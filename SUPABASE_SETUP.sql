-- SUPABASE SETUP & SECURITY GUIDE
-- Run these commands in your Supabase SQL Editor to secure your database.

-- ==========================================
-- 1. Create Tables
-- ==========================================

-- Create the profiles table if it doesn't exist
-- This stores additional user information linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  full_name TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the site_content table
CREATE TABLE IF NOT EXISTS public.site_content (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the member table
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

-- Create the event_participation table
CREATE TABLE IF NOT EXISTS public.event_participation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- ==========================================
-- 2. Create Helper Functions
-- ==========================================

-- Function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create is_admin helper function
-- References public.profiles which is now created above
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  -- Check if user is in profiles with admin role OR has hardcoded admin email
  RETURN (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR (
      auth.jwt() ->> 'email' IN (
        'l47idkpro@gmail.com',
        'jarysucksatgames@gmail.com', -- Added your current email for immediate admin access
        'admin@example.com'
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 3. Enabling Row Level Security (RLS)
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participation ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. Create Triggers
-- ==========================================

-- Trigger for site_content
DROP TRIGGER IF EXISTS on_site_content_updated ON public.site_content;
CREATE TRIGGER on_site_content_updated
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Trigger for profiles
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Trigger for member
DROP TRIGGER IF EXISTS on_member_updated ON public.member;
CREATE TRIGGER on_member_updated
  BEFORE UPDATE ON public.member
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Trigger for participation
DROP TRIGGER IF EXISTS on_participation_updated ON public.event_participation;
CREATE TRIGGER on_participation_updated
  BEFORE UPDATE ON public.event_participation
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ==========================================
-- 5. Create Policies
-- ==========================================

-- --- Policies for site_content ---
DROP POLICY IF EXISTS "Allow public read access" ON public.site_content;
CREATE POLICY "Allow public read access" ON public.site_content FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin update access" ON public.site_content;
CREATE POLICY "Allow admin update access" ON public.site_content FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- --- Policies for profiles ---
DROP POLICY IF EXISTS "Allow public read profiles" ON public.profiles;
CREATE POLICY "Allow public read profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
CREATE POLICY "Allow users to update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow admins to manage all profiles" ON public.profiles;
CREATE POLICY "Allow admins to manage all profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_admin());

-- --- Policies for member ---
DROP POLICY IF EXISTS "Allow public read members" ON public.member;
CREATE POLICY "Allow public read members" ON public.member FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow users to insert own member record" ON public.member;
CREATE POLICY "Allow users to insert own member record" ON public.member FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow users to update own member entry" ON public.member;
CREATE POLICY "Allow users to update own member entry" ON public.member FOR UPDATE TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (
  auth.uid() = id AND 
  (CASE WHEN verified IS DISTINCT FROM (SELECT m.verified FROM public.member m WHERE m.id = id) THEN false ELSE true END)
);

DROP POLICY IF EXISTS "Allow admins to manage all members" ON public.member;
CREATE POLICY "Allow admins to manage all members" ON public.member FOR ALL TO authenticated USING (public.is_admin());

-- --- Policies for event_participation ---
DROP POLICY IF EXISTS "Public read participation" ON public.event_participation;
CREATE POLICY "Public read participation" ON public.event_participation FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin manage participation" ON public.event_participation;
CREATE POLICY "Admin manage participation" ON public.event_participation FOR ALL TO authenticated USING (public.is_admin());

-- ==========================================
-- 6. Performance & Indexes
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_participation_member_id ON public.event_participation(member_id);
CREATE INDEX IF NOT EXISTS idx_participation_event_cat ON public.event_participation(event_name, category);
