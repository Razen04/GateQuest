-- Add branch_id to track which goal the revision set was generated for
ALTER TABLE weekly_revision_set 
ADD COLUMN branch_id text REFERENCES branches(id) ON DELETE CASCADE;

-- Backfill existing sets to the default 'cs' branch so they don't break
UPDATE weekly_revision_set SET branch_id = 'cs' WHERE branch_id IS NULL;
