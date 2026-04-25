ALTER TABLE public.topic_tests ALTER COLUMN branch_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_test_per_user_branch_active 
ON public.topic_tests (user_id, branch_id) 
WHERE (status != 'completed');
