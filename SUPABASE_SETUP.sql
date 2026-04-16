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
DROP POLICY IF EXISTS "Allow public read access" ON site_content;
CREATE POLICY "Allow public read access" 
ON site_content FOR SELECT 
USING (true);

-- 4. Create a policy to allow only ADMINS to UPDATE the content
-- Replace the emails below with your actual admin emails.
DROP POLICY IF EXISTS "Allow admin update access" ON site_content;
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
-- Remove EC related columns if they exist
ALTER TABLE public.profiles DROP COLUMN IF EXISTS membership_type;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS department;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create is_admin helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) OR (
    (auth.jwt() ->> 'email' = 'l47idkpro@gmail.com' OR auth.jwt() ->> 'email' = 'jarysucksatgames@gmail.com')
    AND (auth.jwt() ->> 'email_verified')::boolean = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create the member table
CREATE TABLE IF NOT EXISTS public.member (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  email_address TEXT,
  phone TEXT,
  school TEXT,
  class TEXT,
  section TEXT,
  roll TEXT,
  photo_url TEXT,
  payment_method TEXT,
  trxnid TEXT,
  bkash_number TEXT,
  verified TEXT DEFAULT 'no',
  member_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Remove EC related columns if they exist
ALTER TABLE public.member DROP COLUMN IF EXISTS membership_type;
ALTER TABLE public.member DROP COLUMN IF EXISTS department;

ALTER TABLE public.member ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
DROP POLICY IF EXISTS "Allow public read profiles" ON profiles;
CREATE POLICY "Allow public read profiles" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;
CREATE POLICY "Allow users to update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow admins to manage all profiles" ON profiles;
CREATE POLICY "Allow admins to manage all profiles" ON profiles FOR ALL TO authenticated USING (is_admin());

-- Policies for member
DROP POLICY IF EXISTS "Allow public read members" ON public.member;
CREATE POLICY "Allow public read members" ON public.member FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow users to manage own member entry" ON public.member;
CREATE POLICY "Allow users to manage own member entry" ON public.member FOR ALL TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow admins to manage all members" ON public.member;
CREATE POLICY "Allow admins to manage all members" ON public.member FOR ALL TO authenticated USING (is_admin());
