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

### Function: `user_question_activity_batch(batch jsonb)`

- **Purpose:**
    - This function processes a batch of user question attempts and records each attempt in the `user_question_activity` table. It also updates the `user_incorrect_queue` table based on whether the user answered correctly or incorrectly. The function supports batch processing for efficiency and ensures atomicity via transactions.

- **Arguments:**
    - **batch (jsonb):** A JSON array containing multiple question attempt records. Each record should include the following fields:
        - `user_id` (uuid): The ID of the user attempting the questions.
        - `question_id` (uuid): The ID of the question.
        - `subject` (string): The subject of the question.
        - `is_correct` (boolean): Whether the user answered correctly.
        - `time_taken` (int): The time (in seconds) taken to answer the question.
        - `attempted_at` (timestamptz): The timestamp of when the question was attempted.

- **Logic:**
    - **Transaction Handling:** The entire process runs within a transaction to ensure that either all inserts/updates succeed or none of them are applied in case of failure.
    - **Batch Processing:** The function processes each question attempt in the provided `batch` and inserts records into the `user_question_activity` table, calculating the `attempt_number` for each attempt.
    - **Updating the Queue:** Based on whether the answer was correct or incorrect, the function updates the `user_incorrect_queue` table. Correct answers move questions up in the queue, and incorrect answers move them back to box 1.
    - **New Questions:** If the question is not already in the queue, it is inserted into box 1.
    - **Error Handling:** If anything goes wrong during the process, the transaction is rolled back, ensuring no partial data changes.

- **Return Value:**
    - **None.**

- **Example:**
  Given a batch of questions attempted, this function processes them and updates the database accordingly. If the question is answered correctly, the question's box is updated or removed if it reaches box 3. If answered incorrectly, it moves back to box 1.

- **Exceptions:**
    - If an error occurs at any point in the function (e.g., issue with database insert/update), the transaction is rolled back, and no changes are persisted.

### Function: `refresh_question_peer_stats()`

- **Purpose:** To calculate and update the aggregate statistics in the `question_peer_stats` table.
- **Arguments:** None.
- **Logic:** It queries the `user_question_activity` table, grouping by `question_id` to calculate the total attempts, correct/wrong counts, and average time taken for first attempts (`attempt_number = 1`). It then uses `ON CONFLICT DO UPDATE` to either insert a new stats row or update an existing one for each question.
- **Security:** This function is `SECURITY DEFINER`, meaning it runs with the permissions of the user who defined it (the database owner), allowing it to safely read all activity data to generate accurate stats.

### Function: `generate_weekly_revision_set()`

- **Purpose**: To generate a weekly revision set for a user based on their progress in the `user_incorrect_queue` table. This function selects questions for revision, prioritizing based on the Leitner lite system (3-box system) and ranks them to ensure the most relevant questions are reviewed first. It creates a new revision set for the week if one doesn't already exist.
- **Arguments**: None: This function does not accept any external parameters. It derives the user ID (v_user_id) from the current authenticated user using `auth.uid()`.
- **Logic**:
    - **Authentication Check**: The function first checks if the user is authenticated. If not, it raises an exception.
    - **Start of the Week Calculation**: It calculates the start of the current week (Sunday) to prevent generating multiple revision sets for the same week.
    - **Existing Set Check**: It checks if a revision set has already been created for the user for the current week. If found, it returns the existing set ID and a message.
    - **Creating New Revision Set**: If no set exists, it inserts a new entry in the `weekly_revision_set` table with a status of pending.
    - **Populating Revision Set**:
        - The function selects questions from the `user_incorrect_queue` table that are due for review (i.e., next_review_at is less than or equal to the current date).
        - It then ranks the questions within each box using `ROW_NUMBER()`, ensuring that the questions from _box 3_ are given priority, followed by _box 2_, and then _box 1_.
        - A maximum of 30 questions are selected to populate the revision set.
    - **Return**: The function returns a JSON object with the `set_id`, `status`, the count of questions added to the set, and a success message.
- **Return Value**:
    - A `json` object containing:
        - **set_id**: The ID of the generated or existing weekly revision set.
        - **status**: Either existing (if the set already exists) or created (if a new set is generated).
        - **questions_count**: The number of questions added to the revision set.
        - **message**: A message indicating whether the set was newly created or already exists.
- **Example**:
    ```json
    {
        "set_id": "uuid",
        "status": "created",
        "questions_count": 30,
        "message": "Generated new smart revision set."
    }
    ```
- **Exceptions**:
    - If the user is not authenticated, an exception is raised with the message Not authenticated.
    - If an error occurs during the function execution, a general error message is raised.

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
