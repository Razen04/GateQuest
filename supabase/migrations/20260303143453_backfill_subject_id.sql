-- Robust Backfill Script for questions.subject_id
-- Version: 1.0.0 (v0.10.0 architecture)

BEGIN;

-- 1. Perform the update by joining questions and subjects on their names
-- We use TRIM() to ensure whitespace doesn't prevent a match
UPDATE public.questions q
SET subject_id = s.id
FROM public.subjects s
WHERE TRIM(q.subject) = TRIM(s.name)
  AND q.subject_id IS NULL; -- Only update rows that haven't been filled yet

-- 2. Verification: Check if any questions failed to match
-- This helps identify typos in the original 'subject' string data
DO $$
DECLARE
    missing_count int;
BEGIN
    SELECT COUNT(*) INTO missing_count 
    FROM public.questions 
    WHERE subject_id IS NULL;

    IF missing_count > 0 THEN
        RAISE NOTICE 'Backfill complete, but % questions still have no subject_id. Check for name mismatches.', missing_count;
    ELSE
        RAISE NOTICE 'Backfill successful: All questions linked to subject UUIDs.';
    END IF;
END $$;

-- 3. (Optional) Manual mapping for known common aliases if needed
-- Uncomment and adjust if your 'subject' column uses 'OS' instead of 'Operating System', etc.

UPDATE public.questions 
SET subject_id = (SELECT id FROM public.subjects WHERE slug = 'co-architecture')
WHERE subject IN ('CO & Architecture', 'Computer Organization & Architecture') AND subject_id IS NULL;

UPDATE public.questions 
SET subject_id = (SELECT id FROM public.subjects WHERE slug = 'databases')
WHERE subject IN ('Databases', 'Database Management Systems') AND subject_id IS NULL;

COMMIT;
