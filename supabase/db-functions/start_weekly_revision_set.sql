-- invoked by the user when he/she starts revising a weekly set
create or replace function start_weekly_revision_set(v_set_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid;
    v_rows int;
begin
    -- getting the user id
    v_user_id := auth.uid();

    if v_user_id is null then
        raise exception 'Not authenticated';
    end if;

    -- update the started_at and expires_at
    update weekly_revision_set
    set started_at = now(), expires_at = now() + interval '24 hours', status = 'started'
    where generated_for = v_user_id and id = v_set_id and status = 'pending'
    returning 1 into v_rows;
    
    -- if nothing changed, maybe the v_set_id is wrong
    if v_rows = 0 then
        return json_build_object (
            'success', false,
            'message', 'could not start the weekly set.'
        );
    end if;
    
    return json_build_object (
        'success', true,
        'set_id', v_set_id,
        'started_at', now(),
        'expires_at', now() + interval '24 hours',
        'message', 'weekly set started'
    );
end;
$$
