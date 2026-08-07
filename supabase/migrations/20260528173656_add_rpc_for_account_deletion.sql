-- This rpc handles account deletion
-- The process is basically to soft delete and remove unnecessary data which does not contribute much to the engagement data, so all the info from push_subscriptions, topic_tests, topic_test_attempts, weekly_revisio_set, revision_set_questions, user_incorrect_queue will be deleted and in the users table we anonymise the data and remove their bookmarks column to be empty.

-- We will keep donations data just user_id will be set to NULL, user_question_activity and question_reports will keep the activity linked to the fake user_id we will have.

-- We will remove the auth.users data for their id.

create or replace function delete_account()
returns void
language plpgsql
security definer
set search_path = auth, public
as $$
declare
	target_user_id uuid;
begin

	target_user_id := auth.uid();
	if target_user_id is null then
		raise exception 'Not authenticated';
	end if;

	-- Deleting data heavy tables first
	-- Topic Test
	delete from public.topic_tests where user_id = target_user_id;

	-- Weekly Revision Set
	delete from public.weekly_revision_set where generated_for = target_user_id;
	
	-- User Incorrect Queue
	delete from public.user_incorrect_queue where user_id = target_user_id;

	-- Bookmarks (Migrated from users.bookmark_questions)
  delete from public.question_bookmarks where user_id = target_user_id;

	-- Push Subscriptions
	delete from public.push_subscriptions where user_id = target_user_id;

	-- User Goals
	delete from public.user_goals where user_id = target_user_id;

	-- Update the records for donation to have set to NULL for user_id to remove the user identity
	update public.donations set user_id = NULL where user_id = target_user_id;

	-- Update the users table to anonymise the user
	update public.users
	set
		name = 'Deleted Account',
		email = 'deleted_' || target_user_id || 'anonymised@local',
		avatar = NULL,
		settings = '{}'::jsonb,
		bookmark_questions = '{}'::jsonb,
		deleted_at = now()
	where id = target_user_id;

	-- Delete the user from the auth.users table
	delete from auth.users where id = target_user_id;

end;
$$;

