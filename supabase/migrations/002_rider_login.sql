-- Yoglait: rider accounts (email/phone + password)
-- Run this once in the Supabase SQL editor, after the announcements/updates
-- migration (order doesn't matter between them, but both are prerequisites
-- for their respective app code).

-- pgcrypto gives us crypt() / gen_salt('bf') for bcrypt password hashing.
create extension if not exists pgcrypto with schema extensions;

alter table public.riders
  add column if not exists email text,
  add column if not exists password_hash text;

-- Staff: creates a rider with a hashed password. SECURITY DEFINER so the
-- hashing (crypt/gen_salt) happens here in one place server-side, rather
-- than the client ever constructing that SQL itself. Still re-checks
-- is_staff() internally as defense in depth even though only staff reach
-- this from the UI.
create or replace function public.create_rider_with_password(
  p_name text,
  p_phone text,
  p_email text,
  p_password text
)
returns table (id uuid, name text, phone text, email text, active boolean)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
begin
  if not public.is_staff() then
    raise exception 'Only staff can add riders.';
  end if;

  insert into public.riders (name, phone, email, password_hash, active)
  values (p_name, nullif(p_phone, ''), nullif(p_email, ''), crypt(p_password, gen_salt('bf')), true)
  returning riders.id into v_id;

  return query
    select riders.id, riders.name, riders.phone, riders.email, riders.active
    from public.riders
    where riders.id = v_id;
end;
$$;

grant execute on function public.create_rider_with_password(text, text, text, text) to authenticated;

-- Public: verifies a rider's identifier (name OR phone — deliberately not
-- email, matching the rider-facing login form) + password against the
-- bcrypt hash. Returns one row on success, zero rows on any mismatch —
-- never reveals which part (identifier vs password) was wrong, and never
-- returns password_hash itself.
create or replace function public.rider_login(p_identifier text, p_password text)
returns table (id uuid, name text, phone text, email text)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
    select riders.id, riders.name, riders.phone, riders.email
    from public.riders
    where riders.active
      and riders.password_hash is not null
      and (lower(riders.name) = lower(p_identifier) or riders.phone = p_identifier)
      and riders.password_hash = crypt(p_password, riders.password_hash)
    limit 1;
end;
$$;

grant execute on function public.rider_login(text, text) to anon, authenticated;

-- Note: riders added before this migration (or via the old addRider() path)
-- have password_hash = null and simply can't log in yet — rider_login()
-- filters them out rather than erroring. There's no "set/reset password"
-- flow yet; re-adding them through the updated Riders tab is the only way
-- to give them a password today.
