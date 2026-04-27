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
DROP POLICY IF EXISTS "Allow admin update access" ON site_content;
CREATE POLICY "Allow admin update access" 
ON site_content FOR ALL 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Secure the profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Clean up unused columns
ALTER TABLE public.profiles DROP COLUMN IF EXISTS name;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS school;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS class;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS section;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS roll;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS intra_events;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS intra_events_chosen;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS membership_type;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS department;

-- Create trigger for profiles
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create is_admin helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  -- Check if user is in profiles with admin role OR has hardcoded admin email
  -- TIP: You can add more emails to the IN list below
  RETURN (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR (
      auth.jwt() ->> 'email' IN (
        'jarysucksatgames@gmail.com', -- Current User
        'admin@example.com'
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create the member table
CREATE TABLE IF NOT EXISTS public.member (
  id UUID PRIMARY KEY,
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
  member_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for member
DROP TRIGGER IF EXISTS on_member_updated ON public.member;
CREATE TRIGGER on_member_updated
  BEFORE UPDATE ON public.member
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

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
-- Users can only INSERT their own record and update NON-SENSITIVE fields
CREATE POLICY "Allow users to insert own member entry" ON public.member FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow users to update own member entry" ON public.member FOR UPDATE TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (
  auth.uid() = id AND 
  (CASE WHEN verified IS DISTINCT FROM (SELECT m.verified FROM public.member m WHERE m.id = id) THEN false ELSE true END)
);

DROP POLICY IF EXISTS "Allow admins to manage all members" ON public.member;
CREATE POLICY "Allow admins to manage all members" ON public.member FOR ALL TO authenticated USING (is_admin());

-- ==========================================
-- Event Participation System
-- ==========================================

CREATE TABLE IF NOT EXISTS public.event_participation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id TEXT NOT NULL, -- Use the formatted JMC-XXXXXX ID
    event_name TEXT NOT NULL,
    category TEXT NOT NULL, -- Primary, Junior, Secondary, Higher Secondary
    position INTEGER DEFAULT NULL, -- 1 for First, 2 for Second, 3 for Third
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key to event_participation if not already present
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'event_participation_member_id_fkey') THEN
        ALTER TABLE public.event_participation 
          ADD CONSTRAINT event_participation_member_id_fkey 
          FOREIGN KEY (member_id) REFERENCES public.member(member_id);
    END IF;
END $$;

ALTER TABLE public.event_participation ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read participation (important for leaderboards/profiles)
DROP POLICY IF EXISTS "Public read participation" ON public.event_participation;
CREATE POLICY "Public read participation" ON public.event_participation 
  FOR SELECT USING (true);

-- Only admins can manage participation
DROP POLICY IF EXISTS "Admin manage participation" ON public.event_participation;
CREATE POLICY "Admin manage participation" ON public.event_participation 
  FOR ALL TO authenticated USING (public.is_admin());

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_participation_member_id ON public.event_participation(member_id);
CREATE INDEX IF NOT EXISTS idx_participation_event_cat ON public.event_participation(event_name, category);

-- Trigger for participation updated_at
DROP TRIGGER IF EXISTS on_participation_updated ON public.event_participation;
CREATE TRIGGER on_participation_updated
  BEFORE UPDATE ON public.event_participation
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
