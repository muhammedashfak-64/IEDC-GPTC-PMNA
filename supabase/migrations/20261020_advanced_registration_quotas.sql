-- ====================================================================
-- IEDC GPTC PMNA: ADVANCED EVENT REGISTRATION QUOTAS, CLASS-WISE CAPACITY,
-- STATEWIDE PARTICIPATION, DYNAMIC SEAT REALLOCATION & WAITING LISTS
-- ====================================================================

-- 1. ENHANCE EVENTS TABLE WITH QUOTA CONFIGURATION
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS quota_config JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS registration_start_date TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS registration_closing_date TIMESTAMPTZ DEFAULT NULL;

-- 2. ENHANCE REGISTRATIONS TABLE WITH PARTICIPATION CATEGORY & WAITING LIST
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS participation_category TEXT DEFAULT 'Internal',
  ADD COLUMN IF NOT EXISTS waitlist_position INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS promoted_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS district TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS course TEXT DEFAULT NULL;

-- Ensure check constraint on registrations status supports Waitlisted and Rejected
DO $$ 
BEGIN
  ALTER TABLE public.registrations DROP CONSTRAINT IF EXISTS registrations_status_check;
  ALTER TABLE public.registrations 
    ADD CONSTRAINT registrations_status_check 
    CHECK (status IN ('Confirmed', 'Pending', 'Attended', 'Cancelled', 'Waitlisted', 'Rejected'));
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 3. INDEXES FOR HIGH-CONCURRENCY LOOKUP & CAPACITY AGGREGATION
CREATE INDEX IF NOT EXISTS idx_registrations_event_dept_year 
  ON public.registrations(event_id, department, academic_year, status);

CREATE INDEX IF NOT EXISTS idx_registrations_event_category 
  ON public.registrations(event_id, participation_category, status);

CREATE INDEX IF NOT EXISTS idx_registrations_event_waitlist 
  ON public.registrations(event_id, status, waitlist_position);

-- 4. CREATE QUOTA REALLOCATIONS AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS public.quota_reallocations (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  source_class TEXT NOT NULL,
  destination_class TEXT NOT NULL,
  seats_transferred INT NOT NULL CHECK (seats_transferred > 0),
  previous_source_quota INT NOT NULL,
  new_source_quota INT NOT NULL,
  previous_dest_quota INT NOT NULL,
  new_dest_quota INT NOT NULL,
  reason TEXT,
  admin_user TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quota_reallocations_event 
  ON public.quota_reallocations(event_id, created_at DESC);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.quota_reallocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access on quota_reallocations" ON public.quota_reallocations;
CREATE POLICY "Admin full access on quota_reallocations" 
  ON public.quota_reallocations 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);
