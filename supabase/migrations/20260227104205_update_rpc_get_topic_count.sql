CREATE OR REPLACE FUNCTION get_topic_counts(p_subject_id uuid)
RETURNS table(topic text, question_count bigint, subject_id uuid)
LANGUAGE sql
AS $$
  SELECT topic, count(*) as question_count, p_subject_id
  FROM questions
  WHERE subject_id = p_subject_id
    AND topic IS NOT NULL
  GROUP BY topic;
$$;
