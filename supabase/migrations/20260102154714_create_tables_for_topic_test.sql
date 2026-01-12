-- Create the Main Test Session Table
create table if not exists public.topic_tests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  topics text[],     -- Array of topic names
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  completed_at timestamptz,
  status text default 'created' check (status in ('created', 'ongoing', 'paused', 'completed')),
  remaining_time_seconds int not null, 
  total_questions int default 0,
  score float,
  total_marks int,
  accuracy float,
  correct_count int default 0,
  attempted_count int default 0
);

-- Create the Attempts Table (Question Logs)
create table if not exists public.topic_tests_attempts (
  session_id uuid references public.topic_tests(id) on delete cascade not null,
  question_id uuid references public.questions(id) not null,
  attempt_order int not null,
  user_answer jsonb,
  marked_for_review boolean default false,
  status text default 'unvisited' check (status in ('unvisited', 'viewed', 'answered')),
  is_correct boolean,
  score float,
  time_spent_seconds int default 0,
  primary key (session_id, question_id)
);

-- Performance Indexes
create index if not exists idx_topic_tests_user_status on topic_tests(user_id, status);

-- Faster loading of the active test questions in correct order
create index if not exists idx_attempts_session_order on topic_tests_attempts(session_id, attempt_order);

-- Enable Row Level Security (RLS)
alter table public.topic_tests enable row level security;
alter table public.topic_tests_attempts enable row level security;

-- RLS Policies (Security Rules)
-- Policy: Users can only see their own tests
create policy "Users can view own tests" 
on public.topic_tests for select 
using (auth.uid() = user_id);

create policy "Users can update own tests" 
on public.topic_tests for update
to public
using ((auth.uid() = user_id) and status is distinct from 'completed')
with check (
	auth.uid() = user_id
);

-- Policy: Users can view attempts only for their own sessions
create policy "Users can view own attempts" 
on public.topic_tests_attempts for select 
using (
  exists (
    select 1 from public.topic_tests 
    where id = topic_tests_attempts.session_id 
    and user_id = auth.uid()
  )
);

-- Allow users to insert new attempts for their own sessions
create policy "Users can insert own attempts"
on public.topic_tests_attempts
for insert
with check (
  exists (
    select 1 from public.topic_tests
    where id = topic_tests_attempts.session_id
    and user_id = auth.uid()
  )
);

-- Allow users to update attempts for their own sessions
create policy "Users can update own attempts"
on public.topic_tests_attempts
for update
using (
  exists (
    select 1 from public.topic_tests
    where id = topic_tests_attempts.session_id
    and user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.topic_tests
    where id = topic_tests_attempts.session_id
    and user_id = auth.uid()
  )
);
