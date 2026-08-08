-- New socials: Leetcode and Codeforces

alter table public.users_social 
  add column if not exists leetcode_url text,
  add column if not exists codeforces_url text;
