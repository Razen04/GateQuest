-- branches
create table if not exists branches (
    id text primary key, -- 'cs', 'me', 'ee', etc
    name text not null
);

-- exams present in the app
create table if not exists exams (
	id text primary key, -- 'gate', 'isro', etc
	name text not null,
	short_name text not null
);

-- branch_exams for mapping of each branch to it's corresponding exams
create table if not exists branch_exams (
	branch_id text not null references branches(id) on delete cascade,
	exam_id text not null references exams(id) on delete cascade,
	primary key (branch_id, exam_id)
);

-- global subjects data
create table if not exists subjects (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique, -- 'eng-maths', 'aptitude', etc
    name text not null,
    icon_name text,
    theme_color text,
		difficulty text default 'Medium',
		question_count int default 0,
		category text,
    is_universal boolean not null default false
);

create table if not exists exams_subjects (
	exams_id text not null references exams(id) on delete cascade,
	subject_id uuid not null references subjects(id) on delete cascade,
	primary key (exams_id, subject_id)
);

-- mapping between branches and subjects
create table if not exists branch_subjects (
    branch_id text not null references branches(id) on delete cascade,
    subject_id uuid not null references subjects(id) on delete cascade,
    primary key (branch_id, subject_id)
);

-- user goals / preferences
create table if not exists user_goals (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    branch_id text not null references branches(id),
    target_exams jsonb default '["gate"]'::jsonb,
    is_active boolean not null default true,
		unique(user_id, branch_id)
);

create index if not exists idx_user_goals_user_branch
    on user_goals (user_id, branch_id);

-- RLS policies
alter table branches enable row level security;

create policy "Public Read"
on branches
for select
using (true);

alter table subjects enable row level security;

create policy "Policy Read"
on subjects
for select
using (true);

alter table branch_subjects enable row level security;

create policy "Policy Read"
on branch_subjects
for select
	using (true);

alter table user_goals enable row level security;

create policy "User Manage Own"
on user_goals
for all
	using (auth.uid() = user_id)
	with check (auth.uid() = user_id);

alter table exams enable row level security;
create policy "Allow Public Read" on exams for select using (true);

alter table exams_subjects enable row level security;
create policy "Allow Public Read" on exams_subjects for select using (true);

alter table branch_exams enable row level security;
create policy "Allow Public Read" on branch_exams for select using (true);
