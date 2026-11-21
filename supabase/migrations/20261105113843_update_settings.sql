-- Add `mode` field derived from existing `darkMode` boolean, then drop it
update
    public.users
set
    settings = settings - 'darkMode' || jsonb_build_object('mode', case when (settings ->> 'darkMode')::boolean = true then
            'dark'
        else
            'light'
        end)
where
    settings ? 'darkMode';

