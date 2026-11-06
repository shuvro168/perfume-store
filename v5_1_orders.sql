-- Run once in Supabase SQL Editor after reviewing. Test orders only; no payment provider connected.
create extension if not exists pgcrypto;
create table if not exists public.orders (
 id uuid primary key default gen_random_uuid(), order_number text unique not null,
 status text not null default 'pending' check(status in ('pending','processing','verification_required','paid','failed','cancelled','refunded')),
 currency text not null default 'USD',subtotal numeric(12,2) not null check(subtotal>=0),
 customer_email text not null,customer_details jsonb not null,
 access_token_hash text not null,payment_provider text,payment_reference text,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.order_items (
 id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id) on delete cascade,
 product_id uuid not null references public.products(id),product_name text not null,
 quantity integer not null check(quantity>0),unit_price numeric(12,2) not null,line_total numeric(12,2) not null
);
create table if not exists public.payment_events (
 id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id),
 provider text not null,provider_event_id text not null,kind text not null,
 verified boolean not null default false,created_at timestamptz not null default now(),
 unique(provider,provider_event_id)
);
create index if not exists orders_created_idx on public.orders(created_at desc);
create index if not exists order_items_order_idx on public.order_items(order_id);
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_events enable row level security;
-- Intentionally no browser-side RLS policies. All order access uses protected Netlify Functions.
-- Only server service-role may create/read orders; admin listing validates the logged-in user.
