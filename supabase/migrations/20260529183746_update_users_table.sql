-- Updating the users table

alter table public.users 
add column username text unique;

alter table public.users 
add column about text,
add constraint users_about_max_length
check (char_length(about) <= 100);

alter table public.users
add column is_public boolean default true;
