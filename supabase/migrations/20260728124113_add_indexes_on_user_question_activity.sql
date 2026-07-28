create index idx_uqa_user_version_attempted 
on public.user_question_activity (user_id, user_version_number, attempted_at);

-- Composite index for user goals lookup
create index if not exists idx_user_goals_lookup 
on public.user_goals (user_id, is_active);
