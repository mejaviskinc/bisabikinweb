-- Incremental patch for the already-installed seller marketplace schema.
-- Keeps inventory adjustments atomic and prevents seller funds from becoming withdrawable
-- until the order is marked completed and every paid item for that seller is shipped.

CREATE OR REPLACE FUNCTION public.bbweb_adjust_seller_stock(
  p_seller_id uuid, p_product_id text, p_delta integer
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_status text; v_stock integer;
BEGIN
  IF p_delta IS NULL OR p_delta = 0 OR p_delta < -10000 OR p_delta > 10000 THEN
    RAISE EXCEPTION 'INVALID_STOCK_DELTA';
  END IF;
  SELECT status INTO v_status FROM public.bbweb_sellers WHERE id = p_seller_id FOR UPDATE;
  IF NOT FOUND OR v_status <> 'active' THEN RAISE EXCEPTION 'SELLER_NOT_ACTIVE'; END IF;
  SELECT stock INTO v_stock FROM public.bbweb_merchandise
    WHERE id = p_product_id AND seller_id = p_seller_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'PRODUCT_NOT_FOUND'; END IF;
  IF v_stock + p_delta < 0 OR v_stock + p_delta > 10000 THEN RAISE EXCEPTION 'STOCK_OUT_OF_RANGE'; END IF;
  UPDATE public.bbweb_merchandise SET stock = v_stock + p_delta, updated_at = now()
    WHERE id = p_product_id AND seller_id = p_seller_id;
  RETURN v_stock + p_delta;
END;
$function$;
REVOKE ALL ON FUNCTION public.bbweb_adjust_seller_stock(uuid,text,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bbweb_adjust_seller_stock(uuid,text,integer) TO service_role;

CREATE OR REPLACE FUNCTION public.bbweb_seller_order_completion_ledger()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.payment_status = 'paid' THEN
    UPDATE public.bbweb_seller_order_items
    SET payment_status = 'paid', updated_at = now()
    WHERE order_id = NEW.id AND payment_status NOT IN ('refunded','partial_refund');

    INSERT INTO public.bbweb_seller_ledger(
      seller_id, order_id, seller_order_item_id, amount, status, description
    )
    SELECT soi.seller_id, soi.order_id, soi.id, soi.seller_amount, 'pending',
      'Penjualan ' || soi.product_name || ' · ' || NEW.order_no
    FROM public.bbweb_seller_order_items soi
    WHERE soi.order_id = NEW.id AND soi.payment_status = 'paid' AND soi.seller_amount > 0
    ON CONFLICT (seller_order_item_id) DO NOTHING;
  END IF;

  IF NEW.payment_status IN ('refunded','partial_refund') THEN
    UPDATE public.bbweb_seller_order_items
    SET payment_status = NEW.payment_status, updated_at = now()
    WHERE order_id = NEW.id AND payment_status NOT IN ('refunded','partial_refund');

    UPDATE public.bbweb_seller_ledger
    SET status = 'reversed',
        description = left(description || CASE
          WHEN NEW.payment_status = 'partial_refund' THEN ' · dibalik untuk rekonsiliasi refund sebagian'
          ELSE ' · dibalik karena refund'
        END, 500)
    WHERE order_id = NEW.id AND status IN ('pending','available');
  END IF;

  IF NEW.status = 'completed' AND NEW.payment_status = 'paid' THEN
    UPDATE public.bbweb_seller_ledger l
    SET status = 'available', available_at = coalesce(l.available_at, now())
    FROM public.bbweb_seller_order_items soi
    WHERE l.seller_order_item_id = soi.id AND soi.order_id = NEW.id
      AND soi.payment_status = 'paid' AND soi.fulfillment_status = 'shipped'
      AND l.status = 'pending'
      AND NOT EXISTS (
        SELECT 1 FROM public.bbweb_seller_order_items other
        WHERE other.order_id = soi.order_id AND other.seller_id = soi.seller_id
          AND other.payment_status = 'paid' AND other.fulfillment_status <> 'shipped'
      );
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.bbweb_seller_order_completion_ledger() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bbweb_seller_order_completion_ledger() TO service_role;

CREATE OR REPLACE FUNCTION public.bbweb_seller_fulfillment_ledger_release()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_order public.bbweb_orders%rowtype;
BEGIN
  IF NEW.fulfillment_status = 'shipped' AND NEW.payment_status = 'paid' THEN
    SELECT * INTO v_order FROM public.bbweb_orders WHERE id = NEW.order_id;
    IF FOUND AND v_order.status = 'completed' AND v_order.payment_status = 'paid' THEN
      UPDATE public.bbweb_seller_ledger l
      SET status = 'available', available_at = coalesce(l.available_at, now())
      FROM public.bbweb_seller_order_items soi
      WHERE l.seller_order_item_id = soi.id AND soi.order_id = NEW.order_id
        AND soi.seller_id = NEW.seller_id AND soi.payment_status = 'paid'
        AND soi.fulfillment_status = 'shipped' AND l.status = 'pending'
        AND NOT EXISTS (
          SELECT 1 FROM public.bbweb_seller_order_items other
          WHERE other.order_id = NEW.order_id AND other.seller_id = NEW.seller_id
            AND other.payment_status = 'paid' AND other.fulfillment_status <> 'shipped'
        );
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.bbweb_seller_fulfillment_ledger_release() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bbweb_seller_fulfillment_ledger_release() TO service_role;

DROP TRIGGER IF EXISTS bbweb_seller_fulfillment_ledger_release_trigger ON public.bbweb_seller_order_items;
CREATE TRIGGER bbweb_seller_fulfillment_ledger_release_trigger
AFTER UPDATE OF fulfillment_status, payment_status ON public.bbweb_seller_order_items
FOR EACH ROW EXECUTE FUNCTION public.bbweb_seller_fulfillment_ledger_release();
