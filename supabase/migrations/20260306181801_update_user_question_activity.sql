BEGIN;

-- 1. Add the column with the constraint
ALTER TABLE user_question_activity 
ADD COLUMN IF NOT EXISTS branch_id text REFERENCES branches(id);

-- 2. Simple backfill: Set all existing attempts to 'cs'
UPDATE user_question_activity
SET branch_id = 'cs'
WHERE branch_id IS NULL;

-- 3. Optional: Make the column NOT NULL to ensure future data quality
-- (Only do this after the backfill succeeds!)
ALTER TABLE user_question_activity 
ALTER COLUMN branch_id SET NOT NULL;

COMMIT;

