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
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure avatar_url exists if table was already created
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

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

-- Ensure is_ec exists in member table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='member' AND column_name='is_ec') THEN
        ALTER TABLE public.member ADD COLUMN is_ec BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add email index for member table
CREATE INDEX IF NOT EXISTS idx_member_email ON public.member(email);
CREATE INDEX IF NOT EXISTS idx_member_verified ON public.member(verified);

-- Create the ec_member table
CREATE TABLE IF NOT EXISTS public.ec_member (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  school TEXT DEFAULT 'St Joseph',
  class TEXT,
  section TEXT,
  roll TEXT,
  photo_url TEXT,
  payment_method TEXT,
  trxnid TEXT,
  bkash_number TEXT,
  verified TEXT DEFAULT 'no',
  member_id TEXT UNIQUE,
  is_ec BOOLEAN DEFAULT TRUE,
  department TEXT, -- academics, management, logistics
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure email_address and other columns exist in ec_member
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ec_member' AND column_name='email_address') THEN
        ALTER TABLE public.ec_member ADD COLUMN email_address TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ec_member' AND column_name='department') THEN
        ALTER TABLE public.ec_member ADD COLUMN department TEXT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ec_member_email ON public.ec_member(email);
CREATE INDEX IF NOT EXISTS idx_ec_member_verified ON public.ec_member(verified);

-- Create the admin_audit_logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email TEXT,
  admin_name TEXT,
  action_type TEXT NOT NULL,
  target TEXT,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at);

-- Create the email_confirmations_sent table
CREATE TABLE IF NOT EXISTS public.email_confirmations_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  recipient_class TEXT,
  recipient_section TEXT,
  recipient_roll TEXT,
  subject TEXT NOT NULL,
  body_text TEXT,
  verified_by TEXT, -- email or identifier of the admin who verified
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'sent',
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_email_confirmations_sent_at ON public.email_confirmations_sent(sent_at);

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

-- Create the alumni table for future addition of alumni by super admins
CREATE TABLE IF NOT EXISTS public.alumni (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  email TEXT,
  phone TEXT,
  school TEXT DEFAULT 'St Joseph',
  class TEXT,
  section TEXT,
  roll TEXT,
  photo_url TEXT,
  member_id TEXT UNIQUE,
  is_ec BOOLEAN DEFAULT FALSE,
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alumni_email ON public.alumni(email);

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
ALTER TABLE public.ec_member ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni ENABLE ROW LEVEL SECURITY;

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

-- Trigger for ec_member
DROP TRIGGER IF EXISTS on_ec_member_updated ON public.ec_member;
CREATE TRIGGER on_ec_member_updated
  BEFORE UPDATE ON public.ec_member
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Trigger for participation
DROP TRIGGER IF EXISTS on_participation_updated ON public.event_participation;
CREATE TRIGGER on_participation_updated
  BEFORE UPDATE ON public.event_participation
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Trigger for alumni
DROP TRIGGER IF EXISTS on_alumni_updated ON public.alumni;
CREATE TRIGGER on_alumni_updated
  BEFORE UPDATE ON public.alumni
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
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow admins to manage all members" ON public.member;
CREATE POLICY "Allow admins to manage all members" ON public.member FOR ALL TO authenticated USING (public.is_admin());

-- --- Policies for event_participation ---
DROP POLICY IF EXISTS "Public read participation" ON public.event_participation;
CREATE POLICY "Public read participation" ON public.event_participation FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin manage participation" ON public.event_participation;
CREATE POLICY "Admin manage participation" ON public.event_participation FOR ALL TO authenticated USING (public.is_admin());

-- --- Policies for ec_member ---
DROP POLICY IF EXISTS "Allow public read ec_members" ON public.ec_member;
CREATE POLICY "Allow public read ec_members" ON public.ec_member FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow users to insert own ec_member record" ON public.ec_member;
CREATE POLICY "Allow users to insert own ec_member record" ON public.ec_member FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow users to update own ec_member entry" ON public.ec_member;
CREATE POLICY "Allow users to update own ec_member entry" ON public.ec_member FOR UPDATE TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow admins to manage all ec_members" ON public.ec_member;
CREATE POLICY "Allow admins to manage all ec_members" ON public.ec_member FOR ALL TO authenticated USING (public.is_admin());

-- --- Policies for alumni ---
DROP POLICY IF EXISTS "Allow public read alumni" ON public.alumni;
CREATE POLICY "Allow public read alumni" ON public.alumni FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admins to manage all alumni" ON public.alumni;
CREATE POLICY "Allow admins to manage all alumni" ON public.alumni FOR ALL TO authenticated USING (public.is_admin());

-- --- Policies for admin_audit_logs ---
DROP POLICY IF EXISTS "Allow admins to insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Allow admins to insert audit logs" ON public.admin_audit_logs 
  FOR INSERT TO authenticated 
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow super admins to select audit logs" ON public.admin_audit_logs;
CREATE POLICY "Allow super admins to select audit logs" ON public.admin_audit_logs 
  FOR SELECT TO authenticated 
  USING (public.is_super_admin());

DROP POLICY IF EXISTS "Allow super admins to delete audit logs" ON public.admin_audit_logs;
CREATE POLICY "Allow super admins to delete audit logs" ON public.admin_audit_logs 
  FOR DELETE TO authenticated 
  USING (public.is_super_admin());

-- --- Policies for email_confirmations_sent ---
ALTER TABLE public.email_confirmations_sent ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow admins to select email confirmations" ON public.email_confirmations_sent;
CREATE POLICY "Allow admins to select email confirmations" ON public.email_confirmations_sent 
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Allow admins to insert email confirmations" ON public.email_confirmations_sent;
CREATE POLICY "Allow admins to insert email confirmations" ON public.email_confirmations_sent 
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

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

-- Ensure user_id column exists in support_tickets table if it already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='support_tickets' AND column_name='user_id') THEN
        ALTER TABLE public.support_tickets ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

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

