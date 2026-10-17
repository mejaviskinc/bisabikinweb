ALTER TABLE public.bbweb_merchandise
  ADD COLUMN IF NOT EXISTS weight_grams integer NOT NULL DEFAULT 500;

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bbweb_merchandise_weight_grams_check'
      AND conrelid = 'public.bbweb_merchandise'::regclass
  ) THEN
    ALTER TABLE public.bbweb_merchandise
      ADD CONSTRAINT bbweb_merchandise_weight_grams_check
      CHECK (weight_grams BETWEEN 1 AND 100000);
  END IF;
END
$migration$;

DO $migration$
DECLARE
  v_definition text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_definition
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'bbweb_create_merch_order'
    AND pg_get_function_identity_arguments(p.oid) =
      'p_customer jsonb, p_shipping jsonb, p_items jsonb, p_access_token_hash text, p_checkout_key_hash text, p_request_hash text, p_note text';

  IF v_definition IS NULL THEN RAISE EXCEPTION 'bbweb_create_merch_order function not found'; END IF;

  IF position('v_shipping integer' IN v_definition) = 0 THEN
    v_definition := replace(v_definition,'  v_subtotal integer := 0;','  v_subtotal integer := 0;' || E'\n  v_shipping integer := 0;');
    v_definition := replace(v_definition,'begin' || E'\n  if length(p_access_token_hash)',
      'begin' || E'\n  v_shipping := coalesce(nullif(p_shipping->>''shipping_cost'','''')::integer,0);' ||
      E'\n  if v_shipping < 0 or v_shipping > 2000000 then raise exception ''INVALID_SHIPPING_COST''; end if;' ||
      E'\n  if length(p_access_token_hash)');
    v_definition := replace(v_definition,'v_subtotal,0,v_subtotal,','v_subtotal,0,v_subtotal+v_shipping,');
    v_definition := replace(v_definition,'coalesce(p_shipping,''{}''::jsonb),0,''IDR''','coalesce(p_shipping,''{}''::jsonb),v_shipping,''IDR''');
    v_definition := replace(v_definition,'return query select v_order.id,v_order.order_no,v_subtotal,v_subtotal,','return query select v_order.id,v_order.order_no,v_subtotal,v_order.total,');
    IF position('v_shipping integer' IN v_definition) = 0 OR position('v_order.total' IN v_definition) = 0 THEN
      RAISE EXCEPTION 'Could not safely patch bbweb_create_merch_order';
    END IF;
    EXECUTE v_definition;
  END IF;
END
$migration$;

REVOKE EXECUTE ON FUNCTION public.bbweb_create_merch_order(jsonb,jsonb,jsonb,text,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bbweb_create_merch_order(jsonb,jsonb,jsonb,text,text,text,text) TO service_role;
