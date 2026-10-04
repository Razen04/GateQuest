alter table public.topic_tests
    add column if not exists paper_id text default null;

create index if not exists idx_topic_tests_paper on public.topic_tests (user_id, paper_id)
where
    paper_id is not null;

comment on column public.topic_tests.paper_id is 'Non-null for PYQ mock tests. Format: <exam>-<branch>-<year>[-s<shift>]. NULL for custom topic tests.';

