-- updating the type of question_id in user_question_activity
alter table user_question_activity
alter column question_id type uuid
using question_id::uuid;