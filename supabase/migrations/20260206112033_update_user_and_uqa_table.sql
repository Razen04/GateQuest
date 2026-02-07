-- update the user table to contain version_number
alter table users
add column version_number integer not null default 1,
add constraint users_max_version_number
check (version_number <= 5);

-- update the user_question_activity table to hold the version_number for the particular user to properly show the stats of the current version and not the previous version
alter table user_question_activity
add column user_version_number integer not null default 1,
add constraint uqa_users_max_version_number
check (user_version_number <= 5);
