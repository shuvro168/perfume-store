-- Run in the existing Supabase project's SQL Editor before deploying both ZIPs.
-- Public visitors may read the popup copy; only authenticated admins may change it.
create table if not exists public.support_popup_settings (
  id integer primary key default 1 check (id = 1),
  enabled boolean not null default true,
  show_count boolean not null default true,
  contact_count text not null default '999+' check (contact_count ~ '^[0-9]{1,9}[+]?$'),
  contact_message text not null default 'customers have contacted our team' check (length(contact_message) between 1 and 180),
  show_demo_label boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into public.support_popup_settings (id) values (1) on conflict (id) do nothing;
alter table public.support_popup_settings enable row level security;
grant select on public.support_popup_settings to anon, authenticated;
grant update on public.support_popup_settings to authenticated;
drop policy if exists support_popup_public_read on public.support_popup_settings;
create policy support_popup_public_read on public.support_popup_settings for select to anon, authenticated using (true);
drop policy if exists support_popup_admin_update on public.support_popup_settings;
create policy support_popup_admin_update on public.support_popup_settings for update to authenticated
using (exists (select 1 from public.admins where user_id = (select auth.uid())))
with check (exists (select 1 from public.admins where user_id = (select auth.uid())));
