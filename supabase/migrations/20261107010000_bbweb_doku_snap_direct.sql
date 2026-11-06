-- Add direct DOKU SNAP payments without modifying GoO ninks or existing DOKU Checkout rows.
ALTER TABLE public.bbweb_merch_payments DROP CONSTRAINT bbweb_merch_payments_provider_check;
ALTER TABLE public.bbweb_merch_payments ADD CONSTRAINT bbweb_merch_payments_provider_check
 CHECK(provider IN ('doku','doku_snap','midtrans'));
ALTER TABLE public.bbweb_merch_payments
 ADD COLUMN IF NOT EXISTS payment_details jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS bbweb_snap_active_payment_idx ON public.bbweb_merch_payments(order_id,status) WHERE provider='doku_snap';

CREATE OR REPLACE FUNCTION public.bbweb_claim_snap_payment(p_order_id uuid,p_invoice text,p_environment text,p_method text)
RETURNS jsonb LANGUAGE plpgsql SET search_path=public,pg_temp AS $fn$
DECLARE o public.bbweb_orders%rowtype;p public.bbweb_merch_payments%rowtype;
BEGIN
 IF p_environment NOT IN ('sandbox','production') OR p_invoice !~ '^[A-Za-z0-9]{1,30}$'
 OR p_method NOT IN ('snap_qris','snap_va_bca','snap_va_bri') THEN RAISE EXCEPTION 'INVALID_SNAP_ATTEMPT';END IF;
 SELECT * INTO o FROM public.bbweb_orders WHERE id=p_order_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND';END IF;
 IF o.payment_status IN ('paid','refunded','partial_refund') OR o.status IN ('completed','cancelled') THEN RAISE EXCEPTION 'ORDER_NOT_PAYABLE';END IF;
 IF o.currency<>'IDR' OR o.total<1 OR o.total<>trunc(o.total) THEN RAISE EXCEPTION 'INVALID_AMOUNT';END IF;
 SELECT * INTO p FROM public.bbweb_merch_payments WHERE order_id=o.id
 AND status IN('created','pending','authorized','unknown','failed','paid') ORDER BY created_at DESC LIMIT 1;
 IF FOUND THEN RETURN jsonb_build_object('claimed',false,'payment',to_jsonb(p));END IF;
 IF o.inventory_state='released' THEN PERFORM public.bbweb_reserve_merch_order(o.id);END IF;
 INSERT INTO public.bbweb_merch_payments(order_id,merchant_order_id,provider,amount,currency,environment,status,payment_type)
 VALUES(o.id,p_invoice,'doku_snap',o.total,'IDR',p_environment,'created',p_method) RETURNING * INTO p;
 RETURN jsonb_build_object('claimed',true,'payment',to_jsonb(p));
END;$fn$;

CREATE OR REPLACE FUNCTION public.bbweb_apply_snap_payment(
 p_payment_id uuid,p_invoice text,p_amount numeric,p_status text,p_transaction_status text,p_payment_type text)
RETURNS jsonb LANGUAGE plpgsql SET search_path=public,pg_temp AS $fn$
DECLARE o public.bbweb_orders%rowtype;p public.bbweb_merch_payments%rowtype;v_order_id uuid;
BEGIN
 IF p_status NOT IN('paid','pending','expired','unknown','refunded') THEN RAISE EXCEPTION 'INVALID_STATUS';END IF;
 SELECT order_id INTO v_order_id FROM public.bbweb_merch_payments WHERE id=p_payment_id AND provider='doku_snap';
 IF NOT FOUND THEN RAISE EXCEPTION 'PAYMENT_NOT_FOUND';END IF;
 SELECT * INTO o FROM public.bbweb_orders WHERE id=v_order_id FOR UPDATE;
 SELECT * INTO p FROM public.bbweb_merch_payments WHERE id=p_payment_id AND provider='doku_snap' FOR UPDATE;
 IF p.merchant_order_id IS DISTINCT FROM p_invoice OR p.amount IS DISTINCT FROM p_amount OR p.currency<>'IDR'
 THEN RAISE EXCEPTION 'SNAP_AMOUNT_MISMATCH';END IF;
 IF p.status='refunded' OR ((p.status='paid' OR p.paid_at IS NOT NULL) AND p_status NOT IN('paid','refunded')) THEN RETURN to_jsonb(p);END IF;
 IF p_status='paid' THEN
  IF o.payment_status IN('refunded','partial_refund') THEN RETURN to_jsonb(p);END IF;
  IF o.payment_status IS DISTINCT FROM 'paid' THEN
   IF o.inventory_state='released' THEN PERFORM public.bbweb_reserve_merch_order(o.id);END IF;
   PERFORM public.bbweb_commit_merch_order(o.id);
  END IF;
 ELSIF p_status='refunded' THEN
  UPDATE public.bbweb_orders SET payment_status='refunded',status='refunded',updated_at=now() WHERE id=o.id;
 ELSIF p_status='expired' AND p.status NOT IN('paid','refunded') THEN
  PERFORM public.bbweb_release_merch_order(o.id,'expired','expired');
 END IF;
 UPDATE public.bbweb_merch_payments SET status=p_status,
 transaction_status=left(coalesce(p_transaction_status,''),50),
 payment_type=left(coalesce(p_payment_type,''),100),
 updated_at=now(),paid_at=CASE WHEN p_status='paid' THEN coalesce(p.paid_at,now()) ELSE p.paid_at END
 WHERE id=p.id RETURNING * INTO p;
 RETURN to_jsonb(p);
END;$fn$;

REVOKE ALL ON FUNCTION public.bbweb_claim_snap_payment(uuid,text,text,text)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bbweb_claim_snap_payment(uuid,text,text,text) TO service_role;
REVOKE ALL ON FUNCTION public.bbweb_apply_snap_payment(uuid,text,numeric,text,text,text)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bbweb_apply_snap_payment(uuid,text,numeric,text,text,text) TO service_role;
