# GATEQuest Supabase Documentation

Welcome to the GATEQuest database documentation. This document provides a detailed overview of the PostgreSQL schema, custom functions, triggers, scheduled jobs, edge functions, and security policies that power the application, all managed by Supabase.

---

## Core Entities & Relationships

The database is designed around a few core concepts. Understanding their relationships is key to understanding the application.

- **`users`**: Stores the public-facing profiles for everyone who signs up. This is linked to Supabase's private `auth.users` table.
- **`users_social`**: Stores social media handles for beta users, 1-to-1 with `users`. Optional rows; a user may not have one.
- **`user_goals`**: Stores the user goals, i.e., the branch and the exams user is preparing for.
- **`branches`**: Stores the master list of academic disciplines like CS, ME, and EE.
- **`exams`**: Contains the official names and short names of all supported competitive exams.
- **`branch_exams`**: A junction table that maps which exams are applicable to which academic branches.
- **`subjects`**: A global list of all subjects featuring metadata like icons, theme colors, and difficulty scores.
- **`exams_subjects`**: Maps specific subjects to the exams they appear in for syllabus categorization.
- **`branch_subjects`**: Links subjects to branches to ensure users only see content relevant to their stream.
- **`questions`**: Contains all the exam questions. This is the central content of the app.
- **`user_question_activity`**: Acts as a logbook. Every time a user attempts a question, a record is created here, linking a `user` to a `question`.
- **`question_peer_stats`**: An aggregate table that stores statistics (like average time, correct attempts) for each question, calculated from the `user_question_activity` data.
- **`question_reports`**: Allows users to report issues with specific questions.
- **`question_bookmarks`**: Stores user question bookmarks with notes attached for later revision.
- **`notifications`**: Stores notification rows with targeting metadata. Each row describes _who_ should receive it; delivery across push and in-app channels is handled by a dedicated dispatcher pipeline.
- **`notification_reads`**: Tracks per-user dismissal state so that read status syncs across devices.
- **`push_subscriptions`**: Stores Web Push endpoint credentials per device, enabling notifications to reach users even when the app is closed.
- **`user_incorrect_queue`**: Stores the incorrect attempts of the user and helps power Smart Revision.
- **`weekly_revision_set`**: Stores the weekly revision set for each user.
- **`revision_set_questions`**: Stores the revision questions corresponding to each revision set.
- **`donations`**: Stores the donations which are done via the app.
- **`topic_tests`**: Stores user test sessions, including selected topics, test state, timing, and final performance summary.
- **`topic_tests_attempts`**: Stores per-question data for each test session, including user answers, time spent, and status.

---

## System Index

A complete inventory of every object in the `public` schema and the surrounding infrastructure. Use this section as a navigational map — each entry has a detailed section later in the document.

### Tables

**User & Profile**

