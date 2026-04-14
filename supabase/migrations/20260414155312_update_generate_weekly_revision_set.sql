-- Update to not include unverified question in the Revision List and also removing ghost functions
DROP FUNCTION IF EXISTS generate_weekly_revision_set();
DROP FUNCTION IF EXISTS generate_weekly_revision_set(text, uuid[]);

CREATE OR REPLACE FUNCTION generate_weekly_revision_set(
		p_valid_subjects uuid[],
    p_target_exams text[], 
		p_branch_id text
)
RETURNS json AS $$
DECLARE
    v_user_id UUID;
    v_set_id UUID;
    v_start_of_week DATE;
    v_questions_added INT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    -- Calculate the start of the week (Sunday)
    v_start_of_week := (CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::int)::date;

    -- Check if a set already exists for this user/week/branch
    SELECT id INTO v_set_id
    FROM weekly_revision_set
    WHERE generated_for = v_user_id 
      AND start_of_week = v_start_of_week
      AND branch_id = p_branch_id;

    IF v_set_id IS NOT NULL THEN
        RETURN json_build_object ('success', true, 'status', 'existing', 'message', 'Set already present for this week.');
    END IF;

    -- Create the new revision set header
    INSERT INTO weekly_revision_set (generated_for, start_of_week, status, created_at, exam_tags, branch_id)
    VALUES (v_user_id, v_start_of_week, 'pending', now(), p_target_exams, p_branch_id)
    RETURNING id INTO v_set_id;

    WITH RankedQueue AS (
        SELECT DISTINCT ON (uiq.question_id)
            uiq.question_id,
            uiq.box,
            uiq.added_at
        FROM user_incorrect_queue uiq
        JOIN questions q ON uiq.question_id = q.id
        JOIN subjects s ON q.subject_id = s.id 
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
          AND q.verified = true 
          AND (
                -- Rule 1: Always include mistakes for Universal subjects
                s.is_universal = true 
                OR 
                -- Rule 2: For core subjects, filter by current branch 'set' or exam tags
                (q.metadata->>'set' = UPPER(p_branch_id) OR expanded_tags.tag = ANY(p_target_exams))
          )
    )
    INSERT INTO revision_set_questions (set_id, question_id)
    SELECT v_set_id, question_id
    FROM RankedQueue
    ORDER BY box ASC, added_at ASC -- Prioritize lower boxes (more frequent mistakes)
    LIMIT 30;

    GET DIAGNOSTICS v_questions_added = ROW_COUNT;

    UPDATE weekly_revision_set SET total_questions = v_questions_added WHERE id = v_set_id;

    RETURN json_build_object('success', true, 'status', 'created', 'message', 'Generated new smart revision set.');
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to generate revision set: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;
