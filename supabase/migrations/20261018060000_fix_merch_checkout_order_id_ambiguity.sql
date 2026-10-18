-- Fix checkout RPC ambiguity: output parameter order_id conflicts with the seller-order-items column name.
-- Explicitly name the unique constraint so Postgres does not resolve the conflict target as a PL/pgSQL variable.

CREATE OR REPLACE FUNCTION public.bbweb_create_merch_order(p_customer jsonb, p_shipping jsonb, p_items jsonb, p_access_token_hash text, p_checkout_key_hash text, p_request_hash text, p_note text DEFAULT ''::text)
 RETURNS TABLE(order_id uuid, order_no text, subtotal integer, total integer, inventory_state text, created boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_existing public.bbweb_orders%rowtype;
  v_customer_id uuid;
  v_email text := lower(btrim(coalesce(p_customer->>'email','')));
  v_name text := btrim(coalesce(p_customer->>'name',''));
  v_phone text := btrim(coalesce(p_customer->>'phone',''));
  v_item record;
  v_product public.bbweb_merchandise%rowtype;
  v_seller public.bbweb_sellers%rowtype;
  v_snapshot jsonb := '[]'::jsonb;
  v_subtotal integer := 0;
  v_shipping integer := 0;
  v_qty integer;
  v_line integer;
  v_commission_rate numeric(5,2);
  v_commission_amount integer;
  v_seller_amount integer;
  v_seller_name text;
  v_order public.bbweb_orders%rowtype;
begin
  v_shipping := coalesce(nullif(p_shipping->>'shipping_cost','')::integer,0);
  if v_shipping < 0 or v_shipping > 2000000 then raise exception 'INVALID_SHIPPING_COST'; end if;
  if length(p_access_token_hash) < 32 or length(p_checkout_key_hash) < 32 or length(p_request_hash) < 32 then raise exception 'INVALID_CHECKOUT_TOKEN'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 20 then raise exception 'INVALID_CART'; end if;
  if length(v_name) < 2 or position('@' in v_email) < 2 or length(regexp_replace(v_phone,'\D','','g')) < 8 then raise exception 'INVALID_CUSTOMER'; end if;
  select * into v_existing from public.bbweb_orders where checkout_key_hash = p_checkout_key_hash limit 1;
  if found then
    if v_existing.request_hash is distinct from p_request_hash then raise exception 'CHECKOUT_KEY_REUSED'; end if;
    return query select v_existing.id, v_existing.order_no, round(v_existing.subtotal)::int, round(v_existing.total)::int, v_existing.inventory_state, false;
    return;
  end if;
  select id into v_customer_id from public.bbweb_customers where lower(btrim(email)) = v_email limit 1;
  if v_customer_id is null then
    insert into public.bbweb_customers(name,email,phone,last_shipping_address,last_order_at,updated_at)
    values (left(v_name,120),left(v_email,254),left(v_phone,40),coalesce(p_shipping,'{}'::jsonb),now(),now()) returning id into v_customer_id;
  else
    update public.bbweb_customers set name=left(v_name,120),phone=left(v_phone,40),last_shipping_address=coalesce(p_shipping,'{}'::jsonb),last_order_at=now(),updated_at=now() where id=v_customer_id;
  end if;
  for v_item in
    select item->>'productId' as product_id, sum((item->>'quantity')::int)::int as quantity
    from jsonb_array_elements(p_items) item group by item->>'productId'
  loop
    v_qty := v_item.quantity;
    if coalesce(v_item.product_id,'') = '' or v_qty < 1 or v_qty > 20 then raise exception 'INVALID_CART_ITEM'; end if;
    select * into v_product from public.bbweb_merchandise where id=v_item.product_id and is_active=true for update;
    if not found then raise exception 'PRODUCT_UNAVAILABLE:%', v_item.product_id; end if;
    if v_product.price is null or v_product.price <= 0 then raise exception 'PRODUCT_NOT_FOR_SALE:%', v_item.product_id; end if;
    if v_product.stock < v_qty then raise exception 'INSUFFICIENT_STOCK:%', v_item.product_id; end if;
    v_seller_name := null;
    v_commission_rate := 0;
    v_commission_amount := 0;
    v_seller_amount := 0;
    if v_product.seller_id is not null then
      select * into v_seller from public.bbweb_sellers where id=v_product.seller_id and status='active';
      if not found or v_product.seller_review_status <> 'approved' then raise exception 'PRODUCT_UNAVAILABLE:%', v_item.product_id; end if;
      v_seller_name := v_seller.store_name;
      v_commission_rate := v_seller.commission_rate;
    end if;
    v_line := round(v_product.price)::int * v_qty;
    if v_product.seller_id is not null then
      v_commission_amount := round(v_line * v_commission_rate / 100)::int;
      v_seller_amount := v_line - v_commission_amount;
    end if;
    v_subtotal := v_subtotal + v_line;
    update public.bbweb_merchandise set stock=stock-v_qty,updated_at=now() where id=v_product.id;
    v_snapshot := v_snapshot || jsonb_build_array(jsonb_build_object(
      'productId',v_product.id,'variantId',v_product.id,'sku',v_product.sku,'name',v_product.name,
      'color',coalesce(nullif(v_product.color,''),'Default'),'size','Standard','price',round(v_product.price)::int,
      'quantity',v_qty,'lineTotal',v_line,'sellerId',v_product.seller_id,'sellerName',v_seller_name,
      'commissionRate',v_commission_rate,'commissionAmount',v_commission_amount,'sellerAmount',v_seller_amount
    ));
  end loop;
  insert into public.bbweb_orders(
    customer_id,customer_name,customer_email,customer_phone,items,subtotal,discount,total,status,payment_status,
    notes,access_token_hash,checkout_key_hash,request_hash,shipping_address,shipping_amount,currency,
    reserved_until,inventory_state,updated_at
  ) values (
    v_customer_id,left(v_name,120),left(v_email,254),left(v_phone,40),v_snapshot,v_subtotal,0,v_subtotal+v_shipping,
    'waiting_payment','pending',left(coalesce(p_note,''),3000),p_access_token_hash,p_checkout_key_hash,p_request_hash,
    coalesce(p_shipping,'{}'::jsonb),v_shipping,'IDR',now()+interval '30 minutes','reserved',now()
  ) returning * into v_order;
  for v_item in select value as item from jsonb_array_elements(v_order.items) as x(value)
  loop
    if coalesce(v_item.item->>'sellerId','') <> '' then
      insert into public.bbweb_seller_order_items(
        order_id,seller_id,merchandise_id,sku,product_name,quantity,unit_price,gross_amount,
        commission_rate,commission_amount,seller_amount
      ) values (
        v_order.id,(v_item.item->>'sellerId')::uuid,v_item.item->>'productId',
        coalesce(v_item.item->>'sku',''),coalesce(v_item.item->>'name','Merchandise'),
        (v_item.item->>'quantity')::integer,(v_item.item->>'price')::integer,
        (v_item.item->>'lineTotal')::integer,coalesce((v_item.item->>'commissionRate')::numeric,0),
        coalesce((v_item.item->>'commissionAmount')::integer,0),coalesce((v_item.item->>'sellerAmount')::integer,0)
      ) on conflict on constraint bbweb_seller_order_items_order_id_merchandise_id_key do nothing;
    end if;
  end loop;
  return query select v_order.id,v_order.order_no,v_subtotal,round(v_order.total)::int,v_order.inventory_state,true;
end;
$function$
