-- The update will allow the rpc to send the users non attempted questions data so that users aren't able to create a test with 0 questions.

DROP FUNCTION IF EXISTS get_topic_counts(uuid);

CREATE OR REPLACE FUNCTION get_topic_counts(p_subject_id uuid)
RETURNS TABLE(
    topic text, 
    question_count bigint, 
    unattempted_count bigint, 
    subject_id uuid
) AS $$
DECLARE
    v_user_version int;
BEGIN
    -- Get the user's current version number from their account
    SELECT version_number INTO v_user_version 
    FROM users 
    WHERE id = auth.uid();

    RETURN QUERY
    SELECT 
        q.topic, 
        COUNT(*) as question_count,
        -- Count questions not attempted in the CURRENT user version
        COUNT(*) FILTER (WHERE NOT EXISTS (
            SELECT 1 FROM user_question_activity uqa 
            WHERE uqa.question_id = q.id 
            AND uqa.user_id = auth.uid()
            AND uqa.user_version_number = v_user_version
        )) as unattempted_count,
        p_subject_id as subject_id
    FROM questions q
    WHERE q.subject_id = p_subject_id
      AND q.topic IS NOT NULL
      AND q.verified = true
    GROUP BY q.topic;
END;
$$ LANGUAGE plpgsql;
