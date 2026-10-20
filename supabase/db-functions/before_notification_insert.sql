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

