
-- 1. Add the column (nullable first)
ALTER TABLE topic_tests
ADD COLUMN branch_id text REFERENCES branches(id) ON DELETE CASCADE;

-- 2. Backfill existing rows
UPDATE topic_tests
SET branch_id = 'cs';

-- 3. (Optional) Make it NOT NULL if required
ALTER TABLE topic_tests
ALTER COLUMN branch_id SET NOT NULL;

