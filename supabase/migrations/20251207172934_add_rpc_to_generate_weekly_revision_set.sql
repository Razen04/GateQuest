-- Function to generate weekly revision set

CREATE OR REPLACE FUNCTION generate_weekly_revision_set()
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
    -- First we will get the user id and store in v_user_id
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Calculating the v_start_of_week to prevent generating more than 1 set for each week
    v_start_of_week := (CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::int)::date;

    -- Checking if a set already exist for the user, if yes then just return that and not create any new set
    SELECT id INTO v_set_id
    FROM weekly_revision_set
    WHERE generated_for = v_user_id AND start_of_week = v_start_of_week;

    IF v_set_id IS NOT NULL THEN
        RETURN json_build_object (
            'success', true,
            'status', 'existing',
            'message', 'Set already present for this week.'
        );
    END IF;

    -- Generating new set container
    INSERT INTO weekly_revision_set (generated_for, start_of_week, status, created_at)
    VALUES (v_user_id, v_start_of_week, 'pending', now())
    RETURNING id INTO v_set_id;

    -- Populating the weekly set using Quota-Based logic
    WITH RankedQueue AS (
            SELECT
                question_id,
                box,
                added_at,
                -- Rank questions within their specific box by oldest first
                ROW_NUMBER() OVER (PARTITION BY box ORDER BY added_at ASC) as rn
            FROM user_incorrect_queue
            WHERE user_id = v_user_id
              AND next_review_at <= NOW() -- The Gatekeeper: Must be due today or earlier
        )
        INSERT INTO revision_set_questions (set_id, question_id)
        SELECT v_set_id, question_id
        FROM RankedQueue
        ORDER BY
            CASE
                -- TIER 1: The "Guaranteed Mix" (First 5 Mastered, First 10 Hard)
                WHEN box = 3 AND rn <= 5 THEN 1
                WHEN box = 2 AND rn <= 10 THEN 2

                -- TIER 2: The "Critical Mass" (Fill remaining slots with Box 1)
                WHEN box = 1 THEN 3

                -- TIER 3: The "Spillover" (If Box 1 is empty, use remaining B2/B3)
                WHEN box = 2 THEN 4
                ELSE 5 -- Remaining Box 3
            END ASC,
            added_at ASC -- Tie-breaker: Oldest mistakes first
        LIMIT 30;

        -- Get count of inserted items for feedback
        GET DIAGNOSTICS v_questions_added = ROW_COUNT;

        -- Update the weekly_revision_set with the total_questions
        UPDATE weekly_revision_set
        SET total_questions = v_questions_added
        WHERE id = v_set_id;

        -- 6. FINAL RETURN
        RETURN json_build_object(
            'success', true,
            'status', 'created',
            'message', 'Generated new smart revision set.'
        );

    EXCEPTION WHEN OTHERS THEN
        -- Basic Error Handling
        RAISE EXCEPTION 'Failed to generate revision set: %', SQLERRM;
END
$$
