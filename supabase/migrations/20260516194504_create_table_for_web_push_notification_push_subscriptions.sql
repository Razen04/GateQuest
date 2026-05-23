-- Table for Web push notifications
create table push_subscriptions (
	id uuid primary key default gen_random_uuid(),
	user_id uuid references auth.users(id) on delete cascade,
	endpoint text unique not null,
	auth_key text not null,
	p256dh_key text not null,
	created_at timestamptz default now()
);

create index idx_push_subscriptions_user_id
on push_subscriptions(user_id);

alter table push_subscriptions enable row level security;

-- Users can view their own subscriptions
create policy "Users can view own subscriptions"
on push_subscriptions
for select
using (auth.uid() = user_id);

-- Users can insert only their subscriptions
create policy "Users can insert own subscriptions"
on push_subscriptions
for insert
with check (auth.uid() = user_id);

-- Users can delete only their own subsriptions
create policy "Users can delete own subscriptions"
on push_subscriptions
for delete
using (auth.uid() = user_id);
