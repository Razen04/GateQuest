-- Enable the moddatetime extension to track updated_at
create extension if not exists moddatetime schema extensions;

-- Add updated_at column in questions table
alter table public.questions
add column if not exists updated_at timestamptz default now();

-- trigger which runs to update the updated_at whenever a row is updated in the questions table
create trigger handle_questions_updated_at
before update on public.questions
for each row 
execute procedure extensions.moddatetime (updated_at);

