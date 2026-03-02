create materialized view dynamic_difficulty_stats as
with first_attempts as (
	select question_id, subject_id, was_correct
	from public.user_question_activity
	where attempt_number = 1 and time_taken > 5
),
question_stats as (
	-- Applying Laplace Smoothing where K = 10 and Baseline = 0.5
	select question_id, subject_id, count(*) as total_attempts,
	(count(*) filter (where was_correct = false) + 5.0) / (count(*) + 10) as calculated_difficulty
	from first_attempts
	group by question_id, subject_id
)
select 
	qs.question_id,
	qs.calculated_difficulty as question_rating,
	avg(qs.calculated_difficulty) over (partition by qs.subject_id) as subject_rating,
	qs.total_attempts
from question_stats qs
where qs.total_attempts > 10; -- Will only show dynamic difficulty for questions having more than 10 attempts
