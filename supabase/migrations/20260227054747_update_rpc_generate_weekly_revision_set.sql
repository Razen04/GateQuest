CREATE OR REPLACE FUNCTION generate_weekly_revision_set(p_branch_id text, p_valid_subjects uuid[])
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
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    v_start_of_week := (CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::int)::date;

    -- Check if a set already exists for THIS specific branch this week
    SELECT id INTO v_set_id
    FROM weekly_revision_set
    WHERE generated_for = v_user_id AND branch_id = p_branch_id AND start_of_week = v_start_of_week;

    IF v_set_id IS NOT NULL THEN
        RETURN json_build_object ('success', true, 'status', 'existing', 'message', 'Set already present for this week.');
    END IF;

    -- Create new set linked to the branch
    INSERT INTO weekly_revision_set (generated_for, branch_id, start_of_week, status, created_at)
    VALUES (v_user_id, p_branch_id, v_start_of_week, 'pending', now())
    RETURNING id INTO v_set_id;

    -- RankedQueue: JOIN with questions to filter by the valid subjects for this branch
    WITH RankedQueue AS (
        SELECT 
            uq.question_id, uq.box, uq.added_at,
            ROW_NUMBER() OVER (PARTITION BY uq.box ORDER BY uq.added_at ASC) as rn
        FROM user_incorrect_queue uq
        JOIN questions q ON q.id = uq.question_id
        WHERE uq.user_id = v_user_id
          AND uq.next_review_at <= NOW()
          AND q.subject_id = ANY(p_valid_subjects) -- NEW: Filter by active subjects
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
END
$$;
