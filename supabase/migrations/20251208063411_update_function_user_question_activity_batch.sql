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

    v_set_id uuid;

    -- revision state: none | first | done
    v_revision_state text;

    v_existing_is_correct boolean;

    v_box int;
    v_new_box int;

    v_total_questions int;
    v_attempted_questions int;
    v_correct_questions int;
begin
    for item in
        select * from jsonb_array_elements(batch)
    loop
        ------------------------------------------------------------------
        -- Extract input
        ------------------------------------------------------------------
        v_user_id := (item ->> 'user_id')::uuid;
        v_question_id := (item ->> 'question_id')::uuid;
        v_is_correct := coalesce((item ->> 'was_correct')::boolean, false);
        v_time_taken := (item ->> 'time_taken')::int;
        v_attempted_at := (item ->> 'attempted_at')::timestamptz;

        ------------------------------------------------------------------
        -- Resolve ACTIVE weekly revision set
        ------------------------------------------------------------------
        select id
        into v_set_id
        from weekly_revision_set
        where generated_for = v_user_id
          and status = 'started'
        limit 1;

        ------------------------------------------------------------------
        -- Determine revision state
        ------------------------------------------------------------------
        v_revision_state := 'none';

        if v_set_id is not null then
            select is_correct
            into v_existing_is_correct
            from revision_set_questions
            where set_id = v_set_id
              and question_id = v_question_id;

            if found then
                if v_existing_is_correct is null then
                    v_revision_state := 'first';
                else
                    v_revision_state := 'done';
                end if;
            end if;
        end if;

        ------------------------------------------------------------------
        -- HARD STOP: already-attempted revision question
        ------------------------------------------------------------------
        if v_revision_state = 'done' then
            continue;
        end if;

        ------------------------------------------------------------------
        -- PRACTICE MODE ONLY (non-revision)
        -- Log to history table
        ------------------------------------------------------------------
        if v_revision_state = 'none' then
            select coalesce(max(attempt_number) + 1, 1)
            into v_attempt_number
            from user_question_activity
            where user_id = v_user_id
              and question_id = v_question_id;

            insert into user_question_activity (
                user_id,
                question_id,
                subject,
                was_correct,
                time_taken,
                attempt_number,
                attempted_at
            )
            values (
                v_user_id,
                v_question_id,
                item->>'subject',
                v_is_correct,
                v_time_taken,
                v_attempt_number,
                v_attempted_at
            );
        end if;

        ------------------------------------------------------------------
        -- USER INCORRECT QUEUE (Spaced Repetition)
        ------------------------------------------------------------------
        if v_revision_state in ('none', 'first') then
            select box
            into v_box
            from user_incorrect_queue
            where user_id = v_user_id
              and question_id = v_question_id
            limit 1;

            if found then
                -- UPDATE LOGIC:
                -- Only update queue if this is an official REVISION attempt ('first').
                -- Practice attempts ('none') do not move items between boxes.
                if v_revision_state = 'first' then
                    if v_is_correct then
                        if v_box = 1 then
                            v_new_box := 2;
                        elsif v_box = 2 then
                            v_new_box := 3;
                        elsif v_box = 3 then
                            delete from user_incorrect_queue
                            where user_id = v_user_id
                              and question_id = v_question_id;
                            v_new_box := null;
                        end if;
                    else
                        v_new_box := 1;
                    end if;

                    -- Perform Update
                    if v_new_box is not null then
                        update user_incorrect_queue
                        set box = v_new_box,
                            next_review_at = case
                                when v_new_box = 1 then now() + interval '1 week'
                                when v_new_box = 2 then now() + interval '2 weeks'
                                when v_new_box = 3 then now() + interval '4 weeks'
                                else next_review_at
                            end
                        where user_id = v_user_id
                          and question_id = v_question_id;
                    end if;
                end if;
            else
                -- INSERT LOGIC (FIXED):
                -- Only add to queue if the user got it WRONG.
                if not v_is_correct then
                    insert into user_incorrect_queue (
                        user_id,
                        question_id,
                        box,
                        next_review_at
                    )
                    values (
                        v_user_id,
                        v_question_id,
                        1,
                        now()
                    );
                end if;
            end if;
        end if;

        ------------------------------------------------------------------
        -- REVISION SET UPDATE (first attempt only)
        ------------------------------------------------------------------
        if v_revision_state = 'first' then
            update revision_set_questions
            set is_correct = v_is_correct,
                time_spent_seconds = v_time_taken
            where set_id = v_set_id
              and question_id = v_question_id
              and is_correct is null;

            -- Recompute weekly aggregates
            select count(*) into v_total_questions
            from revision_set_questions
            where set_id = v_set_id;

            select count(*) into v_attempted_questions
            from revision_set_questions
            where set_id = v_set_id
              and is_correct is not null;

            select count(*) into v_correct_questions
            from revision_set_questions
            where set_id = v_set_id
              and is_correct = true;

            update weekly_revision_set
            set total_questions = v_total_questions,
                correct_count = v_correct_questions,
                accuracy = case
                    when v_attempted_questions > 0
                    then round(
                        (v_correct_questions::numeric / v_attempted_questions) * 100,
                        2
                    )
                    else null
                end
            where id = v_set_id;

            -- expire set if completed
            if v_attempted_questions = v_total_questions then
                perform update_status_of_weekly_set(
                    v_set_id => v_set_id
                );
            end if;
        end if;

    end loop;
end;
$$;