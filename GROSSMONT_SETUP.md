# Grossmont Street Reach - Complete Setup Guide

A comprehensive by-name list and service tracking system for San Diego Rescue Mission's street outreach program in the Grossmont/La Mesa area.

## Quick Start

### 1. Prerequisites

- Node.js 18+
- Supabase account (free tier works)
- Mapbox account (free tier works)
- Vercel account (optional, for deployment)

### 2. Install Dependencies

```bash
cd /Users/danielschacht/Grossmont-Street-Reach
npm install
```

### 3. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token
```

### 4. Database Setup

Run the complete SQL schema below in your Supabase SQL Editor.

### 5. Run Locally

```bash
npm run dev
```

Visit http://localhost:3000

---

## Complete SQL Schema

Run this entire SQL block in Supabase SQL Editor (Project > SQL Editor > New Query):

```sql
-- =====================================================
-- GROSSMONT STREET REACH - COMPLETE DATABASE SCHEMA
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Set timezone to Pacific
ALTER DATABASE postgres SET timezone TO 'America/Los_Angeles';
SET timezone = 'America/Los_Angeles';

-- =====================================================
-- SEQUENCES
-- =====================================================

CREATE SEQUENCE IF NOT EXISTS person_id_seq START 1;

-- =====================================================
-- TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'field_worker')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table for role-based access
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'field_worker')),
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Persons table (by-name list) - MAIN CLIENT TABLE
CREATE TABLE IF NOT EXISTS public.persons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id TEXT UNIQUE NOT NULL DEFAULT 'CL-' || LPAD(nextval('person_id_seq')::TEXT, 6, '0'),

  -- Photo
  photo_url TEXT,

  -- Personal Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  nickname TEXT,
  phone_number TEXT,
  date_of_birth DATE,
  gender TEXT NOT NULL,
  race TEXT NOT NULL,
  ethnicity TEXT,
  sexual_orientation TEXT,
  preferred_language TEXT,
  cultural_lived_experience TEXT,

  -- Origin Location (Where They Were From) - GROSSMONT SPECIFIC
  origin_location TEXT,
  origin_latitude DOUBLE PRECISION,
  origin_longitude DOUBLE PRECISION,

  -- Status Information
  veteran_status BOOLEAN NOT NULL DEFAULT FALSE,
  disability_status BOOLEAN NOT NULL DEFAULT FALSE,
  disability_type TEXT,
  chronic_homeless BOOLEAN NOT NULL DEFAULT FALSE,
  domestic_violence_victim BOOLEAN NOT NULL DEFAULT FALSE,
  chronic_health BOOLEAN NOT NULL DEFAULT FALSE,
  mental_health BOOLEAN NOT NULL DEFAULT FALSE,
  addiction TEXT,
  living_situation TEXT NOT NULL,
  length_of_time_homeless TEXT,
  evictions INTEGER DEFAULT 0,
  income TEXT,
  income_amount NUMERIC(10, 2),
  support_system TEXT,

  -- Program Information
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  case_manager TEXT,
  referral_source TEXT,
  release_of_information BOOLEAN NOT NULL DEFAULT FALSE,

  -- Exit Tracking
  exit_date DATE,
  exit_destination TEXT,
  exit_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Encounters table (service interactions)
CREATE TABLE IF NOT EXISTS public.encounters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  service_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Location (Where They Were Found)
  outreach_location TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,

  -- Outreach Worker
  outreach_worker TEXT NOT NULL,
  language_preference TEXT,
  cultural_notes TEXT,

  -- High Utilizer Flag
  high_utilizer_contact BOOLEAN NOT NULL DEFAULT FALSE,

  -- Clinical Services
  co_occurring_mh_sud BOOLEAN NOT NULL DEFAULT FALSE,
  co_occurring_type TEXT,
  mat_referral BOOLEAN NOT NULL DEFAULT FALSE,
  mat_type TEXT,
  mat_provider TEXT,
  detox_referral BOOLEAN NOT NULL DEFAULT FALSE,
  detox_provider TEXT,

  -- Harm Reduction
  naloxone_distributed BOOLEAN NOT NULL DEFAULT FALSE,
  naloxone_date DATE,
  fentanyl_test_strips_count INTEGER,
  harm_reduction_education BOOLEAN NOT NULL DEFAULT FALSE,

  -- Other Services
  transportation_provided BOOLEAN NOT NULL DEFAULT FALSE,
  shower_trailer BOOLEAN NOT NULL DEFAULT FALSE,
  refused_shelter BOOLEAN DEFAULT FALSE,
  other_services TEXT,

  -- Placement
  placement_made BOOLEAN DEFAULT FALSE,
  placement_location TEXT,
  placement_location_other TEXT,

  -- Notes
  case_management_notes TEXT,
  referral_source TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Status Changes table (tracks exits and returns)
