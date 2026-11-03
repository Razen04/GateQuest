with goal_tags as (
    select
        g.user_id,
        array_cat(array['branch:' || g.branch_id], coalesce((
                select
                    array_agg('exam:' || lower(e))
                from jsonb_array_elements_text(g.target_exams) as e), array[]::text[])) as tags
    from
        public.user_goals g
    where
        g.is_active = true
        and g.branch_id is not null
),
donor_tags as (
    select distinct
        user_id
    from
        public.donations
    where
        verified = true
        and user_id is not null
),
combined as (
    select
        u.id as user_id,
        coalesce(gt.tags, array[]::text[]) || case when dt.user_id is not null then
            array['role:donor']
        else
            array[]::text[]
        end as final_tags
    from
        public.users u
        left join goal_tags gt on gt.user_id = u.id
        left join donor_tags dt on dt.user_id = u.id)
update
    public.users u
set
    notification_tags = c.final_tags
from
    combined c
where
    u.id = c.user_id
    and u.notification_tags = array[]::text[];

