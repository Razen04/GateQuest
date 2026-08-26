-- updating the user_goal table to add additional_subjects option for GATE XL
alter table public.user_goals
add column if not exists additional_subjects uuid[];
