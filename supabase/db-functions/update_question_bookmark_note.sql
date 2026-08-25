create or replace function update_question_bookmark_note(
    p_question_id uuid,
    p_note text
)
returns void
language plpgsql
security invoker
as $$
declare
    v_user_id uuid := auth.uid();
begin
    if v_user_id is null then
        raise exception 'Authentication required';
    end if;

    if p_note is not null and char_length(p_note) > 100 then
        raise exception 'Note cannot exceed 100 characters';
    end if;

    update question_bookmarks
    set notes = p_note
    where user_id = v_user_id
      and question_id = p_question_id;

    if not found then
        raise exception 'Bookmark not found';
    end if;
end;
$$;
