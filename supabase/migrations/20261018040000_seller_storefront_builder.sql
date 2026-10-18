ALTER TABLE public.bbweb_sellers
  ADD COLUMN IF NOT EXISTS storefront_slug text,
  ADD COLUMN IF NOT EXISTS storefront_config jsonb NOT NULL DEFAULT '{"headline":"","tagline":"","bio":"","avatar_url":"","cover_url":"","theme":"cream","accent_color":"#d7a96b","button_style":"pill","menu_items":[],"links":[],"show_products":true,"show_articles":true,"product_title":"Produk pilihan","article_title":"Artikel terbaru"}'::jsonb,
  ADD COLUMN IF NOT EXISTS storefront_published boolean NOT NULL DEFAULT false;

UPDATE public.bbweb_sellers
SET storefront_slug =
  left(coalesce(nullif(trim(both '-' from regexp_replace(lower(coalesce(store_name,'')), '[^a-z0-9]+', '-', 'g')), ''), 'toko'), 42)
  || '-' || substr(replace(id::text, '-', ''), 1, 6)
WHERE storefront_slug IS NULL OR btrim(storefront_slug) = '';

ALTER TABLE public.bbweb_sellers
  ALTER COLUMN storefront_slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS bbweb_sellers_storefront_slug_uidx
  ON public.bbweb_sellers (storefront_slug);
