begin;

create or replace view public.v_user_cycle_stats as
select distinct on (uqa.user_id, uqa.question_id, uqa.user_version_number)
    uqa.id,
    uqa.user_id,
    uqa.question_id,
    uqa.subject,           -- String name for backward compatibility
    uqa.was_correct,       -- Matches your status check
    uqa.time_taken,
    uqa.attempt_number,
    uqa.user_version_number,
    uqa.attempted_at,
    uqa.subject_id,        -- The UUID for StatsProvider mapping
    -- NORMALIZATION LOGIC: Always return text[] even if metadata is a single string
    case 
				when jsonb_typeof(q.metadata->'exam') = 'array' then 
            array(select jsonb_array_elements_text(q.metadata->'exam'))
				when jsonb_typeof(q.metadata->'exam') = 'string' then
            array[(q.metadata->>'exam')]
				else 
            array['GATE']::text[] -- Default fallback
		end as exam_tags
from public.user_question_activity as uqa
left join public.questions q on uqa.question_id = q.id -- Dynamic Join
order by 
    uqa.user_id, 
    uqa.question_id, 
    uqa.user_version_number, 
    uqa.attempt_number asc;

grant select on public.v_user_cycle_stats to authenticated;

commit;

