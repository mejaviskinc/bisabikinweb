-- Add a transactional quote-ready email for the existing website order system.
-- Orders, payments, and unrelated GoO ninks / merchandise data remain untouched.
alter table public.bbweb_website_email_outbox
 drop constraint if exists bbweb_website_email_outbox_event_type_check;
alter table public.bbweb_website_email_outbox
 add constraint bbweb_website_email_outbox_event_type_check
 check (event_type in ('order_received','quote_ready','payment_paid'));

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
 elsif tg_op='UPDATE' and new.status='proposal' and old.status is distinct from 'proposal'
       and new.quoted_total is not null and new.quoted_total>0 then
  event_name:='quote_ready';
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
after insert or update of status,payment_status on public.bbweb_website_orders
for each row execute function public.bbweb_enqueue_website_email();

-- Existing rows are not backfilled to avoid sending surprise invoice emails.
