-- Add new table users_social, which will contain social profile links of users

create table public.users_social (
	user_id uuid primary key references public.users(id) on delete cascade,
	github_url text,
	x_url text,
	reddit_url text,
	spotify_url text,
	discord_url text,
	linkedin_url text
);

-- RLS policies
alter table public.users_social enable row level security;

create policy "Allow users to manage their own social links"
on public.users_social
for all
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id);


