-- These are suggested by Supabase itself
-- Index on public.user_question_activity

CREATE INDEX idx_user_attempt 
ON public.user_question_activity(user_id, attempt_number, attempted_at);

-- Index on public.questions
CREATE INDEX ON public.questions USING btree (subject);
