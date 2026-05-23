-- Cron to remind donation every 2 weeks at 12pm
select cron.unschedule('donation-reminder-every-2-weeks')

select cron.schedule(
	'donation-reminder-every-2-weeks',
	'30 6 * * 0',
	$$
	select net.http_post(
		url := (select decrypted_secret from vault.decrypted_secrets where name = 'cron_edge_function_base_url') || '/process-reminders?task=donation-reminder',
		headers := jsonb_build_object(
			'Content-Type', 'application/json',
			'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_isolated_secret')
		)
	);
	$$
);
