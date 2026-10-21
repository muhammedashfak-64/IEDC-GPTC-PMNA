-- Migration: Add animated profile image and presentation columns to team_members
-- Safe, idempotent, and backward-compatible

ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS image_position TEXT DEFAULT 'bottom',
ADD COLUMN IF NOT EXISTS image_scale NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS animation_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS animation_style TEXT DEFAULT 'fade-up',
ADD COLUMN IF NOT EXISTS animation_delay NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS glow_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS glow_intensity TEXT DEFAULT 'subtle',
ADD COLUMN IF NOT EXISTS bg_style TEXT DEFAULT 'radial-light',
ADD COLUMN IF NOT EXISTS is_transparent BOOLEAN DEFAULT TRUE;

-- Storage bucket check for team photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-photos', 'team-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage public read policy for transparent photos
DROP POLICY IF EXISTS "Allow public read team photos" ON storage.objects;
CREATE POLICY "Allow public read team photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'team-photos');

-- Storage authenticated upload policy
DROP POLICY IF EXISTS "Allow authenticated upload team photos" ON storage.objects;
CREATE POLICY "Allow authenticated upload team photos"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'team-photos' AND auth.role() = 'authenticated');
