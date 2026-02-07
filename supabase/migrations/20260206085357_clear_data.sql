-- For the feature to clear data
-- Function to clear data
create or replace function clear_user_data()
returns jsonb
language plpgsql
security definer
as $$
declare
	v_user_id uuid;
	v_user_version_number integer;
begin
	-- first get the user_id invoking the function
	v_user_id := auth.uid();
	if v_user_id is null then
		raise exception 'Not Authenticated';
	end if;

	-- get the version_number for the user
	select u.version_number
	into v_user_version_number
	from users u
	where u.id = v_user_id;

	if v_user_version_number is null then
		raise exception 'User is missing version number';
	end if;

	-- check if the version_number is greater than 5, if yes then discard this operation
	if v_user_version_number >= 5 then
		raise exception 'Already completed max data clear, cant use more';
	end if;

	-- update the user's version number otherwise
	update users
	set version_number = v_user_version_number + 1
	where users.id = v_user_id;

	-- delete revision_set and associated questions and also user_incorrect_queue for the particular user as space is a constrain and the new cycle does not require it for the user
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
