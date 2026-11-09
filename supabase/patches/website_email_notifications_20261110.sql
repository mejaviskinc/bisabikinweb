-- Website transactional email outbox: customer receipts and internal sales alerts.
-- Email is sent only by a secret-authorized server worker, never by the browser.
create table if not exists public.bbweb_website_email_outbox (
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null references public.bbweb_website_orders(id) on delete cascade,
 event_type text not null check (event_type in ('order_received','payment_paid')),
 recipient_role text not null check (recipient_role in ('customer','admin')),
 recipient_email text not null,
 status text not null default 'pending' check (status in ('pending','sending','sent')),
 attempts integer not null default 0 check (attempts >= 0),
 next_attempt_at timestamptz not null default now(),
 claimed_at timestamptz,
 sent_at timestamptz,
 last_error text not null default '',
 created_at timestamptz not null default now(),
 unique(order_id,event_type,recipient_role)
);
create index if not exists idx_bbweb_email_pending on public.bbweb_website_email_outbox(status,next_attempt_at,created_at);
alter table public.bbweb_website_email_outbox enable row level security;
revoke all on public.bbweb_website_email_outbox from public,anon,authenticated;
grant all on public.bbweb_website_email_outbox to service_role;

create or replace function public.bbweb_enqueue_website_email()
returns trigger language plpgsql security definer
set search_path=public,pg_temp
as $$
declare event_name text;
begin
 if tg_op='INSERT' then
  event_name:='order_received';
 elsif tg_op='UPDATE' and new.payment_status='paid' and old.payment_status is distinct from 'paid' then
  event_name:='payment_paid';
 else
  return new;
 end if;
 insert into public.bbweb_website_email_outbox(order_id,event_type,recipient_role,recipient_email)
 values(new.id,event_name,'customer',new.email),
       (new.id,event_name,'admin','bussines@bisabikinweb.site')
 on conflict(order_id,event_type,recipient_role) do nothing;
 return new;
end;
$$;
revoke all on function public.bbweb_enqueue_website_email() from public,anon,authenticated;
drop trigger if exists bbweb_website_email_enqueue on public.bbweb_website_orders;
create trigger bbweb_website_email_enqueue
after insert or update of payment_status on public.bbweb_website_orders
for each row execute function public.bbweb_enqueue_website_email();

create or replace function public.bbweb_claim_website_email_jobs(
 p_order_id uuid default null,
 p_max integer default 8
) returns setof public.bbweb_website_email_outbox
language sql security definer
set search_path=public,pg_temp
as $$
 with picked as (
  select o.id from public.bbweb_website_email_outbox o
  where (p_order_id is null or o.order_id=p_order_id)
    and (
     (o.status='pending' and o.next_attempt_at<=now())
     or (o.status='sending' and o.claimed_at<now()-interval '15 minutes')
    )
  order by o.created_at,o.id
  for update skip locked
  limit least(greatest(p_max,1),20)
 )
 update public.bbweb_website_email_outbox o
 set status='sending',attempts=o.attempts+1,claimed_at=now()
 from picked where o.id=picked.id
 returning o.*;
$$;
revoke all on function public.bbweb_claim_website_email_jobs(uuid,integer) from public,anon,authenticated;
grant execute on function public.bbweb_claim_website_email_jobs(uuid,integer) to service_role;

-- Existing orders are deliberately not backfilled: never email legacy purchases
-- or invent a new notification for an already completed transaction.