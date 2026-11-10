create or replace function public.handle_donation_tier_change ()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
    as $$
declare
    v_user_id uuid;
    v_should_recompute boolean := false;
begin
    if TG_OP = 'DELETE' then
        -- Only recompute if a verified donation was deleted
        if old.verified = true and old.user_id is not null then
            v_user_id := old.user_id;
            v_should_recompute := true;
        end if;
    elsif TG_OP = 'INSERT' then
        -- Only recompute if inserted as verified (rare, defensive)
        if new.verified = true and new.user_id is not null then
            v_user_id := new.user_id;
            v_should_recompute := true;
        end if;
    else
        -- UPDATE
        if new.user_id is null then
            return NEW;
            -- guest donation, no user to recompute
        end if;
        -- Recompute if verified state changed, OR if actual_amount changed
        -- on an already-verified donation. Ignores unrelated updates like
        -- alerted_at from the Phase 4 cron.
        if (old.verified is distinct from new.verified) or (new.verified = true and old.actual_amount is distinct from new.actual_amount) then
            v_user_id := new.user_id;
            v_should_recompute := true;
        end if;
    end if;
    if v_should_recompute then
        perform
            public.recompute_user_tier (v_user_id);
    end if;
    if TG_OP = 'DELETE' then
        return OLD;
    else
        return NEW;
    end if;
end;
$$;

