create or replace function public.refresh_user_goal_tags ()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
    as $$
declare
    v_user_id uuid;
    v_branch_tag text;
    v_exam_tags text[];
    v_role_tags text[];
begin
    -- Determine the affected user for INSERT, UPDATE, or DELETE.
    if TG_OP = 'DELETE' then
        v_user_id := old.user_id;
    else
        v_user_id := new.user_id;
    end if;
    -- Recompute goal-derived tags from the active goal.
    select
        case when ug.branch_id is not null then
            'branch:' || ug.branch_id::text
        else
            null
        end,
        (
            select
                array_agg('exam:' || lower(e))
            from
                jsonb_array_elements_text(COALESCE(ug.target_exams, '[]'::jsonb)) as exams (e))
into
    v_branch_tag,
    v_exam_tags
from
    public.user_goals as ug
where
    ug.user_id = v_user_id
        and ug.is_active = true
    limit 1;
    -- Preserve existing role tags, including role:donor.
    select
        array_agg(t)
    into
        v_role_tags
    from
        unnest(COALESCE((
                select
                    u.notification_tags
                from public.users as u
                where
                    u.id = v_user_id), array[]::text[])) as tags (t)
    where
        t like 'role:%';
    -- Replace goal-derived tags while preserving role tags.
    update
        public.users
    set
        notification_tags = array_remove(array[v_branch_tag] || COALESCE(v_exam_tags, array[]::text[]) || COALESCE(v_role_tags, array[]::text[]), null)
    where
        id = v_user_id;
    -- Return the appropriate row for the trigger operation.
    if TG_OP = 'DELETE' then
        return OLD;
    else
        return NEW;
    end if;
end;
$$;

drop trigger if exists on_user_goal_change on public.user_goals;

create trigger on_user_goal_change
    after insert or update or delete on public.user_goals
    for each row
    execute function public.refresh_user_goal_tags ();

