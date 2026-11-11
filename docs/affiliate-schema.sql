-- BisaBikinWeb Affiliate Partner MVP
-- REVIEW BEFORE APPLYING. Deploy the backend function and storefront code together.
-- No user-level Data API access: all operations go through authenticated Edge Function.
create table if not exists public.bbweb_affiliates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null check (length(display_name) between 2 and 120),
  whatsapp text not null check (length(whatsapp) between 7 and 32),
  promotion_channel text not null check (length(promotion_channel) between 2 and 120),
  referral_code text not null unique default ('BBW' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))),
  status text not null default 'pending' check (status in ('pending','active','rejected','suspended')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists bbweb_affiliates_status_idx on public.bbweb_affiliates(status,created_at desc);

alter table public.bbweb_website_orders
  add column if not exists affiliate_id uuid references public.bbweb_affiliates(id);
create index if not exists bbweb_website_orders_affiliate_id_idx on public.bbweb_website_orders(affiliate_id);

create table if not exists public.bbweb_affiliate_commissions (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.bbweb_affiliates(id),
  order_id uuid not null unique references public.bbweb_website_orders(id),
  gross_amount bigint not null check (gross_amount >= 0),
  commission_base bigint not null check (commission_base >= 0),
  rate_percent smallint not null default 10 check (rate_percent between 0 and 30),
  commission_amount bigint not null check (commission_amount >= 0),
  status text not null default 'pending' check (status in ('pending','approved','paid','reversed')),
  eligible_at timestamptz not null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  paid_at timestamptz,
  transfer_reference text,
  constraint bbweb_affiliate_amount_bounds check (commission_base <= gross_amount and commission_amount <= gross_amount)
);
create index if not exists bbweb_affiliate_commissions_affiliate_status_idx
  on public.bbweb_affiliate_commissions(affiliate_id,status,created_at desc);

alter table public.bbweb_affiliates enable row level security;
alter table public.bbweb_affiliate_commissions enable row level security;
revoke all on public.bbweb_affiliates, public.bbweb_affiliate_commissions from public, anon, authenticated;
grant select, insert, update, delete on public.bbweb_affiliates, public.bbweb_affiliate_commissions to service_role;

-- Only a server-side, verified payment status change creates commission.
-- No function-execute privilege is available to anonymous or client JWT roles.
create or replace function public.bbweb_sync_affiliate_commission()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  paid_amount bigint;
  is_active boolean;
begin
  if new.payment_status = 'paid' and old.payment_status is distinct from 'paid' and new.affiliate_id is not null then
    select exists(select 1 from public.bbweb_affiliates a where a.id=new.affiliate_id and a.status='active' and a.user_id<>new.user_id) into is_active;
    if is_active and not exists (
      select 1 from public.bbweb_website_orders o
      where o.user_id=new.user_id and o.id<>new.id and o.payment_status='paid'
    ) then
      select max(p.amount) into paid_amount from public.bbweb_website_payments p
        where p.order_id=new.id and p.status='paid' and p.environment='production';
      if coalesce(paid_amount,0)>0 then
        insert into public.bbweb_affiliate_commissions
          (affiliate_id,order_id,gross_amount,commission_base,rate_percent,commission_amount,status,eligible_at)
        values (new.affiliate_id,new.id,paid_amount,paid_amount,10,floor(paid_amount::numeric * .10)::bigint,'pending',now()+interval '14 days')
        on conflict (order_id) do nothing;
      end if;
    end if;
  elsif new.payment_status in ('refunded','failed') and old.payment_status is distinct from new.payment_status then
    update public.bbweb_affiliate_commissions
       set status='reversed', reviewed_at=now()
     where order_id=new.id and status in ('pending','approved');
  end if;
  return new;
end;
$$;
revoke all on function public.bbweb_sync_affiliate_commission() from public, anon, authenticated;
drop trigger if exists bbweb_affiliate_commission_on_paid on public.bbweb_website_orders;
create trigger bbweb_affiliate_commission_on_paid
after update of payment_status on public.bbweb_website_orders
for each row execute function public.bbweb_sync_affiliate_commission();

comment on table public.bbweb_affiliates is 'Affiliate applications; unique verified auth user; approved codes only.';
comment on table public.bbweb_affiliate_commissions is 'Provisional affiliate commission from production paid website orders; human approval and payout required.';
