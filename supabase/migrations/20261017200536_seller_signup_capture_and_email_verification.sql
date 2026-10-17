CREATE SCHEMA IF NOT EXISTS bbweb_private;
REVOKE ALL ON SCHEMA bbweb_private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA bbweb_private TO service_role;

CREATE OR REPLACE FUNCTION bbweb_private.capture_seller_application_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_meta jsonb := coalesce(NEW.raw_user_meta_data, '{}'::jsonb);
  v_store text := left(btrim(coalesce(v_meta->>'store_name', '')), 120);
  v_owner text := left(btrim(coalesce(v_meta->>'owner_name', '')), 120);
  v_phone text := left(btrim(coalesce(v_meta->>'phone', '')), 40);
  v_description text := left(btrim(coalesce(v_meta->>'description', '')), 1500);
  v_category text := left(btrim(coalesce(v_meta->>'business_category', '')), 60);
  v_city text := left(btrim(coalesce(v_meta->>'city', '')), 100);
  v_address text := left(btrim(coalesce(v_meta->>'store_address', '')), 250);
  v_website text := left(btrim(coalesce(v_meta->>'website_url', '')), 250);
  v_social text := left(btrim(coalesce(v_meta->>'social_url', '')), 250);
BEGIN
  IF v_meta->>'seller_registration_version' IS DISTINCT FROM '1'
     OR v_meta->>'terms_accepted' IS DISTINCT FROM 'true' THEN
    RETURN NEW;
  END IF;

  IF length(v_store) < 2 OR length(v_owner) < 2
     OR length(regexp_replace(v_phone, '[^0-9]', '', 'g')) < 8
     OR length(v_city) < 2 OR length(v_address) < 5
     OR v_category NOT IN ('Fashion','Aksesoris','Kecantikan','Makanan & Minuman','Kerajinan','Elektronik','Produk Digital','Rumah Tangga','Lainnya')
     OR (v_website <> '' AND v_website !~* '^https://[^[:space:]]+$')
     OR (v_social <> '' AND v_social !~* '^https://[^[:space:]]+$') THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.bbweb_sellers(
    id,email,store_name,owner_name,phone,description,business_category,city,
    store_address,website_url,social_url,terms_accepted_at,email_verified_at,
    status,commission_rate
  ) VALUES (
    NEW.id, lower(coalesce(NEW.email,'')), v_store, v_owner, v_phone, v_description,
    v_category, v_city, v_address, v_website, v_social, now(),
    coalesce(NEW.email_confirmed_at, NEW.confirmed_at), 'pending', 0
  ) ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION bbweb_private.capture_seller_application_signup() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION bbweb_private.capture_seller_application_signup() TO service_role;

CREATE OR REPLACE FUNCTION bbweb_private.sync_seller_email_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
     AND OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at THEN
    UPDATE public.bbweb_sellers
    SET email_verified_at = NEW.email_confirmed_at, updated_at = now()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION bbweb_private.sync_seller_email_verification() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION bbweb_private.sync_seller_email_verification() TO service_role;

DROP TRIGGER IF EXISTS bbweb_capture_seller_application_on_signup ON auth.users;
CREATE TRIGGER bbweb_capture_seller_application_on_signup
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION bbweb_private.capture_seller_application_signup();

DROP TRIGGER IF EXISTS bbweb_sync_seller_email_verification ON auth.users;
CREATE TRIGGER bbweb_sync_seller_email_verification
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW EXECUTE FUNCTION bbweb_private.sync_seller_email_verification();
