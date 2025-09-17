

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


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."insert_user_question_activity_batch"("batch" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$declare
  item jsonb;
begin
  -- Loop through each object in the batch array
  for item in select * from jsonb_array_elements(batch)
  loop
    insert into user_question_activity (
      user_id,
      question_id,
      subject,
      was_correct,
      time_taken,
      attempt_number,
      attempted_at
    )
    values (
      (item->>'user_id')::uuid,
    item->>'question_id',
      item->>'subject',
      (item->>'was_correct')::boolean,
      (item->>'time_taken')::int,
      coalesce(
        (select max(uqa.attempt_number) + 1
         from user_question_activity uqa
         where uqa.user_id = (item->>'user_id')::uuid
           and uqa.question_id = (item->>'question_id')),
        1
      ),
      (item->>'attempted_at')::timestamptz
    );
  end loop;
end;$$;


ALTER FUNCTION "public"."insert_user_question_activity_batch"("batch" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_question_peer_stats"() RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$

insert into public.question_peer_stats

(question_id, total_attempts, correct_attempts, wrong_attempts, avg_time_seconds, updated_at)

select

(uqa.question_id)::uuid, -- cast if your question_id is text; remove ::uuid if already uuid

count(*) as total_attempts,

count(*) filter (where uqa.was_correct) as correct_attempts,

count(*) filter (where not uqa.was_correct) as wrong_attempts,

avg(uqa.time_taken) filter (where uqa.time_taken is not null) as avg_time_seconds,

now()

from public.user_question_activity uqa -- <-- replace with your actual table name if different

where uqa.attempt_number = 1

group by uqa.question_id

on conflict (question_id) do update

set total_attempts = excluded.total_attempts,

correct_attempts = excluded.correct_attempts,

wrong_attempts = excluded.wrong_attempts,

avg_time_seconds = excluded.avg_time_seconds,

updated_at = now();

$$;


ALTER FUNCTION "public"."refresh_question_peer_stats"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text",
    "message" "text",
    "type" "text",
    "active" boolean
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'In-app notifications';



CREATE TABLE IF NOT EXISTS "public"."question_peer_stats" (
    "question_id" "uuid" NOT NULL,
    "total_attempts" integer DEFAULT 0 NOT NULL,
    "correct_attempts" integer DEFAULT 0 NOT NULL,
    "wrong_attempts" integer DEFAULT 0 NOT NULL,
    "avg_time_seconds" numeric,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."question_peer_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."question_reports" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "question_id" "uuid",
    "report_type" "text",
    "report_text" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."question_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "year" integer NOT NULL,
    "question_number" integer,
    "subject" "text" NOT NULL,
    "topic" "text",
    "question_type" "text" NOT NULL,
    "question" "text" NOT NULL,
    "options" "text"[],
    "correct_answer" "jsonb" NOT NULL,
    "answer_text" "text",
    "difficulty" "text",
    "marks" integer,
    "tags" "text"[],
    "source" "text",
    "source_url" "text",
    "added_by" "text",
    "verified" boolean DEFAULT false,
    "explanation" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_question_activity" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "question_id" "text",
    "subject" "text",
    "was_correct" boolean,
    "time_taken" bigint,
    "attempted_at" timestamp with time zone DEFAULT "now"(),
    "attempt_number" bigint
);


ALTER TABLE "public"."user_question_activity" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_question_activity" IS 'For the dashboard';



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "email" "text",
    "name" "text",
    "avatar" "text",
    "show_name" boolean DEFAULT true,
    "total_xp" integer DEFAULT 0,
    "settings" "jsonb",
    "college" "text",
    "targetYear" integer,
    "bookmark_questions" "jsonb"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."question_peer_stats"
    ADD CONSTRAINT "question_peer_stats_pkey" PRIMARY KEY ("question_id");



ALTER TABLE ONLY "public"."question_reports"
    ADD CONSTRAINT "question_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."question_reports"
    ADD CONSTRAINT "unique_report_per_user_per_question" UNIQUE ("user_id", "question_id");



ALTER TABLE ONLY "public"."user_question_activity"
    ADD CONSTRAINT "user_question_activity_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_uqa_question_first_attempt" ON "public"."user_question_activity" USING "btree" ("question_id") WHERE ("attempt_number" = 1);



ALTER TABLE ONLY "public"."question_reports"
    ADD CONSTRAINT "fk_question_reports_user" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."question_peer_stats"
    ADD CONSTRAINT "question_peer_stats_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."question_reports"
    ADD CONSTRAINT "question_reports_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."question_reports"
    ADD CONSTRAINT "question_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_question_activity"
    ADD CONSTRAINT "user_question_activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");



CREATE POLICY "Allow insert for own user_id" ON "public"."user_question_activity" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow logged-in user to insert/update own row" ON "public"."users" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Allow read for all" ON "public"."notifications" FOR SELECT USING (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."question_reports" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable read access for all users" ON "public"."question_peer_stats" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."questions" FOR SELECT USING (true);



CREATE POLICY "Get all the questions" ON "public"."user_question_activity" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."question_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_question_activity" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON FUNCTION "public"."insert_user_question_activity_batch"("batch" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."insert_user_question_activity_batch"("batch" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_user_question_activity_batch"("batch" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_question_peer_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_question_peer_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_question_peer_stats"() TO "service_role";
























GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."question_peer_stats" TO "anon";
GRANT ALL ON TABLE "public"."question_peer_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."question_peer_stats" TO "service_role";



GRANT ALL ON TABLE "public"."question_reports" TO "anon";
GRANT ALL ON TABLE "public"."question_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."question_reports" TO "service_role";



GRANT ALL ON TABLE "public"."questions" TO "anon";
GRANT ALL ON TABLE "public"."questions" TO "authenticated";
GRANT ALL ON TABLE "public"."questions" TO "service_role";



GRANT ALL ON TABLE "public"."user_question_activity" TO "anon";
GRANT ALL ON TABLE "public"."user_question_activity" TO "authenticated";
GRANT ALL ON TABLE "public"."user_question_activity" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
