# GATEQuest Supabase Documentation

Welcome to the GATEQuest database documentation. This document provides a detailed overview of the PostgreSQL schema, custom functions, and security policies that power the application, all managed by Supabase.

## Core Entities & Relationships

The database is designed around a few core concepts. Understanding their relationships is key to understanding the application.

- **`users`**: Stores the public-facing profiles for everyone who signs up. This is linked to Supabase's private `auth.users` table.
- **`user_goals`**: Stores the user goals, i.e., the branch and the exams he/she is preparing for.
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
- **`notifications`**: A simple table for storing in-app notifications for users.
- **`user_incorrect_queue`**: Stores the incorrect attempts of the user and helps power Smart Revision.
- **`weekly_revision_set`**: Stores the weekly revision set for each user.
- **`revision_set_questions`**: Stores the revision questions corresponding to each revision set.
- **`donations`**: Stores the donations which are done via the app.
- **`topic_tests`**: Stores user test sessions, including selected topics, test state, timing, and final performance summary.
- **`topic_tests_attempts`**: Stores per-question data for each test session, including user answers, time spent, and status.

---

## Table Reference

This section provides a detailed breakdown of each table in the `public` schema.

### Table: `public.users`

Stores public profile information for authenticated users. This table is linked 1-to-1 with the private `auth.users` table.

| Column Name          | Data Type     | Constraints & Defaults                          | Description                                                                        |
| :------------------- | :------------ | :---------------------------------------------- | :--------------------------------------------------------------------------------- |
| `id`                 | `uuid`        | `PRIMARY KEY`, `NOT NULL`, `DEFAULT auth.uid()` | The user's unique ID. This is a foreign key that references `auth.users.id`.       |
| `joined_at`          | `timestamptz` | `NOT NULL`, `DEFAULT now()`                     | The timestamp when the user profile was created.                                   |
| `email`              | `text`        | `NULL` allowed                                  | The user's email address.                                                          |
| `name`               | `text`        | `NULL` allowed                                  | The user's full display name.                                                      |
| `avatar`             | `text`        | `NULL` allowed                                  | A URL to the user's profile picture.                                               |
| `show_name`          | `boolean`     | `DEFAULT true`                                  | A setting to control if the user's real name is shown publicly.                    |
| `total_xp`           | `integer`     | `DEFAULT 0`                                     | The total experience points the user has accumulated.                              |
| `settings`           | `jsonb`       | `NULL` allowed                                  | A JSON object for storing user-specific settings.                                  |
| `college`            | `text`        | `NULL` allowed                                  | The name of the user's college or institution.                                     |
| `"targetYear"`       | `integer`     | `NULL` allowed                                  | The user's target year for the GATE exam.                                          |
| `bookmark_questions` | `jsonb`       | `NULL` allowed                                  | A JSON object for storing IDs of bookmarked questions.                             |
| `version_number`     | `integer`     | `DEFAULT 1`                                     | Used for versioning or schema updates related to user settings Clear Data feature. |

**Row Level Security (RLS) Policies:**

- **Policy:** A user can view, insert, or update their own row in the `users` table. They cannot access anyone else's.
- **SQL Logic:** `USING (auth.uid() = id) WITH CHECK (auth.uid() = id)`

---

### Table: `public.questions`

Contains the full details for every question in the GATEQuest database.

| Column Name       | Data Type | Constraints & Defaults                      | Description                                                       |
| :---------------- | :-------- | :------------------------------------------ | :---------------------------------------------------------------- |
| `id`              | `uuid`    | `PRIMARY KEY`, `DEFAULT gen_random_uuid()`  | The unique identifier for the question.                           |
| `year`            | `integer` | `NULL` allowed                              | The year the question appeared in the GATE exam.                  |
| `question_number` | `integer` | `NULL` allowed                              | The original question number from the exam paper.                 |
| `subject`         | `text`    | `NULL` allowed                              | The main subject of the question (e.g., "Quantitative Aptitude"). |
| `subject_id`      | `uuid`    | `FOREIGN KEY → subjects.id`, `NULL` allowed | References the subject associated with the question.              |
| `topic`           | `text`    | `NULL` allowed                              | The specific topic within the subject (e.g., "Logarithms").       |
| `question_type`   | `text`    | `NULL` allowed                              | The type of question (e.g., "multiple-choice", "numeric").        |
| `question`        | `text`    | `NULL` allowed                              | The full text of the question.                                    |
| `options`         | `text[]`  | `NULL` allowed                              | An array of options for MCQ/MSQ questions.                        |
| `correct_answer`  | `jsonb`   | `NULL` allowed                              | JSON object containing the correct answer(s).                     |
| `answer_text`     | `text`    | `NULL` allowed                              | Stores the AI explainations for the question.                     |
| `difficulty`      | `text`    | `NULL` allowed                              | Difficulty level (e.g., Easy, Medium, Hard).                      |
| `marks`           | `integer` | `NULL` allowed                              | Marks assigned to the question.                                   |
| `tags`            | `text[]`  | `NULL` allowed                              | Tags used for categorization.                                     |
| `source`          | `text`    | `NULL` allowed                              | Source of the question.                                           |
| `source_url`      | `text`    | `NULL` allowed                              | URL pointing to the original source.                              |
| `added_by`        | `text`    | `NULL` allowed                              | Identifier of the contributor who added the question.             |
| `verified`        | `boolean` | `DEFAULT false`                             | Indicates whether the question has been verified.                 |
| `explanation`     | `text`    | `NULL` allowed                              | Explanation or solution for the question.                         |
| `metadata`        | `jsonb`   | `NULL` allowed                              | Extra metadata such as exam, paper type, or set.                  |

**Indexes**

- `idx_questions_exams_path` → `GIN` index on `metadata`

**Row Level Security (RLS) Policies:**

- **Policy:** Anyone (including unauthenticated users) can read questions.
- **SQL Logic:** `FOR SELECT USING (true)`

---

### Table: `public.user_questions_activity`

Logs every attempt a user makes on a question. This table is crucial for tracking user progress, analytics, and Smart Revision features.

| Column Name           | Data Type     | Constraints & Defaults                     | Description                                        |
| :-------------------- | :------------ | :----------------------------------------- | :------------------------------------------------- |
| `id`                  | `uuid`        | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique identifier for this attempt.                |
| `user_id`             | `uuid`        | `FOREIGN KEY → users.id`                   | The user who made the attempt.                     |
| `question_id`         | `uuid`        | `FOREIGN KEY → questions.id`               | The question that was attempted.                   |
| `subject`             | `text`        | `NULL` allowed                             | Denormalized subject name for quick access.        |
| `subject_id`          | `uuid`        | `FOREIGN KEY → subjects.id`                | The subject associated with the question.          |
| `branch_id`           | `text`        | `FOREIGN KEY → branches.id`                | The branch of the user at the time of the attempt. |
| `was_correct`         | `boolean`     |                                            | `true` if correct, `false` otherwise.              |
| `time_taken`          | `bigint`      |                                            | Time taken to answer in seconds.                   |
| `attempted_at`        | `timestamptz` | `DEFAULT current_timestamp`                | When the attempt occurred.                         |
| `attempt_number`      | `bigint`      | `DEFAULT 1`                                | The nth attempt on this question by the user.      |
| `user_version_number` | `integer`     | `DEFAULT 1`                                | Versioning for tracking schema/user changes.       |

