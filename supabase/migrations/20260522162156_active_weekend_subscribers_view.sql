-- Index to speed up the lookup of users who were active in the last 14 days
create index idx_uqa_created_user 
on user_question_activity (attempted_at desc, user_id);

-- View to calculate how many users were active, this is created so that the edge function does not spend much time in finding out those users
create view active_weekend_subscriptions as
select distinct on (s.endpoint)
	s.endpoint,
	s.auth_key,
	s.p256dh_key,
	s.user_id
from push_subscriptions s
join user_question_activity uqa on s.user_id = uqa.user_id
where uqa.attempted_at >= now() - interval '14 days'
order by s.endpoint, uqa.attempted_at desc;
