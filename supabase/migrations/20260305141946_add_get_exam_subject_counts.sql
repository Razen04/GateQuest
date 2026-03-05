CREATE OR REPLACE FUNCTION get_exam_subject_counts(target_exams text[])
RETURNS TABLE (subject_id uuid, exam_specific_count bigint) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.subject_id, 
        COUNT(DISTINCT q.id) as exam_specific_count
    FROM questions q
    -- The Bulletproof Lateral Join:
    CROSS JOIN LATERAL jsonb_array_elements_text(
        CASE 
            WHEN jsonb_typeof(q.metadata->'exam') = 'array' THEN q.metadata->'exam'
            WHEN q.metadata->'exam' IS NOT NULL THEN jsonb_build_array(q.metadata->>'exam')
            ELSE '[]'::jsonb
        END
    ) AS expanded_tags(tag)
    WHERE expanded_tags.tag = ANY(target_exams)
    GROUP BY q.subject_id;
END;
$$ LANGUAGE plpgsql;