**Relationships:**

- Many-to-One: `user_id` → `users.id`
- Many-to-One: `question_id` → `questions.id`
- Many-to-One: `subject` → `subjects.id`
- Many-to-One: `branch_id` → `branches.id`

**Row Level Security (RLS) Policies:**

- **Insert Policy:** Users can only insert activity records for themselves.  
  **SQL Logic:** `FOR INSERT WITH CHECK (auth.uid() = user_id)`

- **Select Policy:** Users can only read their own activity records.  
  **SQL Logic:** `FOR SELECT USING (auth.uid() = user_id)`

**Indexes:**

| Index Name                       | Columns                                 | Type   | Purpose / Notes                                                                 |
| -------------------------------- | --------------------------------------- | ------ | ------------------------------------------------------------------------------- |
| Primary Key (default)            | `id`                                    | B-tree | Ensures uniqueness of each attempt.                                             |
| `idx_uqa_question_first_attempt` | `question_id`                           | B-tree | Optimizes queries fetching the first attempt per question for analytics.        |
| `idx_user_attempt` (view)        | `user_id, attempt_number, attempted_at` | B-tree | Speeds up queries for user-specific attempts, used in dashboards and revisions. |

---

### Table: `public.question_peer_stats`

Stores aggregated performance data for each question, allowing users to compare their performance against their peers.

| Column Name        | Data Type     | Constraints & Defaults      | Description                                                          |
| :----------------- | :------------ | :-------------------------- | :------------------------------------------------------------------- |
| `question_id`      | `uuid`        | `PRIMARY KEY`, `NOT NULL`   | Foreign key that references `public.questions.id`.                   |
| `total_attempts`   | `integer`     | `NOT NULL`, `DEFAULT 0`     | The total number of first attempts on this question by all users.    |
| `correct_attempts` | `integer`     | `NOT NULL`, `DEFAULT 0`     | The number of users who answered correctly on their first attempt.   |
| `wrong_attempts`   | `integer`     | `NOT NULL`, `DEFAULT 0`     | The number of users who answered incorrectly on their first attempt. |
| `avg_time_seconds` | `numeric`     | `NULL` allowed              | The average time taken by all users on their first attempt.          |
| `updated_at`       | `timestamptz` | `NOT NULL`, `DEFAULT now()` | The last time these stats were refreshed.                            |

**Relationships:**

- One-to-One: `question_peer_stats.question_id` references `public.questions.id`.

**Row Level Security (RLS) Policies:**

- **Policy:** Anyone, including logged-out users, can read these statistics.
- **SQL Logic:** `FOR SELECT USING (true)`

**Indexes:**

| Index Name                 | Columns       | Type   | Purpose / Notes                                  |
| -------------------------- | ------------- | ------ | ------------------------------------------------ |
| `question_peer_stats_pkey` | `question_id` | B-tree | Primary key index ensuring one row per question. |

---

### Table: `public.question_reports`

Allows authenticated users to report problems with questions.

| Column Name   | Data Type   | Constraints & Defaults                                  | Description                                                       |
| :------------ | :---------- | :------------------------------------------------------ | :---------------------------------------------------------------- |
| `id`          | `uuid`      | `PRIMARY KEY`, `NOT NULL`, `DEFAULT uuid_generate_v4()` | The unique identifier for the report.                             |
| `user_id`     | `uuid`      | `NOT NULL`                                              | Foreign key → `public.users.id`. The user who filed the report.   |
| `question_id` | `uuid`      | `NULL` allowed                                          | Foreign key → `public.questions.id`. The question being reported. |
| `report_type` | `text`      | `NULL` allowed                                          | Category of the report (e.g., 'Incorrect Answer', 'Typo').        |
| `report_text` | `text`      | `NOT NULL`                                              | Detailed description of the issue.                                |
| `status`      | `text`      | `DEFAULT 'pending'`                                     | Report status (e.g., 'pending', 'resolved').                      |
| `created_at`  | `timestamp` | `DEFAULT now()`                                         | When the report was created.                                      |

**Relationships:**

- Many-to-One: `question_reports.user_id` → `public.users.id`
- Many-to-One: `question_reports.question_id` → `public.questions.id`

**Row Level Security (RLS) Policies:**

- **Policy:** Only authenticated users can create a report for their own user ID.
- **SQL Logic:** `FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)`

**Indexes:**

| Index Name              | Columns | Type   | Purpose / Notes                         |
| ----------------------- | ------- | ------ | --------------------------------------- |
| `question_reports_pkey` | `id`    | B-tree | Primary key ensuring unique report IDs. |

---

### Table: `public.notifications`

Stores in-app notifications to be displayed to users.

| Column Name  | Data Type     | Constraints & Defaults                                 | Description                                                |
| :----------- | :------------ | :----------------------------------------------------- | :--------------------------------------------------------- |
| `id`         | `uuid`        | `PRIMARY KEY`, `NOT NULL`, `DEFAULT gen_random_uuid()` | Unique ID for the notification.                            |
| `created_at` | `timestamptz` | `NOT NULL`, `DEFAULT now()`                            | When the notification was created.                         |
| `title`      | `text`        | `NULL` allowed                                         | The title of the notification.                             |
| `message`    | `text`        | `NULL` allowed                                         | The main content of the notification.                      |
| `type`       | `text`        | `NULL` allowed                                         | Notification type (e.g., 'info', 'warning', 'update').     |
| `active`     | `boolean`     | `NULL` allowed                                         | A flag to control if the notification is currently active. |

**Row Level Security (RLS) Policies:**

- **Policy:** Anyone can read active notifications.
- **SQL Logic:** `FOR SELECT USING (true)`

**Indexes:**

| Index Name           | Columns | Type   | Purpose / Notes                               |
| -------------------- | ------- | ------ | --------------------------------------------- |
| `notifications_pkey` | `id`    | B-tree | Primary key ensuring unique notification IDs. |

---

### Table: `public.user_incorrect_queue`

Tracks questions a user has answered incorrectly and schedules them for future review (e.g., spaced repetition).

| Column Name      | Data Type     | Constraints & Defaults                                | Description                                           |
| :--------------- | :------------ | :---------------------------------------------------- | :---------------------------------------------------- |
| `user_id`        | `uuid`        | `PRIMARY KEY (composite)`, `REFERENCES users(id)`     | The user who answered the question incorrectly.       |
| `question_id`    | `uuid`        | `PRIMARY KEY (composite)`, `REFERENCES questions(id)` | The incorrectly answered question.                    |
| `box`            | `int`         | `DEFAULT 1`                                           | Review box or level used for spaced repetition logic. |
| `added_at`       | `timestamptz` | `DEFAULT now()`                                       | When the question was added to the incorrect queue.   |
| `next_review_at` | `timestamptz` | `DEFAULT current_date`                                | The next scheduled review date for the question.      |

