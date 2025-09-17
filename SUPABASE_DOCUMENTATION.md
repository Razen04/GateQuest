# GATEQuest Supabase Documentation

Welcome to the GATEQuest database documentation. This document provides a detailed overview of the PostgreSQL schema, custom functions, and security policies that power the application, all managed by Supabase.

## 🏛️ Core Entities & Relationships

The database is designed around a few core concepts. Understanding their relationships is key to understanding the application.

- **`users`**: Stores the public-facing profiles for everyone who signs up. This is linked to Supabase's private `auth.users` table.
- **`questions`**: Contains all the GATE exam questions. This is the central content of the app.
- **`user_question_activity`**: Acts as a logbook. Every time a user attempts a question, a record is created here, linking a `user` to a `question`.
- **`question_peer_stats`**: An aggregate table that stores statistics (like average time, correct attempts) for each question, calculated from the `user_question_activity` data.
- **`question_reports`**: Allows users to report issues with specific questions.
- **`notifications`**: A simple table for storing in-app notifications for users.

---

## 📖 Table Reference

This section provides a detailed breakdown of each table in the `public` schema.

### Table: `public.users`

Stores public profile information for authenticated users. This table is linked 1-to-1 with the private `auth.users` table.

| Column Name          | Data Type     | Constraints & Defaults                          | Description                                                                  |
| :------------------- | :------------ | :---------------------------------------------- | :--------------------------------------------------------------------------- |
| `id`                 | `uuid`        | `PRIMARY KEY`, `NOT NULL`, `DEFAULT auth.uid()` | The user's unique ID. This is a foreign key that references `auth.users.id`. |
| `joined_at`          | `timestamptz` | `NOT NULL`, `DEFAULT now()`                     | The timestamp when the user profile was created.                             |
| `email`              | `text`        | `NULL` allowed                                  | The user's email address.                                                    |
| `name`               | `text`        | `NULL` allowed                                  | The user's full display name.                                                |
| `avatar`             | `text`        | `NULL` allowed                                  | A URL to the user's profile picture.                                         |
| `show_name`          | `boolean`     | `DEFAULT true`                                  | A setting to control if the user's real name is shown publicly.              |
| `total_xp`           | `integer`     | `DEFAULT 0`                                     | The total experience points the user has accumulated.                        |
| `settings`           | `jsonb`       | `NULL` allowed                                  | A JSON object for storing user-specific settings.                            |
| `college`            | `text`        | `NULL` allowed                                  | The name of the user's college or institution.                               |
| `"targetYear"`       | `integer`     | `NULL` allowed                                  | The user's target year for the GATE exam.                                    |
| `bookmark_questions` | `jsonb`       | `NULL` allowed                                  | A JSON object for storing IDs of bookmarked questions.                       |

**Row Level Security (RLS) Policies:**

- **Policy:** A user can view, insert, or update their own row in the `users` table. They cannot access anyone else's.
- **SQL Logic:** `USING (auth.uid() = id) WITH CHECK (auth.uid() = id)`

---

### Table: `public.questions`

Contains the full details for every question in the GATEQuest database.

| Column Name       | Data Type     | Constraints & Defaults                                 | Description                                                                                                                             |
| :---------------- | :------------ | :----------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------- |
| `id`              | `uuid`        | `PRIMARY KEY`, `NOT NULL`, `DEFAULT gen_random_uuid()` | The unique identifier for the question.                                                                                                 |
| `year`            | `integer`     | `NOT NULL`                                             | The year the question appeared in the GATE exam.                                                                                        |
| `question_number` | `integer`     | `NULL` allowed                                         | The original question number from the exam paper.                                                                                       |
| `subject`         | `text`        | `NOT NULL`                                             | The main subject of the question (e.g., "Quantitative Aptitude").                                                                       |
| `topic`           | `text`        | `NULL` allowed                                         | The specific topic within the subject (e.g., "Logarithms").                                                                             |
| `question_type`   | `text`        | `NOT NULL`                                             | The type of question (e.g., "multiple-choice", "numerical").                                                                            |
| `question`        | `text`        | `NOT NULL`                                             | The full text of the question, can include Markdown/HTML.                                                                               |
| `options`         | `text[]`      | `NULL` allowed                                         | An array of strings representing the choices for multiple-choice questions.                                                             |
| `correct_answer`  | `jsonb`       | `NOT NULL`                                             | A JSON object containing the correct answer(s). For MCQ, this is typically an array with the index of the correct option (e.g., `[2]`). |
| `answer_text`     | `text`        | `NULL` allowed                                         | A textual representation of the answer for non-MCQ types.                                                                               |
| `difficulty`      | `text`        | `NULL` allowed                                         | The difficulty level (e.g., 'Easy', 'Medium', 'Hard').                                                                                  |
| `marks`           | `integer`     | `NULL` allowed                                         | The number of marks the question is worth.                                                                                              |
| `tags`            | `text[]`      | `NULL` allowed                                         | An array of strings for tagging and categorization.                                                                                     |
| `source`          | `text`        | `NULL` allowed                                         | The original source of the question (e.g., "gateoverflow").                                                                             |
| `source_url`      | `text`        | `NULL` allowed                                         | A URL to the original question source.                                                                                                  |
| `added_by`        | `text`        | `NULL` allowed                                         | Identifier for who added the question to the database.                                                                                  |
| `verified`        | `boolean`     | `DEFAULT false`                                        | A flag to indicate if the question has been verified for accuracy.                                                                      |
| `explanation`     | `text`        | `NULL` allowed                                         | A detailed explanation or solution for the question.                                                                                    |
| `metadata`        | `jsonb`       | `NULL` allowed                                         | A JSON object for any extra metadata.                                                                                                   |
| `created_at`      | `timestamptz` | `DEFAULT now()`                                        | The timestamp when the question was added to the database.                                                                              |

