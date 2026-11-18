create or replace function public.topic_tests_set_started_at ()
    returns trigger
    language plpgsql
    as $$
begin
    if new.status = 'ongoing' and old.status = 'created' and new.started_at is null then
        new.started_at := now();
    end if;
    return NEW;
end;
$$;