**Row Level Security (RLS) Policies:**

- **Select:** Users can only read their own incorrect questions.
    - `FOR SELECT USING (user_id = auth.uid())`
- **Insert:** Users can only insert rows for themselves.
    - `FOR INSERT WITH CHECK (user_id = auth.uid())`
- **Update:** Users can only update their own rows.
    - `FOR UPDATE USING (user_id = auth.uid())`
- **Delete:** Users can only delete their own rows.
    - `FOR DELETE USING (user_id = auth.uid())`

**Indexes:**

| Index Name                  | Columns                             | Type   | Purpose / Notes                                     |
| --------------------------- | ----------------------------------- | ------ | --------------------------------------------------- |
| `user_incorrect_queue_pkey` | `user_id, question_id`              | B-tree | Ensures uniqueness per user-question pair.          |
| `idx_next_reviewed`         | `user_id, added_at, next_review_at` | B-tree | Optimizes fetching questions due for review.        |
| `idx_users_added`           | `user_id, added_at`                 | B-tree | Speeds up queries based on insertion order/history. |

---

### Enum: `public.revision_status`

Defines the lifecycle state of a weekly revision set.

| Value     | Description                                          |
| :-------- | :--------------------------------------------------- |
| `pending` | The revision set has been generated but not started. |
| `started` | The user has started the revision set.               |
| `expired` | The revision set is no longer active or valid.       |

---

### Table: `public.weekly_revision_set`

Represents a weekly revision session generated for a user.

| Column Name       | Data Type      | Constraints & Defaults                     | Description                                          |
| :---------------- | :------------- | :----------------------------------------- | :--------------------------------------------------- |
| `id`              | `uuid`         | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique identifier for the revision set.              |
| `generated_for`   | `uuid`         | `REFERENCES users(id)`                     | The user for whom the revision set was generated.    |
| `branch_id`       | `text`         | `REFERENCES branches.id`                   | The branch of the user for this revision set.        |
| `start_of_week`   | `date`         | `NOT NULL`                                 | Start date of the week this revision set applies to. |
| `status`          | `text`         | `DEFAULT 'pending'`                        | Current status: pending / started / completed.       |
| `created_at`      | `timestamptz`  | `DEFAULT current_timestamp`                | When the revision set was created.                   |
| `started_at`      | `timestamptz`  | `NULL` allowed                             | When the user started the revision set.              |
| `expires_at`      | `timestamptz`  | `DEFAULT started_at + interval '24 hours'` | When the revision set expires.                       |
| `total_questions` | `int`          | `DEFAULT 0`                                | Total number of questions in the revision set.       |
| `correct_count`   | `int`          | `DEFAULT 0`                                | Number of correctly answered questions.              |
| `accuracy`        | `numeric(5,2)` | `NULL` allowed                             | Accuracy percentage for the revision set.            |
| `exam_tags`       | `text[]`       | `NULL` allowed                             | Tags of exams/topics included in this revision set.  |

**Row Level Security (RLS) Policies:**

- **Select:** Users can only read their own revision sets.  
  `FOR SELECT USING (generated_for = auth.uid())`
- **Insert:** Users can only create revision sets for themselves.  
  `FOR INSERT WITH CHECK (generated_for = auth.uid())`
- **Update:** Users can only update their own revision sets.  
  `FOR UPDATE USING (generated_for = auth.uid())`
- **Delete:** Users can only delete their own revision sets.  
  `FOR DELETE USING (generated_for = auth.uid())`

**Indexes:**

| Index Name                 | Columns | Type   | Purpose / Notes                            |
| -------------------------- | ------- | ------ | ------------------------------------------ |
| `weekly_revision_set_pkey` | `id`    | B-tree | Primary key ensuring unique revision sets. |

---

### Table: `public.revision_set_questions`

Stores the questions included in a weekly revision set along with user performance data.

| Column Name          | Data Type | Constraints & Defaults                                                               | Description                                       |
| :------------------- | :-------- | :----------------------------------------------------------------------------------- | :------------------------------------------------ |
| `set_id`             | `uuid`    | `PRIMARY KEY (composite)`, `REFERENCES weekly_revision_set(id)`, `ON DELETE CASCADE` | The revision set this question belongs to.        |
| `question_id`        | `uuid`    | `PRIMARY KEY (composite)`, `REFERENCES questions(id)`                                | The question included in the revision set.        |
| `is_correct`         | `boolean` | `NULL` allowed                                                                       | Whether the user answered the question correctly. |
| `time_spent_seconds` | `int`     | `NULL` allowed                                                                       | Time spent answering the question, in seconds.    |

**Notes:**

- Uses a composite primary key (`set_id`, `question_id`) to ensure each question appears only once per revision set.
- Rows are automatically removed when the parent revision set is deleted due to `ON DELETE CASCADE`.
- RLS is **disabled**, so the table can be accessed by anyone via the Data API.

**Indexes:**

| Index Name                    | Columns               | Type   | Purpose / Notes                                         |
| ----------------------------- | --------------------- | ------ | ------------------------------------------------------- |
| `revision_set_questions_pkey` | `set_id, question_id` | B-tree | Composite primary key ensuring unique question per set. |

---

### Table: `public.branches`

Stores the list of academic disciplines (e.g., CS, ME, EE).

| Column Name | Data Type | Constraints & Defaults | Description                     |
| ----------- | --------- | ---------------------- | ------------------------------- |
| `id`        | `text`    | `PRIMARY KEY`          | Branch code (e.g., CS, ME, EE). |
| `name`      | `text`    | `NOT NULL`             | Full name of the branch.        |

**Indexes:**

| Index Name      | Columns | Type   | Purpose / Notes                         |
| --------------- | ------- | ------ | --------------------------------------- |
| `branches_pkey` | `id`    | B-tree | Primary key ensuring unique branch IDs. |

**RLS / Policies:** Public read via `SELECT`.

---

### Table: `public.exams`

Stores all supported competitive exams.

| Column Name  | Data Type | Constraints & Defaults | Description                                |
| ------------ | --------- | ---------------------- | ------------------------------------------ |
| `id`         | `text`    | `PRIMARY KEY`          | Exam code (e.g., GATE).                    |
| `name`       | `text`    | `NOT NULL`             | Official name of the exam for the display. |
| `short_name` | `text`    | `NOT NULL`             | Short name for storing.                    |

**Indexes:**

| Index Name   | Columns | Type   | Purpose / Notes                    |
| ------------ | ------- | ------ | ---------------------------------- |
| `exams_pkey` | `id`    | B-tree | Primary key ensuring unique exams. |

**RLS / Policies:** Public read via `SELECT`.

---

### Table: `public.branch_exams`

Maps which exams apply to which branches.

| Column Name | Data Type | Constraints & Defaults         | Description                      |
| ----------- | --------- | ------------------------------ | -------------------------------- |
| `branch_id` | `text`    | `NOT NULL`, `FK → branches.id` | Branch associated with the exam. |
| `exam_id`   | `text`    | `NOT NULL`, `FK → exams.id`    | Exam associated with the branch. |

