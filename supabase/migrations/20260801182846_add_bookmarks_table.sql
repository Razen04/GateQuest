-- bookmarks table
create table if not exists question_bookmarks (
    user_id uuid not null,
    question_id uuid not null,
    notes text check (char_length(notes) <= 100),
    created_at timestamptz not null default current_timestamp,

    primary key (user_id, question_id),

    constraint fk_bookmarks_user
        foreign key (user_id)
        references users(id)
        on delete cascade,

    constraint fk_bookmarks_question
        foreign key (question_id)
        references questions(id)
        on delete cascade
);

-- index
create index idx_question_bookmarks_user_created_at
on question_bookmarks (user_id, created_at desc);

-- rls policies
alter table question_bookmarks enable row level security;

create policy "Users can view their own bookmarks"
on question_bookmarks
for select
using (auth.uid() = user_id);

create policy "Users can create their own bookmarks"
on question_bookmarks
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own bookmarks"
on question_bookmarks
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own bookmarks"
on question_bookmarks
for delete
using (auth.uid() = user_id);
