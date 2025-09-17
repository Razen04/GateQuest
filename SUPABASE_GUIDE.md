# Supabase Contribution Guide

This document explains how contributors should work with the **Supabase backend** for GATEQuest. Our workflow is **local-first**, meaning you will run a complete and private Supabase environment on your own machine using Docker.

## 🌳 Environments

We use **two shared cloud environments**:

- **Production:** The live app used by real users. _Only maintainers deploy to this._
- **Staging:** A shared testing ground that mirrors production. _Maintainers deploy to this after reviewing a PR._

Contributors **never** access these directly.

## 🔧 Prerequisites

- Git and a code editor.
- Node.js & npm/pnpm installed.
- **Docker Desktop**: Must be installed and **running** in the background.
- **Supabase CLI**: Must be installed and up-to-date. See the [official installation guide](https://supabase.com/docs/guides/cli/getting-started).

## 💻 Local Setup for Contributors

This process creates a complete, private copy of the Supabase backend on your machine, including pre-filled test data.

### 1\. Fork and Clone the Repo

> **Important:** First, fork the main GATEQuest repository to your own GitHub account. Then, clone **your fork**, not the original repository.

```bash
git clone https://github.com/<your-username>/GATEQuest.git
cd GATEQuest
```

### 2\. Start the Local Supabase Environment

This single command starts all Supabase services (database, auth, etc.) inside Docker. It will also automatically run all database migrations and populate your database with essential test data.

```bash
supabase start
```

The first time you run this, it may take a few minutes to download the required Docker images.

### 3\. Set Your Environment Variables

Your React app needs to connect to your new local Supabase instance.

1.  Get your local Supabase credentials by running:
    ```bash
    supabase status
    ```
2.  This will display your local **API URL** and **anon key**.
3.  Create a new file named `.env.local` in the project root. You can do this by copying the `.env.example` file.
4.  Paste the local URL and anon key into your `.env.local` file.

### 4\. Run the Application

You're all set\! Now you can run the front-end application.

```bash
npm run dev
```

### 5\. Log In to the App

Your app will be running on `localhost`. To log in:

1.  Navigate to the login page.
2.  Look for a red-bordered **"Dev Tools"** section.
3.  Click the **"Log In (Local Dev)"** button to sign in as the pre-configured test user (`test@example.com`).

---

## 🌱 Making Schema Changes

Follow this process if your contribution requires changing the database (e.g., adding a table, column, or RLS policy). **Do not** use the local Supabase Studio UI to make schema changes.

### 1\. Create a New Migration File

Tell the CLI you want to make a new schema change. Use a descriptive name.

```bash
# Example:
supabase migration new add_user_achievements
```

This creates a new, empty SQL file in the `supabase/migrations/` directory.

### 2\. Write Your SQL

Open the new file and write the SQL commands for your change.

```sql
-- Example: <timestamp>_add_user_achievements.sql
CREATE TABLE public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    achievement_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own achievements"
ON public.achievements FOR SELECT
USING (auth.uid() = user_id);
```

### 3\. Test Your Migration Locally

To apply your new migration, reset the local database. This is a safe operation that only affects your machine.

```bash
supabase db reset
```

This command wipes your local database and then re-applies **all** migrations from the beginning, including your new one, followed by the test data from `seed.sql`. This is the best way to ensure your migration works correctly.

### 4\. Commit Your Changes

Commit the new migration file along with any other code changes. The migration file is now part of your contribution.

---

## 🚑 Troubleshooting

- **If you get a `500 Internal Server Error` or your local services act strangely:** The most reliable fix is to completely reset the Docker containers.
    ```bash
    supabase stop --no-backup
    supabase start
    ```
- **If you mess up your local data and want a clean slate:** The `db reset` command is your best friend.
    ```bash
    supabase db reset
    ```

---

## 🧑‍💻 Maintainer Workflow (Deploying Migrations)

This section is for project maintainers.

1.  Review and merge the contributor's Pull Request containing the new migration file.
2.  Pull the latest changes to your local `main` branch.
3.  Link the CLI to the **Staging** project and push the new migrations.
    ```bash
    supabase link --project-ref <staging-project-ref>
    supabase db push
    ```
4.  Thoroughly test the feature on the Staging environment.
5.  Once verified, link to the **Production** project and push the same migrations.
    ```bash
    # IMPORTANT: Take a database backup from the dashboard before pushing to production.
    supabase link --project-ref <production-project-ref>
    supabase db push
    ```