**Indexes:**

| Index Name          | Columns              | Type   | Purpose / Notes                             |
| ------------------- | -------------------- | ------ | ------------------------------------------- |
| `branch_exams_pkey` | `branch_id, exam_id` | B-tree | Composite primary key to ensure uniqueness. |

**RLS / Policies:** Public read via `SELECT`.

---

### Table: `public.subjects`

Stores global subjects with metadata.

| Column Name        | Data Type | Constraints & Defaults | Description                                    |
| ------------------ | --------- | ---------------------- | ---------------------------------------------- |
| `id`               | `uuid`    | `PRIMARY KEY`          | Unique subject identifier.                     |
| `slug`             | `text`    | `UNIQUE`               | URL-friendly identifier (e.g., eng-maths).     |
| `name`             | `text`    | `NOT NULL`             | Display name of the subject.                   |
| `icon_name`        | `text`    |                        | Icon associated with the subject.              |
| `theme_color`      | `text`    |                        | Theme color for UI display.                    |
| `difficulty_score` | `float`   | `DEFAULT 0.5`          | Difficulty metric (0–1).                       |
| `question_count`   | `int`     | `DEFAULT 0`            | Number of questions available in this subject. |
| `category`         | `text`    |                        | Optional category grouping.                    |
| `is_universal`     | `boolean` | `DEFAULT false`        | True if applicable across all branches/exams.  |

**Indexes:**

| Index Name          | Columns | Type   | Purpose / Notes       |
| ------------------- | ------- | ------ | --------------------- |
| `subjects_pkey`     | `id`    | B-tree | Primary key.          |
| `subjects_slug_key` | `slug`  | B-tree | Ensures unique slugs. |

**RLS / Policies:** Public read via `SELECT`.

---

### Table: `public.exams_subjects`

Maps subjects to exams.

| Column Name  | Data Type | Constraints & Defaults         | Description                       |
| ------------ | --------- | ------------------------------ | --------------------------------- |
| `exams_id`   | `text`    | `NOT NULL`, `FK → exams.id`    | Exam associated with the subject. |
| `subject_id` | `uuid`    | `NOT NULL`, `FK → subjects.id` | Subject included in the exam.     |

**Indexes:**

| Index Name            | Columns                | Type   | Purpose / Notes        |
| --------------------- | ---------------------- | ------ | ---------------------- |
| `exams_subjects_pkey` | `exams_id, subject_id` | B-tree | Composite primary key. |

**RLS / Policies:** Public read via `SELECT`.

---

### Table: `public.branch_subjects`

Maps subjects to branches.

| Column Name  | Data Type | Constraints & Defaults | Description                         |
| ------------ | --------- | ---------------------- | ----------------------------------- |
| `branch_id`  | `text`    | `FK → branches.id`     | Branch associated with the subject. |
| `subject_id` | `uuid`    | `FK → subjects.id`     | Subject associated with the branch. |

**Indexes:**

| Index Name             | Columns                 | Type   | Purpose / Notes        |
| ---------------------- | ----------------------- | ------ | ---------------------- |
| `branch_subjects_pkey` | `branch_id, subject_id` | B-tree | Composite primary key. |

**RLS / Policies:** Public read via `SELECT`.

---

### Table: `public.user_goals`

Stores the goals of a user, including branch and target exams.

| Column Name    | Data Type | Constraints & Defaults | Description                             |
| -------------- | --------- | ---------------------- | --------------------------------------- |
| `id`           | `uuid`    | `PRIMARY KEY`          | Unique identifier for this goal record. |
| `user_id`      | `uuid`    | `FK → users.id`        | User who owns this goal.                |
| `branch_id`    | `text`    | `FK → branches.id`     | Branch selected by the user.            |
| `target_exams` | `jsonb`   |                        | IDs of exams the user is targeting.     |
| `is_active`    | `boolean` | `DEFAULT true`         | Whether this goal is currently active.  |

**Indexes:**

| Index Name                         | Columns              | Type   | Purpose / Notes                                |
| ---------------------------------- | -------------------- | ------ | ---------------------------------------------- |
| `user_goals_pkey`                  | `id`                 | B-tree | Primary key.                                   |
| `idx_user_goals_user_branch`       | `user_id, branch_id` | B-tree | Optimizes fetching goals per user and branch.  |
| `user_goals_user_id_branch_id_key` | `user_id, branch_id` | B-tree | Ensures uniqueness of user-branch combination. |

**RLS / Policies:**

- Users can only manage their own goals.  
  `USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`

---

### Table: `public.donations`

Stores donation records submitted by users or guests, including amounts, messages, and verification status.

| Column Name        | Data Type       | Constraints & Defaults                     | Description                                               |
| ------------------ | --------------- | ------------------------------------------ | --------------------------------------------------------- |
| `id`               | `uuid`          | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique donation ID.                                       |
| `user_id`          | `uuid`          | `NULL`, `FK → users.id`                    | User who made the donation; NULL if submitted by a guest. |
| `anonymous`        | `boolean`       | `DEFAULT false`                            | True if donor wants to hide their name.                   |
| `message`          | `text`          |                                            | Optional message from the donor (max 100 chars).          |
| `suggested_amount` | `numeric(10,2)` |                                            | Amount suggested by the donor.                            |
| `actual_amount`    | `numeric(10,2)` |                                            | Verified amount received.                                 |
| `utr`              | `text`          | `UNIQUE`                                   | UPI transaction reference number.                         |
| `verified`         | `boolean`       | `DEFAULT false`                            | True after manual verification.                           |
| `created_at`       | `timestamp`     | `DEFAULT current_timestamp`                | Time the donation was submitted.                          |
| `verified_at`      | `timestamp`     |                                            | Time when the donation was verified manually.             |

**Indexes:**

| Index Name               | Columns    | Type   | Purpose / Notes                                            |
| ------------------------ | ---------- | ------ | ---------------------------------------------------------- |
| `donations_pkey`         | `id`       | B-tree | Primary key ensuring unique donation IDs.                  |
| `donations_utr_key`      | `utr`      | B-tree | Enforces unique UPI transaction references.                |
| `idx_donations_utr`      | `utr`      | B-tree | Optimizes lookup by UTR for verification.                  |
| `idx_donations_verified` | `verified` | B-tree | Optimizes queries filtering verified/unverified donations. |

**RLS / Policies:**

- **Insert:** Guest and logged-in users can insert donations.  
  `FOR INSERT TO public`
- **Select:** Anyone can read donations.  
  `FOR SELECT TO public`

---

## Database Functions

Custom SQL functions to handle complex logic directly in the database.

### Function: `insert_user_question_activity_batch(batch jsonb)`

**Purpose:** Processes a batch of user question attempts, handling the synchronization of practice history, the spaced-repetition queue (Leitner system), and active weekly revision sets. It is the central engine for recording user progress while ensuring data integrity through a strict verification guard.

**Arguments:**

| Field Name | Data Type | Description                                                                                                                                     |
| :--------- | :-------- | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| `batch`    | `jsonb`   | A JSON array of question attempt objects, each containing `user_id`, `question_id`, `was_correct`, `time_taken`, `subject_id`, and `branch_id`. |

