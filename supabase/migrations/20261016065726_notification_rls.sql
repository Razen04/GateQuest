-- Replaces the broadcast-only read policy with targeted + read-state filtering.
drop policy if exists "Allow read for all" on public.notifications;

drop policy if exists "notifications_select" on public.notifications;

drop policy if exists "notifications_select_all" on public.notifications;

create policy "notifications_select" on public.notifications
    for select to authenticated
    using (active = true
        and not exists (
            select
                1
            from
                public.notification_reads r
            where
                r.notification_id = notifications.id
                and r.user_id = auth.uid ())
                and ((target ->> 'type' = 'broadcast'
                and audience_ids is null)
                or (audience_ids is not null
                and auth.uid () = any (audience_ids))));

