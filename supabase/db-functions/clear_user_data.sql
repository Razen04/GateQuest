-- Function to clear data. A fresh account starts at version 1, so allowing
-- up to version 6 gives exactly five resets.
create or replace function public.clear_user_data ()
    returns jsonb
    language plpgsql
    security definer
    set search_path = public
    as $$
declare
    v_user_id uuid;
    v_user_version_number integer;
begin
    v_user_id := auth.uid ();
    if v_user_id is null then
        raise exception 'Not Authenticated';
    end if;

    select u.version_number
    into v_user_version_number
    from users u
    where u.id = v_user_id;

    if v_user_version_number is null then
        raise exception 'User is missing version number';
    end if;

    if v_user_version_number > 5 then
        raise exception 'Already completed max data clear, cant use more';
    end if;

    update users
    set version_number = v_user_version_number + 1
    where users.id = v_user_id;

    delete from user_incorrect_queue
    where user_id = v_user_id;

    delete from weekly_revision_set
    where generated_for = v_user_id;

    delete from topic_tests
    where user_id = v_user_id;

    return jsonb_build_object(
        'status', 'ok',
        'version', v_user_version_number + 1
    );
end;
$$;
