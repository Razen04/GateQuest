-- Add branch_id to track which goal the revision set was generated for
ALTER TABLE weekly_revision_set 
ADD COLUMN branch_id text REFERENCES branches(id) ON DELETE CASCADE;

