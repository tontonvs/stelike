-- Fix for: "function gen_salt(unknown) does not exist"
-- Cause: Supabase installs pgcrypto into the `extensions` schema by default,
-- not `public` — so the two rider functions from the previous migration
-- couldn't see gen_crypt()/crypt() with search_path set to `public` only.
-- Safe to run this any number of times (CREATE OR REPLACE is idempotent).

-- Make sure pgcrypto is installed where Supabase expects it.
create extension if not exists pgcrypto with schema extensions;

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
