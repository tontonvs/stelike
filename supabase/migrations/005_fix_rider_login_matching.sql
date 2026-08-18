-- Fix for: rider login only working with email, not name or phone number.
--
-- Two real bugs, both in rider_login():
--   1. It never checked the `email` column at all, despite riders being
--      allowed to register with email at add-rider time.
--   2. Phone matching was strict string equality (`riders.phone =
--      p_identifier`) — "0541010681" typed with a space, a dash, or a
--      "+233" country-code prefix at login simply wouldn't match whatever
--      exact format was typed when the rider was added.
--
-- Safe to run this any number of times (CREATE OR REPLACE is idempotent).

-- Strips everything but digits, then normalizes a Ghana "+233"/"233"
-- country-code prefix down to the equivalent local "0..." form, so
-- "0541010681", "+233541010681", "233 541 010 681", and "054-101-0681"
-- all compare equal. Returns null for null input (so a rider with no phone
-- on file never accidentally matches an empty/blank identifier).
create or replace function public.normalize_phone(p text)
returns text
language sql
immutable
as $$
  select case
    when p is null then null
    when regexp_replace(p, '[^0-9]', '', 'g') like '233%'
      then '0' || substring(regexp_replace(p, '[^0-9]', '', 'g') from 4)
    else regexp_replace(p, '[^0-9]', '', 'g')
  end;
$$;

create or replace function public.rider_login(p_identifier text, p_password text)
returns table (id uuid, name text, phone text, email text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_identifier text := trim(p_identifier);
begin
  return query
    select riders.id, riders.name, riders.phone, riders.email
    from public.riders
    where riders.active
      and riders.password_hash is not null
      and (
        lower(trim(riders.name)) = lower(v_identifier)
        or lower(trim(riders.email)) = lower(v_identifier)
        or public.normalize_phone(riders.phone) = public.normalize_phone(v_identifier)
      )
      and riders.password_hash = crypt(p_password, riders.password_hash)
    limit 1;
end;
$$;

grant execute on function public.rider_login(text, text) to anon, authenticated;
