create or replace function refresh_dynamic_difficulty()
returns void
language plpgsql
security definer
as $$
begin
	refresh materialized view dynamic_difficulty_stats;

	-- update the questions and subjects table
	update public.questions q
	set difficulty = 
		case
			when d.question_rating < 0.35 then 'Easy'
			when d.question_rating < 0.7 then 'Medium'
			else 'Hard'
		end
	from dynamic_difficulty_stats d
	where q.id = d.question_id;

	update public.subjects s
	set difficulty = 
		case
			when d.avg_rating < 0.35 then 'Easy'
			when d.avg_rating < 0.7 then 'Medium'
			else 'Hard'
		end
	from (
		select subject_id, avg(subject_rating) as avg_rating
		from dynamic_difficulty_stats
		group by subject_id
	) d
	where s.id = d.subject_id;
end;
$$;

-- Run every day at midnight
select cron.schedule('nightly-difficulty-sync', '0 0 * * *', 'SELECT refresh_dynamic_difficulty()');

