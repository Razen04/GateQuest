create or replace function public.recompute_user_tier (v_user_id uuid)
    returns void
    language plpgsql
    security definer
    set search_path = public
    as $$
declare
    v_total numeric;
    v_tier smallint;
    v_tags text[];
    v_has_any_verified boolean;
begin
    perform
        1
    from
        users
    where
        id = v_user_id
    for update;
    select
        COALESCE(SUM(actual_amount), 0)
    into
        v_total
    from
        donations
    where
        user_id = v_user_id
        and verified = true
        and actual_amount is not null;
    v_tier := case when v_total >= 569 then
        3
    when v_total >= 169 then
        2
    when v_total >= 50 then
        1
    else
        0
    end;
    select
        exists (
            select
                1
            from
                donations
            where
                user_id = v_user_id
                and verified = true)
    into
        v_has_any_verified;
    select
        COALESCE(array_agg(t) filter (where t not like 'donor:tier-%'), array[]::text[])
    into
        v_tags
    from
        unnest(COALESCE((
                select
                    notification_tags
                from users
                where
                    id = v_user_id), array[]::text[])) t;
    if v_has_any_verified and not ('role:donor' = any (v_tags)) then
        -- array_append is unambiguous — always appends an element
        v_tags := array_append(v_tags, 'role:donor'::text);
    end if;
    if v_tier >= 1 then
        v_tags := array_append(v_tags, 'donor:tier-' || v_tier::text);
    end if;
    update
        users
    set
        notification_tags = v_tags
    where
        id = v_user_id;
end;
$$;

grant execute on function public.recompute_user_tier (uuid) to service_role;

