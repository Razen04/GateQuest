-- Resolves a JSONB target spec into an array of user IDs.
-- Broadcast returns NULL (universal audience).
-- Every other type returns a uuid[] (possibly empty).
create or replace function public.resolve_notification_target (p_target jsonb)
    returns uuid[]
    language plpgsql
    security definer
    set search_path = public
    as $$
declare
    v_type text := p_target ->> 'type';
    v_result uuid[];
begin
    if v_type is null then
        raise exception 'Notification target is missing a "type" field';
    end if;
    case v_type
    when 'broadcast' then
        return null;
    when 'user' then
        if p_target ->> 'user_id' is null then
            raise exception 'target.type=user requires user_id';
            end if;
    return array[(p_target ->> 'user_id')::uuid];
    when 'users' then
        select
            array_agg((t.value)::uuid order by t.ord)
        into
            v_result
        from
            jsonb_array_elements_text(p_target -> 'user_ids')
    with ordinality as t (value, ord);
    return coalesce(v_result, array[]::uuid[]);
    when 'tag' then
        if p_target ->> 'tag' is null then
            raise exception 'target.type=tag requires tag';
        end if;
    select
        array_agg(u.id)
    into
        v_result
    from
        public.users u
    where
        p_target ->> 'tag' = any (u.notification_tags);
    return coalesce(v_result, array[]::uuid[]);
    when 'segment' then
        return public.resolve_segment (p_target);
else
    raise exception 'Unknown notification target type: %', v_type;
    end case;
end;
$$;

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