**Row Level Security (RLS) Policies:**

- **Policy:** Anyone, including logged-out users, can read questions.
- **SQL Logic:** `FOR SELECT USING (true)`

---

### Table: `public.user_question_activity`

Logs every attempt a user makes on a question. This table is crucial for tracking progress and calculating statistics.

| Column Name      | Data Type     | Constraints & Defaults                                 | Description                                                                                                               |
| :--------------- | :------------ | :----------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ |
| `id`             | `uuid`        | `PRIMARY KEY`, `NOT NULL`, `DEFAULT gen_random_uuid()` | The unique identifier for this specific attempt.                                                                          |
| `user_id`        | `uuid`        | `NULL` allowed                                         | Foreign key that references `public.users.id`. The user who made the attempt.                                             |
| `question_id`    | `text`        | `NULL` allowed                                         | The ID of the question that was attempted. **Note:** This should likely be a `uuid` with a foreign key to `questions.id`. |
| `subject`        | `text`        | `NULL` allowed                                         | The subject of the question at the time of the attempt.                                                                   |
| `was_correct`    | `boolean`     | `NULL` allowed                                         | `true` if the user's answer was correct, `false` otherwise.                                                               |
| `time_taken`     | `bigint`      | `NULL` allowed                                         | The time in seconds the user took to answer.                                                                              |
| `attempted_at`   | `timestamptz` | `DEFAULT now()`                                        | The timestamp of when the attempt was made.                                                                               |
| `attempt_number` | `bigint`      | `NULL` allowed                                         | The attempt number for this user on this specific question (1 for the first time, 2 for the second, etc.).                |

**Relationships:**

- Many-to-One: `user_question_activity.user_id` references `public.users.id`.

**Row Level Security (RLS) Policies:**

- **Insert Policy:** A user can only insert activity logs for themselves.
- **SQL Logic:** `FOR INSERT WITH CHECK (auth.uid() = user_id)`
- **Select Policy:** A user can only read their own activity logs.
- **SQL Logic:** `FOR SELECT USING (auth.uid() = user_id)`

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

---

### Table: `public.question_reports`

Allows authenticated users to report problems with questions.

| Column Name   | Data Type   | Constraints & Defaults                                  | Description                                                                 |
| :------------ | :---------- | :------------------------------------------------------ | :-------------------------------------------------------------------------- |
| `id`          | `uuid`      | `PRIMARY KEY`, `NOT NULL`, `DEFAULT uuid_generate_v4()` | The unique identifier for the report.                                       |
| `user_id`     | `uuid`      | `NOT NULL`                                              | Foreign key referencing `public.users.id`. The user who filed the report.   |
| `question_id` | `uuid`      | `NULL` allowed                                          | Foreign key referencing `public.questions.id`. The question being reported. |
| `report_type` | `text`      | `NULL` allowed                                          | The category of the report (e.g., 'Incorrect Answer', 'Typo').              |
| `report_text` | `text`      | `NOT NULL`                                              | The user's detailed description of the issue.                               |
| `status`      | `text`      | `DEFAULT 'pending'`                                     | The status of the report (e.g., 'pending', 'resolved').                     |
| `created_at`  | `timestamp` | `DEFAULT now()`                                         | The timestamp when the report was created.                                  |

**Relationships:**

- Many-to-One: `question_reports.user_id` references `public.users.id`.
- Many-to-One: `question_reports.question_id` references `public.questions.id`.

**Row Level Security (RLS) Policies:**

- **Policy:** Only authenticated users can create a report for their own user ID.
- **SQL Logic:** `FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)`

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

---

## 🚀 Database Functions

Custom SQL functions to handle complex logic directly in the database.

### Function: `insert_user_question_activity_batch(batch jsonb)`

- **Purpose:** To efficiently insert multiple user activity records at once. This is more performant than making many individual API calls from the client.
- **Arguments:** Takes a single `jsonb` argument named `batch`, which should be a JSON array of activity objects.
- **Logic:** It loops through each object in the `batch` array and performs an `INSERT` into the `user_question_activity` table. It automatically calculates the `attempt_number` for each user on each question.

### Function: `refresh_question_peer_stats()`

- **Purpose:** To calculate and update the aggregate statistics in the `question_peer_stats` table.
- **Arguments:** None.
- **Logic:** It queries the `user_question_activity` table, grouping by `question_id` to calculate the total attempts, correct/wrong counts, and average time taken for first attempts (`attempt_number = 1`). It then uses `ON CONFLICT DO UPDATE` to either insert a new stats row or update an existing one for each question.
- **Security:** This function is `SECURITY DEFINER`, meaning it runs with the permissions of the user who defined it (the database owner), allowing it to safely read all activity data to generate accurate stats.
