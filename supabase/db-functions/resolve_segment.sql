-- Segment registry. New segments are added as `when` branches here.
-- Adding a segment = editing this function, no schema change.
create or replace function public.resolve_segment (p_target jsonb)
    returns uuid[]
    language plpgsql
    security definer
    set search_path = public
    as $$
declare
    v_segment text := p_target ->> 'segment';
    v_result uuid[];
begin
    if v_segment is null then
        raise exception 'target.type=segment requires segment';
    end if;
    case v_segment
    when 'active_weekend' then
        select
            array_agg(distinct s.user_id)
        into
            v_result
        from
            public.active_weekend_subscriptions s;
            return coalesce(v_result, array[]::uuid[]);
    when 'leaderboard_top' then
        select
            array_agg(top.id)
into
    v_result
from (
    select
        id
    from
        public.users
    where
        deleted_at is null
    order by
        total_xp desc nulls last
    limit coalesce((p_target -> 'params' ->> 'n')::int, 5)) top;
return coalesce(v_result, array[]::uuid[]);
    else
        raise exception 'Unknown segment: %', v_segment;
    end case;
end;
$$;

