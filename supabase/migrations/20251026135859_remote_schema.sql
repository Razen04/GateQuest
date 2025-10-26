-- This file represents the schema state pulled from production
-- after the git reset. It has been modified to be idempotent.

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Extensions (safe with IF NOT EXISTS)
CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

COMMENT ON SCHEMA "public" IS 'standard public schema';

-- Functions (safe with CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION public.handle_new_attempt_stat()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF NEW.attempt_number = 1 THEN
    INSERT INTO public.question_peer_stats (
      question_id, total_attempts, correct_attempts, wrong_attempts, avg_time_seconds, updated_at
    ) VALUES (
      NEW.question_id, 1,
      CASE WHEN NEW.was_correct = true THEN 1 ELSE 0 END,
      CASE WHEN NEW.was_correct = false THEN 1 ELSE 0 END,
      NEW.time_taken, now()
    )
    ON CONFLICT (question_id) DO UPDATE SET
      total_attempts = question_peer_stats.total_attempts + 1,
      correct_attempts = question_peer_stats.correct_attempts + (CASE WHEN NEW.was_correct = true THEN 1 ELSE 0 END),
      wrong_attempts = question_peer_stats.wrong_attempts + (CASE WHEN NEW.was_correct = false THEN 1 ELSE 0 END),
      avg_time_seconds = ((question_peer_stats.avg_time_seconds * question_peer_stats.total_attempts) + NEW.time_taken) / (question_peer_stats.total_attempts + 1),
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$function$;
ALTER FUNCTION "public"."handle_new_attempt_stat"() OWNER TO "postgres"; -- Added owner for completeness

CREATE OR REPLACE FUNCTION public.insert_user_question_activity_batch(batch jsonb)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE item jsonb;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(batch) LOOP
    INSERT INTO user_question_activity (
      user_id, question_id, subject, was_correct, time_taken, attempt_number, attempted_at
    ) VALUES (
      (item->>'user_id')::uuid, (item->>'question_id')::uuid, item->>'subject', (item->>'was_correct')::boolean,
      (item->>'time_taken')::int,
      COALESCE((SELECT max(uqa.attempt_number) + 1 FROM user_question_activity uqa
                WHERE uqa.user_id = (item->>'user_id')::uuid AND uqa.question_id = (item->>'question_id')::uuid), 1),
      (item->>'attempted_at')::timestamptz
    );
  END LOOP;
END;
$function$;
ALTER FUNCTION "public"."insert_user_question_activity_batch"("batch" "jsonb") OWNER TO "postgres";

-- Drop the old function (safe with IF EXISTS)
DROP FUNCTION IF EXISTS "public"."refresh_question_peer_stats"();

SET default_tablespace = '';
SET default_table_access_method = "heap";

-- Tables (safe with IF NOT EXISTS, Primary Keys defined inline)
CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text", "message" "text", "type" "text", "active" boolean
);
ALTER TABLE "public"."notifications" OWNER TO "postgres";
COMMENT ON TABLE "public"."notifications" IS 'In-app notifications';

CREATE TABLE IF NOT EXISTS "public"."question_peer_stats" (
    "question_id" "uuid" NOT NULL PRIMARY KEY,
    "total_attempts" integer DEFAULT 0 NOT NULL,
    "correct_attempts" integer DEFAULT 0 NOT NULL,
    "wrong_attempts" integer DEFAULT 0 NOT NULL,
    "avg_time_seconds" numeric,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."question_peer_stats" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."question_reports" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL PRIMARY KEY,
    "user_id" "uuid" NOT NULL,
    "question_id" "uuid",
    "report_type" "text",
    "report_text" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp without time zone DEFAULT "now"()
);
ALTER TABLE "public"."question_reports" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "year" integer NOT NULL, "question_number" integer, "subject" "text" NOT NULL, "topic" "text",
    "question_type" "text" NOT NULL, "question" "text" NOT NULL, "options" "text"[],
    "correct_answer" "jsonb" NOT NULL, "answer_text" "text", "difficulty" "text", "marks" integer,
    "tags" "text"[], "source" "text", "source_url" "text", "added_by" "text", "verified" boolean DEFAULT false,
    "explanation" "text", "metadata" "jsonb", "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."questions" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."user_question_activity" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "user_id" "uuid", "question_id" "uuid", -- Corrected type
    "subject" "text", "was_correct" boolean, "time_taken" bigint,
    "attempted_at" timestamp with time zone DEFAULT "now"(), "attempt_number" bigint
);
ALTER TABLE "public"."user_question_activity" OWNER TO "postgres";
COMMENT ON TABLE "public"."user_question_activity" IS 'For the dashboard';

CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "auth"."uid"() NOT NULL PRIMARY KEY,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL, "email" "text", "name" "text", "avatar" "text",
    "show_name" boolean DEFAULT true, "total_xp" integer DEFAULT 0, "settings" "jsonb" DEFAULT '{}'::jsonb, -- Added default
    "college" "text" DEFAULT '', -- Added default
    "target_year" integer DEFAULT 2026, -- Corrected name + default
    "bookmark_questions" "jsonb" DEFAULT '[]'::jsonb -- Added default
);
ALTER TABLE "public"."users" OWNER TO "postgres";

-- Constraints (Removed all ADD CONSTRAINT blocks as they were causing issues on existing DBs)
-- The primary keys are defined inline in CREATE TABLE.
-- Foreign keys will need to be added in a *separate, later* migration if they are missing.

-- Indexes (safe with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS "idx_uqa_question_first_attempt" ON "public"."user_question_activity" USING "btree" ("question_id") WHERE ("attempt_number" = 1);

-- Policies (made idempotent with DROP + CREATE)
DROP POLICY IF EXISTS "Allow insert for own user_id" ON "public"."user_question_activity";
CREATE POLICY "Allow insert for own user_id" ON "public"."user_question_activity" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
DROP POLICY IF EXISTS "Allow logged-in user to insert/update own row" ON "public"."users";
CREATE POLICY "Allow logged-in user to insert/update own row" ON "public"."users" FOR ALL USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id")); -- Changed to FOR ALL
DROP POLICY IF EXISTS "Allow read for all" ON "public"."notifications";
CREATE POLICY "Allow read for all" ON "public"."notifications" FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."question_reports";
CREATE POLICY "Enable insert for authenticated users only" ON "public"."question_reports" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."question_peer_stats";
CREATE POLICY "Enable read access for all users" ON "public"."question_peer_stats" FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."questions";
CREATE POLICY "Enable read access for all users" ON "public"."questions" FOR SELECT USING (true);
DROP POLICY IF EXISTS "Get all the questions" ON "public"."user_question_activity";
CREATE POLICY "Get all the questions" ON "public"."user_question_activity" FOR SELECT USING (("auth"."uid"() = "user_id"));

-- RLS (safe to run multiple times)
ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."question_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."questions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_question_activity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

-- Publications (safe to run multiple times)
-- ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications"; -- Commented out as likely exists

-- Grants (safe to run multiple times)
GRANT USAGE ON SCHEMA "public" TO "postgres", "anon", "authenticated", "service_role";
GRANT ALL ON FUNCTION "public"."handle_new_attempt_stat"() TO "anon", "authenticated", "service_role"; -- Added grants for new function
GRANT ALL ON FUNCTION "public"."insert_user_question_activity_batch"("batch" "jsonb") TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."notifications" TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."question_peer_stats" TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."question_reports" TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."questions" TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."user_question_activity" TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."users" TO "anon", "authenticated", "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres", "anon", "authenticated", "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres", "anon", "authenticated", "service_role";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres", "anon", "authenticated", "service_role";

-- Trigger (made idempotent with DROP + CREATE)
DROP TRIGGER IF EXISTS on_new_attempt ON public.user_question_activity;
CREATE TRIGGER on_new_attempt AFTER INSERT ON public.user_question_activity FOR EACH ROW EXECUTE FUNCTION handle_new_attempt_stat();

RESET ALL;