-- ====================================================================
-- OFFICIAL IEDC GOVERNMENT POLYTECHNIC COLLEGE PERINTHALMANNA (GPTC PMNA)
-- PRODUCTION SUPABASE DATABASE DDL SCHEMA (17 DATABASE TABLES)
-- ====================================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('faculty_coordinator', 'student_lead')),
  phone TEXT,
  profile_photo TEXT,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Hackathon', 'Workshop', 'Seminar', 'Bootcamp', 'Competition', 'State Program')),
  level TEXT NOT NULL CHECK (level IN ('College', 'State', 'National')),
  date DATE NOT NULL,
  time TEXT NOT NULL,
  venue TEXT NOT NULL,
  description TEXT NOT NULL,
  speaker TEXT,
  total_seats INT NOT NULL DEFAULT 50,
  seats_available INT NOT NULL DEFAULT 50,
  banner_image TEXT,
  registration_open BOOLEAN DEFAULT TRUE,
  certificate_eligible BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. REGISTRATIONS TABLE
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  register_number TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  department TEXT NOT NULL,
  status TEXT DEFAULT 'Registered' CHECK (status IN ('Registered', 'Attended', 'Cancelled')),
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE,
  register_number TEXT NOT NULL,
  check_in_time TIMESTAMPTZ DEFAULT NOW(),
  verified_by UUID REFERENCES public.profiles(id)
);

-- 5. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  department TEXT NOT NULL,
  technology TEXT[] NOT NULL,
  year TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('In Progress', 'Prototype', 'Completed', 'Incubated')),
  author TEXT NOT NULL,
  mentor TEXT,
  likes INT DEFAULT 0,
  bookmarks INT DEFAULT 0,
  github_url TEXT,
  demoUrl TEXT,
  image_url TEXT NOT NULL,
  documents JSONB,
  team_members TEXT[] DEFAULT '{}',
  comments_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. GALLERY TABLE
CREATE TABLE IF NOT EXISTS public.gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  album_name TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('Image', 'Video')),
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  event_id UUID REFERENCES public.events(id),
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. RESOURCES TABLE
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('PDF', 'PPT', 'ZIP', 'Document', 'Video')),
  description TEXT,
  file_url TEXT NOT NULL,
  file_size TEXT,
  author TEXT NOT NULL,
  views INT DEFAULT 0,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. BLOGS TABLE
CREATE TABLE IF NOT EXISTS public.blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  author_role TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  read_time TEXT DEFAULT '5 min read',
  image_url TEXT NOT NULL,
  comments_count INT DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_audience TEXT DEFAULT 'All' CHECK (target_audience IN ('All', 'Student Lead', 'Faculty')),
  sent_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. IDEAS TABLE
CREATE TABLE IF NOT EXISTS public.ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  student_name TEXT NOT NULL,
  register_number TEXT NOT NULL,
  department TEXT NOT NULL,
  problem_statement TEXT NOT NULL,
  proposed_solution TEXT NOT NULL,
  technology_stack TEXT[],
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Submitted', 'Under Review', 'Approved', 'Mentorship', 'Rejected', 'Pending')),
  assigned_mentor TEXT,
  file_attachment TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. CERTIFICATES TABLE
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id TEXT UNIQUE NOT NULL,
  participant_name TEXT NOT NULL,
  register_number TEXT NOT NULL,
  email TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  certificate_type TEXT NOT NULL CHECK (certificate_type IN ('Participation', 'Winner', 'Organizer', 'Speaker', 'Judge')),
  qr_code_url TEXT NOT NULL,
  pdf_storage_url TEXT,
  status TEXT DEFAULT 'Verified' CHECK (status IN ('Verified', 'Pending', 'Revoked', 'Published')),
  issued_by UUID REFERENCES public.profiles(id),
  issued_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. CERTIFICATE TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  background_image_url TEXT NOT NULL,
  font_color TEXT DEFAULT '#FFFFFF',
  border_color TEXT DEFAULT '#F98A5B',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. CERTIFICATE DOWNLOADS TABLE
CREATE TABLE IF NOT EXISTS public.certificate_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id UUID REFERENCES public.certificates(id) ON DELETE CASCADE,
  ip_address TEXT,
  user_agent TEXT,
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. COMMITTEE TABLE
CREATE TABLE IF NOT EXISTS public.committee (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Faculty Coordinator', 'Executive Committee', 'Mentor', 'Ambassador')),
  email TEXT,
  photo_url TEXT,
  display_order INT DEFAULT 0
);

-- 15. STARTUPS TABLE
CREATE TABLE IF NOT EXISTS public.startups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  founders TEXT[] NOT NULL,
  department TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('Idea', 'Prototype', 'Registered', 'Funded', 'Scaling')),
  funding_amount TEXT,
  logo_url TEXT NOT NULL,
  website TEXT,
  pitch_deck_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.committee ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Public Read Policies
CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public Read Events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Public Read Projects" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Public Read Gallery" ON public.gallery FOR SELECT USING (true);
CREATE POLICY "Public Read Resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Public Read Blogs" ON public.blogs FOR SELECT USING (true);
CREATE POLICY "Public Read Certificates" ON public.certificates FOR SELECT USING (true);
CREATE POLICY "Public Read Committee" ON public.committee FOR SELECT USING (true);
CREATE POLICY "Public Read Startups" ON public.startups FOR SELECT USING (true);

-- Authenticated Full Access Policies
CREATE POLICY "Faculty Full Access Profiles" ON public.profiles FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'faculty_coordinator'));
CREATE POLICY "Faculty Full Access Events" ON public.events FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'faculty_coordinator'));
CREATE POLICY "Faculty Full Access Certificates" ON public.certificates FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'faculty_coordinator'));
