-- Yoglait: announcements + per-order updates
-- Run this once in the Supabase SQL editor. Assumes the existing is_staff()
-- helper function (used by staff/products RLS already) is present — this
-- migration reuses it rather than redefining it.

-- =========================================================================
-- announcements: global popup on site visit + persistent bell list
-- =========================================================================

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('notice', 'advert')),
  title text not null,
  body text not null,
  image_url text,
  active boolean not null default true,
  -- null = no expiry (stays active until a staff member deactivates it)
  expires_at timestamptz,
  created_by uuid not null references public.staff(id),
  created_at timestamptz not null default now()
);

alter table public.announcements enable row level security;

-- Public (anon + customers): only active, non-expired rows — this is what
-- powers the popup and the bell list, no login required.
create policy "public can read active announcements"
  on public.announcements for select
  using (active and (expires_at is null or expires_at > now()));

-- Staff: everything, including inactive/expired, for the management list.
create policy "staff can read all announcements"
  on public.announcements for select
  using (public.is_staff());

create policy "staff can insert announcements"
  on public.announcements for insert
  with check (public.is_staff());

create policy "staff can update announcements"
  on public.announcements for update
  using (public.is_staff());

create policy "staff can delete announcements"
  on public.announcements for delete
  using (public.is_staff());

-- Storage bucket for the optional announcement image. Deliberately separate
-- from product images (which stay bundled in the frontend build for speed —
-- see productsApi.ts) since announcements are dynamic, staff-created content
-- that has no build-time asset to bundle.
insert into storage.buckets (id, name, public)
values ('announcements', 'announcements', true)
on conflict (id) do nothing;

create policy "public can view announcement images"
  on storage.objects for select
  using (bucket_id = 'announcements');

create policy "staff can upload announcement images"
  on storage.objects for insert
  with check (bucket_id = 'announcements' and public.is_staff());

create policy "staff can delete announcement images"
  on storage.objects for delete
  using (bucket_id = 'announcements' and public.is_staff());

-- =========================================================================
-- order_updates: per-order messages staff send, surfaced via phone lookup
-- (there's no customer login to hang a real inbox off of, so this mirrors
-- the existing get_orders_by_phone() pattern rather than a public SELECT)
-- =========================================================================

create table if not exists public.order_updates (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  message text not null,
  created_by uuid not null references public.staff(id),
  created_at timestamptz not null default now()
);

alter table public.order_updates enable row level security;

-- No public SELECT policy — deliberately, same reasoning as `orders` (see
-- orders.ts createOrder() comment). Customers reach this data only through
-- get_order_updates_by_phone() below, and staff read it directly since
-- they're already authenticated.
create policy "staff can read order updates"
  on public.order_updates for select
  using (public.is_staff());

create policy "staff can insert order updates"
  on public.order_updates for insert
  with check (public.is_staff());

-- SECURITY DEFINER: lets an anonymous customer fetch updates for their own
-- orders by phone number, without a public SELECT policy on the table
-- itself (which would let anyone with the publishable key read every
-- update ever sent). Mirrors get_orders_by_phone() exactly.
create or replace function public.get_order_updates_by_phone(p_phone text)
returns setof public.order_updates
language sql
security definer
set search_path = public
as $$
  select ou.*
  from public.order_updates ou
  join public.orders o on o.id = ou.order_id
  where o.customer_phone = p_phone
  order by ou.created_at desc;
$$;

grant execute on function public.get_order_updates_by_phone(text) to anon, authenticated;
