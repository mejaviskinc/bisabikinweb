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
  IF position('round(v_order.total)::int' IN v_definition) = 0 THEN
    v_definition := replace(
      v_definition,
      'return query select v_order.id,v_order.order_no,v_subtotal,v_order.total,',
      'return query select v_order.id,v_order.order_no,v_subtotal,round(v_order.total)::int,'
    );
    IF position('round(v_order.total)::int' IN v_definition) = 0 THEN
      RAISE EXCEPTION 'Could not safely cast shipping-inclusive order total';
    END IF;
    EXECUTE v_definition;
  END IF;
END
$migration$;
