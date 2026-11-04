-- Username search index
create index if not exists users_username_search_idx on public.users (lower(username))
where
    deleted_at is null and coalesce(is_public, false) = true;

create or replace function public.search_users (search_term text)
    returns table (
        id uuid,
        username text,
        avatar text)
    language sql
    stable
    security definer
    set search_path = ''
    as $$
    select
        u.id,
        u.username,
        u.avatar
    from
        public.users u
    where
        auth.uid () is not null
        and length(trim(search_term)) >= 2
        and u.deleted_at is null
        and coalesce(u.is_public, false) = true
        and lower(u.username)
        like lower(trim(search_term)) || '%'
    order by
        case when lower(u.username) = lower(trim(search_term)) then
            0
        else
            1
        end,
        u.username
    limit 20;
$$;

revoke all on function public.search_users (text) from public;

grant execute on function public.search_users (text) to authenticated;