---

**Logic Flow:**

1.  **User Profile Sync**: Retrieves the `version_number` from the `users` table for the first user in the batch to ensure attempts are logged against the correct user data version.
2.  **Verification Guard (Silent Skip)**: For every item in the batch, the function queries the `questions` table. If the question is not found or `verified = false`, the function execution for that specific item is skipped using `CONTINUE`. This prevents stale or unvetted content in a user's local cache from affecting their statistics.
3.  **Revision Context Resolution**: Checks if the user has an active `weekly_revision_set` with a status of `'started'`. If so, it determines the "Revision State" for the current question:
    - **`none`**: Standard practice mode (not part of the current revision set).
    - **`first`**: The question belongs to the active set and has not been answered yet.
    - **`done`**: The question was already answered in this revision set (triggers a **Hard Stop** to ignore the duplicate attempt).
4.  **Practice History Logging**: For states `none` and `first`, it records the attempt in `user_question_activity`, automatically incrementing the `attempt_number` for that specific user-question pair.
5.  **Spaced Repetition Management (`user_incorrect_queue`)**:
    - **New Mistakes**: If the answer is incorrect and the question isn't in the queue, it is inserted at **Box 1**.
    - **Box Progression**: If the attempt is a `first` revision attempt, correct answers move the question to the next box (Box 1 → 2 → 3 → Removal), while incorrect answers reset it to Box 1.
    - **Practice Protection**: Standard practice attempts (`none`) can add questions to the queue but **cannot** advance them to higher boxes, preserving the integrity of the official revision cycle.
6.  **Revision Aggregate Updates**: For `first` attempts, the function updates the `revision_set_questions` record and recalculates the overall `total_questions`, `correct_count`, and `accuracy` for the `weekly_revision_set`.
7.  **Auto-Expiration**: If all questions in the active revision set have been attempted, the function triggers `update_status_of_weekly_set` to mark the set as `expired`.

---

**Key Behaviors & Guarantees:**

- **Resilience to Stale Data**: The `verified` check ensures that unverified questions are ignored rather than causing database errors, allowing the system to handle users who may have unvetted questions in their local browser cache.
- **Idempotency in Revision**: Users cannot "pad" their revision accuracy by attempting the same question multiple times within a single weekly set; only the first attempt is recorded for revision stats.
- **Leitner System Logic**: Box level and `next_review_at` intervals (1 week, 2 weeks, 4 weeks) are only modified during official revision sets to accurately measure long-term retention.

**Return Value:**

- `void`

---

**Example SQL Usage:**

```sql
-- Batching a practice attempt and a revision attempt
SELECT insert_user_question_activity_batch('[
  {
    "user_id": "uuid",
    "question_id": "verified-uuid",
    "was_correct": true,
    "time_taken": 45,
    "subject_id": "subject-uuid",
    "branch_id": "CS",
    "attempted_at": "2026-04-14T21:42:00Z"
  }
]'::jsonb);
```

### Function: `refresh_question_peer_stats()`

**Purpose:**  
Calculates and updates aggregate performance statistics for all questions in the `question_peer_stats` table. This allows users to compare their performance against peers.

**Arguments:**

- None

**Logic Flow:**

1. **Select First Attempts:**
    - Queries `user_question_activity` filtering only the **first attempt** for each user/question (`attempt_number = 1`).

2. **Aggregate Metrics per Question:**
    - `total_attempts` – Number of first attempts.
    - `correct_attempts` – Number of first attempts answered correctly.
    - `wrong_attempts` – Number of first attempts answered incorrectly.
    - `avg_time_seconds` – Average time spent on first attempts (ignores nulls).

3. **Insert or Update:**
    - Uses `ON CONFLICT (question_id) DO UPDATE` to insert new rows or update existing ones.
    - Ensures `updated_at` always reflects the latest refresh.

**Key Notes:**

- Only **first attempts** are counted to prevent skew from repeated attempts.
- Aggregate data is stored in `question_peer_stats` for analytics, dashboards, and peer comparison.
- Designed to be safe to run frequently; old stats are overwritten.

**Security:**

- Marked `SECURITY DEFINER` – runs with the permissions of the function owner to access all user activity, even if normal users cannot.

**Return Value:**

- `void`

### Function: `generate_weekly_revision_set(p_branch_id text, p_target_exams text[], p_valid_subjects uuid[])`

**Purpose:** Generates a personalized weekly revision set for an authenticated user by selecting questions they previously answered incorrectly. It prioritizes questions based on the Leitner "Box" system and strictly filters for verified content to ensure high-quality revision sessions.

**Arguments:**

| Field Name         | Data Type | Description                                                                        |
| :----------------- | :-------- | :--------------------------------------------------------------------------------- |
| `p_branch_id`      | `text`    | The academic branch (e.g., 'CS') used to filter branch-specific core subjects.     |
| `p_target_exams`   | `text[]`  | An array of targeted exams (e.g., `['GATE', 'ISRO']`) to include in the selection. |
| `p_valid_subjects` | `uuid[]`  | A list of subject IDs currently relevant to the user's practice profile.           |

---

**Logic Flow:**

1.  **Authentication & Date Initialization**:
    - Retrieves the current user's ID using `auth.uid()` and raises an exception if not authenticated.
    - Calculates the start of the current week (Sunday) to ensure only one set is generated per user per week.

2.  **Duplicate Prevention**:
    - Checks the `weekly_revision_set` table for an existing record matching the user, the current week, and the specific `branch_id`.
    - Returns the existing set details if found to prevent redundant generation.

3.  **Header Creation**:
    - Inserts a new record into `weekly_revision_set` with a status of `'pending'`, mapping the user's target exams and branch.

4.  **The `RankedQueue` Selection (The Core Engine)**:
    - **Mistake Retrieval**: Joins `user_incorrect_queue` with `questions` and `subjects` to find questions where `next_review_at` has passed.
    - **Strict Verification**: Implements a mandatory `verified = true` filter. Unverified or "draft" questions are ignored even if the user got them wrong previously.
    - **Branch & Exam Relevance**:
        - Always includes mistakes from **Universal** subjects (e.g., General Aptitude).
        - For core subjects, it filters based on the user's `branch_id` (via the metadata `'set'` tag) or by matching the `p_target_exams` array.

5.  **Prioritization & Batching**:
    - Selects a maximum of **30 questions**.
    - Orders by `box ASC` (prioritizing Box 1 mistakes that need more frequent review) and `added_at ASC` (oldest mistakes first).

6.  **Finalization**:
    - Inserts the selected questions into `revision_set_questions`.
    - Updates the revision set header with the final `total_questions` count.

---

**Key Behaviors & Guarantees:**

- **Verified Content Only**: By enforcing the `verified` check, the function guarantees users only spend revision time on finalized, accurate questions.
- **Targeted Relevance**: The use of `p_branch_id` and `p_target_exams` ensures that a CS student preparing for GATE doesn't accidentally receive EE-specific revision questions.
- **Leitner Efficiency**: Prioritizes lower-box questions (recent or frequent errors) to optimize the spaced-repetition learning cycle.

