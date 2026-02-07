-- This view selects the EARLIEST attempt for every question within every version cycle.
create or replace view v_user_cycle_stats as
select distinct on (user_id, question_id, user_version_number)
    id,
    user_id,
    question_id,
    subject,
    was_correct,
    time_taken,
    attempt_number,
    user_version_number,
    attempted_at
from user_question_activity
-- We order by ID and Version, then by attempt_number ASC to pick the lowest number first.
order by user_id, question_id, user_version_number, attempt_number asc;

-- Grant access to authenticated users so your app can read the view.
grant select on v_user_cycle_stats to authenticated;
