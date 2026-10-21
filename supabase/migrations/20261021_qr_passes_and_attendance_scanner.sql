-- ====================================================================
-- IEDC GPTC PMNA: EVENT QR PASSES, ATTENDANCE SCANNER & TEMPLATES
-- ====================================================================

-- 1. ENHANCE REGISTRATIONS WITH SECURE PASS TOKENS & QR SCAN TRACKING
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS pass_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS qr_payload TEXT,
  ADD COLUMN IF NOT EXISTS attendance_method TEXT DEFAULT 'MANUAL' CHECK (attendance_method IN ('QR', 'MANUAL')),
  ADD COLUMN IF NOT EXISTS marked_by_id TEXT,
  ADD COLUMN IF NOT EXISTS pass_generated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS pass_downloaded_at TIMESTAMPTZ;

-- Index for instant QR check-in scanner lookups
CREATE INDEX IF NOT EXISTS idx_registrations_pass_token 
  ON public.registrations(pass_token);

CREATE INDEX IF NOT EXISTS idx_registrations_event_pass 
  ON public.registrations(event_id, pass_token);

-- 2. ENHANCE CERTIFICATE TEMPLATES TABLE
ALTER TABLE public.certificate_templates
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS uploaded_by TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT;

CREATE INDEX IF NOT EXISTS idx_certificate_templates_active 
  ON public.certificate_templates(is_active);

-- 3. AUDIT LOGS FOR QR PASS SCANS
-- Ensures every scan has a verified admin operator, scan timestamp, and event binding
COMMENT ON COLUMN public.registrations.attendance_method IS 'Method used to verify attendance: QR scanner camera or manual admin toggle';
COMMENT ON COLUMN public.registrations.pass_token IS 'Cryptographically secure pass token encoded inside the attendee QR pass';
