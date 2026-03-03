-- Backfill Exam Metadata for GATE
-- Version: 1.0.0 (v0.10.0 architecture)

BEGIN;

-- 1. Update the metadata JSONB column
-- This uses the || operator to merge the new key-value pair.
-- It also handles cases where the metadata column might be NULL.
UPDATE public.questions
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"exam": "GATE"}'::jsonb
WHERE (metadata->>'exam') IS NULL OR metadata->>'exam' != 'GATE';

-- 2. Verification: Check the count of questions tagged with GATE
DO $$
DECLARE
    gate_count int;
BEGIN
    SELECT COUNT(*) INTO gate_count 
    FROM public.questions 
    WHERE metadata->>'exam' = 'GATE';

    RAISE NOTICE 'Success: % questions now have "GATE" in their metadata.', gate_count;
END $$;

COMMIT;
