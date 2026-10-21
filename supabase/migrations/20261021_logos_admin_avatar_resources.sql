-- ====================================================================
-- SAFE MIGRATION: Add IEDC GPTC PMNA Logo, Website Settings & Admin Avatar
-- Safe, Idempotent, and Preserves All Existing Data
-- ====================================================================

-- 1. Ensure website_settings has logo columns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'website_settings' 
        AND column_name = 'iedc_gptc_pmna_logo_url'
    ) THEN
        ALTER TABLE public.website_settings ADD COLUMN iedc_gptc_pmna_logo_url TEXT DEFAULT '/iedc-gptc-pmna-logo.png';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'website_settings' 
        AND column_name = 'college_logo_url'
    ) THEN
        ALTER TABLE public.website_settings ADD COLUMN college_logo_url TEXT DEFAULT '/college-logo.png';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'website_settings' 
        AND column_name = 'iedc_logo_url'
    ) THEN
        ALTER TABLE public.website_settings ADD COLUMN iedc_logo_url TEXT DEFAULT '/iedc-logo.png';
    END IF;
END $$;

-- Update current_settings row if it exists
UPDATE public.website_settings
SET 
    iedc_gptc_pmna_logo_url = COALESCE(iedc_gptc_pmna_logo_url, '/iedc-gptc-pmna-logo.png'),
    college_logo_url = COALESCE(college_logo_url, '/college-logo.png'),
    iedc_logo_url = COALESCE(iedc_logo_url, '/iedc-logo.png')
WHERE id = 'current_settings';

-- 2. Ensure profiles has avatar column for administrator and operators
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'avatar'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN avatar TEXT;
    END IF;
END $$;
