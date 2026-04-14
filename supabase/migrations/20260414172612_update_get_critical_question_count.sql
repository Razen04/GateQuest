-- Update the rpc to only get the count of verfied questions for smart revision 
CREATE OR REPLACE FUNCTION get_critical_question_count(p_valid_subjects uuid[])
RETURNS integer AS $$
DECLARE
    v_count integer;
    v_current_branch_id text;
BEGIN
    -- 1. Get the user's active branch (e.g., 'da' or 'cs')
    SELECT branch_id INTO v_current_branch_id 
    FROM public.user_goals 
    WHERE user_id = auth.uid() 
    LIMIT 1;

    -- 2. Count distinct critical questions matching the branch 'set'
    SELECT COUNT(DISTINCT uiq.question_id) INTO v_count
    FROM user_incorrect_queue uiq
    JOIN questions q ON uiq.question_id = q.id
    JOIN subjects s ON q.subject_id = s.id
    WHERE uiq.user_id = auth.uid()
      AND uiq.next_review_at <= NOW()
      AND q.subject_id = ANY(p_valid_subjects)
      -- Strictly filter for verified questions only
      AND q.verified = true
      AND (
          -- Rule 1: Always include universal mistakes (Maths/Aptitude)
          s.is_universal = true 
          OR 
          -- Rule 2: For core subjects, metadata 'set' must match the active branch_id
          (q.metadata->>'set' = UPPER(v_current_branch_id)) 
      );
      
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;
