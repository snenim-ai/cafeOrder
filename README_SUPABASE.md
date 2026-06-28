# Supabase + Vercel setup guide

This app uses Supabase as the shared database so multiple users can see the same cafe order data.

## 1. Create a Supabase project

1. Go to Supabase and create a new project.
2. Copy the project URL.
   - Example: `https://xeyojidbyikqnicmojkw.supabase.co`
3. Go to `Settings` > `API Keys`.
4. Copy the server secret key.
   - In the new Supabase UI this is usually under `Secret keys`.
   - It may start with `sb_secret_...`.
   - Do not use the publishable key for `SUPABASE_SERVICE_ROLE_KEY`.

## 2. Create Supabase tables

Open Supabase `SQL Editor`, then run these files in order:

1. `db/supabase_setup.sql`
2. `db/supabase_seed.sql`

`supabase_setup.sql` creates these tables:

- `order_sheets`
- `menus`
- `order_items`

`supabase_seed.sql` inserts the initial menu data and one optional test order sheet.

The seed file is safe to run multiple times because it uses `on conflict`.

## 3. Set Vercel environment variables

Go to the Vercel project:

`Settings` > `Environment Variables` > `Add Environment Variable`

Add these variables:

```text
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-secret-key
```

Recommended settings:

```text
SUPABASE_URL
- Sensitive: off
- Environments: Production, Preview, Development

SUPABASE_SERVICE_ROLE_KEY
- Sensitive: on
- Environments: Production, Preview, Development
```

Important: put values in the `Value` field, not the `Note` field.

## 4. Redeploy Vercel

After adding or changing environment variables, redeploy the app:

`Deployments` > latest deployment `...` > `Redeploy`

Environment variable changes do not affect old deployments until redeploy.

## 5. Verify the connection

Open:

```text
https://your-vercel-domain.vercel.app/api/menus
```

Success response:

```json
{
  "success": true,
  "menus": []
}
```

If `menus` contains rows, Supabase is connected and the app is reading shared DB data.

## Troubleshooting

### `Supabase environment variables not configured`

Vercel does not have the required environment variables, or the app was not redeployed after adding them.

Check:

- `SUPABASE_URL` exists.
- `SUPABASE_SERVICE_ROLE_KEY` exists.
- Values are in the `Value` field.
- The selected environment includes the deployment you are testing.
- You redeployed after saving.

### `relation "menus" does not exist`

The Supabase tables were not created.

Run `db/supabase_setup.sql` in Supabase SQL Editor.

### Menus are empty

The tables exist, but seed data was not inserted.

Run `db/supabase_seed.sql` in Supabase SQL Editor.

### Korean text looks broken

The seed SQL may have been pasted or executed with broken encoding.

Run `db/supabase_seed.sql` again from a UTF-8 editor.

## Security note

`SUPABASE_SERVICE_ROLE_KEY` is a powerful server-side secret. Do not commit it to GitHub and do not expose it in browser code.

If the key was pasted into chat or shared accidentally, rotate it in Supabase and update the Vercel environment variable.
