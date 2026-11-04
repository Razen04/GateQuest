-- Adds the columns used by the automated donation verification pipeline
-- (issue #112). Existing verified donations were all manually verified
-- (the automation did not exist), so they are backfilled as 'manual'.
-- Nullable because pending donations have no method yet.
alter table public.donations
    add column if not exists verification_method text,
    add column if not exists review_alerted_at timestamptz;

-- Anything already marked verified was verified by a human.
update
    public.donations
set
    verification_method = 'manual'
where
    verified = true
    and verification_method is null;

-- NULL is allowed for pending rows; only verified rows get a method.
alter table public.donations
    add constraint donations_verification_method_check check (verification_method in ('manual', 'email_auto'));

-- NOT NULL constraint on utr
alter table public.donations
    alter column utr set not null;

-- The 5-minute job queries: verified = false AND review_alerted_at IS NULL
-- ordered by created_at. Partial index keeps it tiny.
create index if not exists donations_pending_unaudited_idx on public.donations (created_at)
where
    verified = false and review_alerted_at is null;

-- Admin view filters by method. Partial because pending rows are excluded.
create index if not exists donations_verification_method_idx on public.donations (verification_method)
where
    verification_method is not null;

comment on column public.donations.verification_method is 'How the donation was verified: ''manual'' (admin) or ''email_auto'' (automated). NULL while pending.';

comment on column public.donations.review_alerted_at is 'When the 1-hour pending-review alert was sent. Prevents duplicate alerts.';

