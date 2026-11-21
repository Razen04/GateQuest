begin;
select
    plan (15);
-- Keep the notification dispatch trigger offline during the test.
set local app.skip_dispatch = 'true';
-- Isolate from seed/snippet data.
delete from public.notifications;
delete from public.mocks;
-- ─── Partial indexes ──────────────────────────────────────────────
select
    has_index ('public', 'topic_tests', 'idx_topic_tests_completed_paper', 'completed mock paper index exists');
select
    has_index ('public', 'topic_tests', 'idx_topic_tests_active_paper', 'active mock paper index exists');
-- ─── Newly scheduled mock ─────────────────────────────────────────
insert into public.mocks (id, label, branch, starts_at, duration_seconds, status)
    values ('mock-notify-later', 'Later Mock', 'cs', now() + interval '2 hours', 3600, 'scheduled');
select
    is (public.notify_mocks (), 1, 'announces a newly scheduled mock once');
select
    is ((
            select
                count(*)::int
            from
                public.notifications), 1, 'exactly one notification inserted');
select
    is ((
            select
                target
            from
                public.notifications
            where
                title = '📅 New mock scheduled'), '{"type": "broadcast"}'::jsonb, 'schedule broadcast targets everyone');
select
    is ((
            select
                link
            from
                public.notifications
            where
                title = '📅 New mock scheduled'), '/topic-test-generate?tab=mocks', 'schedule notification links to the mock tab');
select
    is ((
            select
                schedule_notified_at is not null
            from
                public.mocks
            where
                id = 'mock-notify-later'), true, 'schedule bookkeeping is stamped');
select
    is (public.notify_mocks (), 0, 'rerun does not duplicate the schedule broadcast');
-- ─── Mock about to start ──────────────────────────────────────────
insert into public.mocks (id, label, branch, starts_at, duration_seconds, status)
    values ('mock-notify-soon', 'Soon Mock', 'cs', now() + interval '30 seconds', 3600, 'scheduled');
select
    is (public.notify_mocks (), 1, 'reminds once for a mock about to start');
select
    is ((
            select
                count(*)::int
            from
                public.notifications
            where
                title = '⏰ Mock starts in 1 minute'), 1, 'one reminder notification inserted');
select
    is ((
            select
                link
            from
                public.notifications
            where
                title = '⏰ Mock starts in 1 minute'), '/topic-test-generate?tab=mocks', 'reminder notification links to the mock tab');
select
    is ((
            select
                start_reminder_sent_at is not null
            from
                public.mocks
            where
                id = 'mock-notify-soon'), true, 'reminder bookkeeping is stamped');
select
    is (public.notify_mocks (), 0, 'rerun does not duplicate the reminder');
-- ─── Past mocks are never announced retroactively ─────────────────
insert into public.mocks (id, label, branch, starts_at, duration_seconds, status)
    values ('mock-notify-past', 'Past Mock', 'cs', now() - interval '1 hour', 3600, 'scheduled');
select
    is (public.notify_mocks (), 0, 'a mock that already started is skipped');
-- ─── Privileges ───────────────────────────────────────────────────
set local role authenticated;
select
    throws_ok ($$ select public.notify_mocks(); $$, '42501', null, 'authenticated cannot run the sweep');
reset role;
select
    *
from
    finish ();
rollback;
