CREATE OR REPLACE FUNCTION get_critical_question_count(
    p_valid_subjects uuid[], 
    p_target_exams text[]
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count integer;
BEGIN
    SELECT COUNT(DISTINCT uiq.question_id) INTO v_count
    FROM user_incorrect_queue uiq
    JOIN questions q ON uiq.question_id = q.id
    -- The Bulletproof Lateral Join:
    CROSS JOIN LATERAL jsonb_array_elements_text(
        CASE 
            WHEN jsonb_typeof(q.metadata->'exam') = 'array' THEN q.metadata->'exam'
            WHEN q.metadata->'exam' IS NOT NULL THEN jsonb_build_array(q.metadata->>'exam')
            ELSE '[]'::jsonb
        END
    ) AS expanded_tags(tag)
    WHERE uiq.user_id = auth.uid()
      AND uiq.next_review_at <= NOW()
      AND q.subject_id = ANY(p_valid_subjects)
      AND expanded_tags.tag = ANY(p_target_exams);
      
    RETURN v_count;
END;
$$;
