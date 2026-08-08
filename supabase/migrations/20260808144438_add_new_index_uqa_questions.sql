-- new indexes to give a boost to dashboard metric calculation, don't know if that will even help but let's see, hope it do.

-- Accelerates JSONB metadata containment queries (@>) in internal_calc_exam_stats
create index if not exists idx_questions_metadata_gin 
on public.questions using gin (metadata jsonb_path_ops);

-- Accelerates version + first-attempt joins in internal_calc_exam_stats & global_stats
create index if not exists idx_uqa_user_version_attempt_q 
on public.user_question_activity (user_id, user_version_number, attempt_number, question_id);
