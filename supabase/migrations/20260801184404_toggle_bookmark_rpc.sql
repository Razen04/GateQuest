create or replace function toggle_question_bookmark(
	p_question_id uuid,
	p_note text default null
)
returns boolean
language plpgsql
security invoker
as $$
declare
	v_user_id uuid := auth.uid();
	v_exists boolean;
begin
	if v_user_id is null then
		raise exception 'Authentication required.';
	end if;

	if p_note is not null and char_length(p_note) > 100 then
		raise exception 'Note cannot exceed 100 chars.';
	end if;

	select exists (
		select 1
		from question_bookmarks
		where user_id = v_user_id and question_id = p_question_id
	)
	into v_exists;

	if v_exists then
		delete from question_bookmarks
			where user_id = v_user_id and question_id = p_question_id;

		return false; -- removed
	else
		insert into question_bookmarks (
			user_id,
			question_id, notes
		)
		values (
			v_user_id,
			p_question_id,
			p_note
		);

		return true; -- added
	end if;
end;
$$;
