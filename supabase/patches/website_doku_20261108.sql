-- Isolated DOKU Checkout ledger for website services; merchandise settlement is untouched.
create table if not exists public.bbweb_website_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.bbweb_website_orders(id) on delete restrict,
  merchant_order_id text not null unique check (merchant_order_id ~ '^BWS[A-F0-9]{23}$'),
  provider text not null default 'doku' check (provider = 'doku'),
  amount bigint not null check (amount between 1 and 999999999999),
  currency text not null default 'IDR' check (currency = 'IDR'),
  environment text not null check (environment in ('sandbox','production')),
  status text not null default 'created' check (status in ('created','pending','authorized','unknown','paid','expired','refunded')),
  transaction_status text not null default '',
  payment_type text not null default '',
  redirect_url text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_bbweb_website_payments_status on public.bbweb_website_payments(status,created_at desc);
alter table public.bbweb_website_payments enable row level security;
drop policy if exists bbweb_website_payments_owner_select on public.bbweb_website_payments;
create policy bbweb_website_payments_owner_select on public.bbweb_website_payments
for select to authenticated using
 (exists(select 1 from public.bbweb_website_orders o where o.id=order_id and o.user_id=(select auth.uid())));
revoke all on public.bbweb_website_payments from public,anon,authenticated;
grant select on public.bbweb_website_payments to authenticated;
grant all on public.bbweb_website_payments to service_role;

create or replace function public.bbweb_claim_website_doku_payment(
 p_order_id uuid,p_invoice text,p_environment text
) returns jsonb language plpgsql security definer
set search_path = public,pg_temp
as $$
declare o public.bbweb_website_orders%rowtype;
        p public.bbweb_website_payments%rowtype;
        inserted boolean := false;
begin
 if p_environment not in ('sandbox','production') then raise exception 'INVALID_ENVIRONMENT'; end if;
 select * into o from public.bbweb_website_orders where id=p_order_id for update;
 if not found then raise exception 'ORDER_NOT_FOUND'; end if;
 if p_invoice <> 'BWS'||upper(left(replace(o.id::text,'-',''),23)) then raise exception 'INVALID_WEBSITE_INVOICE'; end if;
 if o.status <> 'awaiting_payment' or o.payment_status = 'paid' then raise exception 'ORDER_NOT_APPROVED_FOR_PAYMENT'; end if;
 if o.quoted_total is null or o.quoted_total < 1 or o.quoted_total > 999999999999 then raise exception 'INVALID_APPROVED_QUOTE'; end if;
 insert into public.bbweb_website_payments(order_id,merchant_order_id,amount,environment)
 values (o.id,p_invoice,o.quoted_total,p_environment)
 on conflict (order_id) do nothing;
 get diagnostics inserted = row_count;
 select * into p from public.bbweb_website_payments where order_id=o.id for update;
 if p.environment <> p_environment or p.amount <> o.quoted_total or p.merchant_order_id <> p_invoice then raise exception 'PAYMENT_ALREADY_LOCKED_DIFFERENT_DETAILS'; end if;
 return jsonb_build_object('claimed',inserted,'payment',to_jsonb(p));
end;
$$;
revoke all on function public.bbweb_claim_website_doku_payment(uuid,text,text) from public,anon,authenticated;
grant execute on function public.bbweb_claim_website_doku_payment(uuid,text,text) to service_role;

create or replace function public.bbweb_apply_website_doku_payment(
 p_invoice text,p_amount numeric,p_environment text,p_status text,p_transaction_status text,p_payment_type text
) returns jsonb language plpgsql security definer
set search_path = public,pg_temp
as $$
declare p public.bbweb_website_payments%rowtype;
        o public.bbweb_website_orders%rowtype;
        new_payment_status text;
        transitioned boolean := false;
begin
 if p_status not in ('pending','authorized','paid','expired','refunded') then raise exception 'INVALID_PROVIDER_STATUS'; end if;
 select * into p from public.bbweb_website_payments where merchant_order_id=p_invoice for update;
 if not found then raise exception 'PAYMENT_NOT_FOUND'; end if;
 if p_environment <> p.environment or p_amount <> p.amount then raise exception 'SIGNED_AMOUNT_OR_ENVIRONMENT_MISMATCH'; end if;
 select * into o from public.bbweb_website_orders where id=p.order_id for update;
 if not found then raise exception 'ORDER_NOT_FOUND'; end if;
 if p.status='paid' and p_status in ('pending','authorized','expired') then return jsonb_build_object('id',p.id,'status','paid','duplicate',true); end if;
 if p.status='refunded' and p_status <> 'refunded' then return jsonb_build_object('id',p.id,'status','refunded','duplicate',true); end if;
 transitioned := p.status is distinct from p_status;
 update public.bbweb_website_payments
 set status=p_status,transaction_status=left(coalesce(p_transaction_status,''),50),
     payment_type=left(coalesce(p_payment_type,''),100),
     paid_at=case when p_status='paid' then coalesce(p.paid_at,now()) else p.paid_at end,
     updated_at=now()
 where id=p.id;
 new_payment_status:=case p_status when 'paid' then 'paid' when 'refunded' then 'refunded' when 'expired' then 'failed' else 'pending' end;
 update public.bbweb_website_orders
 set payment_status=new_payment_status,
     status=case when p_status='paid' and status='awaiting_payment' then 'in_progress' else status end,
     updated_at=now()
 where id=p.order_id;
 if transitioned then
   insert into public.bbweb_website_order_events(order_id,actor_user_id,event_type,note)
   values(p.order_id,null,case p_status when 'paid' then 'payment_paid' when 'refunded' then 'payment_refunded' else 'payment_'||p_status end,
          'DOKU Checkout: '||upper(p_status));
 end if;
 return jsonb_build_object('id',p.id,'status',p_status,'duplicate',not transitioned);
end;
$$;
revoke all on function public.bbweb_apply_website_doku_payment(text,numeric,text,text,text,text) from public,anon,authenticated;
grant execute on function public.bbweb_apply_website_doku_payment(text,numeric,text,text,text,text) to service_role;

-- Block changes to merchant-approved pricing after an invoice was reserved.
create or replace function public.bbweb_protect_website_quoted_total()
returns trigger language plpgsql security invoker set search_path=public,pg_temp
as $$
begin
 if old.quoted_total is distinct from new.quoted_total
   and exists(select 1 from public.bbweb_website_payments p where p.order_id=old.id)
 then raise exception 'QUOTE_LOCKED_BY_DOKU_PAYMENT'; end if;
 return new;
end;
$$;
drop trigger if exists bbweb_website_quote_lock on public.bbweb_website_orders;
create trigger bbweb_website_quote_lock before update of quoted_total on public.bbweb_website_orders
for each row execute function public.bbweb_protect_website_quoted_total();
revoke all on function public.bbweb_protect_website_quoted_total() from public,anon,authenticated;
