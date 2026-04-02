create or replace function submit_test_grading(
  p_session_id uuid,
  p_payload jsonb,
  p_remaining_time_seconds int
)
returns jsonb
language plpgsql
security definer
as $$
declare
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
begin
  if exists (select 1 from topic_tests where id = p_session_id and status = 'completed') then
    return jsonb_build_object('status', 'already_completed');
  end if;

  for v_item in select * from jsonb_array_elements(p_payload) loop
    v_q_id := (v_item->>'question_id')::uuid;
    v_user_ans := v_item->'user_answer';
    
    -- Fix literal 'null' text issue
    if jsonb_typeof(v_user_ans) = 'null' then
      v_user_ans := null;
    end if;

    select correct_answer, marks, question_type 
    into v_correct_ans, v_q_marks, v_q_type
    from questions where id = v_q_id;

-- Initialize as NULL for skipped questions
    v_is_correct := NULL;
    v_score := 0;

    -- Only enter grading logic if the user actually provided an answer
    if v_user_ans is not null then
      v_attempted_count := v_attempted_count + 1;
      
      -- NAT logic (Safe for scalars)
      if v_q_type = 'numerical' then
        v_user_val := (v_user_ans#>>'{}')::float;
        v_ans_type := v_correct_ans->>'type';

        case v_ans_type
          when 'exact' then v_is_correct := (v_user_val = (v_correct_ans->>'value')::float);
          when 'multiple' then 
             v_is_correct := exists (
               select 1 from jsonb_array_elements(
                 case when jsonb_typeof(v_correct_ans->'values') = 'array' then v_correct_ans->'values' else jsonb_build_array(v_correct_ans->'values') end
               ) val where (val#>>'{}')::float = v_user_val
             );
          when 'range' then 
            if coalesce((v_correct_ans->>'inclusive')::boolean, true) then
              v_is_correct := (v_user_val >= (v_correct_ans->>'min')::float and v_user_val <= (v_correct_ans->>'max')::float);
            else
              v_is_correct := (v_user_val > (v_correct_ans->>'min')::float and v_user_val < (v_correct_ans->>'max')::float);
            end if;
          when 'tolerance' then v_is_correct := (abs(v_user_val - (v_correct_ans->>'value')::float) <= (v_correct_ans->>'tolerance')::float);
          else v_is_correct := false;
        end case;

        -- Update counts based on the boolean result of the NAT comparison
        if v_is_correct then
          v_score := coalesce(v_q_marks, 1);
          v_correct_count := v_correct_count + 1;
        else
          v_incorrect_count := v_incorrect_count + 1;
        end if;

      -- MCQ/MSQ logic (Defensive against scalars)
      else
        if (select jsonb_agg(x order by x) from jsonb_array_elements(
              case when jsonb_typeof(v_user_ans) = 'array' then v_user_ans else jsonb_build_array(v_user_ans) end
           ) x) = 
           (select jsonb_agg(y order by y) from jsonb_array_elements(
              case when jsonb_typeof(v_correct_ans) = 'array' then v_correct_ans else jsonb_build_array(v_correct_ans) end
           ) y) then
          v_is_correct := true;
          v_score := coalesce(v_q_marks, 2);
          v_correct_count := v_correct_count + 1;
        else
          -- Explicitly set to FALSE for wrong answers (differentiates from NULL/Skipped)
          v_is_correct := false; 
          if v_q_type = 'multiple-choice' then
            v_score := - (coalesce(v_q_marks, 1) / 3.0);
          end if;
          v_incorrect_count := v_incorrect_count + 1;
        end if;
      end if;
    end if;

    v_total_score := v_total_score + v_score;

    insert into topic_tests_attempts (
      session_id, question_id, user_answer, is_correct, score, 
      time_spent_seconds, marked_for_review, status, attempt_order
    ) values (
      p_session_id, v_q_id, v_user_ans, v_is_correct, v_score, 
      (v_item->>'time_spent_seconds')::int, 
      (v_item->>'marked_for_review')::boolean,
      coalesce(v_item->>'status', 'visited'),
      (v_item->>'attempt_order')::int
    )
    on conflict (session_id, question_id) do update set
      user_answer = excluded.user_answer,
      is_correct = excluded.is_correct,
      score = excluded.score,
      time_spent_seconds = excluded.time_spent_seconds,
      status = excluded.status;
  end loop;

  update topic_tests set
    status = 'completed',
    score = v_total_score,
    correct_count = v_correct_count,
    attempted_count = v_attempted_count,
    remaining_time_seconds = p_remaining_time_seconds,
    completed_at = now(),
    accuracy = case when v_attempted_count > 0 then (v_correct_count::float / v_attempted_count::float) * 100 else 0 end
  where id = p_session_id;

  return jsonb_build_object('total_score', v_total_score, 'correct_count', v_correct_count, 'incorrect_count', v_incorrect_count);
end;
$$;
