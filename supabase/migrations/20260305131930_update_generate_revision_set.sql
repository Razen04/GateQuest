CREATE OR REPLACE FUNCTION generate_weekly_revision_set(
    p_valid_subjects uuid[], 
    p_target_exams text[],
    p_branch_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_set_id UUID;
    v_start_of_week DATE;
    v_questions_added INT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    v_start_of_week := (CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::int)::date;

    SELECT id INTO v_set_id
    FROM weekly_revision_set
    WHERE generated_for = v_user_id 
      AND start_of_week = v_start_of_week
      AND branch_id = p_branch_id;

    IF v_set_id IS NOT NULL THEN
        RETURN json_build_object ('success', true, 'status', 'existing', 'message', 'Set already present for this week.');
    END IF;

    INSERT INTO weekly_revision_set (generated_for, start_of_week, status, created_at, exam_tags, branch_id)
    VALUES (v_user_id, v_start_of_week, 'pending', now(), p_target_exams, p_branch_id)
    RETURNING id INTO v_set_id;

    WITH RankedQueue AS (
        SELECT DISTINCT ON (uiq.question_id)
            uiq.question_id,
            uiq.box,
            uiq.added_at,
            ROW_NUMBER() OVER (PARTITION BY uiq.box ORDER BY uiq.added_at ASC) as rn
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
        WHERE uiq.user_id = v_user_id
          AND uiq.next_review_at <= NOW() 
          AND q.subject_id = ANY(p_valid_subjects) 
          AND expanded_tags.tag = ANY(p_target_exams) 
    )
    INSERT INTO revision_set_questions (set_id, question_id)
    SELECT v_set_id, question_id
    FROM RankedQueue
    ORDER BY
        CASE
            WHEN box = 3 AND rn <= 5 THEN 1
            WHEN box = 2 AND rn <= 10 THEN 2
            WHEN box = 1 THEN 3
            WHEN box = 2 THEN 4
            ELSE 5 
        END ASC,
        added_at ASC 
    LIMIT 30;

    GET DIAGNOSTICS v_questions_added = ROW_COUNT;

    UPDATE weekly_revision_set SET total_questions = v_questions_added WHERE id = v_set_id;

    RETURN json_build_object('success', true, 'status', 'created', 'message', 'Generated new smart revision set.');
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to generate revision set: %', SQLERRM;
END
$$;
