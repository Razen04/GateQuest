-- This file updates the status of Engineering Maths from universal to non-universal with the addition of GATE XL branch.

update subjects
set is_universal = false
where slug = 'eng-maths';

insert into branch_subjects (branch_id, subject_id)
select
    b.id,
    s.id
from branches b
cross join subjects s
where s.slug = 'eng-maths'
  and b.id in ('da', 'me', 'ee', 'ec')
on conflict do nothing;
