-- Migrate JSONB array items into question_bookmarks
INSERT INTO public.question_bookmarks (user_id, question_id, created_at)
SELECT DISTINCT
    u.id AS user_id,
    q.id AS question_id,
    NOW() AS created_at
FROM 
    public.users u,
    jsonb_to_recordset(u.bookmark_questions) AS q_elem(id text)
JOIN public.questions q
    ON q.id = q_elem.id::uuid
WHERE 
    u.bookmark_questions IS NOT NULL
    AND jsonb_array_length(u.bookmark_questions) > 0
ON CONFLICT (user_id, question_id) DO NOTHING;
