-- ====================================================================
-- IEDC GPTC PMNA: REGISTRATIONS TABLE & EXPANDED STORAGE BUCKETS MIGRATION
-- Safe, Idempotent, and Backward-Compatible
-- ====================================================================

-- 1. Create registrations table
CREATE TABLE IF NOT EXISTS public.registrations (
    id TEXT PRIMARY KEY,
    registration_code TEXT UNIQUE NOT NULL,
    event_id TEXT REFERENCES public.events(id) ON DELETE CASCADE,
    event_title TEXT,
    student_name TEXT NOT NULL,
    register_number TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    department TEXT NOT NULL,
    academic_year TEXT DEFAULT '2nd Year',
    college_name TEXT DEFAULT 'Govt Polytechnic College Perinthalmanna',
    additional_notes TEXT,
    status TEXT NOT NULL DEFAULT 'Confirmed' CHECK (status IN ('Confirmed', 'Pending', 'Attended', 'Cancelled')),
    consent BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique index to prevent duplicate registrations for the same student on the same event
CREATE UNIQUE INDEX IF NOT EXISTS idx_reg_event_regnum ON public.registrations(event_id, register_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reg_event_email ON public.registrations(event_id, email);

-- Lookup indexes
CREATE INDEX IF NOT EXISTS idx_reg_event_id ON public.registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_reg_status ON public.registrations(status);
CREATE INDEX IF NOT EXISTS idx_reg_created_at ON public.registrations(created_at DESC);

-- Enable RLS
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- 2. RLS Policies for Registrations:
-- Public can submit valid registrations
DROP POLICY IF EXISTS "Public Can Register For Events" ON public.registrations;
CREATE POLICY "Public Can Register For Events" ON public.registrations 
FOR INSERT WITH CHECK (true);

-- Only authenticated admins can view all registrations (protects student personal info)
DROP POLICY IF EXISTS "Admin Full Access Registrations" ON public.registrations;
CREATE POLICY "Admin Full Access Registrations" ON public.registrations 
FOR ALL USING (auth.role() = 'authenticated');

-- 3. Additional Storage Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('website-assets', 'website-assets', true),
    ('project-files', 'project-files', true),
    ('resources', 'resources', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for newly created buckets
DROP POLICY IF EXISTS "Public Read Website Assets" ON storage.objects;
CREATE POLICY "Public Read Website Assets" ON storage.objects FOR SELECT USING (bucket_id = 'website-assets');

DROP POLICY IF EXISTS "Public Read Project Files" ON storage.objects;
CREATE POLICY "Public Read Project Files" ON storage.objects FOR SELECT USING (bucket_id = 'project-files');

DROP POLICY IF EXISTS "Public Read Resources Bucket" ON storage.objects;
CREATE POLICY "Public Read Resources Bucket" ON storage.objects FOR SELECT USING (bucket_id = 'resources');
