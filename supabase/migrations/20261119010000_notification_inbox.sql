-- ═══════════════════════════════════════════════════════════════════
-- Notification inbox: show read notifications too, last 30 days only
-- ═══════════════════════════════════════════════════════════════════
-- The old SELECT policy hid any notification with a notification_reads
-- row, so a user could never revisit something they had already read.
-- Read state is still stored per user in notification_reads (whose RLS
-- only exposes a user's own rows), but it no longer filters the inbox —
-- the client uses it to style entries and to drive the unread badge.
-- Notifications older than 30 days are not readable at all.
-- ═══════════════════════════════════════════════════════════════════
drop policy if exists "notifications_select" on public.notifications;

create policy "notifications_select" on public.notifications
    for select to authenticated
    using (
        active = true
        and created_at >= (now () - interval '30 days')
        and ((target ->> 'type' = 'broadcast'
            and audience_ids is null)
            or (audience_ids is not null
                and auth.uid () = any (audience_ids)))
    );
