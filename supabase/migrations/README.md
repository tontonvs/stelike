# Supabase migrations

These are the SQL scripts that have actually been run against this project's
Supabase database, kept here for reference and disaster recovery. This
folder exists because they'd previously only ever lived in someone's
Downloads folder — same gap the project notes already flag for edge
functions (`paystack-webhook`, `create-staff`), which still only live in
the Supabase dashboard, not in git.

## Not a Supabase CLI migrations folder

This project doesn't use the Supabase CLI (the dev machine's CPU crashes
its native binary — see the main project notes). These files are run
**manually**, by pasting each one into the Supabase dashboard's SQL Editor
and clicking Run — the same way they were originally applied. `supabase
migration up` will not work here and isn't the intended workflow.

## Run order for a brand-new Supabase project

If you're ever setting this project up fresh (new Supabase project, empty
database), run these **in numeric order**:

1. `001_announcements_and_order_updates.sql`
2. `002_rider_login.sql`
3. `004_employee_log.sql`

`003` and `005` are historical fixes for bugs hit on top of an
already-run `002` (see below) — `002` as it sits in this folder already
has both fixes folded in, so a fresh install doesn't need them. Running
them anyway is harmless (every statement in both is `create or replace` /
idempotent), just redundant.

## What each file actually did, in the order it happened

- **001** — announcements (popup + notification bell) and per-order
  update messages. Two new tables, a Storage bucket, RLS.
- **002** — rider accounts: email/password columns on `riders`, password
  hashing via pgcrypto, a `rider_login()` function. *As it sits in this
  file*, it already includes the `003` fix below — but the very first
  time this was run, pgcrypto's functions weren't reachable and hit the
  error in `003`.
- **003** — fix for `002`: Supabase installs pgcrypto into the
  `extensions` schema, not `public`, so `002`'s functions couldn't find
  `gen_salt()`/`crypt()` until their `search_path` was widened. Genuinely
  needed on the live database at the time, since it already had the
  original (unfixed) `002` applied.
- **004** — the admin-only employee log: `created_at`/`terminated_at` on
  staff and riders (soft-terminate instead of hard delete), a `rider_id`
  link on `orders` for reliable rider history, and a new staff UPDATE
  policy (the table previously had none).
- **005** — fix for `002`'s `rider_login()`: it only ever matched on name
  or phone, never email, and phone matching was strict string equality
  with no normalization (so "0541010681" typed with a space or a `+233`
  prefix wouldn't match). Broadened to check name, phone (normalized), or
  email, all case-insensitive/trimmed where relevant.

## Known gap: the baseline schema isn't here

`staff`, `products`, `orders` (original columns), `riders` (original
columns), and their original RLS policies, plus the `get_orders_by_phone()`
and `is_staff()`/`is_admin()` functions predate this migrations folder —
they were set up before any of this was tracked in git, and the exact SQL
that created them was never captured anywhere. This folder only covers
migrations from `001` onward. If you ever want the full baseline captured
too, that would need to be pulled fresh from the live project (e.g. a
schema-only `pg_dump`, or reconstructed by hand from the dashboard's
table editor) — nobody currently has the original SQL to just copy in.
