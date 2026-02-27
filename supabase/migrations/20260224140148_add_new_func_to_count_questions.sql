-- update the questions table subjects column to use uuid and reference
alter table questions 
add column subject_id uuid references subjects(id) on delete set null;

-- create the function that updates the question_count in the subjects table.
create or replace function update_subject_question_count()
returns trigger as $$
begin
    if tg_op = 'INSERT' then
        update subjects
        set question_count = question_count + 1
        where id = NEW.subject_id;

    elsif tg_op = 'DELETE' then
        update subjects
        set question_count = question_count - 1
        where id = OLD.subject_id;

    elsif tg_op = 'UPDATE' then
        -- if subject changed
        if NEW.subject_id <> OLD.subject_id then
            update subjects
            set question_count = question_count - 1
            where id = OLD.subject_id;

            update subjects
            set question_count = question_count + 1
            where id = NEW.subject_id;
        end if;
    end if;

    return null;
end;
$$ language plpgsql;

-- trigger on the question table to update the question_count
create trigger trg_update_question_count
after insert or delete or update on questions
for each row
	execute function update_subject_question_count();
