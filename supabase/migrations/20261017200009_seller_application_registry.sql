ALTER TABLE public.bbweb_sellers
  ADD COLUMN IF NOT EXISTS application_no text NOT NULL DEFAULT (
    'SLR-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))
  ),
  ADD COLUMN IF NOT EXISTS business_category text NOT NULL DEFAULT 'Lainnya',
  ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS store_address text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS website_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS social_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_note text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by text,
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS bbweb_sellers_application_no_key
  ON public.bbweb_sellers(application_no);
CREATE INDEX IF NOT EXISTS bbweb_sellers_status_created_idx
  ON public.bbweb_sellers(status, created_at DESC);