**Return Value:**

Returns a `json` object:

- `success`: Boolean indicating if the process completed successfully.
- `status`: `'created'` for new sets or `'existing'` for redundant requests.
- `message`: Human-readable status update.

---

**Example Usage:**

```sql
-- Generate a revision set for a CS student targeting GATE 2026
SELECT generate_weekly_revision_set(
    'CS',
    ARRAY['GATE'],
    ARRAY['22222222-2222-2222-2222-000000000001', '22222222-2222-2222-2222-000000000002']::uuid[]
);
```

### Function: `update_status_of_weekly_set(v_set_id uuid)`

- **Purpose:**
    - To update the status of a weekly revision set to `expired` after 24 hours have passed from the `started_at` time. This function is invoked from the client-side to ensure that the set cannot be used after the expiration period has passed. It provides feedback on whether the set was updated successfully or if there was an issue (e.g., set not found or already expired).

- **Arguments:**
    - **v_set_id (uuid):** The unique identifier of the weekly revision set to be updated.

- **Logic:**
    - **Authentication Check:**
        - The function first retrieves the current authenticated user's ID using `auth.uid()`. If the user is not authenticated (i.e., `v_user_id` is `NULL`), an exception is raised with the message `Not authenticated`.
    - **Set Status Update:**
        - The function attempts to update the status of the revision set with the given `v_set_id` to `'expired'`. The update happens only if the `generated_for` matches the authenticated user’s ID (`v_user_id`).
    - **Rows Affected Check:**
        - If no rows are affected by the `UPDATE` (i.e., the set was not found or has already been expired), the function returns a message indicating that the set was not found or is already expired.
    - **Return Success or Failure:**
        - If the status is successfully updated, a success message is returned indicating the revision set is now marked as expired.
        - If the set could not be found, a failure message is returned.

- **Return Value:**
    - A `json` object with the following keys:
        - **success (boolean):** Indicates whether the operation was successful (`true`) or failed (`false`).
        - **message (string):** A message providing additional information about the outcome. It can either confirm the successful update or explain why the update was not performed (e.g., "No such weekly set found or already expired").

- **Example:**
    - **Success:**
        ```json
        {
            "success": true,
            "message": "Weekly set status updated to expired."
        }
        ```
    - **Failure:**
        ```json
        {
            "success": false,
            "message": "No such weekly set found or already expired."
        }
        ```
- **Exceptions**:
    - If the user is not authenticated (i.e., auth.uid() returns NULL), an exception is raised with the message Not authenticated.
    - If no matching revision set is found or it is already expired, the function returns a failure message instead of an exception.

### Function: `start_weekly_revision_set(v_set_id uuid)`

- **Purpose:**
    - To mark the weekly revision set as "started" by setting the `started_at` and `expires_at` timestamps. This function is invoked when the user starts revising a weekly set. It ensures that the set's status changes from `pending` to `started` and calculates an expiration time of 24 hours from the start time.

- **Arguments:**
    - **v_set_id (uuid):** The unique identifier of the weekly revision set that is being started.

- **Logic:**
    - **Authentication Check:**
        - The function first retrieves the current authenticated user's ID using `auth.uid()`. If the user is not authenticated (i.e., `v_user_id` is `NULL`), an exception is raised with the message `Not authenticated`.
    - **Update Status:**
        - The function attempts to update the `status` of the weekly revision set with the given `v_set_id` to `'started'` and sets the `started_at` and `expires_at` timestamps.
        - The update occurs only if the set is currently in the `pending` state.
    - **Check if Update Was Successful:**
        - The function checks whether any rows were affected by the update (i.e., if the set was in `pending` status). If no rows were updated, it returns a failure message indicating that the set could not be started.
    - **Return Success or Failure:**
        - If the status is successfully updated, a success message is returned indicating the revision set has been started along with the `set_id`, `started_at`, and `expires_at` timestamps.
        - If no matching set was found (i.e., it was not in `pending` status), a failure message is returned.

- **Return Value:**
    - A `json` object with the following keys:
        - **success (boolean):** Indicates whether the operation was successful (`true`) or failed (`false`).
        - **set_id (uuid):** The ID of the set that was updated.
        - **started_at (timestamp):** The timestamp when the revision set was started.
        - **expires_at (timestamp):** The timestamp when the revision set expires (24 hours from the start).
        - **message (string):** A message providing additional information about the outcome.

- **Example:**
    - **Success:**
        ```json
        {
            "success": true,
            "set_id": "some-uuid",
            "started_at": "2025-12-08T10:00:00Z",
            "expires_at": "2025-12-09T10:00:00Z",
            "message": "Weekly set started."
        }
        ```
    - **Failure:**
        ```json
        {
            "success": false,
            "message": "Could not start the weekly set. It may not be in pending status or does not exist."
        }
        ```
- **Exception**
    - If the user is not authenticated (i.e., auth.uid() returns NULL), an exception is raised with the message Not authenticated.
    - If no matching revision set is found or if the set is not in the pending status, the function returns a failure message.

### Function: `get_weekly_set()`

- **Purpose:**
    - To retrieve the currently available weekly revision set for the user. The function checks if the user has an active (pending or started) weekly revision set, and returns the set's details. If the set has expired, it is updated to an `expired` status before returning the set.

- **Arguments:**
    - **None.**

- **Logic:**
    - **Authentication Check:**
        - The function retrieves the current authenticated user's ID using `auth.uid()`. If the user is not authenticated (i.e., `v_user_id` is `NULL`), an exception is raised with the message `Not authenticated`.
    - **Status Update:**
        - The function calls the `update_status_of_weekly_set()` function to update any `pending` or `started` weekly revision set to `expired` if the time window has passed (24 hours from the `started_at` time).
    - **Fetch Weekly Set:**
        - After ensuring expired sets are updated, the function fetches the user's `weekly_revision_set` that is either `pending` or `started`.
    - **Return Success or Failure:**
        - If no matching revision set is found, the function returns a failure message (`No weekly set available for the user`).
        - If a valid revision set is found, the function returns the set's details in JSON format, including the `success` status and the revision set details (`set_info`).

- **Return Value:**
    - A `json` object with the following keys:
        - **success (boolean):** Indicates whether the operation was successful (`true`) or failed (`false`).
        - **set_info (jsonb):** The details of the found weekly revision set (if available).
        - **message (string):** A message providing additional information about the outcome.

- **Example:**
    - **Success:**
        ```json
        {
            "success": true,
            "set_info": {
                "id": "some-uuid",
                "generated_for": "some-uuid",
                "start_of_week": "2025-12-07",
                "status": "pending",
                "created_at": "2025-12-07T00:00:00Z"
            },
            "message": "Weekly set available"
        }
        ```
    - **Failure:**
        ```json
        {
            "success": false,
            "message": "No weekly set available for the user"
        }
        ```
- **Exception**
    - If the user is not authenticated (i.e., auth.uid() returns NULL), an exception is raised with the message Not authenticated.
    - If no matching revision set is found or all available sets are expired, the function returns a failure message instead of an exception.

