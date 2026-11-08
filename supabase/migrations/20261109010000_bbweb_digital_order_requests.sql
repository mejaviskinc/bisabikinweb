-- Digital service order requests, isolated from merchandise / website payments.
-- No paid or supplier-fulfilled state is available until payment/provider integration is verified.
create table if not exists public.bbweb_digital_orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,
  idempotency_key uuid not null,
  user_id uuid not null references auth.users(id) on delete restrict,
  service text not null check (service in ('game','pulsa','data','pln','voucher')),
  product_name text not null check (char_length(product_name) between 2 and 180),
  target_primary text not null check (char_length(target_primary) between 4 and 100),
  target_secondary text not null default '' check (char_length(target_secondary)<=100),
  buyer_name text not null check (char_length(buyer_name) between 2 and 120),
  buyer_email text not null,
  buyer_phone text not null,
  note text not null default '',
  status text not null default 'requested' check (status in ('requested','reviewing','cancelled')),
  payment_status text not null default 'not_invoiced' check (payment_status = 'not_invoiced'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bbweb_digital_orders_user_idem_unique unique (user_id,idempotency_key)
);
create index if not exists bbweb_digital_orders_user_date_idx on public.bbweb_digital_orders(user_id,created_at desc);
create index if not exists bbweb_digital_orders_date_idx on public.bbweb_digital_orders(created_at desc);
alter table public.bbweb_digital_orders enable row level security;
revoke all on public.bbweb_digital_orders from anon, authenticated;
-- This table is intentionally accessible ONLY through the authenticated Edge Function.
-- Do not add permissive public insert/update policies; server verifies email + user + rate limits.
