ALTER TABLE public.bbweb_customers
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS bbweb_customers_auth_user_id_uidx
  ON public.bbweb_customers(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS bbweb_orders_customer_created_idx
  ON public.bbweb_orders(customer_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.bbweb_customer_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  company text NOT NULL DEFAULT '',
  default_shipping_address jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bbweb_customer_profiles_full_name_length CHECK (char_length(full_name) <= 120),
  CONSTRAINT bbweb_customer_profiles_phone_length CHECK (char_length(phone) <= 40),
  CONSTRAINT bbweb_customer_profiles_company_length CHECK (char_length(company) <= 160)
);

ALTER TABLE public.bbweb_customer_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.bbweb_customer_profiles FROM PUBLIC, anon, authenticated;
