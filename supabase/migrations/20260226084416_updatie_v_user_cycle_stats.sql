-- Add the new relationship columns
ALTER TABLE user_question_activity 
ADD COLUMN subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
ADD COLUMN branch_id text REFERENCES branches(id) ON DELETE SET NULL;

-- 2. Backfill 'subject_id' for existing records
-- We map the old string 'subject' to the new UUID. 
-- Note: You may need to adjust "uqa.subject ILIKE s.name" if your old strings matched 'slug' instead.
UPDATE user_question_activity uqa
SET subject_id = s.id
FROM subjects s
WHERE uqa.subject ILIKE s.name; 

-- 3. Backfill 'branch_id' for existing records
-- Since GATEQuest was previously a CS-centric app, all historical attempts belong to the 'cs' branch.
UPDATE user_question_activity
SET branch_id = 'cs'
WHERE branch_id IS NULL;


-- This view selects the EARLIEST attempt for every question within every version cycle,
-- now joined with the questions table to retrieve the new relational subject_id (UUID).

create or replace view v_user_cycle_stats as
select distinct on (uqa.user_id, uqa.question_id, uqa.user_version_number)
    uqa.id,
    uqa.user_id,
    uqa.question_id,
    uqa.subject,           -- Keeping the old string name for backward compatibility
    uqa.was_correct,
    uqa.time_taken,
    uqa.attempt_number,
    uqa.user_version_number,
    uqa.attempted_at,
		uqa.subject_id          -- NEW: Pulling the UUID directly from the questions table
from user_question_activity as uqa
-- We order by ID and Version, then by attempt_number ASC to pick the lowest number first.
order by uqa.user_id, uqa.question_id, uqa.user_version_number, uqa.attempt_number asc;

-- Grant access to authenticated users so your app can read the view.
grant select on v_user_cycle_stats to authenticated;
