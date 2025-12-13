-- updating user_question_activity_batch to also work with updating the user_incorrect_queue table

create or replace function insert_user_question_activity_batch(batch jsonb)
returns void
language plpgsql
as $$
declare
    item jsonb;
    v_user_id uuid;
    v_question_id uuid;
    v_is_correct boolean;
    v_time_taken int;
    v_attempted_at timestamptz;
    v_attempt_number int;
    v_box int;
    v_new_box int;
    v_box_deleted boolean;
begin
    -- loop through each object in the batch array
    for item in
        select * from jsonb_array_elements(batch)
    loop
        -- extracting fields from the each object in the batch
        v_user_id := (item ->> 'user_id')::uuid;
        v_question_id := (item ->> 'question_id')::uuid;
        v_is_correct := (item ->> 'was_correct')::boolean;
        v_time_taken := (item ->> 'time_taken')::int;
        v_attempted_at := (item ->> 'attempted_at')::timestamptz;

        -- calculating the attempt number
        select coalesce(max(uqa.attempt_number) + 1, 1)
        into v_attempt_number
        from user_question_activity uqa
        where uqa.user_id = v_user_id and uqa.question_id = (item ->> 'question_id');

        -- insert into user_question_activity
        insert into user_question_activity ( user_id, question_id, subject, was_correct, time_taken, attempt_number, attempted_at )
        values ( v_user_id, (item ->> 'question_id'), (item->>'subject'), v_is_correct, v_time_taken, v_attempt_number, v_attempted_at );

        -- update or insert into user_incorrect_queue
        -- first, check if the question exists in the user's queue
        select box into v_box
        from user_incorrect_queue
        where user_id = v_user_id and question_id = v_question_id
        limit 1;

        if found then
            -- handle correct/incorrect answer logic
            if v_is_correct then
                -- correct answer: move to a higher box (box 1 -> 2, box 2 -> 3, box 3 -> remove)
                if v_box = 1 then
                    v_new_box :=  2;
                elsif v_box = 2 then
                    v_new_box := 3;
                elsif v_box = 3 then
                    -- remove from queue if it's in the box 3
                    delete from user_incorrect_queue
                    where user_id = v_user_id and question_id = v_question_id;
                    v_new_box := null;
                end if;
            else
                -- incorrect answer: move back to box 1 if it's in box 2 or 3
                if v_box = 2 or v_box = 3 then
                    v_new_box := 1;
                end if;
            end if;

            -- update the user's queue with the new box and next review date
            update user_incorrect_queue
            set box = v_new_box,
                next_review_at = case
                    when v_new_box = 1 then now() + interval '1 week'
                    when v_new_box = 2 then now() + interval '2 weeks'
                    when v_new_box = 3 then now() + interval '4 weeks'
                    else next_review_at
                end
            where user_id = v_user_id and question_id = v_question_id;

            -- Update the revision_set_questions table with the user's progress
                update revision_set_questions
                set is_correct = v_is_correct,
                    time_spent_seconds = v_time_taken
                where set_id = (select set_id from weekly_revision_set where generated_for = v_user_id and status = 'started')
                  and question_id = v_question_id;

        else
            -- if the question dosen't exist in the queue, insert it with box 1
            insert into user_incorrect_queue (user_id, question_id, box, next_review_at)
            values (
                v_user_id,
                v_question_id,
                1, -- new question starts in box 1
                now() + interval '1 week' -- next review in 1 week again for critical mistakes
            );
        end if;
    end loop;

exception when others then
    raise;
end;
$$
