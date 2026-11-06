-- Additive DOKU runtime patch. Review live table constraints before applying.
-- No payment/order history is rewritten. All APIs below are service-role only.
BEGIN;

CREATE TABLE IF NOT EXISTS public.bbweb_doku_poll_slots (
  payment_id uuid PRIMARY KEY REFERENCES public.bbweb_merch_payments(id) ON DELETE CASCADE,
  next_poll_at timestamptz NOT NULL
);
ALTER TABLE public.bbweb_doku_poll_slots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.bbweb_doku_poll_slots FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bbweb_doku_poll_slots TO service_role;

CREATE OR REPLACE FUNCTION public.bbweb_claim_doku_payment(
  p_order_id uuid, p_invoice text, p_environment text
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER
SET search_path = public, pg_temp AS $fn$
DECLARE o public.bbweb_orders%ROWTYPE; p public.bbweb_merch_payments%ROWTYPE;
BEGIN
  IF p_environment IS NULL OR p_invoice IS NULL OR p_environment NOT IN ('sandbox','production') OR p_invoice !~ '^[A-Za-z0-9]{1,30}$' THEN
    RAISE EXCEPTION 'INVALID_DOKU_ATTEMPT';
  END IF;
  -- One order lock serializes initial checkout and buyer payment continuation.
  SELECT * INTO o FROM public.bbweb_orders WHERE id=p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;
  IF o.payment_status IN ('paid','refunded','partial_refund') OR o.status IN ('completed','cancelled') THEN
    RAISE EXCEPTION 'ORDER_NOT_PAYABLE';
  END IF;
  IF o.currency <> 'IDR' OR o.total < 1 OR o.total <> trunc(o.total) THEN RAISE EXCEPTION 'INVALID_AMOUNT'; END IF;
  SELECT * INTO p FROM public.bbweb_merch_payments WHERE order_id=o.id
    AND status IN ('created','pending','authorized','unknown','failed','paid') ORDER BY created_at DESC LIMIT 1;
  IF FOUND THEN RETURN jsonb_build_object('claimed',false,'payment',to_jsonb(p)); END IF;
  IF o.inventory_state='released' THEN PERFORM public.bbweb_reserve_merch_order(o.id); END IF;
  INSERT INTO public.bbweb_merch_payments(order_id,merchant_order_id,provider,amount,currency,environment,status)
    VALUES(o.id,p_invoice,'doku',o.total,'IDR',p_environment,'created') RETURNING * INTO p;
  RETURN jsonb_build_object('claimed',true,'payment',to_jsonb(p));
END;
$fn$;
REVOKE ALL ON FUNCTION public.bbweb_claim_doku_payment(uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bbweb_claim_doku_payment(uuid,text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.bbweb_take_doku_poll_slot(p_payment_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $fn$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.bbweb_doku_poll_slots(payment_id,next_poll_at) VALUES(p_payment_id,now()+interval '60 seconds')
  ON CONFLICT(payment_id) DO UPDATE SET next_poll_at=EXCLUDED.next_poll_at
    WHERE bbweb_doku_poll_slots.next_poll_at<=now()
  RETURNING payment_id INTO v_id;
  RETURN v_id IS NOT NULL;
END;
$fn$;
REVOKE ALL ON FUNCTION public.bbweb_take_doku_poll_slot(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bbweb_take_doku_poll_slot(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.bbweb_apply_doku_payment(
  p_payment_id uuid, p_invoice text, p_amount numeric, p_status text,
  p_transaction_status text, p_payment_type text
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $fn$
DECLARE o public.bbweb_orders%ROWTYPE; p public.bbweb_merch_payments%ROWTYPE; v_order_id uuid;
BEGIN
  IF p_status IS NULL OR p_status NOT IN ('paid','pending','authorized','failed','expired','refunded','unknown') THEN RAISE EXCEPTION 'INVALID_STATUS'; END IF;
  SELECT order_id INTO v_order_id FROM public.bbweb_merch_payments WHERE id=p_payment_id AND provider='doku';
  IF NOT FOUND THEN RAISE EXCEPTION 'PAYMENT_NOT_FOUND'; END IF;
  -- Same lock order as the claim path. Payment and stock/seller settlement commit together.
  SELECT * INTO o FROM public.bbweb_orders WHERE id=v_order_id FOR UPDATE;
  SELECT * INTO p FROM public.bbweb_merch_payments WHERE id=p_payment_id AND provider='doku' FOR UPDATE;
  IF p.merchant_order_id IS DISTINCT FROM p_invoice OR p.amount IS DISTINCT FROM p_amount THEN RAISE EXCEPTION 'DOKU_AMOUNT_MISMATCH'; END IF;
  IF p.status='refunded' OR ((p.status='paid' OR p.paid_at IS NOT NULL) AND p_status NOT IN ('paid','refunded')) THEN RETURN to_jsonb(p); END IF;
  IF p_status='paid' THEN
    IF o.payment_status IN ('refunded','partial_refund') THEN RETURN to_jsonb(p); END IF;
    IF o.payment_status IS DISTINCT FROM 'paid' THEN
      -- A late payment may arrive after the reservation expires. Reacquire stock first.
      -- If stock is unavailable this entire transaction rolls back and DOKU retries;
      -- manual reconciliation is required instead of silently overselling.
      IF o.inventory_state='released' THEN PERFORM public.bbweb_reserve_merch_order(o.id); END IF;
      PERFORM public.bbweb_commit_merch_order(o.id);
    END IF;
  ELSIF p_status='refunded' THEN
    UPDATE public.bbweb_orders SET payment_status='refunded',updated_at=now() WHERE id=o.id;
  END IF;
  UPDATE public.bbweb_merch_payments SET status=p_status,
    transaction_status=left(p_transaction_status,50),payment_type=left(p_payment_type,100),updated_at=now(),
    paid_at=CASE WHEN p_status='paid' THEN coalesce(p.paid_at,now()) ELSE p.paid_at END
    WHERE id=p.id RETURNING * INTO p;
  RETURN to_jsonb(p);
END;
$fn$;
REVOKE ALL ON FUNCTION public.bbweb_apply_doku_payment(uuid,text,numeric,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bbweb_apply_doku_payment(uuid,text,numeric,text,text,text) TO service_role;
COMMIT;
