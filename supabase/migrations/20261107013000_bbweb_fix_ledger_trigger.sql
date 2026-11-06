-- Fix order-trigger execution: PL/pgSQL CASE evaluated NEW.order_id even for bbweb_orders,
-- whose row type has no such field. Keep seller settlement condition unchanged.
CREATE OR REPLACE FUNCTION bbweb_private.release_seller_ledger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $body$
DECLARE v_order_id uuid;
BEGIN
 IF TG_TABLE_NAME='bbweb_orders' THEN
   v_order_id:=NEW.id;
 ELSE
   v_order_id:=NEW.order_id;
 END IF;
 UPDATE public.bbweb_seller_ledger ledger
 SET status='available',available_at=coalesce(ledger.available_at,now())
 FROM public.bbweb_seller_order_items item
 JOIN public.bbweb_orders o ON o.id=item.order_id
 WHERE ledger.seller_order_item_id=item.id
  AND o.id=v_order_id AND o.status='completed' AND o.payment_status='paid'
  AND item.payment_status='paid' AND item.fulfillment_status='shipped'
  AND ledger.status='pending'
  AND NOT EXISTS(
    SELECT 1 FROM public.bbweb_seller_order_items other
    WHERE other.order_id=item.order_id AND other.seller_id=item.seller_id
      AND other.payment_status='paid' AND other.fulfillment_status<>'shipped'
  );
 RETURN NEW;
END;$body$;
REVOKE ALL ON FUNCTION bbweb_private.release_seller_ledger() FROM PUBLIC,anon,authenticated;