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
