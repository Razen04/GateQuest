-- Creating Donation Table
CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    anonymous BOOLEAN DEFAULT FALSE,
    message VARCHAR(100),
    suggested_amount NUMERIC(10,2),
    actual_amount NUMERIC(10,2),
    utr TEXT UNIQUE,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ NULL
);

-- For Performace
CREATE INDEX idx_donations_utr ON donations (utr); -- To look using UTR for the admin
CREATE INDEX idx_donations_verified ON donations (verified); -- To look using verified status of the donation to show up on Supporter List

-- Adding RLS poilcies
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Reading this table is allowed for everyone
CREATE POLICY "Allow select for everyone"
ON donations
FOR SELECT
USING (true);

-- Creation is allowed for both Guest and Logged in users
CREATE POLICY "Allow insertion for Guest and Logged in users"
ON donations
FOR INSERT
WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    (auth.uid() IS NULL AND user_id IS NULL)
);