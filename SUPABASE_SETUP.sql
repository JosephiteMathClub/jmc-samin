-- SUPABASE SETUP & SECURITY GUIDE
-- Run these commands in your Supabase SQL Editor to secure your database.

-- 1. Create the site_content table if it doesn't exist
CREATE TABLE IF NOT EXISTS site_content (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
-- This is the most important step to prevent unauthorized access.
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy to allow anyone to READ the content
CREATE POLICY "Allow public read access" 
ON site_content FOR SELECT 
USING (true);

-- 4. Create a policy to allow only ADMINS to UPDATE the content
-- Replace the emails below with your actual admin emails.
CREATE POLICY "Allow admin update access" 
ON site_content FOR ALL 
TO authenticated
USING (
  auth.jwt() ->> 'email' IN ('l47idkpro@gmail.com')
)
WITH CHECK (
  auth.jwt() ->> 'email' IN ('l47idkpro@gmail.com')
);

-- 5. Secure the profiles table
-- Ensure the 'role' column exists: ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read profiles" 
ON profiles FOR SELECT 
USING (true);

CREATE POLICY "Allow users to update own profile" 
ON profiles FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow admins to manage all profiles" 
ON profiles FOR ALL 
TO authenticated
USING (
  auth.jwt() ->> 'email' IN ('l47idkpro@gmail.com') OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 6. Secure the members table (if you use one)
-- ALTER TABLE members ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public read" ON members FOR SELECT USING (true);
-- CREATE POLICY "Allow admin write" ON members FOR ALL TO authenticated 
-- USING (auth.jwt() ->> 'email' IN ('l47idkpro@gmail.com', 'jarysucksatgames@gmail.com'));
