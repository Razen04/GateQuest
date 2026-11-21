-- ─────────────────────────────────────────────────────────────────
-- Cron that triggers donation-alerts edge function every 5 min
--
-- Design:
--   - Function `trigger_donation_alerts()` reads URL + secret from Vault
--   - pg_net POSTs to the edge function
--   - pg_cron schedules it every 5 minutes
--
-- Idempotent — safe to re-run.
-- ─────────────────────────────────────────────────────────────────
create or replace function public.trigger_donation_alerts ()
    returns void
    language plpgsql
    security definer
    set search_path = public
    as $$
declare
    v_url text;
    v_secret text;
begin
    -- Read URL and secret from Supabase Vault
    select
        decrypted_secret
    into
        v_url
    from
        vault.decrypted_secrets
    where
        name = 'DONATION_ALERTS_URL';
    select
        decrypted_secret
    into
        v_secret
    from
        vault.decrypted_secrets
    where
        name = 'CRON_ISOLATED_SECRET';
    if v_url is null then
        raise WARNING 'DONATION_ALERTS_URL not in Vault — cron will skip this cycle';
        return;
    end if;
    if v_secret is null then
        raise WARNING 'CRON_ISOLATED_SECRET not in Vault — cron will skip this cycle';
        return;
    end if;
    perform
        net.http_post (url := v_url, headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', v_secret), body := '{}'::jsonb, timeout_milliseconds := 15000);
end;
$$;

grant execute on function public.trigger_donation_alerts () to service_role;

-- Schedule: every 5 minutes
do $$
begin
    if exists (
        select
            1
        from
            cron.job
        where
            jobname = 'donation-alerts') then
    perform
        cron.unschedule ('donation-alerts');
end if;
end
$$;

select
    cron.schedule ('donation-alerts', '*/5 * * * *', 'SELECT public.trigger_donation_alerts();');

