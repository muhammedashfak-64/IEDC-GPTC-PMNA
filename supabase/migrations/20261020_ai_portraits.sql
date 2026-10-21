-- Migration: AI Student Lead & Faculty Portrait Generator with Transparency & Animation
-- Safe, backward-compatible, idempotent migration

-- 1. Extend team_members table with AI portrait fields
ALTER TABLE public.team_members
ADD COLUMN IF NOT EXISTS original_photo_url TEXT,
ADD COLUMN IF NOT EXISTS ai_generated_photo_url TEXT,
ADD COLUMN IF NOT EXISTS final_transparent_photo_url TEXT,
ADD COLUMN IF NOT EXISTS ai_approval_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS ai_processing_status TEXT DEFAULT 'idle',
ADD COLUMN IF NOT EXISTS ai_error_message TEXT,
ADD COLUMN IF NOT EXISTS ai_metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Extend faculty_coordinators table with AI portrait fields
ALTER TABLE public.faculty_coordinators
ADD COLUMN IF NOT EXISTS original_photo_url TEXT,
ADD COLUMN IF NOT EXISTS ai_generated_photo_url TEXT,
ADD COLUMN IF NOT EXISTS final_transparent_photo_url TEXT,
ADD COLUMN IF NOT EXISTS ai_approval_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS ai_processing_status TEXT DEFAULT 'idle',
ADD COLUMN IF NOT EXISTS ai_error_message TEXT,
ADD COLUMN IF NOT EXISTS ai_metadata JSONB DEFAULT '{}'::jsonb;

-- 3. Dedicated Member Portraits audit & history table
CREATE TABLE IF NOT EXISTS public.member_portraits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id TEXT NOT NULL,
    member_type TEXT NOT NULL DEFAULT 'team_member', -- 'team_member' | 'faculty_coordinator'
    original_image_path TEXT NOT NULL,
    generated_image_path TEXT,
    final_transparent_image_path TEXT,
    approval_status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
    processing_status TEXT NOT NULL DEFAULT 'idle', -- 'idle' | 'processing' | 'completed' | 'failed'
    error_message TEXT,
    provider_used TEXT DEFAULT 'auto',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_member_portraits_member_id ON public.member_portraits(member_id);
CREATE INDEX IF NOT EXISTS idx_member_portraits_approval ON public.member_portraits(approval_status);

-- 4. Supabase Storage bucket for Team Portraits
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-portraits', 'team-portraits', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read access for portraits bucket
DROP POLICY IF EXISTS "Allow public read team portraits" ON storage.objects;
CREATE POLICY "Allow public read team portraits"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'team-portraits');

-- Authenticated upload access
DROP POLICY IF EXISTS "Allow authenticated upload team portraits" ON storage.objects;
CREATE POLICY "Allow authenticated upload team portraits"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'team-portraits' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated update team portraits" ON storage.objects;
CREATE POLICY "Allow authenticated update team portraits"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'team-portraits' AND auth.role() = 'authenticated');
