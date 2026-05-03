-- Messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Anyone insert korte parbe (anonymous users)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert"
ON messages FOR INSERT
TO anon
WITH CHECK (true);

-- Shudhu admin (authenticated) read & delete korte parbe
CREATE POLICY "Admin can read"
ON messages FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin can delete"
ON messages FOR DELETE
TO authenticated
USING (true);