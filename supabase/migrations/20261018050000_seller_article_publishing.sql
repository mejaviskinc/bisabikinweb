ALTER TABLE public.bbweb_articles
  ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES public.bbweb_sellers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS author_store_name text NOT NULL DEFAULT 'BisaBikinWeb',
  ADD COLUMN IF NOT EXISTS author_type text NOT NULL DEFAULT 'editorial';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bbweb_articles_author_type_check'
      AND conrelid = 'public.bbweb_articles'::regclass
  ) THEN
    ALTER TABLE public.bbweb_articles
      ADD CONSTRAINT bbweb_articles_author_type_check
      CHECK (author_type IN ('editorial', 'seller'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS bbweb_articles_seller_created_idx
  ON public.bbweb_articles (seller_id, created_at DESC)
  WHERE seller_id IS NOT NULL;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bbweb-seller-articles',
  'bbweb-seller-articles',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Seller uploads own article covers" ON storage.objects;
CREATE POLICY "Seller uploads own article covers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'bbweb-seller-articles'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
