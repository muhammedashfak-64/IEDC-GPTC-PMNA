-- ====================================================================
-- IEDC GPTC PMNA: WINNER CERTIFICATE INDEPENDENT DESCRIPTIONS & CONFIG
-- ====================================================================

-- 1. Add winner certificate title, independent paragraph, award category, and winner template layout
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS certificate_title TEXT DEFAULT 'CERTIFICATE OF PARTICIPATION',
  ADD COLUMN IF NOT EXISTS winner_certificate_title TEXT DEFAULT 'CERTIFICATE OF ACHIEVEMENT',
  ADD COLUMN IF NOT EXISTS winner_certificate_paragraph TEXT,
  ADD COLUMN IF NOT EXISTS award_category TEXT DEFAULT 'Winner',
  ADD COLUMN IF NOT EXISTS winner_template_config JSONB DEFAULT '{
    "nameY": 305,
    "nameFontSize": 34,
    "nameColor": [0.545, 0, 0],
    "paraY": 252,
    "paraFontSize": 12.5,
    "paraLineSpacing": 18,
    "paraMaxWidth": 580,
    "paraColor": [0.12, 0.16, 0.21],
    "paraAlign": "center",
    "paraBold": false,
    "showCertId": true,
    "certIdY": 45,
    "subtitleY": 398,
    "introY": 363
  }'::jsonb;

-- Comment on columns for schema clarity
COMMENT ON COLUMN public.events.winner_certificate_paragraph IS 'Independent editable description paragraph for winner certificates with exact casing preserved.';
COMMENT ON COLUMN public.events.winner_template_config IS 'Independent typography and coordinate positioning controls for winner certificates.';
