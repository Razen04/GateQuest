-- Renaming targetYear to target_year for consistency
ALTER TABLE public.users
    RENAME COLUMN "targetYear" TO target_year;

ALTER TABLE public.users
    ALTER COLUMN show_name SET DEFAULT TRUE,
    ALTER COLUMN total_xp SET DEFAULT 0,
    ALTER COLUMN settings SET DEFAULT '{
        "sound": true,
        "autoTimer": true,
        "darkMode": false,
        "shareProgress": true,
        "dataCollection": true
    }'::jsonb,
    ALTER COLUMN college SET DEFAULT '',
    ALTER COLUMN target_year SET DEFAULT 2026,
    ALTER COLUMN bookmark_questions SET DEFAULT '[]'::jsonb;
    
