-- Saturday 9am Cron Job (UTC +05:30)
select cron.schedule(
	'weekend-topic-test-saturday',
	'30 3 * * 6',
	$$
	select net.http_post(
		url := (select decrypted_secret from vault.decrypted_secrets where name = 'cron_edge_function_base_url') || '/process-reminders?task=weekend-topic-test',
		headers := jsonb_build_object(
			'Content-Type', 'application/json',
			'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_isolated_secret')
		)
	);
	$$
);

-- Sunday 9am Cron Job
select cron.schedule(
	'weekend-topic-test-sunday',
	'30 3 * * 0',
	$$
	select net.http_post(
		url := (select decrypted_secret from vault.decrypted_secrets where name = 'cron_edge_function_base_url') || '/process-reminders?task=weekend-topic-test',
		headers := jsonb_build_object(
			'Content-Type', 'application/json',
			'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_isolated_secret')
		)
	);
	$$
);