| Table                                                   | Purpose                                        |
| :------------------------------------------------------ | :--------------------------------------------- |
| [`users`](#table-publicusers)                           | Public user profiles, 1-to-1 with `auth.users` |
| [`users_social`](#table-publicusers_social)             | Social media handles for beta users            |
| [`user_goals`](#table-publicuser_goals)                 | Branch and target exams per user               |
| [`push_subscriptions`](#table-publicpush_subscriptions) | Web Push endpoints per device                  |
| [`notification_reads`](#table-publicnotification_reads) | Per-user notification dismissal state          |

**Content Catalog**

| Table                                             | Purpose                              |
| :------------------------------------------------ | :----------------------------------- |
| [`branches`](#table-publicbranches)               | Academic disciplines (CS, ME, EE, …) |
| [`exams`](#table-publicexams)                     | Supported competitive exams          |
| [`subjects`](#table-publicsubjects)               | Global subject catalog with metadata |
| [`questions`](#table-publicquestions)             | The full question bank               |
| [`branch_exams`](#table-publicbranch_exams)       | Many-to-many: exams per branch       |
| [`branch_subjects`](#table-publicbranch_subjects) | Many-to-many: subjects per branch    |
| [`exams_subjects`](#table-publicexams_subjects)   | Many-to-many: subjects per exam      |

**User Activity**

| Table                                                            | Purpose                                          |
| :--------------------------------------------------------------- | :----------------------------------------------- |
| [`user_question_activity`](#table-publicuser_questions_activity) | Append-only log of every attempt                 |
| [`question_peer_stats`](#table-publicquestion_peer_stats)        | Aggregated first-attempt statistics per question |
| [`question_reports`](#table-publicquestion_reports)              | User-submitted issue reports on questions        |
| [`question_bookmarks`](#table-publicquestion_bookmarks)          | Bookmarked questions with personal notes         |

**Test System**

| Table                                                       | Purpose                                  |
| :---------------------------------------------------------- | :--------------------------------------- |
| [`topic_tests`](#table-publictopic_tests)                   | Custom Topic Test and PYQ Mock sessions  |
| [`topic_tests_attempts`](#table-publictopic_tests_attempts) | Per-question state within a test session |

**Spaced Repetition**

| Table                                                           | Purpose                                 |
| :-------------------------------------------------------------- | :-------------------------------------- |
| [`user_incorrect_queue`](#table-publicuser_incorrect_queue)     | Leitner box queue of incorrect attempts |
| [`weekly_revision_set`](#table-publicweekly_revision_set)       | Generated weekly revision sessions      |
| [`revision_set_questions`](#table-publicrevision_set_questions) | Questions included in each revision set |

**Notifications**

| Table                                         | Purpose                                   |
| :-------------------------------------------- | :---------------------------------------- |
| [`notifications`](#table-publicnotifications) | Notification rows with targeting metadata |

**Donations**

| Table                                 | Purpose                                       |
| :------------------------------------ | :-------------------------------------------- |
| [`donations`](#table-publicdonations) | Donation submissions with verification status |

---

### Views

| View                                                                       | Purpose                                                                   |
| :------------------------------------------------------------------------- | :------------------------------------------------------------------------ |
| [`active_weekend_subscriptions`](#view-publicactive_weekend_subscriptions) | Users who attempted a question in the last 14 days, distinct per endpoint |
| [`v_user_cycle_stats`](#view-publicv_user_cycle_stats)                     | Per-user success-cycle view used by the difficulty sync                   |

---

### Functions

**User-Facing RPCs**

| Function                                                                                         | Purpose                                           |
| :----------------------------------------------------------------------------------------------- | :------------------------------------------------ |
| [`get_my_dashboard()`](#function-get_my_dashboard)                                               | Aggregate dashboard payload for the current user  |
| [`get_public_profile(p_username text)`](#function-get_public_profilep_username-text)             | Public profile by username                        |
| [`get_user_attempted_ids(...)`](#function-get_user_attempted_idsp_subject_slug-text-p_mode-text) | Question IDs the user has attempted               |
| [`get_topic_counts(p_subject_id uuid)`](#function-get_topic_counts)                              | Per-topic counts and unattempted breakdown        |
| [`get_exam_subject_counts(target_exams text[])`](#function-get_exam_subject_counts)              | Verified question pool per subject                |
| [`get_critical_question_count(...)`](#function-get_critical_question_count)                      | Overdue queue count for the dashboard badge       |
| [`get_verified_donations()`](#function-get_verified_donations)                                   | Verified donations list for the donors page       |
| [`calc_user_metrics(p_user_id uuid)`](#function-calc_user_metricsp_user_id-uuid)                 | Raw metric bundle for a given user                |
| [`clear_user_data()`](#function-clear_user_data)                                                 | User-initiated data reset (Settings → Clear Data) |
| [`delete_account()`](#function-delete_account)                                                   | Full account deletion with anonymisation          |

**Test System**

| Function                                                          | Purpose                                              |
| :---------------------------------------------------------------- | :--------------------------------------------------- |
| [`generate_topic_test(...)`](#function-generate_topic_test)       | Create a custom Topic Test session                   |
| [`create_test_from_paper(...)`](#function-create_test_from_paper) | Create a PYQ Mock session from a paper catalog entry |
| [`submit_test_grading(...)`](#function-submit_test_grading)       | Grade a completed test and finalise the session      |

**Activity Logging**

| Function                                                                                            | Purpose                                      |
| :-------------------------------------------------------------------------------------------------- | :------------------------------------------- |
| [`insert_user_question_activity_batch(batch jsonb)`](#function-insert_user_question_activity_batch) | Batched attempt recording + revision context |
| [`refresh_question_peer_stats()`](#function-refresh_question_peer_stats)                            | Rebuild `question_peer_stats` from activity  |
| [`refresh_dynamic_difficulty()`](#function-refresh_dynamic_difficulty)                              | Recompute dynamic difficulty scores          |

**Spaced Repetition**

| Function                                                                              | Purpose                                    |
| :------------------------------------------------------------------------------------ | :----------------------------------------- |
| [`generate_weekly_revision_set(...)`](#function-generate_weekly_revision_set)         | Generate the current week's revision set   |
| [`start_weekly_revision_set(v_set_id uuid)`](#function-start_weekly_revision_set)     | Mark a revision set as started             |
| [`update_status_of_weekly_set(v_set_id uuid)`](#function-update_status_of_weekly_set) | Expire a revision set                      |
| [`get_weekly_set(...)`](#function-get_weekly_set)                                     | Fetch the active revision set for the user |

**Bookmarks**

| Function                                                                        | Purpose                                        |
| :------------------------------------------------------------------------------ | :--------------------------------------------- |
| [`toggle_question_bookmark(...)`](#function-toggle_question_bookmark)           | Add or remove a bookmark                       |
| [`update_question_bookmark_note(...)`](#function-update_question_bookmark_note) | Update a bookmark's note                       |
| [`get_user_bookmarks(...)`](#function-get_user_bookmarks)                       | List bookmarks, optionally filtered by subject |

**Notification System**

| Function                                                                               | Purpose                                    |
| :------------------------------------------------------------------------------------- | :----------------------------------------- |
| [`resolve_notification_target(p_target jsonb)`](#function-resolve_notification_target) | Resolve a targeting spec to an audience    |
| [`resolve_segment(p_target jsonb)`](#function-resolve_segment)                         | Segment registry used by the resolver      |
| [`before_notification_insert()`](#function-before_notification_insert)                 | Trigger: resolve audience before commit    |
| [`dispatch_notification_http()`](#function-dispatch_notification_http)                 | Trigger: fire the dispatcher Edge Function |

**Internal Helpers**

| Function                                                                                       | Purpose                                    |
| :--------------------------------------------------------------------------------------------- | :----------------------------------------- |
| [`internal_calc_exam_stats(...)`](#function-internal_calc_exam_stats)                          | Per-exam statistics subquery for dashboard |
| [`internal_calc_global_stats(...)`](#function-internal_calc_global_stats)                      | Global accuracy and progress for dashboard |
| [`internal_calc_recent_history(...)`](#function-internal_calc_recent_history)                  | Recent activity feed for dashboard         |
| [`internal_calc_user_heatmap(...)`](#function-internal_calc_user_heatmap)                      | Heatmap data aggregation                   |
| [`internal_calc_user_streaks(...)`](#function-internal_calc_user_streaks)                      | Streak calculation                         |
| [`internal_get_user_goal_subjects(p_user_id uuid)`](#function-internal_get_user_goal_subjects) | Subject list derived from user goal        |

**Trigger Functions**

| Function                                                                             | Purpose                                                        |
| :----------------------------------------------------------------------------------- | :------------------------------------------------------------- |
| [`handle_test_completion_sync()`](#trigger-function-handle_test_completion_sync)     | Sync test attempts into `user_question_activity` on completion |
| [`handle_report_event_webhook()`](#trigger-function-handle_report_event_webhook)     | Forward report events to the reminders Edge Function           |
| [`update_subject_question_count()`](#trigger-function-update_subject_question_count) | Keep `subjects.question_count` in sync with `questions`        |

---

### Triggers

| Trigger                         | Table              | Timing                     | Function                        |
| :------------------------------ | :----------------- | :------------------------- | :------------------------------ |
| `on_topic_test_completed`       | `topic_tests`      | AFTER UPDATE               | `handle_test_completion_sync`   |
| `trigger_on_report_insert`      | `question_reports` | AFTER INSERT               | `handle_report_event_webhook`   |
| `trigger_on_report_update`      | `question_reports` | AFTER UPDATE               | `handle_report_event_webhook`   |
| `trg_update_question_count`     | `questions`        | AFTER INSERT/UPDATE/DELETE | `update_subject_question_count` |
| `handle_questions_updated_at`   | `questions`        | BEFORE UPDATE              | `moddatetime('updated_at')`     |
| `on_notification_before_insert` | `notifications`    | BEFORE INSERT              | `before_notification_insert`    |
| `on_notification_after_insert`  | `notifications`    | AFTER INSERT               | `dispatch_notification_http`    |

---

### Cron Jobs

Scheduled via `pg_cron`. Three invoke the `process-reminders` Edge Function, two run pure SQL.

| Job                               | Schedule     | Action                                         |
| :-------------------------------- | :----------- | :--------------------------------------------- |
| `refresh-peer-stats-midnight`     | `0 0 * * *`  | `select public.refresh_question_peer_stats();` |
| `nightly-difficulty-sync`         | `0 0 * * *`  | `select refresh_dynamic_difficulty();`         |
| `revision-hourly-reminder`        | `0 * * * *`  | POST `?task=revision-hourly`                   |
| `weekend-topic-test-saturday`     | `30 3 * * 6` | POST `?task=weekend-topic-test`                |
| `weekend-topic-test-sunday`       | `30 3 * * 0` | POST `?task=weekend-topic-test`                |
| `donation-reminder-every-2-weeks` | `30 6 * * 0` | POST `?task=donation-reminder`                 |

---

### Edge Functions

| Function                                                        | Trigger                                | Purpose                                         |
| :-------------------------------------------------------------- | :------------------------------------- | :---------------------------------------------- |
| [`welcome-notification`](#edge-function-welcome-notification)   | Client call on subscribe               | Push ack that confirms a new subscription works |
| [`process-reminders`](#edge-function-process-reminders)         | Cron (`?task=` param) + report webhook | Router for five notification producers          |
| [`dispatch-notification`](#edge-function-dispatch-notification) | `notifications` AFTER INSERT trigger   | Fan out push deliveries for a notification row  |

---

### Row-Level Security

RLS is enabled on every table in `public` except:

- `question_peer_stats` — public read, no per-row authorisation needed
- `revision_set_questions` — accessed only via RPCs with `SECURITY DEFINER`, RLS disabled at the table level

All other tables either restrict reads to the owner (`auth.uid()`), restrict to the row's `user_id`, or expose public read for global catalogs (`branches`, `exams`, `subjects`, `questions`). Per-table policies are documented within each table's section.

---

Detailed sections for each table, view, function, trigger, cron job, and Edge Function follow below.

---

## Table Reference

This section provides a detailed breakdown of each table in the `public` schema. Tables are grouped by domain, and within each group they're ordered by dependency — parent tables before the tables that reference them.

---

### Table: `public.users`

Stores public profile information for authenticated users. This table is linked 1-to-1 with the private `auth.users` table.

| Column Name            | Data Type     | Constraints & Defaults                          | Description                                                                              |
| :--------------------- | :------------ | :---------------------------------------------- | :--------------------------------------------------------------------------------------- |
| `id`                   | `uuid`        | `PRIMARY KEY`, `NOT NULL`, `DEFAULT auth.uid()` | The user's unique ID. This is a foreign key that references `auth.users.id`.             |
| `joined_at`            | `timestamptz` | `NOT NULL`, `DEFAULT now()`                     | The timestamp when the user profile was created.                                         |
| `email`                | `text`        | `NULL` allowed                                  | The user's email address.                                                                |
| `name`                 | `text`        | `NULL` allowed                                  | The user's full display name.                                                            |
| `avatar`               | `text`        | `NULL` allowed                                  | A URL to the user's profile picture.                                                     |
| `show_name`            | `boolean`     | `DEFAULT true`                                  | A setting to control if the user's real name is shown publicly.                          |
| `total_xp`             | `integer`     | `DEFAULT 0`                                     | The total experience points the user has accumulated.                                    |
| `settings`             | `jsonb`       | `NULL` allowed                                  | A JSON object for storing user-specific settings.                                        |
| `college`              | `text`        | `NULL` allowed                                  | The name of the user's college or institution.                                           |
| `"targetYear"`         | `integer`     | `NULL` allowed                                  | The user's target year for the GATE exam.                                                |
| `bookmark_questions`   | `jsonb`       | `NULL` allowed                                  | A JSON object for storing IDs of bookmarked questions.                                   |
| `version_number`       | `integer`     | `NOT NULL`, `DEFAULT 1`                         | Used for versioning or schema updates related to user settings Clear Data feature.       |
| `deleted_at`           | `timestamptz` | `DEFAULT NULL`                                  | Used when the user deletes their account to store the date and time of deletion.         |
| `username`             | `text`        | `UNIQUE`, `NULL` allowed                        | Public handle for the user, used in profile URLs.                                        |
| `about`                | `text`        | `NULL` allowed                                  | Short bio text displayed on the public profile.                                          |
| `is_public`            | `boolean`     | `DEFAULT true`                                  | Whether the profile is visible in public search.                                         |
| `notification_tags`    | `text[]`      | `NOT NULL`, `DEFAULT '{}'`                      | Precomputed tags for notification targeting (`branch:cs`, `exam:gate`, `role:donor`, …). |
| `onboarding_completed` | `boolean`     | `DEFAULT false`                                 | Runs the onboarding step if the value is false otherwise skip                            |

**Row Level Security (RLS) Policies:**

- **Policy:** A user can view, insert, or update their own row in the `users` table. They cannot access anyone else's.
- **SQL Logic:** `USING (auth.uid() = id) WITH CHECK (auth.uid() = id)`

Public profile reads are served by the `get_public_profile()` RPC, which runs as `SECURITY DEFINER` and reads around RLS for anonymous visitors.

**Indexes:**

| Index Name                    | Columns             | Type   | Purpose                                               |
| :---------------------------- | :------------------ | :----- | :---------------------------------------------------- |
| `users_pkey`                  | `id`                | B-tree | Primary key.                                          |
| `users_username_key`          | `username`          | B-tree | Unique constraint on handle; used by profile lookups. |
| `users_joined_at_idx`         | `joined_at`         | B-tree | Optimises recent-user queries.                        |
| `idx_users_notification_tags` | `notification_tags` | GIN    | Enables `= any(notification_tags)` targeting lookups. |

---

### Table: `public.users_social`

Stores social media handles for beta users. Each row is 1-to-1 with a `users` row. All columns are optional; a user can fill in as many or as few of the ten supported platforms as they like.

This table is currently rendered on the public profile page via `SocialLinksDisplay`. Rows are created lazily — no row exists until a user saves a social link for the first time.

| Column Name      | Data Type | Constraints & Defaults                     | Description                            |
| :--------------- | :-------- | :----------------------------------------- | :------------------------------------- |
| `user_id`        | `uuid`    | `PRIMARY KEY`, `NOT NULL`, `FK → users.id` | The user these social links belong to. |
| `github_url`     | `text`    | `NULL` allowed                             | GitHub profile URL.                    |
| `x_url`          | `text`    | `NULL` allowed                             | X (formerly Twitter) profile URL.      |
| `reddit_url`     | `text`    | `NULL` allowed                             | Reddit profile URL.                    |
| `spotify_url`    | `text`    | `NULL` allowed                             | Spotify profile URL.                   |
| `discord_url`    | `text`    | `NULL` allowed                             | Discord invite or username URL.        |
| `linkedin_url`   | `text`    | `NULL` allowed                             | LinkedIn profile URL.                  |
| `mastodon_url`   | `text`    | `NULL` allowed                             | Mastodon (federated) profile URL.      |
| `youtube_url`    | `text`    | `NULL` allowed                             | YouTube channel URL.                   |
| `lemmy_url`      | `text`    | `NULL` allowed                             | Lemmy profile URL.                     |
| `leetcode_url`   | `text`    | `NULL` allowed                             | LeetCode profile URL.                  |
| `codeforces_url` | `text`    | `NULL` allowed                             | Codeforces profile URL.                |

**Relationships:**

- One-to-One: `users_social.user_id` → `users.id` (ON DELETE CASCADE)

**Row Level Security (RLS) Policies:**

The table follows the standard "own rows only" pattern. Broader read access for public profile display is served by the `get_public_profile()` RPC, which runs as `SECURITY DEFINER`.

- **Select:** `FOR SELECT USING (auth.uid() = user_id)`
- **Insert:** `FOR INSERT WITH CHECK (auth.uid() = user_id)`
- **Update:** `FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`
- **Delete:** `FOR DELETE USING (auth.uid() = user_id)`

**Indexes:**

| Index Name          | Columns   | Type   | Purpose                                    |
| :------------------ | :-------- | :----- | :----------------------------------------- |
| `users_social_pkey` | `user_id` | B-tree | Primary key; also serves as the FK target. |

**Notes:**

- These fields are **beta-only** and gated behind `users.settings.is_beta` in the UI. There's no policy-level gating because the RPC for public reading uses `SECURITY DEFINER` and would bypass RLS anyway.
- No unique constraint on individual URLs — a user could theoretically set their `github_url` to someone else's, but this is display-only data with no security implication.

---

### Table: `public.user_goals`

Stores the goals of a user, including branch and target exams. A user can have at most one goal per branch; the row is upserted on branch change and existing rows for other branches are deactivated.

This is the primary source of truth for "which subjects should this user see" — it feeds `getPracticeSubjects()` on the client, `internal_get_user_goal_subjects()`, `generate_topic_test`, `create_test_from_paper`, and the notification targeting resolver.

| Column Name           | Data Type | Constraints & Defaults                     | Description                                                                                                                                                            |
| :-------------------- | :-------- | :----------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                  | `uuid`    | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique identifier for this goal record.                                                                                                                                |
| `user_id`             | `uuid`    | `NOT NULL`, `FK → users.id`                | User who owns this goal.                                                                                                                                               |
| `branch_id`           | `text`    | `NOT NULL`, `FK → branches.id`             | Branch selected by the user.                                                                                                                                           |
| `target_exams`        | `jsonb`   | `NOT NULL`                                 | Exam IDs (e.g. `["gate", "isro"]`) the user is targeting.                                                                                                              |
| `additional_subjects` | `uuid[]`  | `DEFAULT NULL`                             | Optional subjects the user has chosen. Currently used only for GATE XL, where the user picks exactly two from the pool of XL optionals. `NULL` for all other branches. |
| `is_active`           | `boolean` | `DEFAULT true`                             | Whether this goal is currently active. Deactivation happens when the user switches branch — the old row stays for historical attribution.                              |

**Relationships:**

- Many-to-One: `user_goals.user_id` → `users.id`
- Many-to-One: `user_goals.branch_id` → `branches.id`

**Row Level Security (RLS) Policies:**

- **Policy:** Users can only manage their own goals.
- **SQL Logic:** `USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`

**Indexes:**

| Index Name                         | Columns              | Type   | Purpose                                                                                                |
| :--------------------------------- | :------------------- | :----- | :----------------------------------------------------------------------------------------------------- |
| `user_goals_pkey`                  | `id`                 | B-tree | Primary key.                                                                                           |
| `idx_user_goals_user_branch`       | `user_id, branch_id` | B-tree | Optimises per-user goal lookup (client's most common query).                                           |
| `user_goals_user_id_branch_id_key` | `user_id, branch_id` | B-tree | Unique constraint; combined with the upsert in `setInitialGoal` guarantees one row per (user, branch). |

**Notes:**

- **The upsert pattern.** `setInitialGoal` uses `ON CONFLICT (user_id, branch_id) DO UPDATE`, so changing exams for a branch that already has a goal updates in place. Changing _branch_ creates a new row and marks the old one `is_active = false`.
- **`additional_subjects` is only consulted when `branch_id = 'xl'` and `'gate'` is in `target_exams`.** For every other combination, the value is either `NULL` or ignored. The validation lives on the client and in `AccountSettings`; there's no database-level constraint enforcing "exactly two subjects when XL".
- **Notification tags.** When the notification migration ships, `users.notification_tags` is populated by a trigger on `user_goals` — `branch:<branch_id>` and `exam:<exam_id>` for each entry in `target_exams`. Until that trigger exists, tag-targeted notifications return an empty audience. See [Notification System](#notification-system) for details.

---

### Table: `public.push_subscriptions`

Stores Web Push endpoint credentials per browser/device. A single user can have many rows — one per device where they've enabled push notifications. When the user disables notifications on a device, the corresponding row is removed.

The rows are read by the `dispatch-notification` Edge Function when fanning out push deliveries for a notification, and by the `active_weekend_subscriptions` view for the weekend segment audience.

| Column Name  | Data Type     | Constraints & Defaults                     | Description                                                                                                                                 |
| :----------- | :------------ | :----------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`         | `uuid`        | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique identifier for this subscription record.                                                                                             |
| `user_id`    | `uuid`        | `NULL` allowed, `FK → users.id`            | Links the subscription to a specific user account. `NULL` is theoretically possible (before a session resolves) but in practice always set. |
| `endpoint`   | `text`        | `NOT NULL`, `UNIQUE`                       | The push service URL returned by the browser's Push API. Serves as the de-duplication key — one subscription per device.                    |
| `auth_key`   | `text`        | `NOT NULL`                                 | VAPID authentication secret from the browser's subscription object.                                                                         |
| `p256dh_key` | `text`        | `NOT NULL`                                 | VAPID public encryption key from the browser's subscription object.                                                                         |
| `created_at` | `timestamptz` | `DEFAULT now()`                            | When the subscription was registered.                                                                                                       |

**Relationships:**

- Many-to-One: `push_subscriptions.user_id` → `users.id` (ON DELETE CASCADE)

**Row Level Security (RLS) Policies:**

RLS is enabled. The exact policies aren't reproduced here because reads are performed exclusively by the dispatcher Edge Function, which uses the service role key and bypasses RLS entirely. Client-side reads of this table don't exist — the client only writes.

**Indexes:**

| Index Name                        | Columns    | Type   | Purpose                                                     |
| :-------------------------------- | :--------- | :----- | :---------------------------------------------------------- |
| `push_subscriptions_pkey`         | `id`       | B-tree | Primary key.                                                |
| `idx_push_subscriptions_user_id`  | `user_id`  | B-tree | Optimises `user_id IN (...)` lookups during dispatch.       |
| `push_subscriptions_endpoint_key` | `endpoint` | B-tree | Unique constraint; ensures one row per device subscription. |

**Notes:**

- **Dead endpoints are deleted by the dispatcher.** When a push delivery returns `404` or `410` — the browser has unsubscribed or the device was wiped — the dispatcher bulk-deletes the endpoint in one query. Rows never accumulate for dead devices beyond one dispatch cycle.
- **No client-side reads.** The table exists to serve the dispatcher. Anything the client needs to know about "am I subscribed" is derived from `Notification.permission` and the `PushManager.subscription` object, not from this table.
- **`ON DELETE CASCADE` from `users`.** Deleting an account (via `delete_account()`) removes all its push subscriptions. This is one of the explicit steps in the `delete_account()` function body.

---

### Table: `public.notification_reads`

Per-user dismissal state for notifications. One row exists per (notification, user) pair that the user has marked as read. Read state is server-side so it syncs across devices — dismissing a notification on a phone removes it from the bell on a laptop.

This table is new as part of the notification migration. It replaces the previous `localStorage.read_notifications` array, which had per-device and per-browser problems.

| Column Name       | Data Type     | Constraints & Defaults              | Description                      |
| :---------------- | :------------ | :---------------------------------- | :------------------------------- |
| `notification_id` | `uuid`        | `NOT NULL`, `FK → notifications.id` | The notification that was read.  |
| `user_id`         | `uuid`        | `NOT NULL`, `FK → users.id`         | The user who read it.            |
| `read_at`         | `timestamptz` | `NOT NULL`, `DEFAULT now()`         | When the user marked it as read. |

**Primary Key:** `(notification_id, user_id)` — a user can only mark a given notification as read once.

**Relationships:**

- Many-to-One: `notification_reads.notification_id` → `notifications.id` (ON DELETE CASCADE)
- Many-to-One: `notification_reads.user_id` → `users.id` (ON DELETE CASCADE)

**Row Level Security (RLS) Policies:**

Three policies, all scoped to `auth.uid()`:

- **Select:** `FOR SELECT USING (user_id = auth.uid())`
- **Insert:** `FOR INSERT WITH CHECK (user_id = auth.uid())`
- **Delete:** `FOR DELETE USING (user_id = auth.uid())`

**No UPDATE policy.** Re-marking a notification as read is a semantic no-op; the client uses `upsert(..., { ignoreDuplicates: true })` which compiles to `INSERT ... ON CONFLICT DO NOTHING` and only needs INSERT permission. This is deliberate — `read_at` is write-once.

**Indexes:**

| Index Name                    | Columns                    | Type   | Purpose                                                                |
| :---------------------------- | :------------------------- | :----- | :--------------------------------------------------------------------- |
| Primary key (composite)       | `notification_id, user_id` | B-tree | Ensures uniqueness and serves the RLS `NOT EXISTS` subquery.           |
| `idx_notification_reads_user` | `user_id`                  | B-tree | Optimises "what has this user read" queries and the delete-own policy. |

**Notes:**

- **How reads filter the bell.** The `notifications` RLS SELECT policy includes a `NOT EXISTS (SELECT 1 FROM notification_reads r WHERE r.notification_id = notifications.id AND r.user_id = auth.uid())` clause. The client's fetch (`.select().order(...)`) returns only unread, targeted notifications with no client-side filtering.
- **Deleting a read row makes the notification reappear.** This is intentional — if a user accidentally dismisses something, the API supports recovery. Nothing in the current UI exposes this, but the data model allows it.
- **`ON DELETE CASCADE` from `notifications`.** Deleting a notification removes all its read rows. Since notifications are typically short-lived (some are auto-cleaned after 30 days), this prevents orphan rows from accumulating.

---

### Table: `public.branch_exams`

Junction table mapping which exams apply to which academic branches. This is what powers the branch → exam dropdown chain in Account Settings: after a user picks their branch, this table determines the subset of exams they can target.

The `combobox` for target exams filters `exams` by `branch_id`, and the client's `useGoalStore` holds both tables. There's no direct RPC read — the client fetches the whole table on login and filters in memory.

| Column Name | Data Type | Constraints & Defaults         | Description                      |
| :---------- | :-------- | :----------------------------- | :------------------------------- |
| `branch_id` | `text`    | `NOT NULL`, `FK → branches.id` | Branch associated with the exam. |
| `exam_id`   | `text`    | `NOT NULL`, `FK → exams.id`    | Exam associated with the branch. |

**Primary Key:** `(branch_id, exam_id)`

**Relationships:**

- Many-to-One: `branch_exams.branch_id` → `branches.id`
- Many-to-One: `branch_exams.exam_id` → `exams.id`

**Row Level Security (RLS) Policies:**

- **Policy:** Public read.
- **SQL Logic:** `FOR SELECT USING (true)`

**Indexes:**

| Index Name          | Columns              | Type   | Purpose                                    |
| :------------------ | :------------------- | :----- | :----------------------------------------- |
| `branch_exams_pkey` | `branch_id, exam_id` | B-tree | Composite primary key; ensures uniqueness. |

**Notes:**

- **No writes from the client.** Rows are populated via migrations only.
- **No `updated_at` / `created_at`.** Reference data; nothing tracks change history.

---

### Table: `public.branch_subjects`

Junction table mapping which subjects are offered by which branch. Read by `getPracticeSubjects()` on the client to filter the practice list, and by `resolve_notification_target` for `branch:cs` style tag targeting (indirectly, via the user's tags).

The subjects list on the Practice page is derived by intersecting this table with `exams_subjects` — a subject appears only if it's in both the user's branch _and_ at least one of their target exams, plus any subject marked `is_universal = true` on `subjects`.

| Column Name  | Data Type | Constraints & Defaults             | Description                         |
| :----------- | :-------- | :--------------------------------- | :---------------------------------- |
| `branch_id`  | `text`    | `NULL` allowed, `FK → branches.id` | Branch associated with the subject. |
| `subject_id` | `uuid`    | `NULL` allowed, `FK → subjects.id` | Subject associated with the branch. |

**Primary Key:** `(branch_id, subject_id)`

**Relationships:**

- Many-to-One: `branch_subjects.branch_id` → `branches.id`
- Many-to-One: `branch_subjects.subject_id` → `subjects.id`

**Row Level Security (RLS) Policies:**

- **Policy:** Public read.
- **SQL Logic:** `FOR SELECT USING (true)`

**Indexes:**

| Index Name             | Columns                 | Type   | Purpose                                    |
| :--------------------- | :---------------------- | :----- | :----------------------------------------- |
| `branch_subjects_pkey` | `branch_id, subject_id` | B-tree | Composite primary key; ensures uniqueness. |

**Notes:**

- **Order is not significant.** Subjects are sorted by name on the client for display, not by insertion order or any ordinal column.
- **Universal subjects are excluded.** Anything in `subjects` with `is_universal = true` (General Aptitude, for example) is _not_ listed here — the intersection logic adds universal subjects on the fly, because they apply across all branches and duplicating that fact across every branch row would be fragile.

---

### Table: `public.exams_subjects`

Junction table mapping which subjects appear in which exams. Combined with `branch_subjects`, this is what defines "what should this user be practicing."

Note the column is `exams_id` (plural "exams"), not `exam_id`. This is inconsistent with `branch_exams.exam_id`, but it's what exists in production and RPCs depend on it.

| Column Name  | Data Type | Constraints & Defaults         | Description                       |
| :----------- | :-------- | :----------------------------- | :-------------------------------- |
| `exams_id`   | `text`    | `NOT NULL`, `FK → exams.id`    | Exam associated with the subject. |
| `subject_id` | `uuid`    | `NOT NULL`, `FK → subjects.id` | Subject included in the exam.     |

**Primary Key:** `(exams_id, subject_id)`

**Relationships:**

- Many-to-One: `exams_subjects.exams_id` → `exams.id`
- Many-to-One: `exams_subjects.subject_id` → `subjects.id`

**Row Level Security (RLS) Policies:**

- **Policy:** Public read.
- **SQL Logic:** `FOR SELECT USING (true)`

**Indexes:**

| Index Name            | Columns                | Type   | Purpose                                    |
| :-------------------- | :--------------------- | :----- | :----------------------------------------- |
| `exams_subjects_pkey` | `exams_id, subject_id` | B-tree | Composite primary key; ensures uniqueness. |

**Notes:**

- **The `is_universal` bypass.** `getPracticeSubjects()` and `get_exam_subject_counts()` both include subjects with `subjects.is_universal = true` regardless of whether they appear in this table. The rationale is the same as `branch_subjects`: universal subjects apply to all exams, so listing them per-exam would be redundant and error-prone.
- **A subject in one exam but not another.** The exam tags on `questions` matter too — see the `questions.metadata.exam` explanation below. A subject being in `exams_subjects` means it's _syllabus-relevant_; whether any particular question is tagged for that exam is a separate concern.

---

### Table: `public.questions`

Contains the full details for every question in the GATEQuest database. This is the largest table and the source of truth for all practice content. Every user-facing feature — practice sessions, topic tests, PYQ Mocks, revision sets, peer statistics — reads from here.

| Column Name       | Data Type | Constraints & Defaults                     | Description                                                                                                          |
| :---------------- | :-------- | :----------------------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| `id`              | `uuid`    | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | The unique identifier for the question.                                                                              |
| `year`            | `integer` | `NULL` allowed                             | The year the question appeared in the GATE exam. For non-PYQ content, this may be `NULL`.                            |
| `question_number` | `integer` | `NULL` allowed                             | The original question number from the exam paper. Used for paper assembly ordering.                                  |
| `subject`         | `text`    | `NULL` allowed                             | The main subject of the question (e.g., "Quantitative Aptitude").                                                    |
| `subject_id`      | `uuid`    | `FK → subjects.id`, `NULL` allowed         | References the subject associated with the question.                                                                 |
| `topic`           | `text`    | `NULL` allowed                             | The specific topic within the subject (e.g., "Logarithms").                                                          |
| `question_type`   | `text`    | `NULL` allowed                             | The type of question (e.g., "multiple-choice", "multiple-select", "numerical").                                      |
| `question`        | `text`    | `NULL` allowed                             | The full text of the question, may contain LaTeX and markdown.                                                       |
| `options`         | `text[]`  | `NULL` allowed                             | An array of options for MCQ/MSQ questions. `NULL` for numerical questions.                                           |
| `correct_answer`  | `jsonb`   | `NULL` allowed                             | JSON object containing the correct answer(s). Shape varies by `question_type`.                                       |
| `answer_text`     | `text`    | `NULL` allowed                             | Stores the AI-generated explanations for the question.                                                               |
| `difficulty`      | `text`    | `NULL` allowed                             | Difficulty level (e.g., Easy, Medium, Hard).                                                                         |
| `marks`           | `integer` | `NULL` allowed                             | Marks assigned to the question.                                                                                      |
| `tags`            | `text[]`  | `NULL` allowed                             | Tags used for categorization (GateOverflow-style hierarchical tags).                                                 |
| `source`          | `text`    | `NULL` allowed                             | Source of the question (e.g., "gateoverflow", "Official PYQ Papers").                                                |
| `source_url`      | `text`    | `NULL` allowed                             | URL pointing to the original source.                                                                                 |
| `added_by`        | `text`    | `NULL` allowed                             | Identifier of the contributor who added the question.                                                                |
| `verified`        | `boolean` | `DEFAULT false`                            | Indicates whether the question has been verified. Unverified questions are excluded from practice, tests, and stats. |
| `explanation`     | `text`    | `NULL` allowed                             | Explanation or solution for the question.                                                                            |
| `metadata`        | `jsonb`   | `NULL` allowed                             | Extra metadata — paper identity, exam tags, section markers. See subsection below.                                   |

**Row Level Security (RLS) Policies:**

- **Policy:** Anyone (including unauthenticated users) can read questions.
- **SQL Logic:** `FOR SELECT USING (true)`

Questions are public content. There's no per-user filtering at the RLS level — the client filters by the user's goal, branch, and exams, but any authenticated or anonymous request can read the full catalog.

**Indexes:**

| Index Name                 | Columns    | Type   | Purpose                                                                                                       |
| :------------------------- | :--------- | :----- | :------------------------------------------------------------------------------------------------------------ |
| `questions_pkey`           | `id`       | B-tree | Primary key.                                                                                                  |
| `idx_questions_exams_path` | `metadata` | GIN    | Enables `metadata->>'set'`, `metadata->>'shift'`, `metadata->>'section'` filtering without a full table scan. |

---

#### The `metadata` JSONB

The `metadata` column is where paper identity and section markers live. It's structured as follows:

```json
{
  "set": "CS", // Branch code — matches branches.id (uppercase)
  "exam": ["GATE"], // Exam IDs, lowercase, array
  "language": "English",
  "paperType": "official", // "official" or "unofficial"
  "shift": 1, // Integer, or absent for single-paper years
  "shiftSource": "tags", // "tags" or "url" — how the shift was extracted
  "section": "TECH", // "GA" for General Aptitude, "TECH" for everything else
  "sectionCode": "XL-P" // Only on XL records — one of XL-P through XL-U
}
```

Each key has a specific consumer:

| Key           | Written by           | Read by                                                             | Purpose                                               |
| :------------ | :------------------- | :------------------------------------------------------------------ | :---------------------------------------------------- |
| `set`         | Scraper / import     | `create_test_from_paper`                                            | Branch filter for paper assembly                      |
| `exam`        | Scraper / import     | `get_user_attempted_ids`, `get_exam_subject_counts`, `useQuestions` | Exam filtering                                        |
| `language`    | Scraper / import     | Display only                                                        | Content metadata                                      |
| `paperType`   | Scraper / import     | `create_test_from_paper`                                            | Excludes unofficial/modified PYQs from paper assembly |
| `shift`       | Normalization script | `create_test_from_paper`                                            | Distinguishes GATE 2024 Set 1 from Set 2              |
| `shiftSource` | Normalization script | Diagnostic only                                                     | Traces how the shift was derived                      |
| `section`     | Backfill migration   | `create_test_from_paper`                                            | GA-first ordering in assembled papers                 |
| `sectionCode` | Manual (XL data)     | `resolve_notification_target`, `create_test_from_paper`             | Distinguishes XL optional subjects                    |

**`set` vs. `branch_id`.** The `questions` table does not have a `branch_id` column. Branch membership is encoded entirely in `metadata.set`. This means a question is branch-tagged (via the set value) but not branch-linked (via a foreign key). The rationale is that some questions belong to multiple branches (via universal subjects) or belong to the same branch across multiple years — a foreign key would force a many-to-many join table, which is more complexity than the current feature set needs.

**`section` is a derived field.** No source data carries "this is GA" or "this is TECH." The backfill migration computes it:

```sql
case
    when lower(subject) in ('general aptitude', 'aptitude', 'ga') then 'GA'
    else 'TECH'
end
```

Once set, it's never updated. If a question's subject changes, its `section` will drift out of sync — a known limitation, acceptable because subjects rarely change post-verification.

**`sectionCode` is only on XL records.** Values are `XL-P` (Chemistry), `XL-Q` (Biochemistry), `XL-R` (Botany), `XL-S` (Microbiology), `XL-T` (Zoology), `XL-U` (Food Technology). The XL paper assembles by selecting GA + XL-P (Chemistry, mandatory) + two optionals chosen by the user.

**Why JSONB and not columns.** Five of these keys are stable, two (`shift`, `section`) were added after the table was populated. Adding them as real columns would have required migrations on a table with hundreds of thousands of rows. JSONB allows the normalization pipeline to add keys without schema changes. The trade-off is that querying requires `metadata->>'key'` syntax, which is why the GIN index exists.

**Query patterns.** The most common reads are:

- `where metadata->>'paperType' = 'official' and metadata->>'set' = ? and year = ?` — paper assembly
- `where metadata->>'section' = 'GA'` — ordering papers
- `where metadata->>'shift' = ?` — shift filtering

All three are served by the `idx_questions_exams_path` GIN index. Without it, each query would scan the full table.

---

### Table: `public.user_question_activity`

Append-only log of every question attempt. This is the source of truth for all progress tracking, analytics, dashboard aggregates, peer statistics, and spaced repetition.

Rows are never updated — a new row is inserted for every attempt, and the "current state" of any question for any user is derived by reading the latest row (or counting all rows, depending on the aggregation). The only exception is that a row can be deleted in `delete_account()` when a user opts to fully remove their data.

| Column Name               | Data Type     | Constraints & Defaults                     | Description                                                                                                                                            |
| :------------------------ | :------------ | :----------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                      | `uuid`        | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique identifier for this attempt.                                                                                                                    |
| `user_id`                 | `uuid`        | `NULL` allowed, `FK → users.id`            | The user who made the attempt. Nullable in the schema, but always set in practice.                                                                     |
| `question_id`             | `uuid`        | `NULL` allowed, `FK → questions.id`        | The question that was attempted.                                                                                                                       |
| `subject`                 | `text`        | `NULL` allowed                             | Denormalized subject name for fast aggregation without a join.                                                                                         |
| `was_correct`             | `boolean`     | `NULL` allowed                             | `true` if correct, `false` if wrong. `NULL` is technically possible but represents an unattempted record — the current write paths never produce one.  |
| `time_taken`              | `bigint`      | `NULL` allowed                             | Time taken to answer, in seconds.                                                                                                                      |
| `attempted_at`            | `timestamptz` | `DEFAULT now()`                            | When the attempt occurred.                                                                                                                             |
| `attempt_number`          | `bigint`      | `NULL` allowed                             | The nth attempt on this question by this user. Computed at insert as `max(attempt_number) + 1` for the (user, question) pair.                          |
| `user_version_number`     | `integer`     | `NOT NULL`, `DEFAULT 1`                    | The user's `version_number` at the time of the attempt. Segments stats across "Clear Data" resets.                                                     |
| `subject_id`              | `uuid`        | `NULL` allowed, `FK → subjects.id`         | The subject associated with the question. Denormalized at insert time.                                                                                 |
| `branch_id`               | `text`        | `NOT NULL`, `FK → branches.id`             | The user's branch at the time of the attempt. Captured per-attempt so switching branches later doesn't retroactively re-attribute history.             |
| `selected_option_indices` | `integer[]`   | `NULL` allowed                             | The option indices the user selected. `NULL` for numerical questions or null answers. Populated by both practice RPCs and the test completion trigger. |

**Relationships:**

- Many-to-One: `user_id` → `users.id`
- Many-to-One: `question_id` → `questions.id`
- Many-to-One: `subject_id` → `subjects.id`
- Many-to-One: `branch_id` → `branches.id`

**Row Level Security (RLS) Policies:**

- **Insert Policy:** Users can only insert activity records for themselves.
- **SQL Logic:** `FOR INSERT WITH CHECK (auth.uid() = user_id)`
- **Select Policy:** Users can only read their own activity records.
- **SQL Logic:** `FOR SELECT USING (auth.uid() = user_id)`

Aggregate functions like `refresh_question_peer_stats()`, `get_my_dashboard()`, and the notification resolver run as `SECURITY DEFINER` and read across all users, bypassing these policies as the function owner.

**Indexes:**

| Index Name                                       | Columns                                                     | Type   | Purpose                                                                                                                                    |
| :----------------------------------------------- | :---------------------------------------------------------- | :----- | :----------------------------------------------------------------------------------------------------------------------------------------- |
| `user_question_activity_pkey`                    | `id`                                                        | B-tree | Primary key.                                                                                                                               |
| `idx_uqa_question_first_attempt`                 | `question_id` (partial: `attempt_number = 1`)               | B-tree | Optimises `refresh_question_peer_stats`, which only aggregates first attempts.                                                             |
| `idx_user_attempt`                               | `user_id, attempt_number, attempted_at`                     | B-tree | Feeds dashboard and revision queries that scan "this user's attempt history".                                                              |
| `idx_uqa_user_version_attempted`                 | `user_id, user_version_number, attempted_at`                | B-tree | Version-scoped dashboard queries after Clear Data.                                                                                         |
| `idx_uqa_user_version_attempt_q`                 | `user_id, user_version_number, attempt_number, question_id` | B-tree | Covers the "has this user attempted this question in their current version" check used by `get_topic_counts` and `get_user_attempted_ids`. |
| `idx_uqa_created_user`                           | `attempted_at DESC, user_id`                                | B-tree | Serves time-ordered aggregate queries like the heatmap.                                                                                    |
| `user_question_activity_user_id_idx`             | `user_id`                                                   | B-tree | Redundant with the composite indexes but kept for simple per-user lookups.                                                                 |
| `user_question_activity_user_version_number_idx` | `user_version_number`                                       | B-tree | Broad version-scoped queries when user_id isn't in the filter.                                                                             |
| `user_question_activity_was_correct_idx`         | `was_correct`                                               | B-tree | Powers global accuracy stats in `get_my_dashboard`.                                                                                        |

**Notes:**

- **Two write paths.** Rows are inserted by:
  - `insert_user_question_activity_batch()` — called from the client after a practice attempt, batched in localStorage.
  - `handle_test_completion_sync()` — fires on `topic_tests` completion, one row per attempted question.
    Both paths set the same columns, so downstream consumers don't care which path produced a row.
- **Why `attempt_number` matters.** `refresh_question_peer_stats()` filters to `attempt_number = 1` — the first attempt is the only one that represents genuine ability, not learning or retrying. Every other query either ignores `attempt_number` or filters to a specific value.
- **Why `user_version_number`.** The "Clear Data" feature increments a user's `version_number`, effectively resetting their stats. Version-scoping means historical activity doesn't pollute the new version's dashboards. Without this, clearing data wouldn't actually clear progress — it would just hide it.
- **`selected_option_indices` is `int[]`, not `jsonb`.** This is because `refresh_question_peer_stats()` needs to `unnest()` it to build the per-option distribution. Arrays unnest natively; JSON requires casting. The trade-off is that it can't store arbitrary shapes, but the domain only needs "list of 0-based option indices."
- **Denormalization is deliberate.** `subject` and `subject_id` are duplicated from `questions`. At the time of writing, joining `questions` on every dashboard query was measurably slower than the denormalized approach. The cost is that if a question's subject is reclassified, historical rows carry the old value. In practice this is fine — subjects don't get reclassified, and even if they did, "what subject did the user _think_ they were attempting" is arguably more useful for analytics than "what subject is it classified as today."
- **`branch_id` is captured per attempt.** Not derived from the user's current goal. This means a user who switches from CS to DA keeps their CS attempts attributed to CS for branch-scoped analytics. Required by `get_my_dashboard`'s per-exam breakdown and by the `refresh_question_peer_stats` grouping.

---

### Table: `public.question_peer_stats`

Pre-aggregated performance statistics per question. Read by `usePeerBenchmark` on the client to show "68% of users got this right" after revealing an answer. Also feeds the per-option distribution bars in the practice UI.

This table exists **because aggregating on every read would be prohibitive**. `user_question_activity` has one row per attempt across all users; a "how many users got question X right on their first attempt" query would scan potentially millions of rows for a single question reveal. Pre-aggregation makes that read a single row lookup.

| Column Name           | Data Type     | Constraints & Defaults                         | Description                                                                                                                                      |
| :-------------------- | :------------ | :--------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------- |
| `question_id`         | `uuid`        | `PRIMARY KEY`, `NOT NULL`, `FK → questions.id` | The question these stats describe.                                                                                                               |
| `total_attempts`      | `integer`     | `NOT NULL`, `DEFAULT 0`                        | Total number of first attempts across all users.                                                                                                 |
| `correct_attempts`    | `integer`     | `NOT NULL`, `DEFAULT 0`                        | First attempts that were correct.                                                                                                                |
| `wrong_attempts`      | `integer`     | `NOT NULL`, `DEFAULT 0`                        | First attempts that were incorrect.                                                                                                              |
| `avg_time_seconds`    | `numeric`     | `NULL` allowed                                 | Average time taken on first attempts.                                                                                                            |
| `updated_at`          | `timestamptz` | `NOT NULL`, `DEFAULT now()`                    | When this row was last refreshed.                                                                                                                |
| `option_distribution` | `jsonb`       | `NULL` allowed                                 | Per-option selection counts as `{"0": 12, "1": 34, "2": 5}`. Raw counts, not percentages. `NULL` when no first attempts recorded option indices. |

**Relationships:**

- One-to-One: `question_id` → `questions.id`

**Row Level Security (RLS) Policies:**

**RLS is disabled on this table.** In practice this means any authenticated or anonymous request can read the entire table. This is intentional — peer statistics are public aggregate data with no per-user privacy implication.

The old `FOR SELECT USING (true)` policy that used to be on this table has been dropped; with RLS disabled, the policy was a no-op anyway. Disabling RLS is the cleaner statement of intent ("this is public data") than enabling it with an always-true policy.

**Indexes:**

| Index Name                 | Columns       | Type   | Purpose                                 |
| :------------------------- | :------------ | :----- | :-------------------------------------- |
| `question_peer_stats_pkey` | `question_id` | B-tree | Primary key; serves as the read lookup. |

**Notes:**

- **How it stays current.** Refreshed nightly by the `refresh-peer-stats-midnight` cron (`0 0 * * *`), which calls `refresh_question_peer_stats()`. This is a full-table refresh — every row is recomputed from `user_question_activity`. On a catalog with hundreds of thousands of attempts, it takes a few seconds. The trade-off is that stats are up to 24 hours stale, which is fine for a "compare to peers" feature.
- **First-attempt semantics.** Only rows with `attempt_number = 1` contribute. A user who retries a question 10 times and gets it right on the 10th attempt contributes to `wrong_attempts`, not `correct_attempts`. This is the correct metric — it reflects first-look ability, not eventual learning.
- **`option_distribution` covers one attempt per option.** For MSQ questions, a single attempt can contribute to multiple options (the user selected two). So the sum of option counts can exceed `total_attempts`. This is correct for the "what fraction of users picked A" question — but the client should divide each count by `total_attempts`, not by the sum of counts.
- **`NULL` vs. `{}` for `option_distribution`.** `NULL` means no first attempts recorded any option indices (either a brand new question or a numerical-only question). `{}` would mean an empty distribution — a state the refresh never produces. The client treats `NULL` as "no bars to show" and skips rendering.
- **`updated_at` is not `created_at`.** Rows are inserted by the refresh function and updated on conflict. There's no separate "when was this question first tracked" timestamp — if it matters, `questions.created_at` serves that purpose.

---

### Table: `public.question_reports`

Allows authenticated users to report problems with questions. Every insert and every status change fires the `handle_report_event_webhook()` trigger, which forwards to the `process-reminders` Edge Function and ultimately creates a notification targeting either the admin or the reporter.

| Column Name   | Data Type   | Constraints & Defaults                                  | Description                                                |
| :------------ | :---------- | :------------------------------------------------------ | :--------------------------------------------------------- |
| `id`          | `uuid`      | `PRIMARY KEY`, `NOT NULL`, `DEFAULT uuid_generate_v4()` | The unique identifier for the report.                      |
| `user_id`     | `uuid`      | `NOT NULL`, `FK → users.id`                             | The user who filed the report.                             |
| `question_id` | `uuid`      | `NULL` allowed, `FK → questions.id`                     | The question being reported.                               |
| `report_type` | `text`      | `NULL` allowed                                          | Category of the report (e.g., 'Incorrect Answer', 'Typo'). |
| `report_text` | `text`      | `NOT NULL`                                              | Detailed description of the issue.                         |
| `status`      | `text`      | `DEFAULT 'pending'`                                     | Report status. Known values: `'pending'`, `'resolved'`.    |
| `created_at`  | `timestamp` | `DEFAULT now()`                                         | When the report was created.                               |

**Relationships:**

- Many-to-One: `user_id` → `users.id`
- Many-to-One: `question_id` → `questions.id`

**Row Level Security (RLS) Policies:**

- **Policy:** Only authenticated users can create a report for their own user ID.
- **SQL Logic:** `FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)`

No SELECT policy is defined for users. Reports are read exclusively by the admin via Supabase Studio. If per-user report history ever needs to be shown (e.g., "your reports" page), a SELECT policy would be added at that time.

**Indexes:**

| Index Name              | Columns | Type   | Purpose                          |
| :---------------------- | :------ | :----- | :------------------------------- |
| `question_reports_pkey` | `id`    | B-tree | Primary key ensuring unique IDs. |

**Triggers:**

Two triggers, both firing `handle_report_event_webhook()`:

| Trigger                    | Timing       | Behavior                                                                                                                 |
| :------------------------- | :----------- | :----------------------------------------------------------------------------------------------------------------------- |
| `trigger_on_report_insert` | AFTER INSERT | Fires the `report-created` handler → notification targeting the admin.                                                   |
| `trigger_on_report_update` | AFTER UPDATE | Fires the `report-resolved` handler — but only when `status` transitions to `'resolved'`. All other updates are ignored. |

The trigger function inspects `TG_OP` and the `new` / `old` records to determine whether to forward a notification. Full mechanics are documented in the [Triggers](#triggers) section.

**Notes:**

- **The report flow is event-driven, not polled.** Before the triggers existed, report notifications were sent by a manual admin action. Now inserting a report automatically alerts the admin, and resolving one automatically alerts the reporter. The user never needs to poll — the notification arrives via push and shows up in their bell.
- **Text is truncated in the notification.** The `report-created` handler truncates `report_text` to 50 characters before including it in the notification message, so the push payload stays under size limits and the bell doesn't show a wall of text. The full text remains in the table.
- **Status is a `text` column, not an enum.** Only two values are currently used (`pending`, `resolved`), but there's no CHECK constraint or enum type. This is deliberate — adding a new status (e.g., `won't_fix`) requires no migration. The resolver only cares about the specific transition `→ 'resolved'`, so other values are inert.
- **Resolving requires care.** The `report-resolved` handler fires only when the status transitions from a non-`'resolved'` value to `'resolved'`. Setting status to `'resolved'` twice does not create two notifications. This is enforced in `reportResolved.ts` (the handler) by checking `old_record.status`, not at the trigger level — meaning the trigger fires on every UPDATE, but the handler short-circuits for the no-op case.

---

### Table: `public.question_bookmarks`

Stores questions that users have bookmarked for later revision, with an optional short personal note. Bookmark data is user-owned and never shared.

| Column Name   | Data Type     | Constraints & Defaults                              | Description                                     |
| :------------ | :------------ | :-------------------------------------------------- | :---------------------------------------------- |
| `user_id`     | `uuid`        | `NOT NULL`, `FK → users.id`                         | The user who created the bookmark.              |
| `question_id` | `uuid`        | `NOT NULL`, `FK → questions.id`                     | The bookmarked question.                        |
| `notes`       | `text`        | `NULL` allowed, `CHECK (char_length(notes) <= 100)` | Optional personal note. Maximum 100 characters. |
| `created_at`  | `timestamptz` | `DEFAULT CURRENT_TIMESTAMP`                         | When the bookmark was created.                  |

**Primary Key:** `(user_id, question_id)` — prevents duplicate bookmarks for the same question by the same user.

**Relationships:**

- Many-to-One: `user_id` → `users.id` (ON DELETE CASCADE)
- Many-to-One: `question_id` → `questions.id` (ON DELETE CASCADE)

**Row Level Security (RLS) Policies:**

Standard "own rows only" pattern. All operations scoped to `auth.uid()`:

- **Select:** `FOR SELECT USING (auth.uid() = user_id)`
- **Insert:** `FOR INSERT WITH CHECK (auth.uid() = user_id)`
- **Update:** `FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`
- **Delete:** `FOR DELETE USING (auth.uid() = user_id)`

**Indexes:**

| Index Name                            | Columns                    | Type   | Purpose                                                                       |
| :------------------------------------ | :------------------------- | :----- | :---------------------------------------------------------------------------- |
| `question_bookmarks_pkey`             | `user_id, question_id`     | B-tree | Primary key; also serves as the uniqueness check.                             |
| `idx_question_bookmarks_user_created` | `user_id, created_at DESC` | B-tree | Optimises "list my bookmarks, newest first" queries via `get_user_bookmarks`. |

**Notes:**

- **One row per (user, question).** The composite primary key means a user either has bookmarked a question or hasn't — there's no "multiple bookmarks" concept. Adding, removing, and updating all operate on the same single row.
- **Toggle semantics via RPC.** The client never does a direct insert or delete. It calls `toggle_question_bookmark(p_question_id, p_note?)`, which checks for an existing row, inserts if absent, deletes if present. This avoids a round-trip race where the client sends "insert" but a bookmark already exists from another tab.
- **Notes are optional but capped.** The 100-character limit is enforced both at the CHECK constraint (database) and in the `validateNote` helper (client). The reasoning: notes are meant to be short reminders ("check before exam"), not freeform essays. A length limit keeps the bookmarks list compact and prevents abuse.
- **Cascade deletes on both sides.** If the user is deleted, their bookmarks go with them. If a question is deleted, all bookmarks referencing it are removed automatically. This is important — a bookmark to a non-existent question would break the `get_user_bookmarks` RPC's join.
- **Bookmarked questions are counted toward practice stats.** The practice page shows a bookmark indicator on each question. It does not affect scoring, progress, or peer statistics — bookmarks are a user-side organizational tool, not a progress marker.

---

## Test System

Two tables work together to power Topic Tests and PYQ Mocks. The distinction between them:

- A **Topic Test** is generated on-demand from user-selected topics. Question selection is randomized with a 50/30/20 bucketing strategy (new / revision / fill).
- A **PYQ Mock** is assembled from a specific past paper. Question selection is deterministic — every user who starts "GATE CS 2024 Set 1" gets the exact same questions in the same order.

Both use the same tables and the same grading RPC. The only difference is how the questions are chosen at creation time, which is entirely handled by `generate_topic_test()` vs. `create_test_from_paper()`.

---

### Table: `public.topic_tests`

Stores the header row for each test session — the "envelope" that holds metadata, timing, and final score. Individual question state lives in `topic_tests_attempts`.

| Column Name              | Data Type          | Constraints & Defaults                     | Description                                                                                                                                                                 |
| :----------------------- | :----------------- | :----------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                     | `uuid`             | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique identifier for the session.                                                                                                                                          |
| `user_id`                | `uuid`             | `NOT NULL`, `FK → users.id`                | The user who owns this test.                                                                                                                                                |
| `topics`                 | `text[]`           | `NULL` allowed                             | Topic names selected for the test. For PYQ Mocks, this is a single-element array containing the paper label, e.g. `["GATE CS 2024 Set 1"]`.                                 |
| `created_at`             | `timestamptz`      | `DEFAULT now()`                            | When the session was created.                                                                                                                                               |
| `updated_at`             | `timestamptz`      | `DEFAULT now()`                            | Updated on every state change (status transitions, timer persists).                                                                                                         |
| `completed_at`           | `timestamptz`      | `NULL` allowed                             | Set when the session transitions to `completed` by `submit_test_grading`.                                                                                                   |
| `status`                 | `text`             | `DEFAULT 'created'`                        | Session lifecycle state. Known values: `created`, `ongoing`, `paused`, `completed`.                                                                                         |
| `remaining_time_seconds` | `integer`          | `NOT NULL`                                 | Time remaining in the test. Decremented by the client every second; the server persists the latest value periodically so a browser refresh can resume the clock.            |
| `total_questions`        | `integer`          | `DEFAULT 0`                                | Number of questions in this session. Populated at creation.                                                                                                                 |
| `score`                  | `double precision` | `NULL` allowed                             | Final score after grading. `NULL` until completion.                                                                                                                         |
| `total_marks`            | `integer`          | `NULL` allowed                             | Sum of marks across all questions. Populated at creation.                                                                                                                   |
| `accuracy`               | `double precision` | `NULL` allowed                             | `(correct_count / attempted_count) * 100` after grading.                                                                                                                    |
| `correct_count`          | `integer`          | `DEFAULT 0`                                | Number of correct answers. Populated by `submit_test_grading`.                                                                                                              |
| `attempted_count`        | `integer`          | `DEFAULT 0`                                | Number of attempted questions (excludes skipped). Populated by grading.                                                                                                     |
| `branch_id`              | `text`             | `NOT NULL`, `FK → branches.id`             | The user's branch at the time of the test. Used for the active-test guard.                                                                                                  |
| `record_activity`        | `boolean`          | `NOT NULL`, `DEFAULT true`                 | If `true`, completion writes attempts into `user_question_activity`. If `false`, the test is isolated — it does not affect dashboard stats, peer stats, or revision queues. |
| `paper_id`               | `text`             | `NULL` allowed                             | Non-null for PYQ Mocks, format like `gate-cs-2024-s1`. `NULL` for custom Topic Tests.                                                                                       |

**Relationships:**

- Many-to-One: `user_id` → `users.id`
- Many-to-One: `branch_id` → `branches.id`
- One-to-Many: `topic_tests_attempts.session_id` → `topic_tests.id` (cascade on delete)

**Row Level Security (RLS) Policies:**

Standard own-rows-only pattern:

- **Select:** `FOR SELECT USING (auth.uid() = user_id)`
- **Insert:** `FOR INSERT WITH CHECK (auth.uid() = user_id)`
- **Update:** `FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`
- **Delete:** `FOR DELETE USING (auth.uid() = user_id)`

**Indexes:**

| Index Name                                   | Columns                                                 | Type           | Purpose                                                                                                                                                                                                   |
| :------------------------------------------- | :------------------------------------------------------ | :------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `topic_tests_pkey`                           | `id`                                                    | B-tree         | Primary key.                                                                                                                                                                                              |
| `idx_one_active_test_per_user_branch_active` | `user_id, branch_id` (partial: `status <> 'completed'`) | B-tree, UNIQUE | **Enforces one active test per (user, branch).** Trying to insert a second active test violates the constraint; both `generate_topic_test` and `create_test_from_paper` guard against this before insert. |
| `idx_topic_tests_user_status`                | `user_id, status`                                       | B-tree         | Optimises "get my active test" and "get my test history" queries.                                                                                                                                         |
| `idx_topic_tests_paper`                      | `user_id, paper_id` (partial: `paper_id IS NOT NULL`)   | B-tree         | Feeds paper-scoped analytics and the paper history view.                                                                                                                                                  |

**Triggers:**

| Trigger                   | Timing       | Function                        |
| :------------------------ | :----------- | :------------------------------ |
| `on_topic_test_completed` | AFTER UPDATE | `handle_test_completion_sync()` |

The trigger fires when `status` transitions to `'completed'` for the first time and `record_activity = true`. It is documented in detail in the [Triggers](#triggers) section.

**Notes:**

- **The active-test constraint is the most important invariant.** A user can have at most one non-`completed` test per branch. Without this, a user could have multiple tabs open and start two tests, leading to confusing state and duplicated attempts. The unique index enforces it at the database level; the RPCs also check before inserting to give a clean error instead of a constraint violation.
- **Status is not a state machine at the DB level.** There's no CHECK constraint preventing `completed → ongoing`. This is deliberate — the transition enforcement lives in the RPCs (`updateTestStatus` in the client, `submit_test_grading` in the DB), and adding a constraint would require a migration to loosen it if the lifecycle ever changes.
- **`record_activity` is enforced by the trigger, not the writer.** A test with `record_activity = false` still grades and stores scores in `topic_tests` — it just doesn't propagate attempts to `user_question_activity`. This allows a user to do a test without affecting their dashboard, which is the whole point of the toggle in the test configuration UI.
- **`paper_id` is null for custom tests.** The name is a slight misnomer — a custom Topic Test has no "paper." The column exists to distinguish "came from a PYQ catalog" from "came from a topic selection," and the client uses this to render history differently (paper label vs. topic list).
- **`updated_at` is bumped manually.** Unlike `questions.updated_at`, which uses a `moddatetime` trigger, `topic_tests.updated_at` is set by each RPC that touches the row. This is because updates happen from multiple clients (timer persists, status changes, grading) and a trigger would need to distinguish "meaningful" from "cosmetic" updates.

---

### Table: `public.topic_tests_attempts`

Stores per-question state within a test session. One row per (session, question). Rows are created at session creation (in `unvisited` status) and updated as the user interacts with each question.

| Column Name          | Data Type          | Constraints & Defaults            | Description                                                                                                                         |
| :------------------- | :----------------- | :-------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| `session_id`         | `uuid`             | `NOT NULL`, `FK → topic_tests.id` | The session this attempt belongs to.                                                                                                |
| `question_id`        | `uuid`             | `NOT NULL`, `FK → questions.id`   | The question being attempted.                                                                                                       |
| `attempt_order`      | `integer`          | `NOT NULL`                        | 1-based position in the paper or topic order. Preserved across submits.                                                             |
| `user_answer`        | `jsonb`            | `NULL` allowed                    | The user's answer. `null` for skipped questions. Shape varies by question type: number for numerical, array of indices for MCQ/MSQ. |
| `marked_for_review`  | `boolean`          | `DEFAULT false`                   | Whether the user flagged this question for review (the flag button in the palette).                                                 |
| `status`             | `text`             | `DEFAULT 'unvisited'`             | One of `unvisited`, `viewed`, `answered`. Reflects the user's interaction, not correctness.                                         |
| `is_correct`         | `boolean`          | `NULL` allowed                    | Graded result. `NULL` until `submit_test_grading` runs; `NULL` after grading if the question was skipped.                           |
| `score`              | `double precision` | `NULL` allowed                    | Marks awarded for this question. Can be negative for MCQ wrong answers.                                                             |
| `time_spent_seconds` | `integer`          | `DEFAULT 0`                       | Time spent on this question. Incremented by the client as the user views it.                                                        |

**Primary Key:** `(session_id, question_id)` — one row per question per session.

**Relationships:**

- Many-to-One: `session_id` → `topic_tests.id` (ON DELETE CASCADE)
- Many-to-One: `question_id` → `questions.id`

**Row Level Security (RLS) Policies:**

Standard own-rows-only pattern, but the ownership check requires a join to `topic_tests`:

- **Select:** `FOR SELECT USING (EXISTS (SELECT 1 FROM topic_tests t WHERE t.id = session_id AND t.user_id = auth.uid()))`
- **Insert / Update / Delete:** same join-based ownership check

The RLS policies use a subquery because `topic_tests_attempts` has no direct `user_id` column — ownership is inferred from the parent session.

**Indexes:**

| Index Name                   | Columns                     | Type   | Purpose                                                             |
| :--------------------------- | :-------------------------- | :----- | :------------------------------------------------------------------ |
| `topic_tests_attempts_pkey`  | `session_id, question_id`   | B-tree | Primary key; serves as the composite lookup for per-question state. |
| `idx_attempts_session_order` | `session_id, attempt_order` | B-tree | Optimises loading a session in paper order for resume and grading.  |

**Notes:**

- **Rows are created upfront.** When a session is created, one row per question is inserted with `status = 'unvisited'` and `attempt_order` set. The attempt order is fixed at creation time so that:
  - The question palette renders in the original order.
  - Loading a session for resume returns questions in the exact order they were presented.
  - `submit_test_grading` can match the payload to existing rows via `(session_id, question_id)` upsert rather than requiring the client to preserve order.
- **`user_answer` shape varies by type.** For numerical questions, it's a scalar JSON number (`42`). For MCQ/MSQ, it's an array of indices (`[2]` or `[1, 3]`). The grading RPC inspects `question_type` to know how to interpret it.
- **`status` vs. `is_correct`.** These are separate concepts:
  - `status = 'answered'` means the user selected something.
  - `is_correct = true` means what they selected was right.
    A user can be `answered` and `is_correct = false` (wrong answer), or `viewed` and `is_correct = NULL` (saw it, didn't attempt), or `unvisited` and `is_correct = NULL` (never looked).
- **Timer and pause state.** The remaining time isn't stored per question — it's on `topic_tests.remaining_time_seconds`. Per-question time is `time_spent_seconds` and is informational, not used for scoring or gating.
- **Grading is an upsert.** `submit_test_grading` uses `ON CONFLICT (session_id, question_id) DO UPDATE`, which means it's safe to call twice — the second call overwrites the first. This is what makes the client's "retry submission" logic safe when network fails mid-grade.
- **Cascade on session delete.** Deleting a session removes all its attempt rows. This is important for the "Clear Data" feature, which needs to remove a user's test history cleanly.
- **The unique constraint `(session_id, question_id)` prevents duplicate attempts for the same question in one session.** A user can't answer question 12 twice — they can only update their existing answer on question 12.

---

## Spaced Repetition

Three tables implement the Leitner-box spaced repetition system that powers Smart Revision. The core idea: questions a user got wrong are queued and resurfaces at increasing intervals as they get them right, until mastery removes them from the queue.

The lifecycle:

1. User answers a question wrong in any context → row is inserted into `user_incorrect_queue` at Box 1.
2. User answers the same question right in a _revision_ context → the row is promoted to Box 2 (next review in 2 weeks), then Box 3 (next review in 4 weeks), then removed entirely.
3. A cron generates a weekly revision set from the queue, prioritized by box level (lower boxes first) and by how long ago the mistake was made.
4. After the user finishes a revision set, the queue is updated to reflect their performance.

The critical distinction is between **practice** and **revision**. Practice (regular practice sessions, topic tests, PYQ Mocks) can _add_ questions to the queue but cannot _advance_ them. Only official revision attempts move boxes forward. This is what makes the spaced repetition actually spaced — a user can't shortcut mastery by hammering practice questions.

---

### Table: `public.user_incorrect_queue`

The Leitner box state per (user, question). A row exists only while a question is queued for review; once mastered, the row is deleted.

| Column Name      | Data Type     | Constraints & Defaults                                     | Description                                                                                                                    |
| :--------------- | :------------ | :--------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| `user_id`        | `uuid`        | `PRIMARY KEY (composite)`, `NOT NULL`, `FK → users.id`     | The user this queue entry belongs to.                                                                                          |
| `question_id`    | `uuid`        | `PRIMARY KEY (composite)`, `NOT NULL`, `FK → questions.id` | The question queued for review.                                                                                                |
| `box`            | `int`         | `DEFAULT 1`                                                | Leitner box level. `1` = needs frequent review, `2` = intermediate, `3` = almost mastered. Higher boxes have longer intervals. |
| `added_at`       | `timestamptz` | `DEFAULT now()`                                            | When the question was added to the queue. Used to prioritize oldest mistakes.                                                  |
| `next_review_at` | `timestamptz` | `DEFAULT current_date`                                     | When the question becomes eligible for revision. A question is only included in a weekly set once this timestamp has passed.   |

**Primary Key:** `(user_id, question_id)`

**Relationships:**

- Many-to-One: `user_id` → `users.id`
- Many-to-One: `question_id` → `questions.id`

**Row Level Security (RLS) Policies:**

Standard own-rows-only pattern:

- **Select:** `FOR SELECT USING (user_id = auth.uid())`
- **Insert:** `FOR INSERT WITH CHECK (user_id = auth.uid())`
- **Update:** `FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`
- **Delete:** `FOR DELETE USING (user_id = auth.uid())`

**Indexes:**

| Index Name                  | Columns                             | Type   | Purpose                                                                                                                     |
| :-------------------------- | :---------------------------------- | :----- | :-------------------------------------------------------------------------------------------------------------------------- |
| `user_incorrect_queue_pkey` | `user_id, question_id`              | B-tree | Primary key; ensures uniqueness per (user, question).                                                                       |
| `idx_next_reviewed`         | `user_id, added_at, next_review_at` | B-tree | Optimises "fetch this user's due-for-review questions, oldest first" — the exact query `generate_weekly_revision_set` runs. |
| `idx_users_added`           | `user_id, added_at`                 | B-tree | Supports time-ordered queue inspection.                                                                                     |

**Notes:**

- **Box intervals.** The transition logic lives in `insert_user_question_activity_batch` and `handle_test_completion_sync`:
  - Box 1 → Box 2 on a correct revision attempt. `next_review_at = now() + 2 weeks`.
  - Box 2 → Box 3 on a correct revision attempt. `next_review_at = now() + 4 weeks`.
  - Box 3 → Deleted on a correct revision attempt. The question is mastered.
  - Any box → Box 1 on an incorrect revision attempt. `next_review_at = now()`, so it's immediately due again.
- **Practice attempts can only add, never advance.** If a user gets a question wrong in practice (not revision), a new row is inserted at Box 1. If they get it right in practice, nothing happens to the queue. This is enforced in `insert_user_question_activity_batch` — the box-update block only runs for `revision_state = 'first'` (which corresponds to answering a question that's part of an active weekly revision set).
- **Initial insert.** A new row from a wrong practice answer gets `next_review_at = now()`, making it immediately eligible. This is intentional — the user got it wrong _today_, so it should be the first thing surfaced in the next revision session.
- **One row per (user, question), ever.** Because the primary key is composite, a question can't have two queue entries for the same user. Getting a question wrong multiple times just updates the existing row (resetting box to 1, bumping `next_review_at`).
- **Deletion on mastery.** When a user correctly answers a Box-3 question in revision, the row is deleted. There's no "mastered" flag — presence in the queue _is_ the flag.
- **The queue doesn't grow unbounded.** A user who never does revision will accumulate rows (every wrong practice answer adds one), but a user who does revision will churn them out. There's no automatic pruning of stale rows — a user who ignores revision for a year could accumulate hundreds of due questions, all of which will show up in their next revision set (capped at 30 per set by `generate_weekly_revision_set`).

---

### Table: `public.weekly_revision_set`

One row per (user, week) — the weekly revision session generated for the user. Generated by a client-triggered RPC call to `generate_weekly_revision_set` when the user opens the Smart Revision page for the first time in a week.

| Column Name       | Data Type      | Constraints & Defaults                     | Description                                                                                                                          |
| :---------------- | :------------- | :----------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------- |
| `id`              | `uuid`         | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique identifier for the revision set.                                                                                              |
| `generated_for`   | `uuid`         | `FK → users.id`                            | The user this set was generated for.                                                                                                 |
| `branch_id`       | `text`         | `FK → branches.id`                         | The user's branch when the set was generated. Captured to prevent cross-branch contamination if the user switches branches mid-week. |
| `start_of_week`   | `date`         | `NOT NULL`                                 | The Sunday that starts the week this set belongs to. Enforces one set per user per week.                                             |
| `status`          | `text`         | `DEFAULT 'pending'`                        | Lifecycle state: `pending`, `started`, `expired`.                                                                                    |
| `created_at`      | `timestamptz`  | `DEFAULT current_timestamp`                | When the set was generated.                                                                                                          |
| `started_at`      | `timestamptz`  | `NULL` allowed                             | When the user actually started the set. `NULL` until `start_weekly_revision_set` runs.                                               |
| `expires_at`      | `timestamptz`  | `DEFAULT started_at + interval '24 hours'` | 24 hours after `started_at`. Once passed, `get_weekly_set` will auto-expire the set.                                                 |
| `total_questions` | `int`          | `DEFAULT 0`                                | Number of questions in the set. Populated by `generate_weekly_revision_set`.                                                         |
| `correct_count`   | `int`          | `DEFAULT 0`                                | Number of correct answers so far. Updated incrementally as the user answers questions in the set.                                    |
| `accuracy`        | `numeric(5,2)` | `NULL` allowed                             | `correct_count / attempted * 100`, updated after each attempt.                                                                       |
| `exam_tags`       | `text[]`       | `NULL` allowed                             | Exam IDs captured at generation time (e.g. `['GATE', 'ISRO']`). Used to filter revision questions by the user's target exams.        |

**Relationships:**

- Many-to-One: `generated_for` → `users.id`
- Many-to-One: `branch_id` → `branches.id`
- One-to-Many: `revision_set_questions.set_id` → `weekly_revision_set.id` (cascade on delete)

**Row Level Security (RLS) Policies:**

Standard own-rows-only pattern:

- **Select:** `FOR SELECT USING (generated_for = auth.uid())`
- **Insert:** `FOR INSERT WITH CHECK (generated_for = auth.uid())`
- **Update:** `FOR UPDATE USING (generated_for = auth.uid()) WITH CHECK (generated_for = auth.uid())`
- **Delete:** `FOR DELETE USING (generated_for = auth.uid())`

**Indexes:**

| Index Name                 | Columns | Type   | Purpose      |
| :------------------------- | :------ | :----- | :----------- |
| `weekly_revision_set_pkey` | `id`    | B-tree | Primary key. |

**Notes:**

- **One set per (user, week, branch).** `generate_weekly_revision_set` checks for an existing set at the same `start_of_week` before inserting. If found, it returns the existing set instead of creating a duplicate. This is what makes "open Smart Revision twice in one day" safe.
- **Status transitions.** `pending` → `started` (via `start_weekly_revision_set`). `started` → `expired` (via `update_status_of_weekly_set` or automatically when `expires_at` is passed and `get_weekly_set` is called). No transitions out of `expired`.
- **The 24-hour window.** A started set expires exactly 24 hours after starting. This is a hard deadline: once the set expires, unanswered questions in it become due again in the queue (`is_correct` stays `NULL` in `revision_set_questions`, and the queue's `next_review_at` doesn't change unless the question was actually attempted). This design encourages completing the set in one sitting while allowing for interruptions.
- **`exam_tags` is captured at generation.** Not derived at read time from `user_goals`. This means if a user changes their target exams mid-week, the current revision set still reflects the exams they had when it was generated. The next week's set will use the updated exams. This is intentional — it avoids mid-session question swaps.
- **`accuracy` uses `numeric(5,2)`.** Not a float. This matters for exact comparison in the UI (e.g., "you scored 66.67% on revision") and avoids the `66.6666666` problem.

---

### Table: `public.revision_set_questions`

The questions included in a specific weekly revision set. One row per (set, question). Populated by `generate_weekly_revision_set`; updated by `insert_user_question_activity_batch` when the user answers each question during the revision session.

| Column Name          | Data Type | Constraints & Defaults                                                                    | Description                                                                                     |
| :------------------- | :-------- | :---------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------- |
| `set_id`             | `uuid`    | `PRIMARY KEY (composite)`, `NOT NULL`, `FK → weekly_revision_set.id`, `ON DELETE CASCADE` | The revision set this question belongs to.                                                      |
| `question_id`        | `uuid`    | `PRIMARY KEY (composite)`, `NOT NULL`, `FK → questions.id`                                | The question included in the revision set.                                                      |
| `is_correct`         | `boolean` | `NULL` allowed                                                                            | Whether the user answered correctly. `NULL` until the user actually answers during the session. |
| `time_spent_seconds` | `int`     | `NULL` allowed                                                                            | Time spent answering, in seconds.                                                               |

**Primary Key:** `(set_id, question_id)`

**Relationships:**

- Many-to-One: `set_id` → `weekly_revision_set.id` (ON DELETE CASCADE)
- Many-to-One: `question_id` → `questions.id`

**Row Level Security (RLS) Policies:**

**RLS is disabled on this table.** This is deliberate — the table is only accessed via SECURITY DEFINER functions (`generate_weekly_revision_set`, `insert_user_question_activity_batch`, `get_weekly_set`), all of which perform their own ownership checks. Enabling RLS would require duplicating those checks at the row level, which would be slower and harder to maintain.

Direct client access is not exposed — there's no RPC that returns rows from this table directly to the client.

**Indexes:**

| Index Name                    | Columns               | Type   | Purpose                                                    |
| :---------------------------- | :-------------------- | :----- | :--------------------------------------------------------- |
| `revision_set_questions_pkey` | `set_id, question_id` | B-tree | Composite primary key; ensures each question appears once. |

**Notes:**

- **`is_correct = NULL` means "not attempted yet."** The set is generated with all rows in this state; the user's answers flip them to `true` or `false`. The `get_weekly_set` RPC computes progress as `count(*) where is_correct is not null` over `total_questions`.
- **Writing happens through the batch RPC, not directly.** When the user answers a question that belongs to an active revision set, `insert_user_question_activity_batch`:
  - Writes the attempt to `user_question_activity` (as normal).
  - Updates the corresponding `revision_set_questions` row with `is_correct` and `time_spent_seconds`.
  - Updates `weekly_revision_set.correct_count` and `accuracy`.
  - Updates `user_incorrect_queue` box level based on the answer.
  - Checks whether all questions are now attempted, and if so, marks the set as expired via `update_status_of_weekly_set`.

  This is the only path that updates `revision_set_questions`. Direct edits by the user would break the invariants that `handle_test_completion_sync` and `insert_user_question_activity_batch` rely on.

- **`ON DELETE CASCADE` from `weekly_revision_set`.** If a revision set is deleted (e.g., by `delete_account`), all its question rows go with it. This is important — orphaned `revision_set_questions` rows would break the queue logic the next time the user generates a set.
- **The order is not stored.** Unlike `topic_tests_attempts`, there's no `attempt_order` column. `get_weekly_set` returns questions in whatever order the RPC chooses (currently by `box ASC, added_at ASC` from the queue). The client displays them in the order returned. This is a design choice — the "optimal order" for revision is determined by the queue prioritization, not stored per set.

---

### Table: `public.notifications`

Stores notification rows along with targeting metadata. Each row describes **who should receive the notification**; delivery across push and in-app channels is handled by a separate dispatcher pipeline that this table feeds into.

This table was originally broadcast-only — every notification went to every user, and the RLS policy was `FOR SELECT USING (true)`. That design has been replaced with a targeting system that supports four audience types, per-user read state, and a two-trigger delivery pipeline. See the [Notification System](#notification-system) architecture note for the full design rationale.

| Column Name     | Data Type     | Constraints & Defaults                                 | Description                                                                                                                                                                              |
| :-------------- | :------------ | :----------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`            | `uuid`        | `PRIMARY KEY`, `NOT NULL`, `DEFAULT gen_random_uuid()` | Unique ID for the notification.                                                                                                                                                          |
| `created_at`    | `timestamptz` | `NOT NULL`, `DEFAULT now()`                            | When the notification was created.                                                                                                                                                       |
| `title`         | `text`        | `NULL` allowed                                         | Push notification title and bell-icon header. Falls back to `'GATEQuest'` when `NULL`.                                                                                                   |
| `message`       | `text`        | `NULL` allowed                                         | Push notification body and bell-icon description.                                                                                                                                        |
| `type`          | `text`        | `NULL` allowed                                         | Icon category used by the bell UI. Known values: `'update'` (green check), `'reminder'` (blue calendar), anything else (purple book).                                                    |
| `active`        | `boolean`     | `NOT NULL`, `DEFAULT true`                             | Global kill switch. Setting to `false` hides the notification from every user, regardless of targeting.                                                                                  |
| `target`        | `jsonb`       | `NOT NULL`, `DEFAULT '{"type": "broadcast"}'::jsonb`   | Targeting specification. See [Target Types](#target-types) below. Checked by a CHECK constraint enforcing `type` is one of five known values.                                            |
| `audience_ids`  | `uuid[]`      | `NULL` allowed                                         | The resolved audience. `NULL` for broadcast (everyone). `[]` for a segment that matched no one (nobody). Populated at insert time by the `before_notification_insert` trigger.           |
| `link`          | `text`        | `NULL` allowed                                         | Deep link URL. Used for both the push notification's `url` field and (in a future release) in-app navigation when the notification is clicked. Falls back to `'/dashboard'` when `NULL`. |
| `dispatched_at` | `timestamptz` | `NULL` allowed                                         | Set by the dispatcher Edge Function when push fanout completes. Serves as the idempotency marker — a notification with a non-null `dispatched_at` is never dispatched again.             |

**Relationships:**

- One-to-Many: `notification_reads.notification_id` → `notifications.id` (cascade on delete)

**Row Level Security (RLS) Policies:**

One SELECT policy, replacing the old `Allow read for all` policy (which has been dropped):

```sql
create policy "notifications_select"
    on public.notifications
    for select
    to authenticated
    using (
        active = true
        and not exists (
            select 1
            from public.notification_reads r
            where r.notification_id = notifications.id
              and r.user_id = auth.uid()
        )
        and (
            (target->>'type' = 'broadcast' and audience_ids is null)
            or (audience_ids is not null and auth.uid() = any(audience_ids))
        )
    );
```

Three conditions must hold:

1. **`active = true`** — the global kill switch.
2. **Not read** — the `NOT EXISTS` subquery excludes anything the user has already dismissed.
3. **Targeting match** — either broadcast (audience `NULL`) or the user is in `audience_ids`.

The client's fetch is therefore a plain `select('*').order('created_at', { ascending: false })` with no client-side filtering. RLS returns exactly the unread, targeted notifications for the calling user.

**Indexes:**

| Index Name                         | Columns                                              | Type   | Purpose                                                             |
| :--------------------------------- | :--------------------------------------------------- | :----- | :------------------------------------------------------------------ |
| `notifications_pkey`               | `id`                                                 | B-tree | Primary key.                                                        |
| `idx_notifications_audience`       | `audience_ids`                                       | GIN    | Serves the RLS policy's `auth.uid() = any(audience_ids)` check.     |
| `idx_notifications_target_type`    | `(target->>'type')`                                  | B-tree | Diagnostic queries ("how many tag-targeted vs. segment-targeted?"). |
| `idx_notifications_undispatched`   | `created_at` (partial: `dispatched_at IS NULL`)      | B-tree | Backfill sweeps for stuck dispatches.                               |
| `idx_notifications_active_created` | `active, created_at DESC` (partial: `active = true`) | B-tree | Serves the client fetch's ORDER BY without a sort step.             |

**Triggers:**

| Trigger                         | Timing        | Function                       |
| :------------------------------ | :------------ | :----------------------------- |
| `on_notification_before_insert` | BEFORE INSERT | `before_notification_insert()` |
| `on_notification_after_insert`  | AFTER INSERT  | `dispatch_notification_http()` |

The BEFORE trigger defaults `active` to `true` and resolves `audience_ids` from `target` (except for broadcast, which stays `NULL`). The AFTER trigger fires an async HTTP call via `pg_net` to the `dispatch-notification` Edge Function, which handles push fanout. Full mechanics are in the [Triggers](#triggers) section.

---

#### Target Types

Five targeting shapes are supported. The `target` JSONB always has a `type` field; other fields depend on the type.

| `target.type` | Shape                                                                   | Resolver behavior                                | Typical producer                                         |
| :------------ | :---------------------------------------------------------------------- | :----------------------------------------------- | :------------------------------------------------------- |
| `broadcast`   | `{ "type": "broadcast" }`                                               | Returns `NULL` — everyone                        | Donation reminders, maintenance announcements            |
| `user`        | `{ "type": "user", "user_id": "<uuid>" }`                               | Returns `[uuid]`                                 | Report resolution (reporter), report creation (admin)    |
| `users`       | `{ "type": "users", "user_ids": ["<uuid>", ...] }`                      | Returns the list                                 | Hourly revision reminders (audience computed by handler) |
| `tag`         | `{ "type": "tag", "tag": "branch:cs" }`                                 | Users whose `notification_tags` includes the tag | Branch-wide, exam-wide, donor-wide notifications         |
| `segment`     | `{ "type": "segment", "segment": "active_weekend", "params": { ... } }` | Delegates to `resolve_segment()`                 | Weekend topic test reminders (recomputed at send time)   |

**The difference between tags and segments** is where the audience logic lives:

- **Tags** are precomputed strings stored on `users.notification_tags`. The resolver is a single `= any()` query. Fast, but requires a trigger to keep tags current whenever the underlying state changes (branch, exams, beta status).
- **Segments** are queries evaluated at insert time. The resolver runs `resolve_segment(target)`, which is a `case` statement over known segment names — `active_weekend` runs the `active_weekend_subscriptions` view, `leaderboard_top` runs an XP-ordered query, and so on. No trigger needed, but each insert pays the query cost.

**Rule of thumb:** if the audience is a stable property of the user, use a tag. If the audience is a dynamic predicate that changes over time without any user action, use a segment. If the audience depends on _when_ the notification is sent (e.g. "sets started 22-23 hours ago"), keep the query in the producer and pass `type: 'users'` with the resolved list.

**The empty-audience state.** When a non-broadcast target resolves to zero users — for example, `active_weekend` on a weekend when nobody has attempted a question in 14 days — the trigger sets `audience_ids = []` (empty array, not `NULL`). This is a third state distinct from broadcast:

| `audience_ids` | Meaning           | Dispatcher behavior                                            |
| :------------- | :---------------- | :------------------------------------------------------------- |
| `NULL`         | Broadcast         | Query all push subscriptions, fan out to everyone              |
| `[uuid, ...]`  | Targeted          | Query subscriptions where `user_id IN (...)`, fan out to those |
| `[]`           | Resolved to empty | Skip dispatch, mark `dispatched_at` without sending            |

The dispatcher explicitly checks for `[]` before querying subscriptions. Without this check, an empty segment match would fall through to the broadcast query — a serious bug that would send the notification to every subscription in the database. This is covered by a dedicated test in the dispatcher suite.

---

**Why the JSONB column rather than three columns.** Three alternatives were considered:

1. **Three columns**: `target_user_id`, `target_tag`, `target_segment`. Mutually exclusive by convention. Adding a fourth type (e.g. `target_user_ids` for explicit lists) would require a migration.
2. **A normalized targeting table**: `notification_targets(notification_id, type, value)`. Cleaner relational model, but requires a join on every read and complicates the RLS policy.
3. **A JSONB column** (chosen): one column, checked by a CHECK constraint, extensible without migrations.

The JSONB approach mirrors `questions.metadata`, which uses the same pattern for `section`, `shift`, `paperType`, and so on. The consistency matters — a reader who understands one doesn't have to learn the other.

**Why `audience_ids` is separate from `target`.** The `target` column describes intent; `audience_ids` records the resolution. They're kept distinct because:

- **Resolution is a snapshot.** If you send a "top 5 leaderboard" notification today, those five users should see it forever — even after the leaderboard shuffles. Storing `audience_ids` freezes the audience at send time. Re-resolving the segment on every read would make notifications appear and disappear as the underlying predicate changes.
- **RLS becomes a fast `= any()` check.** No subqueries against segment logic during reads.
- **The dispatcher has a single source of truth.** It doesn't need to know how to resolve a target; it just reads the pre-resolved audience and queries subscriptions for those user IDs.

**Why `dispatched_at` is separate from `created_at`.** They mark different events:

- `created_at` — when the row was inserted.
- `dispatched_at` — when the push fanout completed successfully.

A gap between them (`dispatched_at > created_at`) is expected — the trigger fires async via `pg_net`, the dispatcher has a cold-start cost of a few hundred milliseconds, and fanout itself takes time proportional to the audience size. If `dispatched_at` stays `NULL`, it means the dispatch never completed (dispatcher error, wrong secret, missing vault secret, or wrong URL) — which is the signal for the backfill sweep query that lives at `idx_notifications_undispatched`.

**The `active` column is not retired.** It's tempting to think targeting obsoletes it, but the semantics are different:

- **Targeting** decides who receives a new notification.
- **`active`** decides whether an _existing_ notification is still visible.

The common use of `active = false` is admin takedown: a notification was sent with wrong content, and needs to be hidden from every user immediately. Without this flag, that would require deleting the row — which would also delete its `notification_reads` history and lose the audit trail.

---

### Table: `public.donations`

Stores donation records submitted by users or guests, including amounts, messages, and verification status. UPI-based donation flow: users submit a transaction reference (UTR) along with the amount they sent, and an admin manually verifies each record.

| Column Name        | Data Type       | Constraints & Defaults                     | Description                                                 |
| :----------------- | :-------------- | :----------------------------------------- | :---------------------------------------------------------- |
| `id`               | `uuid`          | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique donation ID.                                         |
| `user_id`          | `uuid`          | `NULL`, `FK → users.id`                    | User who made the donation; `NULL` if submitted by a guest. |
| `anonymous`        | `boolean`       | `DEFAULT false`                            | True if donor wants to hide their name.                     |
| `message`          | `text`          | `NULL` allowed                             | Optional message from the donor (max 100 chars).            |
| `suggested_amount` | `numeric(10,2)` | `NULL` allowed                             | Amount suggested by the donor.                              |
| `actual_amount`    | `numeric(10,2)` | `NULL` allowed                             | Verified amount received.                                   |
| `utr`              | `text`          | `UNIQUE`                                   | UPI transaction reference number.                           |
| `verified`         | `boolean`       | `DEFAULT false`                            | True after manual verification.                             |
| `created_at`       | `timestamp`     | `DEFAULT current_timestamp`                | Time the donation was submitted.                            |
| `verified_at`      | `timestamp`     | `NULL` allowed                             | Time when the donation was verified manually.               |

**Relationships:**

- Many-to-One: `user_id` → `users.id`

**Row Level Security (RLS) Policies:**

- **Insert:** Anyone (authenticated or anonymous) can insert a donation. Guests can donate without signing up; the `user_id` is `NULL` in that case.
- **SQL Logic:** `FOR INSERT TO public`
- **Select:** Anyone can read donations.
- **SQL Logic:** `FOR SELECT TO public`

Public read is intentional — the donations page shows verified donations to everyone, including guests, as a way of encouraging further contributions. The `get_verified_donations()` RPC is the read path used by the client and it joins `users` to attach the donor's name and avatar (respecting `anonymous = true` by nulling those fields).

**Indexes:**

| Index Name               | Columns    | Type   | Purpose                                                    |
| :----------------------- | :--------- | :----- | :--------------------------------------------------------- |
| `donations_pkey`         | `id`       | B-tree | Primary key ensuring unique donation IDs.                  |
| `donations_utr_key`      | `utr`      | B-tree | Unique constraint on UTR — prevents duplicate submissions. |
| `idx_donations_utr`      | `utr`      | B-tree | Lookup by UTR for verification.                            |
| `idx_donations_verified` | `verified` | B-tree | Optimises filtering verified/unverified in admin view.     |

**Notes:**

- **The UTR is the deduplication key.** A user who accidentally submits the same donation twice (double-click, network retry) is rejected at the database level. This is the correct behavior — each real transaction has exactly one UTR.
- **`suggested_amount` vs. `actual_amount`.** The suggested amount is what the user _said_ they'd pay when they started the flow. The actual amount is what was verified after the transaction went through. In practice, these usually match, but the two-column design allows an admin to correct mistakes during verification ("the user said ₹500 but the UTR shows ₹100 — mark actual as 100").
- **Guest donations are allowed.** `user_id` is nullable because donors aren't required to sign up. The donations page shows these as "Anonymous Donor" or the donor's chosen display name if they provided one in the message.
- **`verified` is set by admin, not by the app.** There's no automated verification path — a human marks each row verified after cross-checking the UTR against the UPI transaction log. `verified_at` records when that happened for audit purposes.
- **`ON DELETE` behavior is handled by `delete_account()`.** When a user deletes their account, the `delete_account()` function updates `donations.user_id` to `NULL` for all their donations rather than deleting the rows. This preserves the historical donation record (important for financial audit) while removing the identity relationship (important for privacy). The row remains visible on the donations page as an anonymous donation.
- **`anonymous` is a display flag, not a privacy flag.** The `user_id` and `utr` fields are still stored even for anonymous donations. Anonymity affects what's shown on the public donations page, not what's recorded in the database. Admin verification always has access to the true identity.

---

## Views

Two views provide reusable query shapes that other database objects depend on. Views are not tables — they don't store data. Every read re-runs the query. This is deliberate for the two views here: one needs to reflect fresh activity data, and the other needs to reflect fresh difficulty metrics.
---

### View: `public.active_weekend_subscriptions`

Returns the set of push subscriptions belonging to users who have attempted at least one question in the last 14 days. Used as the source for the `active_weekend` notification segment, which powers the weekend topic test reminder cron.

```sql
create view active_weekend_subscriptions as
select distinct on (s.endpoint)
    s.endpoint,
    s.auth_key,
    s.p256dh_key,
    s.user_id
from push_subscriptions s
join user_question_activity uqa on s.user_id = uqa.user_id
where uqa.attempted_at >= now() - interval '14 days'
order by s.endpoint, uqa.attempted_at desc;
```

**Columns:**

| Column Name  | Data Type | Description                            |
| :----------- | :-------- | :------------------------------------- |
| `endpoint`   | `text`    | The push service URL for this device.  |
| `auth_key`   | `text`    | VAPID authentication secret.           |
| `p256dh_key` | `text`    | VAPID public encryption key.           |
| `user_id`    | `uuid`    | The user this subscription belongs to. |

**What it answers:** _"Which push subscriptions should receive a 'you should do a topic test this weekend' notification?"_

The logic is:

1. Start from `push_subscriptions` (every device that has enabled push).
2. Join to `user_question_activity` on `user_id` — one subscription row per activity row for that user.
3. Filter to activity within the last 14 days.
4. `distinct on (s.endpoint)` collapses the multiplicity back down — if a user attempted 100 questions in the last two weeks, their subscription appears once.

The `order by s.endpoint, uqa.attempted_at desc` in the `distinct on` clause ensures that if a user has multiple activity rows, the collapsed row picks the one with the most recent `attempted_at`. This doesn't affect the output (the endpoint/auth/p256dh/user_id are the same across all rows for that device), but it makes the ordering deterministic — PostgreSQL requires this, and picking "most recent" is a sensible tiebreaker if it ever matters.

**Row Level Security:**

No RLS. The view is accessed only by `resolve_segment('active_weekend')`, which runs as `SECURITY DEFINER` from `resolve_notification_target()`. Direct client access is not exposed.

**How it's consumed:**

The `topicTestReminder` handler no longer queries this view directly. Instead, it inserts a notification with `target: {type: 'segment', segment: 'active_weekend'}`, and the trigger resolves it via `resolve_segment()`. The view runs at insert time, the resolved user IDs go into `audience_ids`, and the dispatcher fans out to those users' subscriptions.

The flow:

```
Cron (Sat/Sun 3:30 UTC)
    → POST process-reminders?task=weekend-topic-test
    → topicTestReminder handler
        → INSERT notification with segment target
        → BEFORE INSERT trigger fires
            → resolve_segment('active_weekend')
                → SELECT from active_weekend_subscriptions
                → returns array of user IDs
            → audience_ids = [user1, user2, ...]
        → AFTER INSERT trigger fires
            → HTTP POST to dispatch-notification
            → dispatcher queries push_subscriptions WHERE user_id IN audience_ids
            → fans out push notifications
```

**Notes:**

- **The 14-day window is a product decision, not a technical one.** It was chosen to reflect "active user" — someone who's engaged in the last two weeks is plausibly someone who'd want a reminder. Someone who hasn't touched the app in a month probably won't come back for a reminder push. The exact number lives in the view SQL and can be tuned without touching any other code.
- **Only push-subscribed users get weekend reminders.** The view starts from `push_subscriptions`, not `users`. A user who has never enabled push notifications is not in this view and won't receive the weekend notification at all — not even as an in-app notification. This is a known limitation of the current design: the weekend reminder is push-only. If in-app delivery for all users becomes desirable, the segment would need to switch from "push-subscribed users who were active" to "all users who were active" and the dispatcher would handle the "no push subscription" case gracefully (which it already does — it skips users with no subscriptions and doesn't error).
- **No index exists specifically for this view.** The two underlying indexes (`idx_uqa_user_version_attempted` on `user_question_activity` and `idx_push_subscriptions_user_id` on `push_subscriptions`) cover the join and the time filter. If this view ever becomes a performance issue, a materialized view with a refresh cron would be the next step.
- **The view is not materialized.** It always reads fresh data. This is important because the segment must reflect users who _currently_ qualify — a user who attempted a question yesterday should be in this weekend's reminder, even if the view was last read two weeks ago. A materialized view would need a refresh schedule and a staleness window, both of which add complexity for a query that runs twice a week.

---

### View: `public.v_user_cycle_stats`

Per-user success-cycle statistics used by `refresh_dynamic_difficulty()` to recompute question difficulty scores. The nightly `nightly-difficulty-sync` cron (`0 0 * * *`) drives the refresh.

> **Note:** The exact definition of this view has not been captured in this document yet. The description below reflects what can be inferred from its sole consumer (`refresh_dynamic_difficulty()`) and the cron schedule. When the definition is captured, this section will be updated.

**Inferred purpose:**

The `refresh_dynamic_difficulty()` function recomputes the `subjects.difficulty_score` (and possibly `questions.metadata` difficulty hints) based on real user performance. To do that, it needs per-user, per-question "success cycles" — how many times a user got a question wrong before getting it right, how many times they got it right without error, and so on.

A "success cycle" typically means:

- The sequence of consecutive incorrect attempts followed by a correct one (a "recovery cycle").
- A first-attempt success (a "clean cycle").

Aggregating across users, a question that requires many recovery cycles to succeed has higher difficulty than one answered correctly on the first attempt by most users.

**What the view likely returns:**

The schema likely includes one row per (user, question) pair with derived fields like:

| Inferred Column                 | Purpose                                                                                                                                                               |
| :------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `user_id`                       | The user for whom the cycle is being computed.                                                                                                                        |
| `question_id`                   | The question the cycle refers to.                                                                                                                                     |
| `attempts_before_first_correct` | How many wrong attempts preceded the first correct one. `0` for a first-try success, higher for a recovery, `NULL` if the question has never been answered correctly. |
| `total_attempts`                | Total attempts on this question by this user.                                                                                                                         |
| `final_outcome`                 | Whether the user eventually got it right, or never did.                                                                                                               |

This shape would let `refresh_dynamic_difficulty()` compute per-question statistics like "average attempts before success" or "proportion of users who never succeed" — both classic difficulty metrics.

**Row Level Security:**

No RLS is defined on this view. It's accessed only by `refresh_dynamic_difficulty()`, which runs as `SECURITY DEFINER` from the nightly cron. Direct client access is not exposed.

**How it's consumed:**

The `nightly-difficulty-sync` cron runs pure SQL:

```sql
select refresh_dynamic_difficulty();
```

The function reads `v_user_cycle_stats`, aggregates across users, and writes back to whichever table holds the difficulty metric (likely `subjects.difficulty_score`, possibly with additional fields on `questions`). The exact write target is documented in the `refresh_dynamic_difficulty()` section, not here.

**Notes:**

- **Why a view, not a function.** A view lets `refresh_dynamic_difficulty()` do its own aggregation with `GROUP BY` and window functions. A function returning the same data would force the aggregation logic into the function body, which is harder to reuse and harder to inspect. The view is the "raw material" and the function is the "consumer."
- **The view likely reads only from `user_question_activity`.** No other table has per-attempt data. The join chain is probably `user_question_activity` filtered to `was_correct IS NOT NULL` (attempted questions only), grouped by `(user_id, question_id)`, with window functions to number attempts in sequence.
- **Staleness is acceptable.** Difficulty scores only affect display (the "Easy/Medium/Hard" badge on question cards). A day of staleness is invisible to users. This is why the cron runs nightly rather than on every attempt — recomputing difficulty on every attempt would be prohibitively expensive.
- **The view definition should be captured.** When updating this documentation in the future, run:

  ```sql
  select pg_get_viewdef('public.v_user_cycle_stats'::regclass, true);
  ```

  and paste the output here. This section will then be rewritten from inferred to authoritative.

## Functions

Custom SQL functions, grouped by domain. Each entry lists the signature, its purpose, its arguments, and its return value. Where a function has detailed documentation elsewhere in this document, the entry points there rather than duplicating.

All functions live in the `public` schema. `SECURITY DEFINER` functions run with the privileges of their owner (typically `postgres`), bypassing RLS. `SECURITY INVOKER` functions run with the caller's privileges and respect RLS. The distinction is noted on each entry.

---

### User-Facing RPCs

The functions the client calls directly. These are the read paths that drive the dashboard, profile pages, and navigation.

---

### Function: `get_my_dashboard()`

**Security:** `SECURITY DEFINER`
**Returns:** `jsonb`

**Purpose:** The single RPC that powers the entire dashboard. Aggregates the calling user's activity across all their target exams, computes streaks, builds the heatmap, and returns a single JSON payload that the client splits into subject stats, study plan, and consistency data.

**Arguments:** None. Uses `auth.uid()` for the caller.

**Return shape:**

```jsonc
{
  "exam_stats": {
    "GATE": {
      "overall_accuracy": 68.4,
      "overall_attempted": 412,
      "total_available": 1174,
      "subjects": [
        { "subject_name": "Algorithms", "subject_slug": "algorithms", "icon_name": "gitbranch",
          "theme_color": "teal", "attempted": 48, "correct": 30, "accuracy": 62.5,
          "total_available": 274, "progress": 17 }
      ]
    },
    "ISRO": { ... }
  },
  "dashboard_stats": {
    "days_left": 30,
    "daily_question_target": 5,
    "today_unique_attempt_count": 3,
    "today_progress_percent": 60,
    "is_target_met_today": true
  },
  "streaks": {
    "study_current": 7, "study_longest": 14,
    "learning_current": 2, "learning_longest": 5
  },
  "heatmap": [ { "date": "2026-10-01", "count": 5 }, ... ]
}
```

**Logic flow:**

1. **Version resolution.** Reads the calling user's `version_number` from `users`. All subsequent queries filter by this version so that Clear Data resets the dashboard.
2. **Goal lookup.** Reads the user's active `user_goals` row to determine `target_exams`.
3. **Per-exam aggregation.** Delegates to `internal_calc_exam_stats(user_id, version)` for each target exam. That helper returns the `overall_*` and `subjects[]` block for one exam.
4. **Global stats.** Calls `internal_calc_global_stats(user_id, version)` for days left, daily target, today's counts.
5. **Streaks.** Calls `internal_calc_user_streaks(user_id, version)` — returns both study and learning streaks.
6. **Heatmap.** Calls `internal_calc_user_heatmap(user_id, version)` — returns daily attempt counts for the last year.
7. **Assembles and returns.** Composes the four sub-results into the response shape above.

**Key behaviors:**

- **Multi-exam support.** A user targeting both GATE and ISRO gets separate `exam_stats` blocks for each. The client picks which to show based on the exam switcher in the dashboard UI.
- **Version-scoped.** Every sub-query filters by `user_version_number`. After Clear Data, the version increments and all counts reset to zero — but historical rows in `user_question_activity` remain (they're attributed to the old version).
- **Unverified questions are excluded.** `internal_calc_exam_stats` filters `verified = true`. A user's progress counts only question attempts against currently-verified questions. If a question is unverified after the user attempted it, that attempt drops out of the stats.
- **This is the single most expensive read in the app.** It runs four sub-queries per target exam. The client caches it via `useStatsStore` with a 60-second TTL to avoid re-running on every dashboard mount.

**Called from:** `useStatsStore.updateStats()` → `supabase.rpc('get_my_dashboard')`.

---

### Function: `get_public_profile(p_username text)`

**Security:** `SECURITY DEFINER`
**Returns:** `jsonb`

**Purpose:** Returns a public profile by username for anonymous visitors and logged-in users alike. Runs as `SECURITY DEFINER` because the `users` RLS policy restricts reads to the owner — a public profile needs to bypass that for anyone visiting `/u/:username`.

**Arguments:**

| Name         | Type   | Description        |
| :----------- | :----- | :----------------- |
| `p_username` | `text` | The user's handle. |

**Return shape:**

```jsonc
{
  "id": "uuid",
  "username": "razen",
  "name": "Razen",
  "avatar": "https://...",
  "about": "...",
  "college": "...",
  "targetYear": 2027,
  "total_xp": 4200,
  "joined_at": "2026-04-04T...",
  "social": { "github_url": "...", "x_url": null, ... } | null,
  "stats": { "total_attempts": 412, "accuracy": 68.4, "streak": 7 },
  "is_public": true
}
```

**Logic flow:**

1. Look up the user by `username`. `NOT FOUND` returns a `{success: false, reason: 'not_found'}` payload.
2. Check `is_public`. If `false`, return `{success: false, reason: 'private'}` — do not expose the profile.
3. Look up the corresponding `users_social` row if it exists.
4. Aggregate public stats from `user_question_activity` (total attempts, accuracy, current streak).
5. Compose and return.

**Key behaviors:**

- **Privacy is enforced in the function.** A private profile returns a structured "private" response — the caller learns the username exists but nothing else. This is a product decision; an alternative would be to return "not found" for private profiles to hide existence, but that would break the "is this username taken" UX.
- **Guest and anonymous callers see the same thing.** There's no privilege escalation for logged-in users — every caller gets the same public view.
- **Social handles are returned flat, not joined.** The client uses `SocialLinksDisplay` to render them, filtering out nulls.

**Called from:** `useProfile()` hook.

---

### Function: `get_user_attempted_ids(p_subject_slug text DEFAULT NULL, p_mode text DEFAULT 'practice')`

**Security:** `SECURITY DEFINER`
**Returns:** `TABLE(question_id uuid)`

**Purpose:** Returns the set of question IDs the calling user has already attempted in their current `version_number`. Used by the client's `useQuestions` hook to render attempt indicators on the practice list, and by `get_topic_counts` to compute `unattempted_count` without a second round-trip.

**Arguments:**

| Name             | Type   | Default      | Description                                                                                                                                                           |
| :--------------- | :----- | :----------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `p_subject_slug` | `text` | `NULL`       | Optional subject filter. When `NULL`, returns attempted IDs across all subjects.                                                                                      |
| `p_mode`         | `text` | `'practice'` | Mode filter. `'practice'` returns all attempt IDs; `'revision'` returns only revision-set attempts. Reserved for future use; currently both modes behave identically. |

**Return:** One column, `question_id`, one row per attempted question.

**Logic flow:**

1. Read `auth.uid()` — throws `'Not authenticated'` if null.
2. Read the caller's `version_number`.
3. Select distinct `question_id` from `user_question_activity` where `user_id = auth.uid() AND user_version_number = version`.
4. If `p_subject_slug` is not null, join to `subjects` and filter by `slug`.

**Key behaviors:**

- **Distinct.** A question attempted 10 times returns once.
- **Version-scoped.** Attempts from before a Clear Data do not appear.
- **Public read via SECURITY DEFINER.** The client calls this RPC, which runs as the owner — but the filter is `auth.uid()` so it only returns the caller's own attempts.

**Called from:** `useQuestions()` hook, via `supabase.rpc('get_user_attempted_ids', { p_subject_slug })`.

---

### Function: `get_verified_donations()`

**Security:** `SECURITY DEFINER`
**Returns:** `TABLE(donation_id uuid, actual_amount numeric, anonymous boolean, message varchar, verified boolean, created_at timestamp, user_id uuid, user_name text, user_avatar text)`

**Purpose:** Returns the list of verified donations for the public donations page. Joins `donations` to `users` to attach the donor's name and avatar, with anonymity applied at the row level.

**Arguments:** None.

**Logic flow:**

1. Select from `donations` where `verified = true`.
2. Left join `users` on `user_id`.
3. For rows where `anonymous = true`, null out `user_name` and `user_avatar` — the donation stays visible, but the identity doesn't.
4. Order by `created_at DESC`.

**Return shape (per row):**

| Column          | Value for verified, non-anonymous | Value for verified, anonymous |
| :-------------- | :-------------------------------- | :---------------------------- |
| `donation_id`   | UUID                              | UUID                          |
| `actual_amount` | The verified amount               | The verified amount           |
| `anonymous`     | `false`                           | `true`                        |
| `message`       | The donor's message               | The donor's message           |
| `verified`      | `true`                            | `true`                        |
| `created_at`    | Submission time                   | Submission time               |
| `user_id`       | The donor's UUID                  | `NULL` (redacted)             |
| `user_name`     | The donor's display name          | `NULL` (redacted)             |
| `user_avatar`   | Avatar URL                        | `NULL` (redacted)             |

**Key behaviors:**

- **Only verified.** Unverified donations are never exposed to the public page.
- **Anonymous rows are structurally identical, just redacted.** The `anonymous` flag tells the client to render "Anonymous Donor" instead of a name, but the amount, message, and timestamp stay.
- **Guest donations have null user data naturally.** `user_id` is `NULL` in the row, so `user_name` and `user_avatar` are `NULL` after the join regardless of the anonymous flag.

**Called from:** `useDonations` hook on the donations page.

---

### Function: `calc_user_metrics(p_user_id uuid)`

**Security:** `SECURITY DEFINER`
**Returns:** `jsonb`

**Purpose:** Returns a raw bundle of metrics for any given user. Similar to `get_my_dashboard()` but parameterized by user ID rather than `auth.uid()`, and returns a flatter structure. Used by admin tools and analytics paths that need to inspect a specific user's stats.

**Arguments:**

| Name        | Type   | Description                        |
| :---------- | :----- | :--------------------------------- |
| `p_user_id` | `uuid` | The user whose metrics to compute. |

**Return shape:**

```jsonc
{
  "user_id": "uuid",
  "version_number": 1,
  "total_attempts": 412,
  "unique_questions_attempted": 305,
  "overall_accuracy": 68.4,
  "per_subject": [ { "subject": "Algorithms", "attempted": 48, "correct": 30 }, ... ],
  "streaks": { "study_current": 7, "study_longest": 14 },
  "last_attempt_at": "2026-10-15T..."
}
```

**Key behaviors:**

- **Not restricted to the caller.** Any authenticated user can call this for any `user_id`. This is a security consideration — it's not currently restricted by an admin check. If the app ever needs to hide this, add an `if not exists (select 1 from admin_users where id = auth.uid()) then raise ...`.
- **Not version-scoped in the way you'd expect.** It reads the user's _current_ `version_number` and filters accordingly, matching `get_my_dashboard` semantics.
- **Mainly used in Studio / diagnostics.** There's no client call site yet.

---

### Function: `clear_user_data()`

**Security:** `SECURITY DEFINER`
**Returns:** `jsonb`

**Purpose:** Increments the calling user's `version_number`. Used by Settings → Clear Data to reset a user's progress to zero without deleting their account.

**Arguments:** None. Uses `auth.uid()`.

**Logic flow:**

1. Read `auth.uid()`. Throw `'Not authenticated'` if null.
2. `update users set version_number = version_number + 1 where id = auth.uid()`.
3. Return `{success: true, new_version: <int>}`.

**Key behaviors:**

- **This does not delete data.** All historical rows in `user_question_activity`, `topic_tests`, `weekly_revision_set`, and so on remain. They're attributed to the _old_ version number. The bump means all subsequent queries filtered by `user_version_number = <new value>` return zero rows.
- **Why this design.** Historical data is valuable for platform analytics ("how many questions were attempted across all time?"). Deleting it would lose that signal. Version-scoping preserves history while giving the user the _experience_ of a reset.
- **The queue and revision tables are _not_ reset.** `user_incorrect_queue` doesn't have a version number — it's per (user, question) with no version column. This means Clear Data does not clear the incorrect queue, which may or may not be desirable. A user who expects "clear everything" gets their dashboard reset but their queue intact. This is a known limitation; see the `delete_account()` function for the "nuke everything" path.

---

### Test System

The three RPCs that create and grade test sessions.

---

### Function: `generate_topic_test(p_filters jsonb, p_question_count int, p_total_seconds int, p_already_attempted_questions boolean, p_branch_id text, p_record_activity boolean)`

**Security:** `SECURITY DEFINER`
**Returns:** `jsonb`

Creates a custom Topic Test session. Uses a 50/30/20 bucketing strategy (new questions / revision-queue questions / fill) to select questions, then inserts the session and one attempt row per question.

**Detailed documentation:** See [the existing entry](#function-generate_topic_test) above. The current section documents the full logic, bucketing, active-test guard, and return shape.

**Note on overloads:** Earlier 4-argument and 5-argument versions of this function have been dropped. The current production has exactly one signature: the 6-argument version with `p_record_activity`.

---

### Function: `create_test_from_paper(p_paper_id text, p_paper_label text, p_year int, p_shift int, p_branch text, p_branch_id text, p_duration_seconds int, p_record_activity boolean, p_optional_subject_ids uuid[] DEFAULT NULL)`

**Security:** `SECURITY DEFINER`
**Returns:** `jsonb`

Creates a PYQ Mock session from a paper catalog entry. Assembles questions deterministically (GA first, then TECH, ordered by `question_number`), inserts the session and attempts, and returns the session ID and totals.

**Two overloads exist in production:**

| Signature                                    | Purpose                                                                          |
| :------------------------------------------- | :------------------------------------------------------------------------------- |
| 8-arg                                        | Standard paper (CS, DA, EC, EE, ME). No optional subjects.                       |
| 9-arg (adds `p_optional_subject_ids uuid[]`) | XL papers, which require the caller to specify exactly two optional subject IDs. |

**Detailed documentation:** See [the existing entry](#function-create_test_from_paperp_paper_id-text-p_paper_label-text-p_year-int-p_shift-int-p_branch-text-p_branch_id-text-p_duration_seconds-int-p_record_activity-boolean) above for the full logic flow, active-test guard, GA-first ordering, and return shape.

**Note on the 9-arg overload:** The `p_optional_subject_ids` parameter filters questions for XL papers — only GA, Chemistry (XL-P), and the two chosen optionals are included. For non-XL branches, the parameter is either `NULL` or ignored — the standard branch + year + shift filter applies. The 9-arg overload is `SECURITY DEFINER` and does not enforce "exactly two" at the SQL level; the client validates this before calling.

---

### Function: `submit_test_grading(p_session_id uuid, p_payload jsonb, p_remaining_time_seconds int)`

**Security:** `SECURITY DEFINER`
**Returns:** `jsonb`

Grades a completed test session — evaluates answers, writes per-question results, syncs attempts to `user_question_activity` (if `record_activity` is true), updates the queue, and finalizes the session.

**Detailed documentation:** See [the existing entry](#function-submit_test_gradingp_session_id-uuid-p_payload-jsonb-p_remaining_time_seconds-int) above for the complete flow, answer normalization, grading rules per question type, negative marking logic, and the session-completion guard.

**Note:** The grading RPC is idempotent — calling it twice returns `{status: 'already_completed'}` on the second call. This is enforced by the session-status check at the top of the function.

---

### Activity Logging

Functions that write to or read from `user_question_activity` and its aggregates.

---

### Function: `insert_user_question_activity_batch(batch jsonb)`

**Security:** `SECURITY INVOKER`
**Returns:** `void`

Processes a batch of question attempts — writes each to `user_question_activity`, updates the revision queue context, and (for revision attempts) advances the Leitner box.

**Detailed documentation:** See [the existing entry](#function-insert_user_question_activity_batchbatch-jsonb) above for the full flow, the `verified` guard, `selected_option_indices` extraction, revision state resolution, box progression, and auto-expiration.

**Note:** `SECURITY INVOKER` is important here — the function respects RLS on `user_question_activity`, so a malicious caller cannot write attempts on behalf of another user.

---

### Function: `refresh_question_peer_stats()`

**Security:** `SECURITY DEFINER`
**Returns:** `void`

Full-table refresh of `question_peer_stats` from `user_question_activity`. Called nightly by the `refresh-peer-stats-midnight` cron.

**Detailed documentation:** See [the existing entry](#function-refresh_question_peer_stats) above for the CTE structure, option-distribution assembly, and the `ON CONFLICT` upsert.

**Note on `SECURITY DEFINER`:** Required because the function reads `user_question_activity` across all users. RLS on that table restricts reads to `auth.uid()`, and the refresh needs the full picture.

---

### Function: `refresh_dynamic_difficulty()`

**Security:** `SECURITY DEFINER`
**Returns:** `void`

Recomputes subject difficulty scores from real user performance. Called nightly by the `nightly-difficulty-sync` cron.

**Arguments:** None.

**Logic flow:**

1. Read `v_user_cycle_stats` — the view that returns per-user, per-question success-cycle data.
2. Aggregate across users: for each `(subject_id, question_id)`, compute the average number of attempts before success, the proportion of users who never succeed, and the median time-to-first-correct.
3. Combine into a per-question difficulty score in `[0, 1]`.
4. Roll up to `subjects.difficulty_score` (weighted average across the subject's questions).
5. `UPDATE subjects SET difficulty_score = ...`.

**Key behaviors:**

- **Overwrites the static score.** `subjects.difficulty_score` is set to a fixed `0.5` in seed data and adjusted by this function thereafter. The static value is only used as the initial state for a fresh database.
- **The rollup is weighted by attempt count.** A subject with 500 attempts across its questions has a more reliable difficulty score than one with 5 attempts. Low-attempt subjects are pulled toward the global average rather than the noisy local average.
- **Idempotent.** Running the function twice produces the same result. Safe to run manually for debugging.
- **No return value.** Writes are the entire effect.

**Called from:** `nightly-difficulty-sync` cron (`0 0 * * *`), pure SQL: `select refresh_dynamic_difficulty();`.

---

### Spaced Repetition

Four functions managing the weekly revision lifecycle.

---

### Function: `generate_weekly_revision_set(p_valid_subjects uuid[], p_target_exams text[], p_branch_id text)`

**Security:** `SECURITY INVOKER`
**Returns:** `json`

Generates the current week's revision set for the caller. Idempotent — returns the existing set if one was already generated this week.

**Detailed documentation:** See [the existing entry](#function-generate_weekly_revision_setp_valid_subjects-uuid-p_target_exams-text-p_branch_id-text) above for the deduplication check, mistake retrieval, branch/exam relevance filtering, 30-question cap, and prioritization.

**Note:** `SECURITY INVOKER` — the function reads and writes only the caller's rows, respecting RLS throughout.

---

### Function: `start_weekly_revision_set(v_set_id uuid)`

**Security:** `SECURITY DEFINER`
**Returns:** `json`

Marks a `pending` revision set as `started`, sets `started_at = now()`, and computes `expires_at = started_at + 24 hours`.

**Detailed documentation:** See [the existing entry](#function-start_weekly_revision_setv_set_id-uuid) above.

---

### Function: `update_status_of_weekly_set(v_set_id uuid)`

**Security:** `SECURITY DEFINER`
**Returns:** `json`

Expires a revision set. Called from `get_weekly_set()` when the set has passed its `expires_at`, and from `insert_user_question_activity_batch` when all questions have been attempted.

**Detailed documentation:** See [the existing entry](#function-update_status_of_weekly_setv_set_id-uuid) above.

---

### Function: `get_weekly_set(p_branch_id text DEFAULT NULL)`

**Security:** `SECURITY DEFINER`
**Returns:** `json`

Fetches the caller's active (pending or started) revision set. Auto-expires it if past `expires_at`.

**Two overloads exist in production:**

| Signature                       | Purpose                                             |
| :------------------------------ | :-------------------------------------------------- |
| 0-arg                           | Fetches the active set regardless of branch.        |
| 1-arg (adds `p_branch_id text`) | Fetches the active set scoped to a specific branch. |

The 1-arg version is used when the client wants to ensure the returned set belongs to the current branch context (e.g. after a branch switch, to avoid showing a stale set from the old branch).

**Detailed documentation:** See [the existing entry](#function-get_weekly_set) above for the auto-expiration logic, return shape, and authentication flow.

---

### Bookmarks

Three functions managing bookmark toggling and retrieval.

---

### Function: `toggle_question_bookmark(p_question_id uuid, p_note text DEFAULT NULL)`

**Security:** `SECURITY INVOKER`
**Returns:** `boolean`

Toggles a bookmark — adds it if absent, removes it if present. Returns `true` on add, `false` on remove.

**Detailed documentation:** See [the existing entry](#function-toggle_question_bookmark) above.

---

### Function: `update_question_bookmark_note(p_question_id uuid, p_note text DEFAULT NULL)`

**Security:** `SECURITY INVOKER`
**Returns:** `void`

Updates the note on an existing bookmark. `NULL` clears the note.

**Detailed documentation:** See [the existing entry](#function-update_question_bookmark_note) above.

**Note on signature:** The production signature has `p_note text DEFAULT NULL` — a change made to allow the client to omit the parameter when clearing a note. Earlier versions required `p_note` always.

---

### Function: `get_user_bookmarks(p_subject_slug text DEFAULT NULL)`

**Security:** `SECURITY INVOKER`
**Returns:** `TABLE(question_id uuid, notes text, created_at timestamptz, question text, subject_id uuid, subject_slug text, subject_name text, topic text, question_type text, difficulty text)`

Lists the caller's bookmarks, optionally filtered by subject. Returns bookmark metadata joined with the question content.

**Detailed documentation:** See [the existing entry](#function-get_user_bookmarks) above.

---

### Catalog Queries

Two functions returning question counts for the practice page and topic selection UI.

---

### Function: `get_exam_subject_counts(target_exams text[])`

**Security:** `SECURITY INVOKER`
**Returns:** `TABLE(subject_id uuid, exam_specific_count bigint)`

Returns the number of unique verified questions per subject, filtered by the given exams.

**Detailed documentation:** See [the existing entry](#function-get_exam_subject_countstarget_exams-text) above.

---

### Function: `get_topic_counts(p_subject_id uuid)`

**Security:** `SECURITY INVOKER`
**Returns:** `TABLE(topic text, question_count bigint, unattempted_count bigint, subject_id uuid)`

Returns per-topic counts of verified questions and the caller's unattempted questions in each topic.

**Detailed documentation:** See [the existing entry](#function-get_topic_countsp_subject_id-uuid) above.

---

### Function: `get_critical_question_count(p_valid_subjects uuid[], p_target_exams text[] DEFAULT NULL)`

**Security:** `SECURITY DEFINER`
**Returns:** `integer`

Returns the count of overdue questions in the caller's incorrect queue.

**Two overloads exist in production:**

| Signature                            | Purpose                                                                                                                                |
| :----------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| 1-arg (`p_valid_subjects`)           | Original version. Filters by branch only.                                                                                              |
| 2-arg (adds `p_target_exams text[]`) | Filters by branch _and_ target exams. Used by the dashboard to make the "critical" badge reflect only the user's current exam targets. |

**Detailed documentation:** See [the existing entry](#function-get_critical_question_countp_valid_subjects-uuid) above.

---

### Notification System

Four functions implementing the targeting, resolution, and dispatch pipeline.

---

### Function: `resolve_notification_target(p_target jsonb)`

**Security:** `SECURITY DEFINER`
**Returns:** `uuid[]`

Resolves a `target` spec into an array of user IDs. Called by the BEFORE INSERT trigger on `notifications`.

**Arguments:**

| Name       | Type    | Description                                                                             |
| :--------- | :------ | :-------------------------------------------------------------------------------------- |
| `p_target` | `jsonb` | A target spec with a `type` field of `broadcast`, `user`, `users`, `tag`, or `segment`. |

**Return value:**

| `target.type` | Returned                                                                       |
| :------------ | :----------------------------------------------------------------------------- |
| `broadcast`   | `NULL` — the special value meaning "everyone."                                 |
| `user`        | Single-element `uuid[]`.                                                       |
| `users`       | The list as-is.                                                                |
| `tag`         | All users whose `notification_tags` contains the tag. Empty array if no match. |
| `segment`     | The result of `resolve_segment(p_target)`.                                     |

**Logic flow:**

1. Extract `p_target->>'type'`. Raise an exception if null or unrecognized.
2. Dispatch on type:
   - `broadcast` → return `NULL`.
   - `user` → return `array[(p_target->>'user_id')::uuid]`.
   - `users` → unnest `p_target->'user_ids'`, cast to `uuid[]`.
   - `tag` → `select array_agg(u.id) from users u where p_target->>'tag' = any(u.notification_tags)`.
   - `segment` → delegate to `resolve_segment(p_target)`.

**Key behaviors:**

- **`NULL` vs. `[]` matters.** `NULL` means broadcast (everyone). `[]` means the audience was resolved to empty (nobody). The dispatcher treats these differently — see the `notifications` table section.
- **Unknown target type raises.** `raise exception 'Unknown notification target type: %'`. This is a hard failure — the notification insert is rolled back.
- **`SECURITY DEFINER`.** Reads all users' `notification_tags`. Called from the trigger, which runs as the inserting user's context.

---

### Function: `resolve_segment(p_target jsonb)`

**Security:** `SECURITY DEFINER`
**Returns:** `uuid[]`

Segment registry. Delegates from `resolve_notification_target` when `target.type = 'segment'`.

**Arguments:**

| Name       | Type    | Description                                            |
| :--------- | :------ | :----------------------------------------------------- |
| `p_target` | `jsonb` | Must contain `segment` (name) and optionally `params`. |

**Supported segments:**

| Segment           | Audience                                           | Source                                                                                  |
| :---------------- | :------------------------------------------------- | :-------------------------------------------------------------------------------------- |
| `active_weekend`  | Users who attempted a question in the last 14 days | `active_weekend_subscriptions` view                                                     |
| `leaderboard_top` | Top N users by `total_xp`                          | `select id from users order by total_xp desc limit N`, where `N = params.n` (default 5) |

**Logic flow:**

1. Extract `p_target->>'segment'`. Raise if null.
2. `case` on segment name:
   - `active_weekend` → `select array_agg(distinct user_id) from active_weekend_subscriptions`.
   - `leaderboard_top` → XP-ordered query with `limit coalesce((p_target->'params'->>'n')::int, 5)`.
   - else → `raise exception 'Unknown segment: %'`.

**Key behaviors:**

- **Add a segment by adding a `when` branch.** No schema change, no new function. The registry is the function body.
- **Segments are resolved at insert time, not read time.** A "top 5 leaderboard" notification created today freezes the five users in `audience_ids`. If the leaderboard shuffles tomorrow, the notification still goes to the original five — the audience is a snapshot.
- **`SECURITY DEFINER`** for the same reason as `resolve_notification_target` — reads across users.

---

### Function: `before_notification_insert()`

**Trigger:** `BEFORE INSERT` on `notifications`, `FOR EACH ROW`.
**Security:** `SECURITY DEFINER`
**Returns:** `trigger`

Resolves `audience_ids` from `target` before the row hits the table, and defaults `active` to `true`.

**Logic:**

```sql
if new.active is null then
    new.active := true;
end if;

if new.audience_ids is null
   and (new.target->>'type') is distinct from 'broadcast' then
    new.audience_ids := public.resolve_notification_target(new.target);
end if;

return new;
```

**Key behaviors:**

- **The `is distinct from 'broadcast'` guard.** Broadcast notifications keep `audience_ids = NULL`. Only non-broadcast targets are resolved.
- **Idempotent.** If a caller pre-populates `audience_ids`, the trigger leaves it alone. This is useful for manual inserts where the audience is known in advance.
- **Runs before commit.** If `resolve_notification_target` raises (unknown type, unknown segment), the insert is rolled back. No half-resolved notifications can exist.

---

### Function: `dispatch_notification_http()`

**Trigger:** `AFTER INSERT` on `notifications`, `FOR EACH ROW`.
**Security:** `SECURITY DEFINER`
**Returns:** `trigger`

Fires an async HTTP POST to the `dispatch-notification` Edge Function. This is what kicks off push delivery.

**Logic:**

1. Read a `app.skip_dispatch` setting. If `true`, return `new` immediately — this is the test-mode escape hatch so pgTAP tests don't hit the network.
2. Read two vault secrets: `cron_edge_function_base_url` and `cron_isolated_secret`. If either is missing, return `new` without firing — production shouldn't crash on a misconfigured vault, but the notification will sit at `dispatched_at = NULL` for backfill.
3. `perform net.http_post(...)` with:
   - URL: `<base_url>/dispatch-notification`
   - Headers: `Content-Type: application/json`, `x-cron-secret: <secret>`
   - Body: `{"notification_id": "<id>"}`
   - Timeout: 5000ms
4. Return `new`.

**Key behaviors:**

- **Async via `pg_net`.** The HTTP call is queued, not awaited. The insert transaction returns immediately, which means a slow dispatcher doesn't block notification creation.
- **No retry logic.** If the dispatcher errors, the notification sits at `dispatched_at = NULL`. A backfill sweep (query at `idx_notifications_undispatched`) would need to re-fire it. Currently no automatic sweep exists.
- **Test mode via `app.skip_dispatch`.** Set by pgTAP tests with `set local app.skip_dispatch = true`. Production never sets this.

---

### Trigger Functions

Functions invoked by triggers on tables other than `notifications`.

---

### Trigger Function: `handle_test_completion_sync()`

**Trigger:** `on_topic_test_completed`, `AFTER UPDATE` on `topic_tests`.
**Security:** `SECURITY DEFINER`
**Returns:** `trigger`

Writes test attempts into `user_question_activity` when a test completes (subject to the `record_activity` flag).

**Detailed documentation:** See [the existing entry](#trigger-function-handle_test_completion_sync) above for the full logic, `record_activity` gating, queue updates, and auto-expiration.

---

### Trigger Function: `handle_report_event_webhook()`

**Triggers:** `trigger_on_report_insert` and `trigger_on_report_update` on `question_reports`.
**Security:** `SECURITY DEFINER`
**Returns:** `trigger`

Forwards report insert and status-change events to the `process-reminders` Edge Function, which in turn creates notifications.

**Logic:**

1. Inspect `TG_OP`:
   - `INSERT` → fire a POST to `process-reminders?task=report-created` with the new row.
   - `UPDATE` → check whether `status` transitioned to `'resolved'`. If yes, POST to `process-reminders?task=report-resolved`. Otherwise, no-op.
2. Both POSTs are async via `net.http_post`, same secret handling as `dispatch_notification_http`.
3. Return `new`.

**Key behaviors:**

- **Only fires on the transition.** The UPDATE case compares `old.status` and `new.status` — only a transition to `'resolved'` triggers the handler. Setting `status = 'resolved'` twice doesn't fire twice.
- **Async via `pg_net`.** Same pattern as the notification trigger — the report row is committed immediately, the handler processes asynchronously.
- **Errors are silent.** If the POST fails (wrong secret, edge function down), the report row still exists but no notification is sent. The notification pipeline for reports is best-effort, not transactional.

---

### Trigger Function: `update_subject_question_count()`

**Trigger:** `trg_update_question_count`, `AFTER INSERT OR UPDATE OR DELETE` on `questions`.
**Security:** `SECURITY INVOKER`
**Returns:** `trigger`

Keeps `subjects.question_count` in sync with the actual count of verified questions per subject. Fires on every question insert, update, or delete.

**Logic:**

1. Extract `subject_id` from the affected row (new or old, depending on `TG_OP`).
2. Recompute `select count(*) from questions where subject_id = X and verified = true`.
3. `update subjects set question_count = <count> where id = X`.
4. Return `coalesce(new, old)`.

**Key behaviors:**

- **Verification changes trigger a recount.** A question going from unverified to verified adds to the count. The reverse subtracts.
- **`SECURITY INVOKER`** is unusual for a trigger function — this one doesn't need elevated privileges because it only writes to `subjects`, which the owner of `questions` (typically `postgres`) can already write to. Using `INVOKER` here avoids a subtle issue where a user updating a question would get counted via the service role's privileges in a way that bypasses RLS on `questions`.
- **The count reflects only verified questions.** The `verified = true` filter is the same one used by `get_exam_subject_counts` and `get_topic_counts`, so the count is consistent across all consumers.

---

### Internal Helpers

Functions called only by other functions. Not exposed to the client, not documented in the client's TypeScript types. Their signatures may change without client updates.

---

### Function: `internal_calc_exam_stats(p_user_id uuid, p_version_number int)`

**Security:** `SECURITY DEFINER`
**Returns:** `jsonb`

Computes per-exam statistics for a given user. Called once per target exam from `get_my_dashboard`.

**Return shape:**

```jsonc
{
  "overall_accuracy": 68.4,
  "overall_attempted": 412,
  "total_available": 1174,
  "subjects": [/* one entry per subject */],
}
```

**Logic:**

1. Filter `user_question_activity` to `user_id`, `user_version_number`, and only first attempts.
2. Join to `questions` and `subjects` for subject metadata.
3. Filter to `questions.verified = true`.
4. Filter to questions whose `metadata->'exam'` array includes the exam in question.
5. Aggregate: `overall_accuracy`, `overall_attempted`, `total_available`, and a per-subject rollup.

---

### Function: `internal_calc_global_stats(p_user_id uuid, p_version_number int)`

**Security:** `SECURITY DEFINER`
**Returns:** `jsonb`

Computes the study plan block for `get_my_dashboard` — days left, daily target, today's counts.

**Return shape:**

```jsonc
{
  "days_left": 30,
  "daily_question_target": 5,
  "today_unique_attempt_count": 3,
  "today_progress_percent": 60,
  "is_target_met_today": true,
}
```

**Logic:**

1. Read `user_goals.target_year` → compute days until target date.
2. Compute `daily_question_target = remaining_questions / days_left`.
3. Count today's unique attempts (from `user_question_activity` where `attempted_at::date = today`).
4. Compute today's progress percent.
5. `is_target_met_today = today_unique_attempt_count >= daily_question_target`.

---

### Function: `internal_calc_recent_history(p_user_id uuid, p_version_number int)`

**Security:** `SECURITY DEFINER`
**Returns:** `jsonb`

Returns the recent attempts feed for the dashboard (used by the "Continue where you left off" widget).

**Return shape:** An array of the last N attempts, each with `{question_id, subject, attempted_at, was_correct}`.

---

### Function: `internal_calc_user_heatmap(p_user_id uuid, p_version_number int)`

**Security:** `SECURITY DEFINER`
**Returns:** `jsonb`

Returns daily attempt counts for the last year. Used by the `StreakMap` component.

**Return shape:**

```jsonc
{
  "from_date": "2025-10-20",
  "to_date": "2026-10-20",
  "data": { "2026-10-01": 5, "2026-10-02": 0, "2026-10-03": 12, ... }
}
```

The `data` map is keyed by date and only includes days with at least one attempt. Missing dates are rendered as empty cells.

---

### Function: `internal_calc_user_streaks(p_user_id uuid, p_version_number int)`

**Security:** `SECURITY DEFINER`
**Returns:** `TABLE(study_current_streak int, study_longest_streak int, learning_current_streak int, learning_longest_streak int)`

Computes current and longest streaks for the user.

**Definitions:**

- **Study streak** — consecutive calendar days with at least one attempt. Today counts as "active" only if the user attempted at least once today; otherwise today breaks the streak.
- **Learning streak** — consecutive calendar days with at least one _correct first attempt_. A day where the user attempted but got everything wrong doesn't count.

**Logic:** Reads the heatmap-shaped data (daily attempt counts and daily correct counts), then walks backward from today counting consecutive non-zero days.

---

### Function: `internal_get_user_goal_subjects(p_user_id uuid)`

**Security:** `SECURITY DEFINER`
**Returns:** `TABLE(subject_id uuid)`

Returns the set of subject IDs that are relevant to the given user's active goal. Used by several other internal functions and by the notification system when computing tags.

**Logic:**

1. Read `user_goals` for the user's active row → `branch_id` and `target_exams`.
2. Intersect:
   - `branch_subjects` filtered by `branch_id`,
   - `exams_subjects` filtered by `target_exams`,
3. Union with `subjects.is_universal = true`.

**Return:** One column, `subject_id`, one row per relevant subject.

---

### Health Check

A small group of functions used internally to validate data integrity. Not part of the request path.

---

### Function: `get_weekly_set` (legacy alias)

Already documented. See the [Spaced Repetition](#function-get_weekly_set) section above.

---

## Function Naming Conventions

For new function authors, the conventions used in this codebase:

- **`get_*`** — read-only, returns data (a table, JSON, or scalar). Caller expects no side effects.
- **`insert_*` / `update_*` / `delete_*`** — write operations with a specific verb. The name describes the effect.
- **`generate_*`** — compound write operations that create and populate a set of related rows (e.g. `generate_topic_test` creates one session and N attempt rows).
- **`internal_*`** — helper functions used only by other functions. Not part of the client API; signatures may change freely.
- **`handle_*`** — trigger functions. Always return `trigger`. Prefix with the event they handle.
- **`refresh_*`** — full-table recomputation. Typically scheduled via cron.
- **`resolve_*`** — returns a value derived from inputs without a database write. Pure-ish.
- **`before_*` / `after_*`** — trigger functions whose name reflects the trigger timing.

Arguments are prefixed `p_` and locals are prefixed `v_`. This makes it unambiguous which side of an expression is a parameter and which is a variable.

---

## Security Model

| Category        | `SECURITY DEFINER`                                                                                                                                                                                                                                            | `SECURITY INVOKER` |
| :-------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :----------------- |
| **Why DEFINER** | Function needs to read or write data the caller can't access under RLS. Examples: `get_my_dashboard` (reads activity across all questions), `refresh_question_peer_stats` (reads all users' activity), `resolve_notification_target` (reads all users' tags). |                    |
| **Why INVOKER** | Function only touches data the caller already has access to. Examples: `toggle_question_bookmark` (writes to the caller's own bookmarks), `generate_topic_test` (reads questions the caller can already see, writes to their own `topic_tests`).              |                    |
| **Default**     | Prefer `INVOKER`. Only escalate to `DEFINER` when RLS would block the intended read/write.                                                                                                                                                                    |                    |

**The `search_path` rule.** Every `SECURITY DEFINER` function in this codebase sets `search_path = 'public'` (or `'public', net` for functions using `pg_net`). This is not optional — without it, a malicious caller who controls their own `search_path` could shadow `public` functions with custom implementations that run with the function owner's privileges. This is a known Postgres attack vector.

---

## Triggers

A consolidated view of every trigger in the database. Triggers are grouped by the table they fire on and the function they call. Detailed behavior for each trigger function is documented in the [Functions](#functions) section.

### Trigger Inventory

| Table              | Trigger                         | Timing | Events                 | Function                          | Purpose                                                                                                       |
| :----------------- | :------------------------------ | :----- | :--------------------- | :-------------------------------- | :------------------------------------------------------------------------------------------------------------ |
| `questions`        | `handle_questions_updated_at`   | BEFORE | UPDATE                 | `moddatetime('updated_at')`       | Auto-update the `updated_at` column on any row change.                                                        |
| `questions`        | `trg_update_question_count`     | AFTER  | INSERT, UPDATE, DELETE | `update_subject_question_count()` | Recompute `subjects.question_count` when verified questions are added, edited, or removed.                    |
| `question_reports` | `trigger_on_report_insert`      | AFTER  | INSERT                 | `handle_report_event_webhook()`   | Forward new report to the `process-reminders` Edge Function → notification to admin.                          |
| `question_reports` | `trigger_on_report_update`      | AFTER  | UPDATE                 | `handle_report_event_webhook()`   | Forward status transitions to the `process-reminders` Edge Function → notification to reporter when resolved. |
| `topic_tests`      | `on_topic_test_completed`       | AFTER  | UPDATE                 | `handle_test_completion_sync()`   | Sync test attempts into `user_question_activity` and update the queue on session completion.                  |
| `notifications`    | `on_notification_before_insert` | BEFORE | INSERT                 | `before_notification_insert()`    | Default `active`, resolve `audience_ids` from `target`.                                                       |
| `notifications`    | `on_notification_after_insert`  | AFTER  | INSERT                 | `dispatch_notification_http()`    | Fire async HTTP to the `dispatch-notification` Edge Function for push fanout.                                 |

---

### Trigger: `handle_questions_updated_at`

**Table:** `questions`
**Timing:** BEFORE UPDATE
**Function:** `moddatetime('updated_at')` (built-in extension function from `moddatetime`)

**Purpose:** Automatically bumps `questions.updated_at` on every row update. This is the standard "touch the timestamp" pattern; the function is provided by the `moddatetime` extension.

**Why it exists:** The client uses `updated_at` to determine which questions to sync from Supabase into Dexie. If a question is edited (fixed typo, updated answer), `updated_at` must advance so the sync logic re-fetches it. Without this trigger, the timestamp would need to be set manually in every `UPDATE` statement — a maintenance hazard.

**Behavior:**

- Fires on any `UPDATE` to `questions`.
- The trigger only fires when a row is actually modified — a no-op `UPDATE` that sets the same values still fires (Postgres doesn't distinguish), which is fine because `updated_at` advancing is the desired behavior.
- `updated_at` is overwritten with `now()` regardless of what the `UPDATE` statement tries to set.

---

### Trigger: `trg_update_question_count`

**Table:** `questions`
**Timing:** AFTER INSERT, UPDATE, DELETE
**Function:** `update_subject_question_count()`

**Purpose:** Keeps `subjects.question_count` in sync with the actual number of verified questions per subject.

**Behavior:**

- **INSERT** — increments the count for the new question's subject if the question is `verified = true`.
- **UPDATE** — recomputes the count if `subject_id` or `verified` changed. If a question moves from Subject A to Subject B, both counts update. If a question goes from unverified to verified, the count increases.
- **DELETE** — decrements the count for the deleted question's subject if it was verified.

**Why it exists:** The practice page shows "274 questions available" per subject. Computing this count on every page load via `SELECT COUNT(*) FROM questions WHERE subject_id = X AND verified = true` would work, but the question table is large enough that the count query is measurably slow on a cold read. Denormalizing the count into `subjects.question_count` makes it a single-column lookup.

**Trade-off:** The count can drift if a bulk update bypasses the trigger (e.g., a `TRUNCATE` + `INSERT` migration). When this happens, the count is stale until the next affected row triggers a recompute. If you suspect drift, the fix is a one-shot `UPDATE subjects SET question_count = (SELECT COUNT(*) FROM questions WHERE ...)` migration.

**Interaction with `get_exam_subject_counts`:** That RPC recomputes counts on the fly rather than reading `subjects.question_count`. This is intentional — the RPC's count depends on `target_exams`, which the denormalized column doesn't know about. The column is a "subject-wide total," the RPC is an "exam-filtered total."

---

### Trigger: `trigger_on_report_insert`

**Table:** `question_reports`
**Timing:** AFTER INSERT
**Function:** `handle_report_event_webhook()`

**Purpose:** Fires when a user files a new question report. The function POSTs to the `process-reminders` Edge Function with `?task=report-created`, which creates a notification targeting the admin.

**Behavior:**

1. Postgres fires the trigger on the committed row.
2. `handle_report_event_webhook()` reads `TG_OP` and sees `INSERT`.
3. The function POSTs to the Edge Function with the row payload in the body.
4. The Edge Function's `handleReportCreated()` inserts a notification with `target: {type: 'user', user_id: ADMIN_USER_ID}`.
5. The notification's BEFORE INSERT trigger resolves the audience (single admin), AFTER INSERT fires the dispatcher.
6. Admin receives a push notification and a bell-icon entry.

**Why async:** The report insertion itself is not blocked by the notification delivery. If the Edge Function is slow or down, the report still gets filed — it just doesn't produce a notification. The admin might miss an alert, but the report is never lost.

**Failure modes:** If the POST fails (wrong secret, Edge Function not deployed), the trigger silently continues — no error propagates to the user filing the report. The report row exists with no corresponding notification. This is documented as a known limitation, not a bug.

---

### Trigger: `trigger_on_report_update`

**Table:** `question_reports`
**Timing:** AFTER UPDATE
**Function:** `handle_report_event_webhook()`

**Purpose:** Fires on every update to a report row, but the handler short-circuits unless the update is a transition to `status = 'resolved'`.

**Behavior:**

1. Postgres fires the trigger on the updated row.
2. `handle_report_event_webhook()` reads `TG_OP` and sees `UPDATE`.
3. The function checks `new.status` and `old.status`:
   - If `new.status = 'resolved'` and `old.status <> 'resolved'` → POST to the Edge Function with `?task=report-resolved`.
   - Otherwise → no-op. The trigger fired but did nothing.

4. The Edge Function's `handleReportResolved()` inserts a notification targeting the reporter.

**Why the handler checks instead of the trigger:** The trigger fires on _every_ update (typo fixes, status changes, etc.), but only status transitions should produce notifications. Putting the filter in the trigger body would mean duplicating it if other callers ever need the same logic. Putting it in the handler means the notification logic and the transition-detection logic live in one place.

**Re-resolving an already-resolved report:** Setting `status = 'resolved'` on a row that's already resolved does **not** fire a second notification. `old.status = 'resolved'` makes the handler short-circuit. This is intentional — a user resubmitting the same update shouldn't get spammed.

---

### Trigger: `on_topic_test_completed`

**Table:** `topic_tests`
**Timing:** AFTER UPDATE
**Function:** `handle_test_completion_sync()`

**Purpose:** Fires when a test session transitions to `status = 'completed'`. Syncs the test's per-question attempts into `user_question_activity` and updates the user's Leitner queue, subject to the session's `record_activity` flag.

**Fire condition:**

```sql
if new.status = 'completed'
   and old.status <> 'completed'
   and new.record_activity is true then
```

Three conditions must all hold:

- `new.status = 'completed'` — the row just transitioned _into_ completed.
- `old.status <> 'completed'` — the row was _not_ completed before. Without this, an unrelated update to a completed row would re-trigger the sync.
- `new.record_activity is true` — the toggle in the test configuration was left on. When the user disables recording, the test is graded and stored, but the attempts never reach `user_question_activity`.

**Behavior:**

1. Insert one row into `user_question_activity` per attempted question in `topic_tests_attempts`, with `attempt_number` computed as `max(attempt_number) + 1` for the (user, question) pair.
2. Update `user_incorrect_queue`: correct answers on Box 1/2/3 questions advance the box or remove the row; incorrect answers reset to Box 1.
3. Set the attempt's `selected_option_indices` from the JSONB answer — used by `refresh_question_peer_stats` for option distributions.

**Why this is a trigger and not part of the RPC:** `submit_test_grading` is the RPC that computes the scores. The sync happens in the trigger because:

- It fires on any path that transitions to `completed` — including admin fixes, not just user-submitted grades.
- It decouples "grading" (pure computation) from "recording" (write to user activity). If the recording logic ever needs to change, it doesn't require touching the grading function.

**Interaction with `record_activity = false`:** When the user toggles "Record Test Activity" off, the session stores `record_activity = false`. Grading still runs (score and correctness are computed and saved to the session). But the sync trigger skips its work entirely — no `user_question_activity` rows, no queue updates, no peer-stats contribution.

---

### Trigger: `on_notification_before_insert`

**Table:** `notifications`
**Timing:** BEFORE INSERT
**Function:** `before_notification_insert()`

**Purpose:** Defaults `active` to `true` and resolves `audience_ids` from `target` before the row is committed.

**Behavior:**

1. If `new.active is null`, set `new.active := true`.
2. If `new.audience_ids is null` and `new.target->>'type'` is not `'broadcast'`:
   - Call `resolve_notification_target(new.target)`.
   - Assign the result to `new.audience_ids`.

**Why BEFORE, not AFTER:** The resolution must complete before the row is visible to other sessions. If it ran AFTER, there'd be a window where `audience_ids = NULL` on a non-broadcast notification — and the dispatcher (which fires AFTER INSERT) would read `NULL` and fan out to everyone. The `BEFORE` timing guarantees the resolved audience is present in the same row that the AFTER trigger sees.

**Idempotency:** If the caller pre-populates `audience_ids`, the trigger leaves it alone. This is useful for manual inserts where the audience is already known (e.g., an admin pasting a specific user ID list).

**The broadcast bypass:** The `is distinct from 'broadcast'` guard means broadcast notifications keep `audience_ids = NULL`. That's the sentinel value the dispatcher uses to distinguish "everyone" from "resolved-to-empty." If a broadcast went through the resolver, it would return `NULL` anyway (correct), but the guard makes it explicit and avoids a function call.

---

### Trigger: `on_notification_after_insert`

**Table:** `notifications`
**Timing:** AFTER INSERT
**Function:** `dispatch_notification_http()`

**Purpose:** Fires the dispatcher Edge Function after a notification row is committed.

**Behavior:**

1. Check the `app.skip_dispatch` setting. If `true`, return immediately (test mode).
2. Read the vault secrets `cron_edge_function_base_url` and `cron_isolated_secret`.
3. If either is missing, return without firing (log via `raise warning` in production).
4. `perform net.http_post(url := base_url || '/dispatch-notification', headers := {..., 'x-cron-secret': secret}, body := {notification_id: new.id}, timeout_milliseconds := 5000)`.

**Why async via `pg_net`:** A synchronous HTTP call would block the insert transaction on the Edge Function's response time. `pg_net` queues the request and returns a `request_id` immediately — the transaction commits at normal speed, and the HTTP fires asynchronously. If the Edge Function is cold (adds ~300ms), the user doesn't feel it because the notification insert was already committed.

**Test mode:** pgTAP tests set `app.skip_dispatch = true` via `set local`. Without this, every test that inserts a notification would try to reach `localhost:54321/functions/v1/dispatch-notification` — which works when the local stack is up, but fails when running tests in isolation. The setting must be read with `current_setting('app.skip_dispatch', true)` (second argument `true` means "return NULL instead of error if unset"), otherwise production inserts would crash.

**Failure handling:** If `net.http_post` fails (network error, timeout), there's no retry. The notification exists with `dispatched_at = NULL`. A backfill sweep query (documented in [the notifications table](#table-publicnotifications)) catches these on the next manual inspection, but no automatic retry currently exists.

---

## Cron Jobs

Scheduled jobs managed by `pg_cron`. Jobs either run pure SQL (for heavy aggregation that doesn't need a network call) or invoke the `process-reminders` Edge Function via `net.http_post` (for push delivery, which needs the Deno runtime and VAPID key handling).

All jobs are stored in `cron.job`. The `active` column is `true` for all currently-scheduled jobs.

### Job Inventory

| Job                               | Schedule (UTC) | Type     | Action                                         |
| :-------------------------------- | :------------- | :------- | :--------------------------------------------- |
| `refresh-peer-stats-midnight`     | `0 0 * * *`    | Pure SQL | `select public.refresh_question_peer_stats();` |
| `nightly-difficulty-sync`         | `0 0 * * *`    | Pure SQL | `select refresh_dynamic_difficulty();`         |
| `revision-hourly-reminder`        | `0 * * * *`    | HTTP     | POST `?task=revision-hourly`                   |
| `weekend-topic-test-saturday`     | `30 3 * * 6`   | HTTP     | POST `?task=weekend-topic-test`                |
| `weekend-topic-test-sunday`       | `30 3 * * 0`   | HTTP     | POST `?task=weekend-topic-test`                |
| `donation-reminder-every-2-weeks` | `30 6 * * 0`   | HTTP     | POST `?task=donation-reminder`                 |

Schedules are in UTC. To convert to IST (UTC+5:30), add 5 hours 30 minutes:

| Job                               | UTC            | IST            |
| :-------------------------------- | :------------- | :------------- |
| `refresh-peer-stats-midnight`     | 00:00          | 05:30          |
| `nightly-difficulty-sync`         | 00:00          | 05:30          |
| `revision-hourly-reminder`        | every hour :00 | every hour :30 |
| `weekend-topic-test-saturday`     | Sat 03:30      | Sat 09:00      |
| `weekend-topic-test-sunday`       | Sun 03:30      | Sun 09:00      |
| `donation-reminder-every-2-weeks` | Sun 06:30      | Sun 12:00      |

---

### Job: `refresh-peer-stats-midnight`

**Schedule:** `0 0 * * *` (daily at 00:00 UTC)
**Type:** Pure SQL
**Command:** `select public.refresh_question_peer_stats();`

**Purpose:** Recomputes the `question_peer_stats` aggregate table from `user_question_activity`. This is what keeps the "68% of users got this right" statistic current.

**Why nightly:** The aggregation is a full-table scan of `user_question_activity` — potentially hundreds of thousands of rows. Running it on every read would be prohibitive; running it on every attempt would also be too expensive. Nightly is the sweet spot: stats are at most 24 hours stale, which is invisible for a "compare to peers" feature.

**Cost:** A full refresh on a catalog with ~500K attempts takes 2-5 seconds. The `ON CONFLICT (question_id) DO UPDATE` pattern means only new/changed rows trigger writes, so the update phase is fast. The read phase (aggregating activity) is the bulk of the cost.

---

### Job: `nightly-difficulty-sync`

**Schedule:** `0 0 * * *` (daily at 00:00 UTC)
**Type:** Pure SQL
**Command:** `select refresh_dynamic_difficulty();`

**Purpose:** Recomputes subject difficulty scores from real user performance data (`v_user_cycle_stats` view).

**Why nightly:** Same reasoning as peer stats — the aggregation is expensive, and difficulty scores are display-only (the Easy/Medium/Hard badge). A day of staleness is invisible.

**Why pure SQL and not an Edge Function:** No network I/O. The whole computation is Postgres-native — reading `user_question_activity`, aggregating via `v_user_cycle_stats`, writing back to `subjects`. Sending this to an Edge Function would add cold-start latency and a round-trip for zero benefit.

---

### Job: `revision-hourly-reminder`

**Schedule:** `0 * * * *` (hourly)
**Type:** HTTP
**Command:** POST to `process-reminders?task=revision-hourly`

**Purpose:** Reminds users whose weekly revision set has been active for 22-23 hours that it's expiring. The `revisionHourly` handler queries `weekly_revision_set` for sets started in that window and creates a notification targeting those users.

**Why hourly:** The reminder is time-sensitive — a set expires exactly 24 hours after starting. Running the cron every hour means the reminder fires within an hour of the ideal moment (22-23 hours elapsed). A daily cron would miss the window for sets started at the wrong time of day.

**Why HTTP and not pure SQL:** Push delivery requires Deno's `web-push` library, which isn't available in Postgres. The handler creates a notification row; the notification pipeline then dispatches. The HTTP hop is required because the handler needs to run in the Edge Function runtime.

**Implementation detail:** The cron command uses `net.http_post` with the `x-cron-secret` header from vault. The `process-reminders` router validates the secret before routing to the handler. If the secret is missing or wrong, the router returns 401 and no notification is created. This is the primary auth gate for the entire reminders pipeline.

---

### Job: `weekend-topic-test-saturday`

**Schedule:** `30 3 * * 6` (Saturday at 03:30 UTC / 09:00 IST)
**Type:** HTTP
**Command:** POST to `process-reminders?task=weekend-topic-test`

**Purpose:** Saturday half of the weekend topic test reminder. Creates a segment-targeted notification for users who have been active in the last 14 days.

**Why two jobs (Saturday and Sunday):** The reminder fires twice over the weekend to catch users who weren't active on the first day. Each fires independently, so a user who dismissed Saturday's reminder on their phone won't see Sunday's unless Sunday's notification is a different row. It is — the handler creates a new notification each time, so a user who dismisses Saturday's reminder will see Sunday's.

**Note on duplicate risk:** A user who has the app open across both crons will see two notifications. This is intentional (two nudges over the weekend), not a bug.

---

### Job: `weekend-topic-test-sunday`

**Schedule:** `30 3 * * 0` (Sunday at 03:30 UTC / 09:00 IST)
**Type:** HTTP
**Command:** POST to `process-reminders?task=weekend-topic-test`

**Purpose:** Sunday half of the weekend topic test reminder. Same handler as Saturday's job.

**Why both Saturday and Sunday rather than one:** The weekend is the highest-engagement window for study apps. A Saturday morning reminder catches the "I'll study this weekend" intent while it's fresh. A Sunday morning reminder catches users who missed Saturday. Both are additive, not replacements.

---

### Job: `donation-reminder-every-2-weeks`

**Schedule:** `30 6 * * 0` (Sunday at 06:30 UTC / 12:00 IST)
**Type:** HTTP
**Command:** POST to `process-reminders?task=donation-reminder`

**Purpose:** Bi-weekly donation nudge. The `donationReminder` handler checks the bi-weekly index (calculated from an anchor date of 2026-01-01) and only creates a notification on even weeks.

**Why weekly cron if it only fires bi-weekly:** The cron schedule is weekly, but the handler's own `biWeeklyIndex % 2 !== 0` check skips odd weeks. This is a design choice: the cron runs every Sunday, but the handler short-circuits and returns a "skip this week" response on odd weeks. The alternative would be a cron expression that runs bi-weekly, but `pg_cron` doesn't support that cleanly (the closest would be `0 6 1,15 * *`, which fires on specific dates, not "every other week"). The handler-level gate is simpler.

**Broadcast audience:** The notification is inserted with `target: {type: 'broadcast'}` — it goes to every user, not just donors. This is the same as the previous behavior (the old handler queried all push subscriptions). A future enhancement would target `role:donor` to skip users who have already donated, but that tag doesn't exist yet.

---

### Adding a New Cron Job

The pattern for adding a scheduled job that hits the `process-reminders` router:

```sql
select cron.schedule(
    'job-name',                    -- unique identifier in cron.job
    '0 * * * *',                   -- cron expression
    $$
    select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets
                where name = 'cron_edge_function_base_url')
            || '/process-reminders?task=<task-name>',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets
                             where name = 'cron_isolated_secret')
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 5000
    ) as request_id;
    $$
);
```

Then add a `case` branch in `process-reminders/index.ts` for the new task name.

For a pure SQL job, the command is just the `select` statement — no HTTP wrapper needed.

**Removing a job:**

```sql
select cron.unschedule('job-name');
```

Or, if you don't know the name:

```sql
select cron.unschedule(jobid)
from cron.job
where jobname = 'job-name';
```

---

## Edge Functions

Server-side functions deployed to Supabase's Edge Runtime (Deno). Unlike the database functions documented above, Edge Functions run outside Postgres — they can make network requests, use VAPID for push encryption, and import npm packages.

All Edge Functions in this project are deployed under the `zewzixicpoxirmouyeje` project. Their source lives in `supabase/functions/`. Three functions are in production:

| Function                | Status | Purpose                                                  |
| :---------------------- | :----- | :------------------------------------------------------- |
| `welcome-notification`  | Active | Client-facing: sends a push ack when a user subscribes   |
| `process-reminders`     | Active | Cron + webhook router for five notification producers    |
| `dispatch-notification` | Active | Trigger-driven push fanout for the notification pipeline |

---

### Edge Function: `welcome-notification`

**Deployed slug:** `welcome-notification`
**Source:** `supabase/functions/welcome/index.ts`
**Auth:** Client-authenticated (called from the subscribe flow)
**Trigger:** Direct HTTP call from the client when the user enables push notifications

**Purpose:** Sends a one-off "notifications enabled successfully" push to the subscription that just registered. This confirms to the user that push actually works — it's a systems acknowledgment, not a notification in the feed sense.

**Arguments (request body):**

```jsonc
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/...",
    "keys": { "auth": "...", "p256dh": "..." },
  },
}
```

The client sends the subscription object exactly as returned by `PushManager.subscribe()`. The function doesn't look up the subscription in `push_subscriptions` — it sends to the provided endpoint directly.

**Behavior:**

1. Validate that the request body has a `subscription` object with a non-empty `endpoint`.
2. Read `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` from env.
3. `webpush.setVapidDetails('mailto:support@gatequest.in', publicKey, privateKey)`.
4. `webpush.sendNotification(subscription, welcomePayload)`.
5. Return `{success: true, message: 'Welcome ping delivered.'}`.

**Why it's not part of the notification pipeline:** This function targets a **specific subscription endpoint**, not a user. The notification pipeline targets users (via `target`) and fans out to all their subscriptions. If the welcome went through the pipeline, a user subscribing on their phone would also get the welcome on their laptop — which is wrong. It's a per-device ack.

**Failure handling:** Returns 400 on any error (missing subscription, webpush failure). The client doesn't retry — if the welcome fails, the user has already been subscribed successfully (the subscription row is in the database); only the ack push is missing.

**Notes:**

- **No auth check.** The function accepts any subscription object. In practice, this isn't exploitable (a user can only spam themselves), but a `x-client-info` presence check would be a cheap hardening step if abuse ever becomes a concern.
- **The source file is `welcome/index.ts`, the deployed slug is `welcome-notification`.** This mismatch is historical — the function was renamed at deploy time. When referring to it in docs, use the deployed name.
- **Not migrated to the notification pipeline.** The architecture doc explicitly excludes this function from the migration: "the welcome is a systems ack, not a notification." See the `NOTIFICATION_ARCHITECTURE.md` for the full rationale.

---

### Edge Function: `process-reminders`

**Deployed slug:** `process-reminders`
**Source:** `supabase/functions/process-reminders/`
**Auth:** Shared secret (`x-cron-secret` header) validated against `CRON_SECRET` env var
**Triggers:** Cron jobs (three of them) and the `handle_report_event_webhook()` trigger

**Purpose:** Router for five notification producers. Each producer is a handler module that determines who should receive a notification and inserts a row into `notifications`. The router itself is thin — it validates auth, reads the `?task=` parameter, and dispatches to the appropriate handler.

**Request format:**

```
POST /functions/v1/process-reminders?task=<task-name>
x-cron-secret: <shared-secret>
Content-Type: application/json
```

The body is passed to the handler — for cron-triggered tasks it's `{}`; for webhook-triggered tasks it contains the affected row.

**Supported tasks:**

| Task                 | Handler                   | Triggered by                       | Purpose                                 |
| :------------------- | :------------------------ | :--------------------------------- | :-------------------------------------- |
| `revision-hourly`    | `handleHourlyRevision`    | `revision-hourly-reminder` cron    | Reminds users of expiring revision sets |
| `weekend-topic-test` | `handleTopicTestReminder` | Two weekend crons                  | Reminds users to do a topic test        |
| `donation-reminder`  | `handleDonationReminder`  | Bi-weekly cron                     | Broadcast donation nudge                |
| `report-created`     | `handleReportCreated`     | `trigger_on_report_insert` webhook | Notifies admin of new report            |
| `report-resolved`    | `handleReportResolved`    | `trigger_on_report_update` webhook | Notifies reporter of fix                |

**Router logic:**

1. If `req.method === 'OPTIONS'` → return CORS preflight response.
2. Read `x-cron-secret` header. Compare against `CRON_SECRET` env var. Mismatch → 401.
3. Read `?task=` query param. Missing → 400.
4. Create a `supabaseAdmin` client with `SUPABASE_SERVICE_ROLE_KEY`.
5. `switch (task)` → call the appropriate handler, return its response.
6. Unknown task → 400.
7. Any thrown error → 400 with the error message.

**Handler contract:** Every handler has the signature `(args: { req?, supabaseAdmin, corsHeaders }) => Promise<Response>`. They return a `Response` object directly. The router doesn't post-process — the handler controls status code, body, and headers.

**Auth model:** A single shared secret gates the entire router. This is not per-user authentication — it's "the caller is allowed to invoke cron handlers." The secret lives in Supabase Vault (used by cron jobs) and in the Edge Function's env (`CRON_SECRET`). If the two drift out of sync, every cron fires 401 and no reminders get sent.

**Failure isolation:** Each handler runs independently. A failure in `handleHourlyRevision` doesn't affect `handleTopicTestReminder` — they're separate invocations from separate crons. The router has no state, no retries, and no cross-handler coordination.

**Notes:**

- **The router no longer imports `web-push` or calls `setVapidDetails`.** Both used to be at the top of `index.ts`, but after the producer migration all push dispatch moved to the `dispatch-notification` function. The router is now a pure dispatcher over handlers.
- **The five handlers no longer query `push_subscriptions`.** They insert notification rows and let the trigger/dispatcher pipeline handle delivery. This is the core of the producer migration: the handler's job narrowed from "deliver push" to "create the right notification."
- **The handler source files live in `supabase/functions/process-reminders/handlers/`.** They are not deployed separately — they're imported by the router and bundled into its deploy artifact.

---

### Edge Function: `dispatch-notification`

**Deployed slug:** `dispatch-notification`
**Source:** `supabase/functions/dispatch-notification/`
**Auth:** Shared secret (`x-cron-secret` header) validated against `CRON_ISOLATED_SECRET` env var
**Triggers:** The `on_notification_after_insert` trigger on `notifications`

**Purpose:** Fan out push deliveries for a notification row. Reads the resolved audience from `notifications.audience_ids`, queries matching `push_subscriptions`, sends via `web-push`, cleans up dead endpoints, and marks `dispatched_at`.

**Request format:**

```
POST /functions/v1/dispatch-notification
x-cron-secret: <shared-secret>
Content-Type: application/json

{ "notification_id": "<uuid>" }
```

**Behavior:**

1. Validate `x-cron-secret` against `CRON_ISOLATED_SECRET`. Mismatch → 401.
2. Parse the body. Missing `notification_id` → 400.
3. Load the notification row. Not found → 404.
4. Check `dispatched_at`. If non-null → return `{skipped: true, reason: 'already_dispatched'}` (200). This is the idempotency guard.
5. Read `audience_ids`:
   - `null` → broadcast. Query all `push_subscriptions`.
   - `[]` → empty. Mark dispatched, return without fanout.
   - `[uuid, ...]` → targeted. Query `push_subscriptions` where `user_id IN (...)`.
6. Build the push payload from `title`, `message`, `link` with fallbacks (`'GATEQuest'`, `'/dashboard'`).
7. Call `fanOutPush()` from `_shared/pushFanout.ts`.
8. Delete dead endpoints (those that returned 404/410) in one bulk query.
9. Set `dispatched_at = now()`.
10. Return counts: `{success, processed, delivered, dead, failed}`.

**Why it's a separate function from `process-reminders`:** Different auth secret, different trigger mechanism, different scaling characteristics. The dispatcher runs on every notification insert (potentially many per minute during peak activity); the producers run on a fixed cron schedule (a few per day). Separating them means each can scale independently and a bug in one doesn't take down the other.

**Why `CRON_ISOLATED_SECRET` and not `CRON_SECRET`:** Defense in depth. If the producers' secret leaks, the attacker can create notifications but not dispatch them. If the dispatcher's secret leaks, the attacker can dispatch existing notifications but not create new ones. Rotating one doesn't require rotating the other.

**The empty-audience guard:** This is the single most important safety check in the function. Without it, a segment that resolves to zero users would fall through to "query all subscriptions" (because `[]` is falsy in some programming contexts, or because the SQL `IN ()` with an empty array is a no-op that returns all rows in some Postgres configurations). The explicit check prevents a "reminder to nobody" from becoming a "reminder to everyone" — which has happened in production systems without this guard.

**The `dispatched_at` idempotency:** If the trigger fires twice for the same row (retry, race, manual re-fire), the second call sees `dispatched_at IS NOT NULL` and returns without re-sending. This is critical for user experience — a user should never receive the same push twice, even if the underlying infrastructure has a hiccup.

**Test mode:** No test-mode escape hatch exists at the dispatcher level — tests inject a stub `fanOut` function via the `deps` parameter of `handleDispatch`. Production calls `handleDispatch(req)` with no deps, so the real `fanOutPush` runs. This is why the handler has a `deps` parameter in its signature: it's the test seam.

**Notes:**

- **Not deployed until the notification migration ships.** The function and the `notifications` schema changes deploy together — deploying the function before the schema would fail on the `audience_ids` column lookup.
- **The trigger that calls this function is `on_notification_after_insert`.** Documented above in the Triggers section.
- **Source structure:** `index.ts` (one line: `Deno.serve(handleDispatch)`) and `handler.ts` (the actual logic). The split exists so tests can import `handleDispatch` without starting an HTTP server.

---

### Shared Modules (`_shared/`)

Not deployed as functions themselves, but imported by the functions above.

| Module                               | Purpose                                                                                               |
| :----------------------------------- | :---------------------------------------------------------------------------------------------------- |
| `pushFanout.ts`                      | Chunking, error classification, fanout orchestration. Imported by `dispatch-notification/handler.ts`. |
| `payloads/weeklyDonationPayloads.ts` | Copy rotation array for donation reminders.                                                           |
| `payloads/weeklyTestPayloads.ts`     | Copy rotation array for topic test reminders.                                                         |

**`pushFanout.ts` exports:**

- `chunkArray(arr, size)` — splits a list into fixed-size chunks.
- `classifyEndpointError(status)` — maps HTTP status to `'dead'`, `'retry'`, or `'ignore'`.
- `toWebPushSubscription(sub)` — normalizes a database row to `web-push` format.
- `fanOutPush(subscriptions, payload, options)` — the actual fanout, with bounded concurrency (50 per chunk, 10 concurrent chunks = 500 in flight).

**`payloads/` exports:**

- `DONATION_REMINDER_PAYLOADS` — array of `{title, body}` objects. The handler rotates through based on `biWeeklyIndex`.
- `WEEKLY_PAYLOADS` — array of `{title, body}` objects. The topic test handler rotates through based on the current week number.

Both are static copy — changing the message means editing the file and redeploying. No database round-trip for the copy text.

---

### Environment Variables

Edge Functions read from `Deno.env`. Two sets of secrets exist:

**`welcome-notification`:**

| Variable            | Purpose                               |
| :------------------ | :------------------------------------ |
| `VAPID_PUBLIC_KEY`  | VAPID public key (matches the client) |
| `VAPID_PRIVATE_KEY` | VAPID private key (server-only)       |

**`process-reminders`:**

| Variable                    | Purpose                                                           |
| :-------------------------- | :---------------------------------------------------------------- |
| `SUPABASE_URL`              | Auto-injected by Supabase.                                        |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected by Supabase.                                        |
| `CRON_SECRET`               | Shared secret matching the vault's `cron_isolated_secret`.        |
| `ADMIN_USER_ID`             | UUID of the admin user who receives report-created notifications. |

**`dispatch-notification`:**

| Variable                    | Purpose                                                                    |
| :-------------------------- | :------------------------------------------------------------------------- |
| `SUPABASE_URL`              | Auto-injected by Supabase.                                                 |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected by Supabase.                                                 |
| `CRON_ISOLATED_SECRET`      | Shared secret matching the vault's `cron_isolated_secret`.                 |
| `VAPID_PUBLIC_KEY`          | VAPID public key.                                                          |
| `VAPID_PRIVATE_KEY`         | VAPID private key.                                                         |
| `VAPID_SUBJECT`             | Contact address for the VAPID `sub` claim (`mailto:support@gatequest.in`). |

**The auto-injected variables** (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) are provided by the Edge Runtime and don't need to be set with `supabase secrets set`. Everything else must be explicitly configured.

**Secret rotation:** When rotating the shared secret, both the vault entry (`cron_isolated_secret`) and the two Edge Function env vars (`CRON_SECRET`, `CRON_ISOLATED_SECRET`) must be updated in the same window. If they diverge, crons and triggers return 401 with no notification delivery until the next deploy. There's no graceful handoff — the rotation requires a brief outage window.

---

### Deployment Commands

```bash
# Deploy a single function
supabase functions deploy welcome-notification
supabase functions deploy process-reminders
supabase functions deploy dispatch-notification

# Set secrets for a function
supabase secrets set --env-file supabase/functions/process-reminders/.env.production
supabase secrets set --env-file supabase/functions/dispatch-notification/.env.production

# List deployed functions
supabase functions list --project-ref <project-ref>

# View logs for a function
supabase functions logs process-reminders --project-ref <project-ref>
```

**Deploy order for the notification migration:**

1. `dispatch-notification` — deploy first. If producers go live before the dispatcher, `net.http_post` fires into a void and `dispatched_at` stays `null`.
2. Verify the dispatcher is reachable (a manual POST with a fake ID should return 404, not 500).
3. `process-reminders` — deploy the migrated handlers second.
4. Verify end-to-end with a test report resolution.

Deploying in the reverse order means reports filed during the window produce notifications that never get delivered — a temporary inconsistency that resolves once the dispatcher lands, but avoidable by deploying in the correct order.

---

_End of Supabase documentation. For the notification system's full architecture rationale, see `NOTIFICATION_ARCHITECTURE.md` in the repository root._
