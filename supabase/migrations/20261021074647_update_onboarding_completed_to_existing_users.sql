update
    public.users u
set
    onboarding_completed = (u.username is not null
        and exists (
            select
                1
            from
                public.user_goals g
            where
                g.user_id = u.id
                and g.is_active = true
                and g.branch_id is not null
                and jsonb_typeof(g.target_exams) = 'array'
                and jsonb_array_length(g.target_exams) > 0));

