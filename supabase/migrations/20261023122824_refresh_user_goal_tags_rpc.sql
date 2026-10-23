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
    v_donor_tag text[];
begin
    -- handle INSERT/UPDATE (use new) and DELETE (use old)
    v_user_id := coalesce(new.user_id, old.user_id);
    -- Recompute the goal-derived tags from scratch
    select
        case when is_active
            and branch_id is not null then
            'branch:' || branch_id
        else
            null
        end,
        case when is_active then
        (
            select
                array_agg('exam:' || lower(e))
            from
                jsonb_array_elements_text(target_exams) as e)
        else
            null
        end
    into
        v_branch_tag,
        v_exam_tags
    from
        public.user_goals
    where
        user_id = v_user_id
        and is_active = true
    limit 1;
    -- Preserve role:donor if present
    select
        array_agg(t)
    into
        v_donor_tag
    from
        unnest(
            select
                notification_tags
            from public.users
            where
                id = v_user_id) as t
    where
        t like 'role:%';
    update
        public.users
    set
        notification_tags = array_remove(array[v_branch_tag] || coalesce(v_exam_tags, array[]::text[]) || coalesce(v_donor_tag, array[]::text[]), null)
    where
        id = v_user_id;
    return coalesce(new, old);
end;
$$;

drop trigger if exists on_user_goal_change on public.user_goals;

create trigger on_user_goal_change
    after insert or update or delete on public.user_goals for each row
    execute function public.refresh_user_goal_tags ();

