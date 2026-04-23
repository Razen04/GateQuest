-- Adding new indexes for better performace (recommended by Supabase)
-- Index on questions table
CREATE INDEX ON public.questions USING btree (subject_id);
CREATE INDEX ON public.questions USING btree (created_at);

-- Index on user_question_activity
CREATE INDEX ON public.user_question_activity USING btree (user_version_number);
CREATE INDEX ON public.user_question_activity USING btree (was_correct);
CREATE INDEX ON public.user_question_activity USING btree (user_id);

-- Index on users table
CREATE INDEX ON public.users USING btree (joined_at);
