-- Updating the users table

alter table public.users 
add column username text unique;

alter table public.users
add column is_public boolean default true;
