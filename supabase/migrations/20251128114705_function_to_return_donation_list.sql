-- Function to get verified donations. My reasoning to this is to bypass RLS which is auth.id == users.id.

create or replace function public.get_verified_donations()
returns table (
  donation_id uuid,
  actual_amount numeric,
  anonymous boolean,
  message VARCHAR,
  verified boolean,
  created_at timestamp,
  user_id uuid,
  user_name text,
  user_avatar text
)
language sql
stable
security definer
set search_path = public
as $$
  select 
    donations.id as donation_id,
    donations.actual_amount,
    donations.anonymous,
    donations.message,
    donations.verified,
    donations.created_at,
    donations.user_id as user_id,
    users.name as user_name,
    users.avatar as user_avatar
  from donations
  left join users on users.id = donations.user_id  -- Use LEFT JOIN to include anonymous donations
  where donations.verified = true
  order by donations.created_at desc;
$$;
