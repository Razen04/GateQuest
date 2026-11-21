-- ─────────────────────────────────────────────────────────────────
-- Donation automation columns + indexes (issue #112)
--
-- Adds the columns used by the automated donation verification pipeline:
--   verified_by  — how the donation was verified ('auto' via email
--                  webhook, 'manual' via admin). NULL while pending.
--   alerted_at   — dedup marker for the 30-min pending-review alert
--                  cron. NULL until first alert fires.
--
-- Also enforces UTR uniqueness as NOT NULL (was nullable before) and
-- adds partial indexes for the two hot cron queries.
-- ─────────────────────────────────────────────────────────────────
-- 1. Add columns
alter table public.donations
    add column if not exists verified_by text,
    add column if not exists alerted_at timestamptz;

-- 2. Backfill: anything already verified was verified by a human
--    (the automation didn't exist when these rows were created).
update
    public.donations
set
    verified_by = 'manual'
where
    verified = true
    and verified_by is null;

-- 3. Constraint: restrict verified_by to known values
--    (drop first in case a prior partial run left a stale version)
alter table public.donations
    drop constraint if exists donations_verified_by_check;

alter table public.donations
    add constraint donations_verified_by_check check (verified_by in ('auto', 'manual'));

-- 4. UTR is required — every donation must have a reference to match
--    against email alerts. Guard against existing NULLs first.
do $$
begin
    if exists (
        select
            1
        from
            public.donations
        where
            utr is null) then
    raise exception 'Cannot set utr NOT NULL — % rows have NULL utr. '
             'Backfill or delete them first.', (
            select
                count(*)
            from
                public.donations
            where
                utr is null);
end if;
end
$$;

alter table public.donations
    alter column utr set not null;

-- 5. Partial index for the 30-min pending alert cron:
--      WHERE verified = false AND alerted_at IS NULL
--      AND created_at < now() - '30 minutes'
create index if not exists idx_donations_pending_unalerted on public.donations (created_at)
where
    verified = false and alerted_at is null;

-- 6. Partial index for admin dashboard filtering
create index if not exists idx_donations_verified_by on public.donations (verified_by)
where
    verified_by is not null;

-- 7. Column comments
comment on column public.donations.verified_by is 'How the donation was verified: ''manual'' (admin) or ''auto'' (email automation). NULL while pending.';

comment on column public.donations.alerted_at is 'When the 30-min pending alert was sent. Prevents duplicate alerts. NULL until first alert.';

