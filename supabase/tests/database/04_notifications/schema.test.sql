-- Asserts the notification schema additions exist.
begin;
select
    plan (12);
-- notifications columns
select
    has_column ('public', 'notifications', 'target', 'notifications.target exists');
select
    has_column ('public', 'notifications', 'audience_ids', 'notifications.audience_ids exists');
select
    has_column ('public', 'notifications', 'link', 'notifications.link exists');
select
    has_column ('public', 'notifications', 'dispatched_at', 'notifications.dispatched_at exists');
-- users column
select
    has_column ('public', 'users', 'notification_tags', 'users.notification_tags exists');
-- notification_reads table and columns
select
    has_table ('public', 'notification_reads', 'notification_reads table exists');
select
    has_column ('public', 'notification_reads', 'notification_id', 'notification_reads.notification_id exists');
select
    has_column ('public', 'notification_reads', 'user_id', 'notification_reads.user_id exists');
select
    has_column ('public', 'notification_reads', 'read_at', 'notification_reads.read_at exists');
-- indexes
select
    has_index ('public', 'users', 'idx_users_notification_tags', 'users tag GIN index exists');
select
    has_index ('public', 'notifications', 'idx_notifications_audience', 'notifications audience_ids GIN index exists');
select
    has_index ('public', 'notification_reads', 'idx_notification_reads_user', 'notification_reads user index exists');
select
    *
from
    finish ();
rollback;
