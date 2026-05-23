-- Database Trigger function that routes traffic based on the action performed on the question_reports table

create or replace function public.handle_report_event_webhook()
returns trigger as $$
declare
	target_task text;
	payload jsonb;
begin
	if (tg_op = 'INSERT') then
		target_task := 'report-created';

	elsif (tg_op = 'UPDATE') then
		if (new.status is not distinct from old.status) then
			return new;
		end if;

		target_task := 'report-resolved';
	end if;

	payload := jsonb_build_object(
		'record', to_jsonb(new),
		'old_record',
		case
			when tg_op = 'UPDATE' then to_jsonb(old)
			else null
		end
	);

	perform net.http_post(
		url := (
			select decrypted_secret
			from vault.decrypted_secrets
			where name = 'cron_edge_function_base_url'
		) || '/process-reminders?task=' || target_task,

		headers := jsonb_build_object(
			'content-type', 'application/json',
			'x-cron-secret',
			(
				select decrypted_secret
				from vault.decrypted_secrets
				where name = 'cron_isolated_secret'
			)
		),

		body := payload,
		timeout_milliseconds := 5000
	);

	return new;
end;
$$ language plpgsql security definer;

-- bind insert trigger
drop trigger if exists trigger_on_report_insert
on public.question_reports;

create trigger trigger_on_report_insert
after insert on public.question_reports
for each row
execute function public.handle_report_event_webhook();

-- bind update trigger
drop trigger if exists trigger_on_report_update
on public.question_reports;

create trigger trigger_on_report_update
after update on public.question_reports
for each row
execute function public.handle_report_event_webhook();
