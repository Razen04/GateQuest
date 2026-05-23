create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema public;

select cron.unschedule(jobid)
from cron.job
where jobname = 'revision-hourly-reminder';

select cron.schedule(
	'revision-hourly-reminder',
	'0 * * * *',
	$$
	select net.http_post(
		url := (select decrypted_secret from vault.decrypted_secrets where name = 'cron_edge_function_base_url') || '/process-reminders?task=revision-hourly',
		headers := jsonb_build_object(
			'Content-Type', 'application/json',
			'X-Cron-Secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_isolated_secret')
		),
		body := '{}'::jsonb,
		timeout_milliseconds := 5000
	) as request_id;
	$$
);
