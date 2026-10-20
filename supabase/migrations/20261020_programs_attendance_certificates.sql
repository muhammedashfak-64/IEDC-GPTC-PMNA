-- ====================================================================
-- IEDC GPTC PMNA: PROGRAMS, ATTENDANCE & AUTOMATIC CERTIFICATES SCHEMA
-- ====================================================================

-- 1. ENHANCE EVENTS TABLE WITH PROGRAM & CERTIFICATE CONFIGURATION
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS organizing_body TEXT DEFAULT 'the IEDC Cell, Government Polytechnic College Perinthalmanna',
  ADD COLUMN IF NOT EXISTS certificate_heading TEXT DEFAULT 'CERTIFICATE OF PARTICIPATION',
  ADD COLUMN IF NOT EXISTS certificate_paragraph TEXT,
  ADD COLUMN IF NOT EXISTS certificate_template_url TEXT,
  ADD COLUMN IF NOT EXISTS certificate_status TEXT DEFAULT 'Draft' CHECK (certificate_status IN ('Draft', 'Published', 'Archived')),
  ADD COLUMN IF NOT EXISTS registration_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS template_config JSONB DEFAULT '{
    "nameY": 305,
    "nameFontSize": 34,
    "nameColor": [0.545, 0, 0],
    "paraY": 252,
    "paraFontSize": 12.5,
    "paraLineSpacing": 18,
    "paraMaxWidth": 580,
    "paraColor": [0.12, 0.16, 0.21],
    "showCertId": true,
    "certIdY": 45
  }'::jsonb;

-- 2. ENHANCE REGISTRATIONS TABLE WITH ATTENDANCE TRACKING
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS attendance_status TEXT DEFAULT 'Absent' CHECK (attendance_status IN ('Present', 'Absent', 'Pending')),
  ADD COLUMN IF NOT EXISTS attended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS marked_by TEXT,
  ADD COLUMN IF NOT EXISTS certificate_id TEXT;

-- Index for rapid attendance and event queries
CREATE INDEX IF NOT EXISTS idx_registrations_event_attendance 
  ON public.registrations(event_id, attendance_status);

-- 3. CREATE PROGRAM LEADERS & ORGANIZERS TABLE
CREATE TABLE IF NOT EXISTS public.program_leaders (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Student Lead' CHECK (role IN (
    'Student Lead', 'Program Coordinator', 'Volunteer', 
    'Organizer', 'Speaker', 'Faculty Coordinator', 'Mentor'
  )),
  department TEXT,
  email TEXT,
  phone TEXT,
  certificate_status TEXT DEFAULT 'Eligible' CHECK (certificate_status IN ('Eligible', 'Generated', 'Ineligible')),
  certificate_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_program_leaders_event 
  ON public.program_leaders(event_id);

-- 4. CREATE CERTIFICATE TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  template_type TEXT DEFAULT 'PDF' CHECK (template_type IN ('PDF', 'PNG', 'JPG')),
  template_url TEXT NOT NULL,
  preview_url TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  config JSONB NOT NULL DEFAULT '{
    "nameY": 305,
    "nameFontSize": 34,
    "nameColor": [0.545, 0, 0],
    "paraY": 252,
    "paraFontSize": 12.5,
    "paraLineSpacing": 18,
    "paraMaxWidth": 580,
    "paraColor": [0.12, 0.16, 0.21],
    "showCertId": true,
    "certIdY": 45
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.program_leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

-- Program leaders: Admins full access, public no read access (keeps private contacts safe)
CREATE POLICY "Admin full access on program_leaders" 
  ON public.program_leaders 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Certificate templates: Authenticated admins full access, public can read default template metadata
CREATE POLICY "Admin full access on certificate_templates" 
  ON public.certificate_templates 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Public read certificate_templates" 
  ON public.certificate_templates 
  FOR SELECT 
  TO anon 
  USING (is_default = true);

-- 6. CERTIFICATES RLS VERIFICATION:
-- Public can retrieve their own certificate if status = 'Published'
CREATE POLICY "Public can read published certificates"
  ON public.certificates
  FOR SELECT
  TO anon
  USING (status = 'Published');
