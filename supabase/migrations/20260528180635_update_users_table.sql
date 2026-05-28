-- Adding deleted_at to for account deletion
alter table public.users 
add column deleted_at timestamptz default null;

-- Update the exisiting policy to ignore deleted accounts
drop policy if exists "Allow logged-in user to insert/update own row" on public.users;

create policy "Allow logged-in user to insert/update own row" 
on public.users 
for all
using (
    auth.uid() = id AND 
    deleted_at IS NULL
) 
with check (
    auth.uid() = id AND 
    deleted_at IS NULL
);
