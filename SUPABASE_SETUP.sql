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

-- Ensure email column exists in profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;
END $$;

-- Indices for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Create the site_content table
CREATE TABLE IF NOT EXISTS public.site_content (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the member table
CREATE TABLE IF NOT EXISTS public.member (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
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

-- Ensure email_address and other columns exist in member
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='member' AND column_name='email_address') THEN
        ALTER TABLE public.member ADD COLUMN email_address TEXT;
    END IF;
END $$;

-- Add email index for member table
CREATE INDEX IF NOT EXISTS idx_member_email ON public.member(email);
CREATE INDEX IF NOT EXISTS idx_member_verified ON public.member(verified);

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
      WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin')
    )
    OR (
      auth.jwt() ->> 'email' IN (
        'l47idkpro@gmail.com'
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create is_super_admin helper function
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
    OR (
      auth.jwt() ->> 'email' IN (
        'l47idkpro@gmail.com'
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

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email,
    CASE 
      WHEN NEW.email = 'l47idkpro@gmail.com' THEN 'admin'
      ELSE 'member'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to call handle_new_user on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 5. Backfill Existing Users
-- ==========================================
-- Sync existing auth users who don't have a profile yet
INSERT INTO public.profiles (id, full_name, email, role)
SELECT 
  id, 
  COALESCE(raw_user_meta_data ->> 'full_name', email),
  email,
  CASE 
    WHEN email = 'l47idkpro@gmail.com' THEN 'admin'
    ELSE 'member'
  END
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 6. Create Policies
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
-- 6. Storage Setup
-- ==========================================
-- Create the 'images' and 'avatars' buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true), ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for 'images' and 'avatars' buckets
DROP POLICY IF EXISTS "Allow public to view images" ON storage.objects;
CREATE POLICY "Allow public to view images" ON storage.objects FOR SELECT USING (bucket_id IN ('images', 'avatars'));

DROP POLICY IF EXISTS "Allow authenticated to upload images" ON storage.objects;
CREATE POLICY "Allow authenticated to upload images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('images', 'avatars'));

DROP POLICY IF EXISTS "Allow authenticated to update images" ON storage.objects;
CREATE POLICY "Allow authenticated to update images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id IN ('images', 'avatars'));

DROP POLICY IF EXISTS "Allow admins to delete images" ON storage.objects;
CREATE POLICY "Allow admins to delete images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id IN ('images', 'avatars') AND public.is_admin());

-- ==========================================
-- 7. Performance & Indexes
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_participation_member_id ON public.event_participation(member_id);
CREATE INDEX IF NOT EXISTS idx_participation_event_cat ON public.event_participation(event_name, category);

-- ==========================================
-- 8. Support Tickets
-- ==========================================
-- Create the support_tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    user_name TEXT,
    subject TEXT DEFAULT 'Technical Problem',
    message TEXT NOT NULL,
    error_context JSONB DEFAULT NULL,
    status TEXT DEFAULT 'open', -- open, in_progress, resolved, closed
    admin_reply TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for support_tickets
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Trigger for support_tickets updated_at
DROP TRIGGER IF EXISTS on_support_tickets_updated ON public.support_tickets;
CREATE TRIGGER on_support_tickets_updated
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Policies for support_tickets
DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
CREATE POLICY "Users can view own tickets" ON public.support_tickets 
  FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own tickets" ON public.support_tickets;
CREATE POLICY "Users can create own tickets" ON public.support_tickets 
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all tickets" ON public.support_tickets;
CREATE POLICY "Super Admins can manage all tickets" ON public.support_tickets 
  FOR ALL TO authenticated 
  USING (public.is_super_admin());
