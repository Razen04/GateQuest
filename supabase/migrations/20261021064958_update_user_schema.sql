-- add onboarding_completed for the new onboarding flow
alter table public.users
    add column if not exists onboarding_completed boolean not null default false;

create index idx_users_onboarding_incomplete on public.users (id)
where
    onboarding_completed = false;

