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
    v_preserved_tags text[];
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
    -- Preserve every tag family this trigger does NOT own.
    -- Includes role:donor, donor:tier-*, and any future families.
    select
        array_agg(t)
    into
        v_preserved_tags
    from
        unnest(COALESCE((
                select
                    u.notification_tags
                from public.users as u
                where
                    u.id = v_user_id), array[]::text[])) as tags (t)
    where
        t not like 'branch:%'
        and t not like 'exam:%';
    -- Replace goal-derived tags while preserving everything else.
    update
        public.users
    set
        notification_tags = array_remove(array[v_branch_tag] || COALESCE(v_exam_tags, array[]::text[]) || COALESCE(v_preserved_tags, array[]::text[]), null)
    where
        id = v_user_id;
    if TG_OP = 'DELETE' then
        return OLD;
    else
        return NEW;
    end if;
end;
$$;

drop trigger if exists on_user_goal_change on public.user_goals;

create trigger on_user_goal_change
    after insert or update or delete on public.user_goals for each row
    execute function public.refresh_user_goal_tags ();
