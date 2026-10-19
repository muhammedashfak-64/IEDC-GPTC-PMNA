-- Migration: Create team_members table and Storage policies for IEDC GPTC PMNA
-- Safe and idempotent

CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    designation TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Executive Members',
    department TEXT NOT NULL,
    email TEXT,
    contact_number TEXT,
    show_email_publicly BOOLEAN DEFAULT FALSE,
    show_contact_publicly BOOLEAN DEFAULT FALSE,
    graduation_date TEXT,
    photo_url TEXT,
    instagram_username TEXT,
    instagram_url TEXT,
    linkedin_url TEXT,
    bio TEXT,
    display_order INTEGER DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'Published' CHECK (status IN ('Published', 'Draft', 'Archived')),
    verification_flag TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Drop old policies if existing
DROP POLICY IF EXISTS "Allow public read published team members" ON public.team_members;
DROP POLICY IF EXISTS "Allow authenticated full team members access" ON public.team_members;

-- 1. Public read-only policy for published members
CREATE POLICY "Allow public read published team members"
    ON public.team_members
    FOR SELECT
    USING (status = 'Published');

-- 2. Authenticated administrative users full access
CREATE POLICY "Allow authenticated full team members access"
    ON public.team_members
    FOR ALL
    USING (auth.role() = 'authenticated');

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_team_members_status ON public.team_members(status);
CREATE INDEX IF NOT EXISTS idx_team_members_category ON public.team_members(category);
CREATE INDEX IF NOT EXISTS idx_team_members_order ON public.team_members(display_order);

-- Storage bucket for team photos (if not existing)
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-photos', 'team-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage public read policy
DROP POLICY IF EXISTS "Allow public read team photos" ON storage.objects;
CREATE POLICY "Allow public read team photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'team-photos');

-- Storage authenticated upload policy
DROP POLICY IF EXISTS "Allow authenticated upload team photos" ON storage.objects;
CREATE POLICY "Allow authenticated upload team photos"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'team-photos' AND auth.role() = 'authenticated');
