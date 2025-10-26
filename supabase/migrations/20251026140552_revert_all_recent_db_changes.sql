-- This migration reverts the database schema back to the state
-- before the dynamic stats trigger, type changes, and user defaults.

-- 1. Drop the trigger and its function
DROP TRIGGER IF EXISTS on_new_attempt ON public.user_question_activity;
DROP FUNCTION IF EXISTS public.handle_new_attempt_stat();

-- 2. Recreate the old batch stats function (refresh_question_peer_stats)
--    (Copied from your earlier provided schema)
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
GRANT ALL ON FUNCTION "public"."refresh_question_peer_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_question_peer_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_question_peer_stats"() TO "service_role";


-- 3. Drop the foreign key on user_question_activity.question_id
ALTER TABLE public.user_question_activity
  DROP CONSTRAINT IF EXISTS user_question_activity_question_id_fkey;

-- 4. Change user_question_activity.question_id back to text
ALTER TABLE public.user_question_activity
  ALTER COLUMN question_id TYPE text;

-- 5. Rename target_year back to "targetYear"
ALTER TABLE public.users
  RENAME COLUMN target_year TO "targetYear";

-- 6. Remove the default values from the users table
ALTER TABLE public.users
  ALTER COLUMN show_name DROP DEFAULT,
  ALTER COLUMN total_xp DROP DEFAULT,
  ALTER COLUMN settings DROP DEFAULT,
  ALTER COLUMN college DROP DEFAULT,
  ALTER COLUMN "targetYear" DROP DEFAULT, -- Use the old name here
  ALTER COLUMN bookmark_questions DROP DEFAULT;