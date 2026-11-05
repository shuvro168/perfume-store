-- Run in Supabase SQL Editor. Public can read ONLY published products.
create extension if not exists pgcrypto;
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  category text not null default 'Other',
  price numeric(12,2) not null check (price >= 0),
  volume text not null default '50 ml',
  notes text not null default '',
  description text not null default '',
  image_url text not null default '',
  stock integer not null default 0 check (stock >= 0),
  active boolean not null default false,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists products_active_created_idx on public.products(active, created_at desc);
alter table public.admins enable row level security;
alter table public.products enable row level security;
create policy "Admin reads own membership" on public.admins for select to authenticated using (user_id = (select auth.uid()));
create policy "Anyone reads published products" on public.products for select to anon, authenticated using (active = true);
create policy "Admin reads all products" on public.products for select to authenticated using (exists(select 1 from public.admins where user_id = (select auth.uid())));
create policy "Admin inserts products" on public.products for insert to authenticated with check (exists(select 1 from public.admins where user_id = (select auth.uid())));
create policy "Admin updates products" on public.products for update to authenticated using (exists(select 1 from public.admins where user_id = (select auth.uid()))) with check (exists(select 1 from public.admins where user_id = (select auth.uid())));
create policy "Admin deletes products" on public.products for delete to authenticated using (exists(select 1 from public.admins where user_id = (select auth.uid())));
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;
create policy "Public can view product images" on storage.objects for select to anon, authenticated using (bucket_id='product-images');
create policy "Admin uploads product images" on storage.objects for insert to authenticated with check (bucket_id='product-images' and exists(select 1 from public.admins where user_id = (select auth.uid())));
-- After creating an admin user manually in Authentication > Users, run:
-- insert into public.admins (user_id) values ('REPLACE_WITH_AUTH_USER_UUID');
-- Do not add public insert/update policies to admins.