DROP POLICY IF EXISTS "Super Admins can manage all tickets" ON public.support_tickets;
CREATE POLICY "Super Admins can manage all tickets" ON public.support_tickets 
  FOR ALL TO authenticated 
  USING (public.is_super_admin());

-- ==========================================
-- 9. Event & Segment Registration Tables
-- ==========================================

-- Primary Events (Class 3 - 5)
CREATE TABLE IF NOT EXISTS public.primary_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    class TEXT NOT NULL,
    section TEXT NOT NULL,
    roll TEXT NOT NULL,
    bkash_number TEXT NOT NULL,
    trxnid TEXT NOT NULL UNIQUE,
    amount INTEGER NOT NULL,
    selected_events TEXT NOT NULL, -- comma-separated list of selected events
    verified TEXT DEFAULT 'no', -- 'no' or 'yes',
    registered_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junior Events (Class 6 - 8)
CREATE TABLE IF NOT EXISTS public.junior_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    class TEXT NOT NULL,
    section TEXT NOT NULL,
    roll TEXT NOT NULL,
    bkash_number TEXT NOT NULL,
    trxnid TEXT NOT NULL UNIQUE,
    amount INTEGER NOT NULL,
    selected_events TEXT NOT NULL,
    verified TEXT DEFAULT 'no',
    registered_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Secondary Events (Class 9 - 10)
CREATE TABLE IF NOT EXISTS public.secondary_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    class TEXT NOT NULL,
    section TEXT NOT NULL,
    roll TEXT NOT NULL,
    bkash_number TEXT NOT NULL,
    trxnid TEXT NOT NULL UNIQUE,
    amount INTEGER NOT NULL,
    selected_events TEXT NOT NULL,
    verified TEXT DEFAULT 'no',
    registered_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Higher Secondary Events (Class 11 - 12)
CREATE TABLE IF NOT EXISTS public.higher_secondary_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    class TEXT NOT NULL,
    section TEXT NOT NULL,
    roll TEXT NOT NULL,
    bkash_number TEXT NOT NULL,
    trxnid TEXT NOT NULL UNIQUE,
    amount INTEGER NOT NULL,
    selected_events TEXT NOT NULL,
    verified TEXT DEFAULT 'no',
    registered_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure user_id, selected_events, and verified columns exist in event tables if they already exist
DO $$
BEGIN
    -- primary_events
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='primary_events' AND column_name='user_id') THEN
        ALTER TABLE public.primary_events ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='primary_events' AND column_name='selected_events') THEN
        ALTER TABLE public.primary_events ADD COLUMN selected_events TEXT NOT NULL DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='primary_events' AND column_name='verified') THEN
        ALTER TABLE public.primary_events ADD COLUMN verified TEXT DEFAULT 'no';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='primary_events' AND column_name='registered_by') THEN
        ALTER TABLE public.primary_events ADD COLUMN registered_by TEXT;
    END IF;

    -- junior_events
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='junior_events' AND column_name='user_id') THEN
        ALTER TABLE public.junior_events ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='junior_events' AND column_name='selected_events') THEN
        ALTER TABLE public.junior_events ADD COLUMN selected_events TEXT NOT NULL DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='junior_events' AND column_name='verified') THEN
        ALTER TABLE public.junior_events ADD COLUMN verified TEXT DEFAULT 'no';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='junior_events' AND column_name='registered_by') THEN
        ALTER TABLE public.junior_events ADD COLUMN registered_by TEXT;
    END IF;

    -- secondary_events
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='secondary_events' AND column_name='user_id') THEN
        ALTER TABLE public.secondary_events ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='secondary_events' AND column_name='selected_events') THEN
        ALTER TABLE public.secondary_events ADD COLUMN selected_events TEXT NOT NULL DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='secondary_events' AND column_name='verified') THEN
        ALTER TABLE public.secondary_events ADD COLUMN verified TEXT DEFAULT 'no';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='secondary_events' AND column_name='registered_by') THEN
        ALTER TABLE public.secondary_events ADD COLUMN registered_by TEXT;
    END IF;

    -- higher_secondary_events
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='higher_secondary_events' AND column_name='user_id') THEN
        ALTER TABLE public.higher_secondary_events ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='higher_secondary_events' AND column_name='selected_events') THEN
        ALTER TABLE public.higher_secondary_events ADD COLUMN selected_events TEXT NOT NULL DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='higher_secondary_events' AND column_name='verified') THEN
        ALTER TABLE public.higher_secondary_events ADD COLUMN verified TEXT DEFAULT 'no';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='higher_secondary_events' AND column_name='registered_by') THEN
        ALTER TABLE public.higher_secondary_events ADD COLUMN registered_by TEXT;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.primary_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.junior_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secondary_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.higher_secondary_events ENABLE ROW LEVEL SECURITY;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS on_primary_events_updated ON public.primary_events;
