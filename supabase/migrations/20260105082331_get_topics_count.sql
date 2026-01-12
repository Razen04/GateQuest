create or replace function get_topic_counts(p_subject text)
returns table(topic text, question_count bigint)
language sql
as $$
  select topic, count(*) as question_count
  from questions
  where subject = p_subject
    and topic is not null
  group by topic;
$$;