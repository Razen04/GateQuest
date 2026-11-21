create or replace function public.notify_mocks ()
    returns integer
    language plpgsql
    security definer
    set search_path = 'public'
    as $$
declare
    v_mock record;
    v_branch_name text;
    v_when text;
    v_count integer := 0;
begin
    -- 1) Newly scheduled mocks. A mock created less than a minute
    -- before it starts skips straight to the reminder branch so the
    -- audience is not pinged twice in a row.
    for v_mock in
    select
        *
    from
        public.mocks m
    where
        m.status in ('scheduled', 'live')
        and m.schedule_notified_at is null
        and m.starts_at > now() + interval '1 minute'
    order by
        m.starts_at
    for update
        skip locked
    loop
        select
            coalesce(b.name, upper(v_mock.branch))
        into
            v_branch_name
        from
            public.branches b
        where
            b.id = lower(v_mock.branch);

        if v_branch_name is null then
            v_branch_name := upper(v_mock.branch);
        end if;

        v_when := to_char(v_mock.starts_at at time zone 'Asia/Kolkata', 'Dy, DD Mon · HH12:MI AM');

        begin
            insert into public.notifications (title, message, link, type, target)
            values ('📅 New mock scheduled', format('%s · %s · starts %s IST.', v_mock.label, v_branch_name, v_when), '/topic-test-generate?tab=mocks', 'update', jsonb_build_object('type', 'broadcast'));

            update public.mocks
            set
                schedule_notified_at = now()
            where
                id = v_mock.id;

            v_count := v_count + 1;
        exception
            when others then
                -- Never abort the sweep because one broadcast failed.
                raise WARNING 'notify_mocks schedule broadcast failed for %: %', v_mock.id, SQLERRM;
        end;
    end loop;

    -- 2) Mocks starting within the next ~90 seconds. The cron fires
    -- once a minute, so a 90s window guarantees a reminder even for
    -- mocks that start off the minute boundary. The bookkeeping
    -- column makes this exactly-once.
    for v_mock in
    select
        *
    from
        public.mocks m
    where
        m.status in ('scheduled', 'live')
        and m.start_reminder_sent_at is null
        and m.starts_at > now()
        and m.starts_at <= now() + interval '90 seconds'
    order by
        m.starts_at
    for update
        skip locked
    loop
        v_when := to_char(v_mock.starts_at at time zone 'Asia/Kolkata', 'HH12:MI AM');

        begin
            insert into public.notifications (title, message, link, type, target)
            values ('⏰ Mock starts in 1 minute', format('%s begins at %s IST. Open the mock now.', v_mock.label, v_when), '/topic-test-generate?tab=mocks', 'reminder', jsonb_build_object('type', 'broadcast'));

            update public.mocks
            set
                start_reminder_sent_at = now()
            where
                id = v_mock.id;

            v_count := v_count + 1;
        exception
            when others then
                raise WARNING 'notify_mocks reminder broadcast failed for %: %', v_mock.id, SQLERRM;
        end;
    end loop;

    return v_count;
end;
$$;

comment on function public.notify_mocks () is
'Broadcasts the "new mock scheduled" and "mock starts in ~1 minute" notifications exactly once per mock. Cron-only.';

revoke all on function public.notify_mocks () from public;

revoke all on function public.notify_mocks () from anon, authenticated;

grant execute on function public.notify_mocks () to service_role;
