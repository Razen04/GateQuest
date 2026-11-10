-- Fix: refresh_user_goal_tags was wiping donor:tier-* tags.
--
-- The original (20261023122824) preserved only role:* tags, so any
-- goal change (user switches target exam) silently erased the donor
-- tier tag. Donors lost their tier ring on any goal change.
--
-- This CREATE OR REPLACE preserves everything except the two families
-- this trigger owns (branch:*, exam:*). donor:tier-*, team:*, cohort:*
-- and any future family survive goal changes.
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
    if TG_OP = 'DELETE' then
        v_user_id := old.user_id;
    else
        v_user_id := new.user_id;
    end if;
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
    select
        array_agg(t)
    into
        v_preserved_tags
    from
        unnest(COALESCE((
                select
                    notification_tags
                from public.users
                where
                    id = v_user_id), array[]::text[])) as t
    where
        t not like 'branch:%'
        and t not like 'exam:%';
    update
        public.users
    set
        notification_tags = array_remove(array[v_branch_tag] || COALESCE(v_exam_tags, array[]::text[]) || COALESCE(v_preserved_tags, array[]::text[]), null)
    where
        id = v_user_id;
    return COALESCE(new, old);
end;
$$;

drop trigger if exists on_user_goal_change on public.user_goals;

create trigger on_user_goal_change
    after insert or update or delete on public.user_goals
    for each row
    execute function public.refresh_user_goal_tags ();