CREATE TRIGGER on_primary_events_updated BEFORE UPDATE ON public.primary_events FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS on_junior_events_updated ON public.junior_events;
CREATE TRIGGER on_junior_events_updated BEFORE UPDATE ON public.junior_events FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS on_secondary_events_updated ON public.secondary_events;
CREATE TRIGGER on_secondary_events_updated BEFORE UPDATE ON public.secondary_events FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS on_higher_secondary_events_updated ON public.higher_secondary_events;
CREATE TRIGGER on_higher_secondary_events_updated BEFORE UPDATE ON public.higher_secondary_events FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Policies for public reading and user operations
DROP POLICY IF EXISTS "Allow users to view own primary_events" ON public.primary_events;
DROP POLICY IF EXISTS "Allow users to insert own primary_events" ON public.primary_events;
DROP POLICY IF EXISTS "Allow admins to manage primary_events" ON public.primary_events;
CREATE POLICY "Allow users to view own primary_events" ON public.primary_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Allow users to insert own primary_events" ON public.primary_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow admins to manage primary_events" ON public.primary_events FOR ALL TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Allow users to view own junior_events" ON public.junior_events;
DROP POLICY IF EXISTS "Allow users to insert own junior_events" ON public.junior_events;
DROP POLICY IF EXISTS "Allow admins to manage junior_events" ON public.junior_events;
CREATE POLICY "Allow users to view own junior_events" ON public.junior_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Allow users to insert own junior_events" ON public.junior_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow admins to manage junior_events" ON public.junior_events FOR ALL TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Allow users to view own secondary_events" ON public.secondary_events;
DROP POLICY IF EXISTS "Allow users to insert own secondary_events" ON public.secondary_events;
DROP POLICY IF EXISTS "Allow admins to manage secondary_events" ON public.secondary_events;
CREATE POLICY "Allow users to view own secondary_events" ON public.secondary_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Allow users to insert own secondary_events" ON public.secondary_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow admins to manage secondary_events" ON public.secondary_events FOR ALL TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Allow users to view own higher_secondary_events" ON public.higher_secondary_events;
DROP POLICY IF EXISTS "Allow users to insert own higher_secondary_events" ON public.higher_secondary_events;
DROP POLICY IF EXISTS "Allow admins to manage higher_secondary_events" ON public.higher_secondary_events;
CREATE POLICY "Allow users to view own higher_secondary_events" ON public.higher_secondary_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Allow users to insert own higher_secondary_events" ON public.higher_secondary_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow admins to manage higher_secondary_events" ON public.higher_secondary_events FOR ALL TO authenticated USING (public.is_admin());

-- Public SELECT policies for service role and verification (CRITICAL for admin approval verification)
DROP POLICY IF EXISTS "Allow public read primary_events" ON public.primary_events;
CREATE POLICY "Allow public read primary_events" ON public.primary_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read junior_events" ON public.junior_events;
CREATE POLICY "Allow public read junior_events" ON public.junior_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read secondary_events" ON public.secondary_events;
CREATE POLICY "Allow public read secondary_events" ON public.secondary_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read higher_secondary_events" ON public.higher_secondary_events;
CREATE POLICY "Allow public read higher_secondary_events" ON public.higher_secondary_events FOR SELECT USING (true);

-- STORAGE BUCKETS (Run these in the SQL Editor if buckets are missing)
-- NOTE: Supabase storage buckets cannot always be created via public SQL schema commands depending on permissions.
-- Better to create them in the Supabase Dashboard -> Storage -> New Bucket.
-- Create 'avatars' and 'images' buckets and set them to PUBLIC.


