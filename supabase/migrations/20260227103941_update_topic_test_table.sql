
-- 1. Add the column (nullable first)
ALTER TABLE topic_tests
ADD COLUMN branch_id text REFERENCES branches(id) ON DELETE CASCADE;

