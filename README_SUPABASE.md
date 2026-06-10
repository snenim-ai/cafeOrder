Supabase setup and migration guide
=================================

This project includes SQL migrations under `db/supabase_migrations`.

Apply migrations (option A) - using Supabase CLI

- Install the Supabase CLI: https://supabase.com/docs/guides/cli
- Login and link to your project:
  - `supabase login`
  - `supabase link --project-ref <your-project-ref>`
- Push migrations (uses `supabase` migrations format):
  - `supabase db push`

Apply migrations (option B) - using psql

- Ensure `psql` is installed and available in PATH.
- Set `SUPABASE_DB_URL` environment variable to your database URL (from Supabase project > Settings > Database > Connection string (URI)).
- Run (Linux/macOS):
```
export SUPABASE_DB_URL="postgres://user:pass@host:5432/postgres"
./db/apply_migrations.sh
```
- Run (Windows PowerShell):
```
$env:SUPABASE_DB_URL = 'postgres://user:pass@host:5432/postgres'
.\db\apply_migrations.ps1
```

Vercel environment variables
----------------------------

Set the following in your Vercel project (Dashboard → Settings → Environment Variables) or via the Vercel CLI:

- `SUPABASE_URL` — your Supabase project URL (e.g. `https://xyz.supabase.co`)
- `SUPABASE_SERVICE_ROLE_KEY` — the service role key (server-only secret)
- `NEXT_PUBLIC_USE_SUPABASE` — set to `1` to enable Supabase mode in frontend

Vercel CLI example (requires `VERCEL_TOKEN` or logged-in session):
```
vercel env add SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXT_PUBLIC_USE_SUPABASE production
```

Security note: only add `SUPABASE_SERVICE_ROLE_KEY` to Vercel's server environment (do NOT expose it to the browser). `NEXT_PUBLIC_*` variables are exposed to client.