-- ==========================================
-- 10. Challenges & Submissions Tables
-- ==========================================

-- Challenges table
CREATE TABLE IF NOT EXISTS public.challenges (
    id TEXT PRIMARY KEY DEFAULT 'active',
    title TEXT NOT NULL,
    description TEXT,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    published BOOLEAN DEFAULT FALSE,
    deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for challenges
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Triggers for challenges updated_at
DROP TRIGGER IF EXISTS on_challenges_updated ON public.challenges;
CREATE TRIGGER on_challenges_updated BEFORE UPDATE ON public.challenges FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Policies for challenges
DROP POLICY IF EXISTS "Allow public read challenges" ON public.challenges;
CREATE POLICY "Allow public read challenges" ON public.challenges FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admins to manage challenges" ON public.challenges;
CREATE POLICY "Allow admins to manage challenges" ON public.challenges FOR ALL TO authenticated USING (public.is_admin());


-- Challenge Submissions table
CREATE TABLE IF NOT EXISTS public.challenge_submissions (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    member_id TEXT,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    auto_score INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 0,
    graded_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'pending', -- pending, published
    final_score INTEGER DEFAULT 0,
    feedback TEXT DEFAULT '',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_challenge_submissions_email ON public.challenge_submissions(email);
CREATE INDEX IF NOT EXISTS idx_challenge_submissions_status ON public.challenge_submissions(status);

-- Enable RLS for submissions
ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;

-- Policies for submissions
DROP POLICY IF EXISTS "Allow public / users to insert submissions" ON public.challenge_submissions;
CREATE POLICY "Allow public / users to insert submissions" ON public.challenge_submissions FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow users to view own submissions" ON public.challenge_submissions;
CREATE POLICY "Allow users to view own submissions" ON public.challenge_submissions FOR SELECT USING (
    lower(email) = lower(auth.jwt() ->> 'email') OR public.is_admin()
);

DROP POLICY IF EXISTS "Allow admins to update submissions" ON public.challenge_submissions;
CREATE POLICY "Allow admins to update submissions" ON public.challenge_submissions FOR UPDATE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Allow super admins to delete submissions" ON public.challenge_submissions;
CREATE POLICY "Allow super admins to delete submissions" ON public.challenge_submissions FOR DELETE TO authenticated USING (public.is_super_admin());


-- ==========================================
-- 11. SMS History & Notification Logging Note
-- ==========================================
-- SMS dispatches, including successful and failed deliveries, are securely logged
-- in the `public.email_confirmations_sent` table. SMS records are identified by subjects
-- prefixed with '[SMS] ' or recipients without '@' characters. Privacy is strictly respected
-- by masking phone numbers in public and admin UI views.


-- ==========================================
-- 12. System Settings & Form Enhancements
-- ==========================================

-- System Settings table for app configuration, registration targets, and feature flags
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure RLS is enabled for system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to system settings" ON public.system_settings;
CREATE POLICY "Allow public read access to system settings" ON public.system_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admins to insert/update system settings" ON public.system_settings;
CREATE POLICY "Allow admins to insert/update system settings" ON public.system_settings FOR ALL USING (public.is_admin());

-- Insert default system settings if missing
INSERT INTO public.system_settings (key, value) VALUES
  ('event_registration_enabled', 'true'::jsonb),
  ('visit_intra_enabled', 'true'::jsonb),
  ('visit_inter_enabled', 'true'::jsonb),
  ('inter_registration_enabled', 'true'::jsonb),
  ('primary_registration_target', '"inter"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Ensure gender and verified_by exist in event tables
DO $$
BEGIN
    -- primary_events
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='primary_events' AND column_name='gender') THEN
        ALTER TABLE public.primary_events ADD COLUMN gender TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='primary_events' AND column_name='verified_by') THEN
        ALTER TABLE public.primary_events ADD COLUMN verified_by TEXT;
    END IF;

    -- junior_events
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='junior_events' AND column_name='gender') THEN
        ALTER TABLE public.junior_events ADD COLUMN gender TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='junior_events' AND column_name='verified_by') THEN
        ALTER TABLE public.junior_events ADD COLUMN verified_by TEXT;
    END IF;

    -- secondary_events
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='secondary_events' AND column_name='gender') THEN
        ALTER TABLE public.secondary_events ADD COLUMN gender TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='secondary_events' AND column_name='verified_by') THEN
        ALTER TABLE public.secondary_events ADD COLUMN verified_by TEXT;
    END IF;

    -- higher_secondary_events
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='higher_secondary_events' AND column_name='gender') THEN
        ALTER TABLE public.higher_secondary_events ADD COLUMN gender TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='higher_secondary_events' AND column_name='verified_by') THEN
        ALTER TABLE public.higher_secondary_events ADD COLUMN verified_by TEXT;
    END IF;
END $$;


