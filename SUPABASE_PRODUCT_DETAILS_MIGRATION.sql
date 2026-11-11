-- Run once in the existing Supabase project before deploying the enhanced admin.
-- Add optional fields to the existing products table. Existing rows remain intact.
alter table public.products
  add column if not exists sku text,
  add column if not exists barcode text,
  add column if not exists brand_country text,
  add column if not exists concentration text,
  add column if not exists gender text,
  add column if not exists fragrance_family text,
  add column if not exists top_notes text,
  add column if not exists heart_notes text,
  add column if not exists base_notes text,
  add column if not exists compare_at_price numeric(12,2),
  add column if not exists seo_title text,
  add column if not exists seo_description text;

alter table public.products
  drop constraint if exists products_compare_at_price_nonnegative;
alter table public.products
  add constraint products_compare_at_price_nonnegative
  check (compare_at_price is null or compare_at_price >= 0);
