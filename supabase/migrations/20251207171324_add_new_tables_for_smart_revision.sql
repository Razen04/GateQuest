-- user_incorrect_queue table
CREATE TABLE IF NOT EXISTS user_incorrect_queue (
    user_id UUID REFERENCES users(id),
    question_id UUID REFERENCES questions(id),
    box INT DEFAULT 1,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    next_review_at TIMESTAMPTZ DEFAULT CURRENT_DATE,
    PRIMARY KEY (user_id, question_id)
);

-- index to speed up search of user_id and added_at
CREATE INDEX idx_users_added ON user_incorrect_queue(user_id, added_at);
CREATE INDEX idx_next_reviewed ON user_incorrect_queue(user_id, added_at, next_review_at);

-- weekly_revision_set table
CREATE TYPE revision_status AS ENUM ('pending','started','expired');

CREATE TABLE IF NOT EXISTS weekly_revision_set (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generated_for uuid REFERENCES users(id),
    start_of_week DATE NOT NULL,
    status revision_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    total_questions INT DEFAULT 0,
    correct_count INT DEFAULT 0,
    accuracy NUMERIC(5,2)
);

-- revision_set_questions table
CREATE TABLE IF NOT EXISTS revision_set_questions (
    set_id UUID REFERENCES weekly_revision_set(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id),
    is_correct BOOLEAN,
    time_spent_seconds INT,
    PRIMARY KEY (set_id, question_id)
);

-- Enable RLS for user_incorrect_queue
ALTER TABLE user_incorrect_queue ENABLE ROW LEVEL SECURITY;

-- Enable RLS for weekly_revision_set
ALTER TABLE weekly_revision_set ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_incorrect_queue
-- Create policy to allow only the owner to access their data in user_incorrect_queue
CREATE POLICY user_incorrect_queue_select_policy
    ON user_incorrect_queue
    FOR SELECT
    USING (user_id = auth.uid());  -- Only allow access to rows where user_id matches the authenticated user

-- Create policy to allow only the owner to insert data into user_incorrect_queue
CREATE POLICY user_incorrect_queue_insert_policy
    ON user_incorrect_queue
    FOR INSERT
    WITH CHECK (user_id = auth.uid());  -- Only allow insertion if user_id matches the authenticated user

-- Create policy to allow only the owner to update data in user_incorrect_queue
CREATE POLICY user_incorrect_queue_update_policy
    ON user_incorrect_queue
    FOR UPDATE
    USING (user_id = auth.uid());  -- Only allow updates if user_id matches the authenticated user

-- Create policy to allow only the owner to delete data from user_incorrect_queue
CREATE POLICY user_incorrect_queue_delete_policy
    ON user_incorrect_queue
    FOR DELETE
    USING (user_id = auth.uid());  -- Only allow delete if user_id matches the authenticated user

-- RLS policies for weekly_revision_set
-- Create policy to allow only the owner to access their weekly revision sets
CREATE POLICY weekly_revision_set_select_policy
    ON weekly_revision_set
    FOR SELECT
    USING (generated_for = auth.uid());  -- Only allow access to rows where generated_for matches the authenticated user

-- Create policy to allow only the owner to insert a new weekly revision set
CREATE POLICY weekly_revision_set_insert_policy
    ON weekly_revision_set
    FOR INSERT
    WITH CHECK (generated_for = auth.uid());  -- Only allow insertion if generated_for matches the authenticated user

-- Create policy to allow only the owner to update their weekly revision set
CREATE POLICY weekly_revision_set_update_policy
    ON weekly_revision_set
    FOR UPDATE
    USING (generated_for = auth.uid());  -- Only allow updates if generated_for matches the authenticated user

-- Create policy to allow only the owner to delete their weekly revision set
CREATE POLICY weekly_revision_set_delete_policy
    ON weekly_revision_set
    FOR DELETE
    USING (generated_for = auth.uid());  -- Only allow delete if generated_for matches the authenticated user

    