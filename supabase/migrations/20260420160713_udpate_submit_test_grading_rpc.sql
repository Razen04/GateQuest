-- Updating this rpc so that the attempts get synced to user_question_activity to reflect the nature in the dashboard too.

CREATE OR REPLACE FUNCTION submit_test_grading(
  p_session_id uuid,
  p_payload jsonb,
  p_remaining_time_seconds int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item jsonb;
  v_q_id uuid;
  v_user_ans jsonb;
  v_user_val float;
  v_correct_ans jsonb;
  v_ans_type text;
  v_q_marks float;
  v_q_type text;
  v_is_correct boolean;
  v_score float;
  v_total_score float := 0;
  v_correct_count int := 0;
  v_incorrect_count int := 0;
  v_attempted_count int := 0;
  
  -- Context variables for user_question_activity
  v_user_id uuid;
  v_branch_id text;
  v_user_version int;
  v_subject_id uuid;
  v_subject_name text;
BEGIN
  -- 1. Check if the session is already completed
  IF EXISTS (SELECT 1 FROM topic_tests WHERE id = p_session_id AND status = 'completed') THEN
    RETURN jsonb_build_object('status', 'already_completed');
  END IF;

  -- 2. Fetch User and Session Context
  SELECT 
    tt.user_id, 
    tt.branch_id, 
    u.version_number 
  INTO v_user_id, v_branch_id, v_user_version
  FROM topic_tests tt
  JOIN users u ON u.id = tt.user_id
  WHERE tt.id = p_session_id;

  -- 3. Loop through the payload and grade each question
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload) LOOP
    v_q_id := (v_item->>'question_id')::uuid;
    v_user_ans := v_item->'user_answer';
    
    -- Fix literal 'null' text issue
    IF jsonb_typeof(v_user_ans) = 'null' THEN
      v_user_ans := null;
    END IF;

    -- Fetch question details and subject name for activity logging
    SELECT 
      q.correct_answer, q.marks, q.question_type, q.subject_id, s.name
    INTO v_correct_ans, v_q_marks, v_q_type, v_subject_id, v_subject_name
    FROM questions q
    LEFT JOIN subjects s ON s.id = q.subject_id
    WHERE q.id = v_q_id;

    v_is_correct := NULL;
    v_score := 0;

    -- Grading logic for attempted questions
    IF v_user_ans IS NOT NULL THEN
      v_attempted_count := v_attempted_count + 1;
      
      -- NAT logic
      IF v_q_type = 'numerical' THEN
        v_user_val := (v_user_ans#>>'{}')::float;
        v_ans_type := v_correct_ans->>'type';

        CASE v_ans_type
          WHEN 'exact' THEN v_is_correct := (v_user_val = (v_correct_ans->>'value')::float);
          WHEN 'multiple' THEN 
             v_is_correct := EXISTS (
               SELECT 1 FROM jsonb_array_elements(
                 CASE WHEN jsonb_typeof(v_correct_ans->'values') = 'array' THEN v_correct_ans->'values' ELSE jsonb_build_array(v_correct_ans->'values') END
               ) val WHERE (val#>>'{}')::float = v_user_val
             );
          WHEN 'range' THEN 
            IF COALESCE((v_correct_ans->>'inclusive')::boolean, true) THEN
              v_is_correct := (v_user_val >= (v_correct_ans->>'min')::float AND v_user_val <= (v_correct_ans->>'max')::float);
            ELSE
              v_is_correct := (v_user_val > (v_correct_ans->>'min')::float AND v_user_val < (v_correct_ans->>'max')::float);
            END IF;
          WHEN 'tolerance' THEN v_is_correct := (ABS(v_user_val - (v_correct_ans->>'value')::float)[118;1:3u <= (v_correct_ans->>'tolerance')::float);
          ELSE v_is_correct := false;
        END CASE;

        IF v_is_correct THEN
          v_score := COALESCE(v_q_marks, 1);
          v_correct_count := v_correct_count + 1;
        ELSE
          v_incorrect_count := v_incorrect_count + 1;
        END IF;

      -- MCQ/MSQ logic
      ELSE
        IF (SELECT jsonb_agg(x ORDER BY x) FROM jsonb_array_elements(
              CASE WHEN jsonb_typeof(v_user_ans) = 'array' THEN v_user_ans ELSE jsonb_build_array(v_user_ans) END
           ) x) = 
           (SELECT jsonb_agg(y ORDER BY y) FROM jsonb_array_elements(
              CASE WHEN jsonb_typeof(v_correct_ans) = 'array' THEN v_correct_ans ELSE jsonb_build_array(v_correct_ans) END
           ) y) THEN
          v_is_correct := true;
          v_score := COALESCE(v_q_marks, 2);
          v_correct_count := v_correct_count + 1;
        ELSE
          v_is_correct := false; 
          IF v_q_type = 'multiple-choice' THEN
            v_score := - (COALESCE(v_q_marks, 1) / 3.0);
          END IF;
          v_incorrect_count := v_incorrect_count + 1;
        END IF;
      END IF;

      -- 4. Sync to user_question_activity (Only for attempted questions)
      INSERT INTO user_question_activity (
        user_id, 
        question_id, 
        subject,
        subject_id,
        branch_id,
        was_correct, 
        time_taken, 
        user_version_number
      ) VALUES (
        v_user_id,
        v_q_id,
        v_subject_name,
        v_subject_id,
        v_branch_id,
        v_is_correct,
        COALESCE((v_item->>'time_spent_seconds')::int, 0),
        v_user_version
      );
    END IF;

    v_total_score := v_total_score + v_score;

    -- 5. Update topic_tests_attempts
    INSERT INTO topic_tests_attempts (
      session_id, question_id, user_answer, is_correct, score, 
      time_spent_seconds, marked_for_review, status, attempt_order
    ) VALUES (
      p_session_id, v_q_id, v_user_ans, v_is_correct, v_score, 
      (v_item->>'time_spent_seconds')::int, 
      (v_item->>'marked_for_review')::boolean,
      COALESCE(v_item->>'status', 'visited'),
      (v_item->>'attempt_order')::int
    )
    ON CONFLICT (session_id, question_id) DO UPDATE SET
      user_answer = EXCLUDED.user_answer,
      is_correct = EXCLUDED.is_correct,
      score = EXCLUDED.score,
      time_spent_seconds = EXCLUDED.time_spent_seconds,
      status = EXCLUDED.status;
  END LOOP;

  -- 6. Finalize Topic Test Session
  UPDATE topic_tests SET
    status = 'completed',
    score = v_total_score,
    correct_count = v_correct_count,
    attempted_count = v_attempted_count,
    remaining_time_seconds = p_remaining_time_seconds,
    completed_at = now(),
    accuracy = CASE WHEN v_attempted_count > 0 THEN (v_correct_count::float / v_attempted_count::float) * 100 ELSE 0 END
  WHERE id = p_session_id;

  RETURN jsonb_build_object(
    'total_score', v_total_score, 
    'correct_count', v_correct_count, 
    'incorrect_count', v_incorrect_count
  );
END;
$$;