### Function: `submit_test_grading(p_session_id uuid, p_payload jsonb, p_remaining_time_seconds int)`

---

## **Purpose:**

Processes and grades a completed topic test session by evaluating user answers, calculating scores, and persisting results across multiple tracking tables.

This function:

- Grades **numerical (NAT)** and **objective (MCQ/MSQ)** questions
- Stores per-question attempts in `topic_tests_attempts`
- Syncs user activity into `user_question_activity` for dashboard analytics
- Calculates total score, correctness, and accuracy
- Finalizes the test session in `topic_tests`
- Ensures **idempotent, single-time grading per session**

---

## **Arguments:**

### Core Inputs

| Field Name                 | Type    | Description                                |
| :------------------------- | :------ | :----------------------------------------- |
| `p_session_id`             | `uuid`  | Unique identifier for the test session     |
| `p_payload`                | `jsonb` | Array of question attempt objects          |
| `p_remaining_time_seconds` | `int`   | Remaining time at the moment of submission |

---

### Payload Schema (`p_payload` items)

Each object inside the JSON array must follow:

| Field Name           | Type      | Description                         |
| :------------------- | :-------- | :---------------------------------- |
| `question_id`        | `uuid`    | Question being attempted            |
| `user_answer`        | `jsonb`   | User’s answer (scalar or array)     |
| `time_spent_seconds` | `int`     | Time spent on the question          |
| `marked_for_review`  | `boolean` | Whether question was flagged        |
| `status`             | `text`    | State (`visited`, `answered`, etc.) |
| `attempt_order`      | `int`     | Order of attempt                    |

---

## **Core Concepts:**

### Question Types

- **numerical (NAT)** → evaluated using:
    - exact match
    - multiple valid answers
    - range-based validation
    - tolerance-based validation

- **multiple-choice (MCQ)** → single correct option with negative marking
- **multiple-select (MSQ)** → multi-option exact match, no negative marking

---

### Answer States

- `NULL` → skipped question (no attempt recorded)
- `true` → correct answer
- `false` → incorrect answer

---

## **Logic Flow:**

---

### 1. Session Completion Guard

- If the session already has `status = 'completed'`, the function exits immediately:

```json
{ "status": "already_completed" }
```

Prevents duplicate grading.

---

### 2. User & Context Resolution

Fetches:

- `user_id`
- `branch_id`
- `user_version_number`

from:

- `topic_tests`
- `users`

This ensures:

- version-safe analytics
- correct activity mapping

---

### 3. Payload Iteration

Loops through each question attempt in `p_payload`.

---

### 4. Answer Normalization

- Converts JSON `"null"` → SQL `NULL`
- Ensures skipped questions are properly handled

---

### 5. Question Metadata Fetch

For each question:

- `correct_answer`
- `marks`
- `question_type`
- `subject_id`
- `subject_name`

---

## **6. Grading Logic**

---

### A. Attempt Check

Only executed if `user_answer IS NOT NULL`.

- increments `attempted_count`

---

### B. Numerical (NAT) Grading

Supports:

- **exact match**
- **multiple valid values**
- **range check (inclusive/exclusive)**
- **tolerance-based comparison**

Scoring:

- correct → full marks
- incorrect → 0 marks

---

### C. MCQ / MSQ Grading

- Compares **sorted arrays** (order-independent)

#### MCQ:

- correct → full marks
- incorrect → **negative marking = 1/3 marks**

#### MSQ:

- correct → full marks
- incorrect → **no negative marking**

---

## **7. User Activity Sync (NEW BEHAVIOR)**

Each **attempted question** is now persisted into:

### `user_question_activity`

This enables:

- dashboard progress tracking
- topic-wise performance analytics
- per-question history reconstruction

### Inserted Fields:

| Field                 | Description                 |
| :-------------------- | :-------------------------- |
| `user_id`             | Auth user                   |
| `question_id`         | Attempted question          |
| `subject`             | Subject name (denormalized) |
| `subject_id`          | Subject UUID                |
| `branch_id`           | User branch context         |
| `was_correct`         | Evaluation result           |
| `time_taken`          | Time spent on question      |
| `user_version_number` | Version-scoped tracking     |

### Key Rule:

> Only **attempted questions** (non-NULL answers) are synced.

Skipped questions are intentionally excluded.

---

## **8. Attempt Persistence**

Each question attempt is stored in:

### `topic_tests_attempts`

Using:

```sql
ON CONFLICT (session_id, question_id)
```

Ensures:

- idempotent updates
- safe re-submissions within same session

Stored fields:

- user answer
- correctness
- score
- time spent
- status
- review flag
- attempt order

---

## **9. Score Aggregation**

Tracks:

- `v_total_score`
- `v_correct_count`
- `v_incorrect_count`
- `v_attempted_count`

Accuracy is based only on attempted questions.

---

## **10. Session Finalization**

Updates `topic_tests`:

- marks `status = 'completed'`
- stores final score
- stores attempt stats
- stores remaining time
- sets completion timestamp
- computes accuracy:

```text
accuracy = (correct_count / attempted_count) * 100
```

---

## **Key Behaviors & Guarantees:**

- A session is **strictly single-grading**
- Skipped questions do **not affect accuracy**
- User activity is now **fully synchronized for analytics**
- Version-aware tracking prevents historical contamination
- MCQ negative marking applies only where appropriate
- MSQ is always non-penalized for incorrect answers
- Attempt data is **idempotent and conflict-safe**
- Dashboard consistency is guaranteed via `user_question_activity` sync

---

## **Return Value:**

### Successful grading:

```json
{
  "total_score": float,
  "correct_count": int,
  "incorrect_count": int
}
```

### If already completed:

```json
{
    "status": "already_completed"
}
```

---

## **Example Usage:**

```sql
SELECT submit_test_grading(
  'session-uuid',
  '[{...}]'::jsonb,
  120
);
```

---

## **Example Frontend Call:**

```typescript
await supabase.rpc('submit_test_grading', {
    p_session_id: sessionId,
    p_payload: attempts,
    p_remaining_time_seconds: remainingTime,
});
```

### Function: `get_exam_subject_counts(target_exams text[])`

**Purpose:** Calculates the total number of unique, verified questions available for each subject based on a list of targeted exams. This function is used to determine the "Total Question Pool" for progress bars and study plan calculations.

**Arguments:**

| Field Name     | Type     | Description                                                                          |
| :------------- | :------- | :----------------------------------------------------------------------------------- |
| `target_exams` | `text[]` | An array of exam codes (e.g., `['GATE', 'ISRO']`) used to filter the question count. |

**Logic Flow:**

1.  **Tag Normalization**: Expands question metadata using a `LATERAL` join with `jsonb_array_elements_text`. It handles metadata stored as arrays, single strings, or defaults to `["GATE"]` for legacy data.
2.  **Subject Filtering**: Joins `questions` and `subjects` to evaluate relevance. A question is included if its subject is `is_universal` or if its metadata tags match any value in the `target_exams` array.
3.  **Strict Verification**: Filters strictly for `verified = true`, ensuring only vetted content contributes to user progress metrics.
4.  **Distinct Aggregation**: Groups results by `subject_id` and performs a `COUNT(DISTINCT q.id)` to ensure each question is counted only once, even if it is tagged with multiple relevant exams.

