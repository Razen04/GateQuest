-- function to get the weekly set which is pending/started

create or replace function get_weekly_set()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid;
    v_set_id uuid;
    v_start_of_week date;
    v_status revision_status;
    v_created_at timestamptz;
    v_started_at timestamptz;
    v_expires_at timestamptz;
    v_total_questions int;
    v_correct_count int;
    v_accuracy numeric(5,2);
    v_questions jsonb;
begin
    -- Get the user ID
    v_user_id := auth.uid();
    if v_user_id is null then
        raise exception 'Not authenticated';
    end if;
    
    -- First, update the status of the set that has expired
    perform update_status_of_weekly_set(v_set_id => (
        select id from weekly_revision_set 
        where generated_for = v_user_id and status in ('pending', 'started') and expires_at <= now()
        limit 1
    ));
    
    -- Assign multiple variables at once
    select id, start_of_week, status, created_at, started_at, expires_at, total_questions, correct_count, accuracy
    into v_set_id, v_start_of_week, v_status, v_created_at, v_started_at, v_expires_at, v_total_questions, v_correct_count, v_accuracy
    from weekly_revision_set
    where generated_for = v_user_id and status in ('pending', 'started')
    limit 1;
    
    -- If no rows found, return a message
    if not found then
        return json_build_object (
            'success', false,
            'message', 'No weekly set available for the user'
        );
    end if;
    
    -- get all the questions of this set using join
    select jsonb_agg(
        to_jsonb(q) || jsonb_build_object(
            'is_correct', rsq.is_correct,
            'time_spent_seconds', rsq.time_spent_seconds
        )
    )
    into v_questions
    from revision_set_questions rsq
    join questions q on q.id = rsq.question_id
    where rsq.set_id = v_set_id;
    
    return json_build_object (
        'success', true,
        'set_id', v_set_id,
        'start_of_week', v_start_of_week,
        'status', v_status,
        'created_at', v_created_at,
        'started_at', v_started_at,
        'expires_at', v_expires_at,
        'total_questions', v_total_questions,
        'correct_count', v_correct_count,
        'accuracy', v_accuracy,
        'questions', coalesce(v_questions, '[]'::jsonb),
        'message', 'weekly set available'
    );
end;
$$;