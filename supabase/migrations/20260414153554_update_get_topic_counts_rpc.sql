-- Update the get_topic_counts rpc to only return verified questions count for each topic
-- Also drops the same name rpc which was using subject name to get the data

DROP FUNCTION IF EXISTS get_topic_counts(text);

CREATE OR REPLACE FUNCTION get_topic_counts(p_subject_id uuid)
RETURNS TABLE(topic text, question_count bigint, subject_id uuid) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.topic, 
        COUNT(*) as question_count,
        p_subject_id as subject_id
    FROM questions q
    WHERE q.subject_id = p_subject_id
      AND q.topic IS NOT NULL
      AND q.verified = true
    GROUP BY q.topic;
END;
$$ LANGUAGE plpgsql;
