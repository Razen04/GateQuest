-- This gives all the dashboard metrics for a user on their own dashboard
create or replace function get_my_dashboard()
returns jsonb
language plpgsql
security definer
as $$
declare
    v_user_id uuid;
    v_dashboard_data jsonb;
begin
    v_user_id := auth.uid();
    if v_user_id is null then
        raise exception 'Not authenticated. Please log in.';
    end if;

		-- Call the calc_user_metrics rpc with the required user_id
    v_dashboard_data := calc_user_metrics(v_user_id);

    return v_dashboard_data;
end;
$$;
