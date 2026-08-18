-- Yoglait: employee log (sub-admins + riders)
-- Run this once in the Supabase SQL editor.
--
-- Assumes public.is_staff() and public.is_admin() already exist (used by
-- existing RLS on staff/products/etc — see earlier migrations/notes). If
-- your project uses different helper names, adjust the two new policies
-- at the bottom accordingly.

-- staff: track when added, and soft-terminate instead of hard delete so a
-- terminated sub-admin still shows up in the log with their history.
-- Existing rows backfill created_at = now() at migration time — there's no
-- way to recover the *real* original add-date for people already in the
-- table, so their "date added" will show as today until you know otherwise.
alter table public.staff
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists terminated_at timestamptz;

-- riders: same idea. Termination reuses the existing `active` column
-- (rider_login() already filters on riders.active, so terminating a rider
-- immediately blocks their login — no further change needed there).
alter table public.riders
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists terminated_at timestamptz;

-- orders: a real link to the rider, instead of only the rider_name/
-- rider_phone text snapshot — lets a rider's history be found reliably
-- even if they're later renamed or terminated. Orders placed before this
-- column existed have no rider_id and are only matched by rider_name as a
-- fallback (see orders.ts) — if two riders ever shared a name, old orders
-- could show up under both.
alter table public.orders
  add column if not exists rider_id uuid references public.riders(id);

-- The staff table previously had no UPDATE policy at all (only read/
-- insert/delete were covered) — terminating is an UPDATE, so this is new,
-- not a widening of an existing rule. Scoped to admins only, matching the
-- existing insert/delete restriction.
drop policy if exists "admins can update staff" on public.staff;
create policy "admins can update staff"
  on public.staff for update
  using (public.is_admin())
  with check (public.is_admin());

-- riders likely already allowed staff to update (untouched by earlier
-- migrations), but this makes it explicit and safe to rerun either way.
drop policy if exists "staff can update riders" on public.riders;
create policy "staff can update riders"
  on public.riders for update
  using (public.is_staff())
  with check (public.is_staff());
