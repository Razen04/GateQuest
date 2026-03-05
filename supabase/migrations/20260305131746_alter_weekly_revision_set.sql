alter table weekly_revision_set
add column if not exists exam_tags text[] default '{}';
