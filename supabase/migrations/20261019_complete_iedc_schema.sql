-- ====================================================================
-- OFFICIAL IEDC GPTC PMNA MASTER SUPABASE DATABASE MIGRATION
-- Project: nxlaazpcbvzxmdboqlxe
-- Safe, Idempotent, and Preserves All Existing Data
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------
-- 1. PROFILES & USER ROLES TABLE
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student_lead' CHECK (role IN ('faculty_coordinator', 'student_lead')),
    phone TEXT,
    department TEXT,
    designation TEXT,
    avatar TEXT,
    staff_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial faculty and student lead accounts if empty
INSERT INTO public.profiles (id, username, email, full_name, role, phone, department, designation, staff_id, is_active)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'iedc.faculty', 'faculty@iedcgptcpmna.in', 'Prof. Muhammed Rashid', 'faculty_coordinator', '9447123456', 'Electronics Engineering', 'Nodal Officer & Lecturer', 'IEDC001', true),
    ('00000000-0000-0000-0000-000000000002', 'iedc.studentlead', 'studentlead@iedcgptcpmna.in', 'Rahul V', 'student_lead', '9847123456', 'Computer Engineering', 'Student Lead (Chairperson)', 'SL001', true)
ON CONFLICT (email) DO NOTHING;

-- -------------------------------------------------------------
-- 2. WEBSITE SETTINGS TABLE
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.website_settings (
    id TEXT PRIMARY KEY DEFAULT 'current_settings',
    site_title TEXT NOT NULL DEFAULT 'IEDC GPTC PMNA',
    college_name TEXT NOT NULL DEFAULT 'Government Polytechnic College, Perinthalmanna',
    hero_heading TEXT DEFAULT 'Where Innovation Meets Opportunity',
    hero_sub TEXT,
    campus_photo_url TEXT DEFAULT '/campus-main.jpeg',
    contact_email TEXT DEFAULT 'iedc@gptcpmna.edu.in',
    contact_phone TEXT DEFAULT '+91 4933 227221',
    address TEXT DEFAULT 'Govt Polytechnic College, Angadippuram PO, Perinthalmanna, Malappuram, Kerala 679321',
    social_links JSONB DEFAULT '{"instagram": "https://instagram.com/iedc_gptcpmna", "linkedin": "https://linkedin.com/company/iedc-gptc-pmna", "github": "https://github.com/iedc-gptc-pmna"}'::jsonb,
    stats JSONB DEFAULT '[{"label":"Active Members","value":"650+"},{"label":"Student Projects","value":"120+"},{"label":"Events Hosted","value":"35+"},{"label":"Incubated Startups","value":"15+"}]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.website_settings (id, site_title, college_name, hero_heading)
VALUES ('current_settings', 'IEDC GPTC PMNA', 'Government Polytechnic College, Perinthalmanna', 'Where Innovation Meets Opportunity')
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------------
-- 3. EVENTS & WORKSHOPS TABLE
-- -------------------------------------------------------------
DROP TABLE IF EXISTS public.events CASCADE;
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Workshop',
    level TEXT NOT NULL DEFAULT 'State',
    date TEXT NOT NULL,
    time TEXT,
    venue TEXT NOT NULL,
    description TEXT NOT NULL,
    speaker TEXT,
    total_seats INT DEFAULT 60,
    seats_available INT DEFAULT 50,
    banner_image TEXT,
    brochure_url TEXT,
    registration_link TEXT,
    status TEXT NOT NULL DEFAULT 'Published' CHECK (status IN ('Published', 'Draft', 'Archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 4. TEAM MEMBERS (STUDENT LEADS & EXECUTIVE MEMBERS)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.team_members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Executive Members',
    department TEXT NOT NULL,
    email TEXT,
    contact TEXT,
    show_email_publicly BOOLEAN DEFAULT FALSE,
    show_contact_publicly BOOLEAN DEFAULT FALSE,
    graduation_date TEXT,
    photo_url TEXT,
    instagram_username TEXT,
    instagram_url TEXT,
    linkedin_url TEXT,
    bio TEXT,
    display_order INT DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'Published' CHECK (status IN ('Published', 'Draft', 'Archived')),
    verification_flag TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 5. CERTIFICATES & PARTICIPANT RECORDS TABLE
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certificates (
    id TEXT PRIMARY KEY,
    certificate_id TEXT UNIQUE NOT NULL,
    participant_name TEXT NOT NULL,
    register_number TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    event_id TEXT,
    event_name TEXT NOT NULL,
    event_date TEXT NOT NULL,
    certificate_type TEXT NOT NULL DEFAULT 'Participation',
    qr_code_url TEXT,
    pdf_storage_url TEXT,
    status TEXT NOT NULL DEFAULT 'Published' CHECK (status IN ('Published', 'Draft', 'Archived')),
    downloads_count INT DEFAULT 0,
    issued_date TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 6. PROJECTS TABLE
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    department TEXT NOT NULL,
    technologies TEXT[],
    year TEXT DEFAULT '2026',
    status TEXT NOT NULL DEFAULT 'Completed',
    author TEXT NOT NULL,
    mentor TEXT,
    github_url TEXT,
    demo_url TEXT,
    image_url TEXT,
    publication_status TEXT NOT NULL DEFAULT 'Published' CHECK (publication_status IN ('Published', 'Draft', 'Archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 7. GALLERY ALBUMS & ITEMS TABLE
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gallery_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    album_name TEXT NOT NULL DEFAULT 'Campus Moments',
    media_type TEXT NOT NULL DEFAULT 'Image',
    media_url TEXT NOT NULL,
    caption TEXT,
    alt_text TEXT,
    status TEXT NOT NULL DEFAULT 'Published' CHECK (status IN ('Published', 'Draft', 'Archived')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 8. LEARNING RESOURCES TABLE
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.resources (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Workshop Notes',
    file_type TEXT NOT NULL DEFAULT 'PDF',
    description TEXT,
    file_url TEXT NOT NULL,
    author TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Published' CHECK (status IN ('Published', 'Draft', 'Archived')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 9. BLOGS TABLE
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blogs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    author TEXT NOT NULL,
    author_role TEXT DEFAULT 'Innovation Member',
    category TEXT DEFAULT 'Technology',
    read_time TEXT DEFAULT '5 min read',
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'Published' CHECK (status IN ('Published', 'Draft', 'Archived')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 10. ANNOUNCEMENTS TABLE
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'Normal',
    is_urgent BOOLEAN DEFAULT FALSE,
    action_link TEXT,
    status TEXT NOT NULL DEFAULT 'Published' CHECK (status IN ('Published', 'Draft', 'Archived')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 11. STARTUPS TABLE
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.startups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    founders TEXT[],
    department TEXT,
    stage TEXT DEFAULT 'Idea',
    funding_amount TEXT,
    logo_url TEXT,
    website TEXT,
    status TEXT NOT NULL DEFAULT 'Published' CHECK (status IN ('Published', 'Draft', 'Archived')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------
-- 12. AUDIT LOGS TABLE
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_name TEXT,
    user_role TEXT,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Policies (Only published content is readable)
DROP POLICY IF EXISTS "Public Read Website Settings" ON public.website_settings;
CREATE POLICY "Public Read Website Settings" ON public.website_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Published Events" ON public.events;
CREATE POLICY "Public Read Published Events" ON public.events FOR SELECT USING (status = 'Published');

DROP POLICY IF EXISTS "Public Read Published Team" ON public.team_members;
CREATE POLICY "Public Read Published Team" ON public.team_members FOR SELECT USING (status = 'Published');

DROP POLICY IF EXISTS "Public Read Published Projects" ON public.projects;
CREATE POLICY "Public Read Published Projects" ON public.projects FOR SELECT USING (publication_status = 'Published');

DROP POLICY IF EXISTS "Public Read Published Gallery" ON public.gallery_items;
CREATE POLICY "Public Read Published Gallery" ON public.gallery_items FOR SELECT USING (status = 'Published');

DROP POLICY IF EXISTS "Public Read Published Resources" ON public.resources;
CREATE POLICY "Public Read Published Resources" ON public.resources FOR SELECT USING (status = 'Published');

DROP POLICY IF EXISTS "Public Read Published Blogs" ON public.blogs;
CREATE POLICY "Public Read Published Blogs" ON public.blogs FOR SELECT USING (status = 'Published');

DROP POLICY IF EXISTS "Public Read Published Announcements" ON public.announcements;
CREATE POLICY "Public Read Published Announcements" ON public.announcements FOR SELECT USING (status = 'Published');

DROP POLICY IF EXISTS "Public Read Published Startups" ON public.startups;
CREATE POLICY "Public Read Published Startups" ON public.startups FOR SELECT USING (status = 'Published');

-- 2. Authenticated Admin Full Access Policies
DROP POLICY IF EXISTS "Admin Full Access Settings" ON public.website_settings;
CREATE POLICY "Admin Full Access Settings" ON public.website_settings FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Full Access Events" ON public.events;
CREATE POLICY "Admin Full Access Events" ON public.events FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Full Access Team" ON public.team_members;
CREATE POLICY "Admin Full Access Team" ON public.team_members FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Full Access Certificates" ON public.certificates;
CREATE POLICY "Admin Full Access Certificates" ON public.certificates FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Full Access Projects" ON public.projects;
CREATE POLICY "Admin Full Access Projects" ON public.projects FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Full Access Gallery" ON public.gallery_items;
CREATE POLICY "Admin Full Access Gallery" ON public.gallery_items FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Full Access Resources" ON public.resources;
CREATE POLICY "Admin Full Access Resources" ON public.resources FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Full Access Blogs" ON public.blogs;
CREATE POLICY "Admin Full Access Blogs" ON public.blogs FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Full Access Announcements" ON public.announcements;
CREATE POLICY "Admin Full Access Announcements" ON public.announcements FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Full Access Startups" ON public.startups;
CREATE POLICY "Admin Full Access Startups" ON public.startups FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Full Access Audit Logs" ON public.audit_logs;
CREATE POLICY "Admin Full Access Audit Logs" ON public.audit_logs FOR ALL USING (auth.role() = 'authenticated');

-- ====================================================================
-- SUPABASE STORAGE BUCKETS CONFIGURATION
-- ====================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('team-photos', 'team-photos', true),
    ('event-posters', 'event-posters', true),
    ('gallery', 'gallery', true),
    ('documents', 'documents', true),
    ('certificates', 'certificates', false)
ON CONFLICT (id) DO NOTHING;

-- Public read for public buckets
DROP POLICY IF EXISTS "Public Read Team Photos" ON storage.objects;
CREATE POLICY "Public Read Team Photos" ON storage.objects FOR SELECT USING (bucket_id = 'team-photos');

DROP POLICY IF EXISTS "Public Read Event Posters" ON storage.objects;
CREATE POLICY "Public Read Event Posters" ON storage.objects FOR SELECT USING (bucket_id = 'event-posters');

DROP POLICY IF EXISTS "Public Read Gallery" ON storage.objects;
CREATE POLICY "Public Read Gallery" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');

DROP POLICY IF EXISTS "Public Read Documents" ON storage.objects;
CREATE POLICY "Public Read Documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents');

-- Authenticated upload policies for buckets
DROP POLICY IF EXISTS "Admin Upload Storage" ON storage.objects;
CREATE POLICY "Admin Upload Storage" ON storage.objects FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Update Storage" ON storage.objects;
CREATE POLICY "Admin Update Storage" ON storage.objects FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin Delete Storage" ON storage.objects;
CREATE POLICY "Admin Delete Storage" ON storage.objects FOR DELETE USING (auth.role() = 'authenticated');
