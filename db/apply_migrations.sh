#!/usr/bin/env bash
# Apply SQL migrations to a Postgres database (Supabase) using psql.
# Requires: psql in PATH and SUPABASE_DB_URL env var set to the database connection string.

set -euo pipefail

if [ -z "${SUPABASE_DB_URL:-}" ]; then
  echo "Set SUPABASE_DB_URL environment variable (Postgres connection string)."
  echo "Example: export SUPABASE_DB_URL=\"postgres://user:pass@host:5432/postgres\""
  exit 1
fi

MIGRATION_DIR=$(dirname "$0")/supabase_migrations

for f in "$MIGRATION_DIR"/*.sql; do
  echo "Applying $f"
  psql "$SUPABASE_DB_URL" -f "$f"
done

echo "Migrations applied."
