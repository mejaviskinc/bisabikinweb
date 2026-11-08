-- Additive website-services ordering schema. Separate from merchandise/DOKU tables.
-- No destructive changes; existing bbweb_* and shared gn_* objects stay untouched.
create table if not exists public.bbweb_website_templates (
  slug text primary key check (slug ~ '^[a-z0-9][a-z0-9-]{1,80}$'),
  title text not null check (char_length(title) between 3 and 180),
  category text not null check (char_length(category) between 2 and 80),
  description text not null default '',
  features jsonb not null default '[]'::jsonb check (jsonb_typeof(features)='array'),
  image_url text,
  demo_url text,
  is_active boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.bbweb_website_packages (
  slug text primary key check (slug ~ '^[a-z0-9][a-z0-9-]{1,80}$'),
  name text not null check (char_length(name) between 2 and 160),
  description text not null default '',
  features jsonb not null default '[]'::jsonb check (jsonb_typeof(features)='array'),
  base_price bigint check (base_price is null or base_price>=0),
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.bbweb_website_orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique check (order_no ~ '^BW-[A-F0-9]{12}$'),
  user_id uuid not null references auth.users(id) on delete restrict,
  package_slug text not null references public.bbweb_website_packages(slug) on delete restrict,
  template_slug text,
  category text not null default 'umkm',
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text not null check (char_length(email) between 3 and 254),
  phone text not null check (char_length(phone) between 7 and 32),
  company text not null check (char_length(company) between 2 and 160),
  requested_domain text not null default '',
  domain_status text not null default 'unchecked' check (domain_status in ('unchecked','manual_review','available','unavailable','registered')),
  reference_url text not null default '',
  brief text not null check (char_length(brief) between 20 and 3500),
  base_price_snapshot bigint check (base_price_snapshot is null or base_price_snapshot>=0),
  quoted_total bigint check (quoted_total is null or quoted_total>=0),
  status text not null default 'requested' check (status in ('requested','reviewing','proposal','awaiting_payment','in_progress','client_review','revision','completed','cancelled')),
  payment_status text not null default 'not_invoiced' check (payment_status in ('not_invoiced','pending','paid','failed','refunded')),
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.bbweb_website_order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.bbweb_website_orders(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (char_length(event_type) between 2 and 50),
  note text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists idx_bbweb_website_orders_user_created on public.bbweb_website_orders(user_id,created_at desc);
create index if not exists idx_bbweb_website_orders_status on public.bbweb_website_orders(status,created_at desc);
create index if not exists idx_bbweb_website_events_order_date on public.bbweb_website_order_events(order_id,created_at desc);
create index if not exists idx_bbweb_website_templates_active on public.bbweb_website_templates(is_active,sort_order);
create index if not exists idx_bbweb_website_packages_active on public.bbweb_website_packages(is_active,sort_order);
alter table public.bbweb_website_templates enable row level security;
alter table public.bbweb_website_packages enable row level security;
alter table public.bbweb_website_orders enable row level security;
alter table public.bbweb_website_order_events enable row level security;
drop policy if exists bbweb_website_templates_public_read on public.bbweb_website_templates;
create policy bbweb_website_templates_public_read on public.bbweb_website_templates for select to anon,authenticated using (is_active=true);
drop policy if exists bbweb_website_packages_public_read on public.bbweb_website_packages;
create policy bbweb_website_packages_public_read on public.bbweb_website_packages for select to anon,authenticated using (is_active=true);
drop policy if exists bbweb_website_orders_owner_read on public.bbweb_website_orders;
create policy bbweb_website_orders_owner_read on public.bbweb_website_orders for select to authenticated using ((select auth.uid())=user_id);
drop policy if exists bbweb_website_events_owner_read on public.bbweb_website_order_events;
create policy bbweb_website_events_owner_read on public.bbweb_website_order_events for select to authenticated
 using (exists (select 1 from public.bbweb_website_orders o where o.id=order_id and o.user_id=(select auth.uid())));
revoke all on public.bbweb_website_templates,public.bbweb_website_packages,public.bbweb_website_orders,public.bbweb_website_order_events from anon,authenticated;
grant select on public.bbweb_website_templates,public.bbweb_website_packages to anon,authenticated;
grant select on public.bbweb_website_orders,public.bbweb_website_order_events to authenticated;
-- Starter prices use the existing public site defaults. They are indicative only; no invoice is issued by this schema.
insert into public.bbweb_website_packages(slug,name,description,features,base_price,sort_order,is_active) values
 ('starter','Starter','Landing page profesional untuk usaha yang memulai kehadiran digital.','["Landing page profesional","Responsif desktop dan mobile","CTA WhatsApp","SEO dasar"]'::jsonb,800000,10,true),
 ('business','Business','Company profile dengan halaman dan struktur informasi bisnis.','["Website multi halaman","Layanan dan portofolio","Form kontak","Struktur SEO on-page"]'::jsonb,1500000,20,true),
 ('commerce','Commerce','Website toko online dengan fitur berdasarkan ruang lingkup.','["Katalog produk","Keranjang dan pesanan","Dashboard pengelolaan","Integrasi pembayaran sesuai kesepakatan"]'::jsonb,3500000,30,true),
 ('custom','Custom','Web app dan integrasi bisnis dengan penawaran khusus.','["Analisis kebutuhan","Desain khusus","Integrasi API","Dashboard sesuai scope"]'::jsonb,null,40,true)
on conflict(slug) do nothing;