CREATE TABLE IF NOT EXISTS status_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN ('exit', 'return_to_active')),
  change_date DATE NOT NULL DEFAULT CURRENT_DATE,
  exit_destination TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Persons indexes
CREATE INDEX IF NOT EXISTS idx_persons_first_name_trgm ON public.persons USING gin (first_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_persons_last_name_trgm ON public.persons USING gin (last_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_persons_nickname_trgm ON public.persons USING gin (nickname gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_persons_client_id ON public.persons(client_id);
CREATE INDEX IF NOT EXISTS idx_persons_dob ON public.persons(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_persons_exit_date ON public.persons(exit_date);
CREATE INDEX IF NOT EXISTS idx_persons_origin_location ON public.persons(origin_location);
CREATE INDEX IF NOT EXISTS idx_persons_origin_coords ON public.persons(origin_latitude, origin_longitude);

-- Encounters indexes
CREATE INDEX IF NOT EXISTS idx_encounters_person_id ON public.encounters(person_id);
CREATE INDEX IF NOT EXISTS idx_encounters_service_date ON public.encounters(service_date DESC);
CREATE INDEX IF NOT EXISTS idx_encounters_location ON public.encounters(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_encounters_outreach_worker ON public.encounters(outreach_worker);
CREATE INDEX IF NOT EXISTS idx_encounters_high_utilizer ON public.encounters(high_utilizer_contact);

-- Status changes indexes
CREATE INDEX IF NOT EXISTS idx_status_changes_person_id ON status_changes(person_id);
CREATE INDEX IF NOT EXISTS idx_status_changes_date ON status_changes(change_date);
CREATE INDEX IF NOT EXISTS idx_status_changes_type ON status_changes(change_type);
CREATE INDEX IF NOT EXISTS idx_status_changes_type_date ON status_changes(change_type, change_date);

-- User profiles index
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fuzzy person search function (for duplicate detection)
CREATE OR REPLACE FUNCTION search_similar_persons(
  search_first_name TEXT,
  search_last_name TEXT,
  search_dob DATE DEFAULT NULL,
  similarity_threshold REAL DEFAULT 0.3
)
RETURNS TABLE (
  id UUID,
  client_id TEXT,
  first_name TEXT,
  last_name TEXT,
  nickname TEXT,
  date_of_birth DATE,
  age INTEGER,
  similarity_score REAL,
  last_encounter_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.client_id,
    p.first_name,
    p.last_name,
    p.nickname,
    p.date_of_birth,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.date_of_birth))::INTEGER as age,
    GREATEST(
      similarity(p.first_name, search_first_name),
      similarity(p.last_name, search_last_name),
      COALESCE(similarity(p.nickname, search_first_name), 0)
    ) as similarity_score,
    (SELECT MAX(e.service_date) FROM public.encounters e WHERE e.person_id = p.id) as last_encounter_date
  FROM public.persons p
  WHERE
    (
      similarity(p.first_name, search_first_name) > similarity_threshold OR
      similarity(p.last_name, search_last_name) > similarity_threshold OR
      similarity(p.nickname, search_first_name) > similarity_threshold
    )
    AND (
      search_dob IS NULL OR
      p.date_of_birth = search_dob
    )
  ORDER BY similarity_score DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Updated at triggers
DROP TRIGGER IF EXISTS update_persons_updated_at ON public.persons;
CREATE TRIGGER update_persons_updated_at
  BEFORE UPDATE ON public.persons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_encounters_updated_at ON public.encounters;
CREATE TRIGGER update_encounters_updated_at
  BEFORE UPDATE ON public.encounters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_status_changes_updated_at ON status_changes;
CREATE TRIGGER update_status_changes_updated_at
  BEFORE UPDATE ON status_changes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_changes ENABLE ROW LEVEL SECURITY;

-- Users policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- User profiles policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
CREATE POLICY "Users can read own profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.user_profiles;
CREATE POLICY "Admins can read all profiles"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage profiles" ON public.user_profiles;
CREATE POLICY "Admins can manage profiles"
  ON public.user_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Persons policies
DROP POLICY IF EXISTS "Authenticated users can view all persons" ON public.persons;
CREATE POLICY "Authenticated users can view all persons"
  ON public.persons FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert persons" ON public.persons;
CREATE POLICY "Authenticated users can insert persons"
  ON public.persons FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update persons" ON public.persons;
CREATE POLICY "Authenticated users can update persons"
  ON public.persons FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Encounters policies
DROP POLICY IF EXISTS "Authenticated users can view all encounters" ON public.encounters;
CREATE POLICY "Authenticated users can view all encounters"
  ON public.encounters FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can insert encounters" ON public.encounters;
CREATE POLICY "Authenticated users can insert encounters"
  ON public.encounters FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update encounters" ON public.encounters;
CREATE POLICY "Authenticated users can update encounters"
  ON public.encounters FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Status changes policies
DROP POLICY IF EXISTS "Authenticated users can view all status changes" ON status_changes;
CREATE POLICY "Authenticated users can view all status changes"
  ON status_changes FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert status changes" ON status_changes;
CREATE POLICY "Authenticated users can insert status changes"
  ON status_changes FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update status changes" ON status_changes;
CREATE POLICY "Authenticated users can update status changes"
  ON status_changes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- STORAGE (for client photos)
-- =====================================================

-- Create storage bucket for client photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-photos', 'client-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies
DROP POLICY IF EXISTS "Authenticated users can upload client photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload client photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'client-photos');

DROP POLICY IF EXISTS "Authenticated users can view client photos" ON storage.objects;
CREATE POLICY "Authenticated users can view client photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'client-photos');

DROP POLICY IF EXISTS "Authenticated users can update client photos" ON storage.objects;
CREATE POLICY "Authenticated users can update client photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'client-photos');

DROP POLICY IF EXISTS "Authenticated users can delete client photos" ON storage.objects;
CREATE POLICY "Authenticated users can delete client photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'client-photos');

-- Public access to photos (for displaying in the app)
DROP POLICY IF EXISTS "Public can view client photos" ON storage.objects;
CREATE POLICY "Public can view client photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'client-photos');

-- =====================================================
-- PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION search_similar_persons TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.persons IS 'By-name list of clients served by Grossmont Street Reach';
COMMENT ON TABLE public.encounters IS 'Service interactions/encounters with clients';
COMMENT ON TABLE status_changes IS 'Tracks exit and return-to-active status changes for persons';
COMMENT ON TABLE public.user_profiles IS 'User profiles with role-based access control';

COMMENT ON COLUMN public.persons.origin_location IS 'Where the client was originally from (city, state, or general description)';
COMMENT ON COLUMN public.persons.origin_latitude IS 'GPS latitude of origin location (optional, for heat map visualization)';
COMMENT ON COLUMN public.persons.origin_longitude IS 'GPS longitude of origin location (optional, for heat map visualization)';
COMMENT ON COLUMN public.persons.disability_type IS 'Comma-separated list of disability types';
COMMENT ON COLUMN public.persons.addiction IS 'Comma-separated list of substances';
```

---

## Create Admin User

After running the SQL schema:

1. Go to Supabase Dashboard > Authentication > Users
2. Click "Add user" > "Create new user"
3. Enter email and password
4. Copy the user's UUID
5. Run this SQL (replace values):

```sql
INSERT INTO public.user_profiles (id, email, role, full_name)
VALUES (
  'paste-user-uuid-here',
  'admin@example.com',
  'admin',
  'Admin User'
);
```

---

## Key Features

### New for Grossmont:
- **Where They Were From**: Tracks client origin location for demographic analysis
- **Origin Heat Map**: Optional GPS coordinates for visualizing where clients came from
- **Map centered on Grossmont/La Mesa area** (32.7678, -117.0231)

### Core Features:
- By-name list management with auto-generated client IDs
- Real-time duplicate detection with fuzzy matching
- Service interaction tracking with GPS coordinates
- Client photo capture (camera or upload)
- Admin dashboard with metrics, heat maps, exports
- PWA support for mobile field workers

---

## Deployment to Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

Add environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`

---

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL, Auth, RLS, Storage)
- **Maps**: Mapbox GL
- **Forms**: React Hook Form + Zod validation
- **PWA**: next-pwa

---

## Support

For issues: https://github.com/DSchacht0825/encinitas-street-reach/issues
