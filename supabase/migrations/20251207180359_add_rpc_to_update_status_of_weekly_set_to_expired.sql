-- Function to update the weekly set status to expired after 24 hours is passed from started_at time, this will be invoked from client-side

create or replace function update_status_of_weekly_set(v_set_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid;
    v_rows_affected int;
begin
    -- getting the v_user_id
    v_user_id := auth.uid();
    
    if v_user_id is null then
        raise exception 'Not authenticated';
    end if;
    
    -- try updating the status column to 'expired'
    update weekly_revision_set 
    set status = 'expired'
    where generated_for = v_user_id and id = v_set_id
    returning 1 into v_rows_affected;

    -- if no rows were affected, the set may not exist or has already been expired
    if v_rows_affected = 0 then
        return json_build_object(
            'success', false,
            'message', 'No such weekly set found or already expired.'
        );
    end if;

    -- return success if update was successful
    return json_build_object(
        'success', true,
        'message', 'Weekly set status updated to expired.'
    );
end;
$$