**Key Behaviors & Guarantees:**

- **Quality Control**: The `verified = true` filter ensures that practice progress and subject stats reflect only finalized content.
- **Universal Inclusion**: Core subjects marked as `is_universal` (e.g., General Aptitude) are always included in the count regardless of specific exam tags.
- **Accuracy**: The `DISTINCT` count prevents double-counting questions that may belong to multiple targeted exams.

**Return Value:**

Returns a table with the following columns:

| Column Name           | Data Type | Description                                                     |
| :-------------------- | :-------- | :-------------------------------------------------------------- |
| `subject_id`          | `uuid`    | The unique identifier for the subject.                          |
| `exam_specific_count` | `bigint`  | The total number of unique verified questions for that subject. |

**Example Usage (Frontend):**

```typescript
//
const { data, error } = await supabase.rpc('get_exam_subject_counts', {
    target_exams: ['GATE', 'ESE'],
});
```

### Function: `get_topic_counts(p_subject_id uuid)`

**Purpose:**
Retrieves a granular breakdown of verified question counts for every topic associated with a specific subject. This function is primarily used to power the **Topic Test** selection screen, enabling users to see both the total number of available questions and how many of those they have not yet attempted in their current user version.

---

### Arguments:

| Field Name     | Data Type | Description                                                                          |
| :------------- | :-------- | :----------------------------------------------------------------------------------- |
| `p_subject_id` | `uuid`    | The unique identifier of the subject (e.g., Operating Systems) to filter topics for. |

---

### Logic Flow:

1. **User Version Resolution**
    - The function first retrieves the current user's `version_number` from the `users` table using `auth.uid()`.
    - This ensures question attempt tracking is scoped correctly per user version.

2. **Subject Filtering**
    - Queries the `questions` table and filters records by the provided `p_subject_id`.

3. **Data Cleaning**
    - Excludes questions where `topic IS NULL`, ensuring only valid syllabus topics are included.

4. **Verification Filter**
    - Only includes questions where `verified = true`, ensuring unvetted content does not affect counts.

5. **Total Question Count**
    - Groups results by `topic` and computes `COUNT(*)` to determine total verified questions per topic.

6. **Unattempted Question Calculation**
    - For each question, checks `user_question_activity` to determine whether the current user (and version) has attempted it.
    - Uses a `NOT EXISTS` filter to count only **unattempted questions per topic**.

7. **Grouping & Aggregation**
    - Results are grouped by `q.topic` to produce per-topic summaries.

8. **Contextual Mapping**
    - The original `p_subject_id` is returned in each row as `subject_id` for frontend state mapping.

---

### Key Behaviors & Guarantees:

- **Prevents Empty Tests:**
  The inclusion of `unattempted_count` ensures the UI can prevent users from starting a Topic Test with zero available (unattempted) questions.

- **Accurate Progress Tracking:**
  Counts are scoped to both `auth.uid()` and `user_version_number`, ensuring user progress isolation across versions.

- **Content Integrity:**
  Only `verified` questions contribute to counts, maintaining dataset quality.

- **Version-Safe Logic:**
  User activity is segmented by `user_version_number`, preventing cross-version contamination of attempt history.

- **Scalable Design:**
  Relies on indexed fields (`subject_id`, `verified`, `user_id`, `question_id`) for efficient aggregation at scale.

---

### Return Value:

The function returns a table with the following structure:

| Column Name         | Data Type | Description                                                                 |
| :------------------ | :-------- | :-------------------------------------------------------------------------- |
| `topic`             | `text`    | The name of the syllabus topic (e.g., "CPU Scheduling").                    |
| `question_count`    | `bigint`  | Total number of verified questions available for the topic.                 |
| `unattempted_count` | `bigint`  | Number of verified questions the user has NOT attempted in current version. |
| `subject_id`        | `uuid`    | The ID of the parent subject for frontend mapping.                          |

---

### Example SQL Usage:

```sql
-- Fetch topic counts with user-specific unattempted breakdown
SELECT *
FROM get_topic_counts('22222222-2222-2222-2222-000000000009');
```

---

### Example Frontend Integration:

```typescript
const { data, error } = await supabase.rpc('get_topic_counts', {
    p_subject_id: 'your-subject-uuid',
});
```

### Function: `get_critical_question_count(p_valid_subjects uuid[])`

**Purpose:** Returns the total count of verified, overdue questions currently in the user's personal mistake queue (`user_incorrect_queue`). This function is used to display "Critical" or "Action Needed" badges on the dashboard, helping users identify exactly how many questions require immediate attention based on their spaced-repetition schedule.

**Arguments:**

| Field Name         | Data Type | Description                                                                       |
| :----------------- | :-------- | :-------------------------------------------------------------------------------- |
| `p_valid_subjects` | `uuid[]`  | An array of subject IDs that are currently active in the user's practice profile. |

---

**Logic Flow:**

1.  **Branch Context Retrieval**:
    - The function first identifies the currently authenticated user via `auth.uid()`.
    - It retrieves the user's active `branch_id` (e.g., 'CS', 'DA') from the `user_goals` table. This ensures that the count only includes mistakes relevant to their current academic focus.

2.  **Queue Filtering**:
    - Queries the `user_incorrect_queue` for records belonging to the user where the `next_review_at` timestamp is less than or equal to `NOW()`.

3.  **Strict Verification Guard**:
    - Joins with the `questions` table to enforce a mandatory `verified = true` check. Questions that were recently unverified or marked as draft are excluded from the "Critical" count to prevent users from reviewing unreliable content.

4.  **Subject & Branch Validation**:
    - **Subject Filter**: Only questions belonging to the `p_valid_subjects` array are counted.
    - **Universal Rule**: Questions from universal subjects (like Mathematics or General Aptitude) are always included.
    - **Core Rule**: For non-universal subjects, the question's metadata `'set'` tag must match the user's active `branch_id`.

5.  **Aggregation**:
    - Uses `COUNT(DISTINCT question_id)` to provide an accurate total of unique questions due for review.

---

**Key Behaviors & Guarantees:**

- **Content Quality Assurance**: By adding the `verified` check, the dashboard count remains a reliable indicator of high-quality work remaining, rather than being inflated by unvetted system data.
- **Dynamic Goal Alignment**: The count automatically adjusts if a user changes their active branch or exams, ensuring they are not prompted to review irrelevant material.
- **Leitner System Support**: Directly integrates with the "Box" system logic by only counting questions that the spaced-repetition algorithm has marked as "due".

**Return Value:**

Returns an `integer` representing the total number of unique, verified, and overdue revision questions.

---

**Example SQL Usage:**

```sql
-- Get count of verified overdue revision questions for active subjects
SELECT get_critical_question_count(
    ARRAY[
        '22222222-2222-2222-2222-000000000001',
        '22222222-2222-2222-2222-000000000002'
    ]::uuid[]
);
```
