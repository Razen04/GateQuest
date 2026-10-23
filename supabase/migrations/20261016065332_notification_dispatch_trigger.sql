-- BEFORE INSERT: resolve audience, default active to true.
-- AFTER INSERT: fire an HTTP POST to the dispatch Edge Function via pg_net.
--
-- pg_net's net.http_post is asynchronous — it queues the request and returns
-- a request_id immediately, so the insert transaction is not blocked by the
-- network. The Edge Function sets dispatched_at when the push fanout completes.
create or replace function public.before_notification_insert ()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
    as $$
begin
    if new.active is null then
        new.active := true;
    end if;
    -- Resolve audience for non-broadcast targets, unless the caller already provided one explicitly
    if new.audience_ids is null and (new.target ->> 'type') is distinct from 'broadcast' then
        new.audience_ids := public.resolve_notification_target (new.target);
    end if;
    return new;
end;
$$;

drop trigger if exists on_notification_before_insert on public.notifications;

create trigger on_notification_before_insert
    before insert on public.notifications for each row
    execute function public.before_notification_insert ();

create or replace function public.dispatch_notification_http ()
    returns trigger
    language plpgsql
    security definer
    set search_path = public, net
    as $$
declare
    v_url text;
    v_secret text;
    v_skip boolean := false;
begin
    -- Test-mode escape hatch. pgTAP tests set app.skip_dispatch = 'true'.
    begin
        v_skip := coalesce(current_setting('app.skip_dispatch', true)::boolean, false);
    exception
        when others then
            v_skip := false;
    end;
    if v_skip then
        return new;
        end if;
        select
            decrypted_secret
        into
            v_url
        from
            vault.decrypted_secrets
        where
            name = 'cron_edge_function_base_url';
            select
                decrypted_secret
            into
                v_secret
            from
                vault.decrypted_secrets
            where
                name = 'cron_isolated_secret';
                if v_url is null or v_secret is null then
                    -- Vault secrets not configured. Skip dispatch rather than fail the insert
                    return new;
                    end if;
                    perform
                        net.http_post (url := v_url || '/dispatch-notification', headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', v_secret), body := jsonb_build_object('notification_id', new.id), timeout_milliseconds := 5000);
                        return new;
end;

$$;

drop trigger if exists on_notification_after_insert on public.notifications;

create trigger on_notification_after_insert
    after insert on public.notifications for each row
    execute function public.dispatch_notification_http ();

