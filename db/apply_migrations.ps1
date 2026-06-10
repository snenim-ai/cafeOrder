if (-not $env:SUPABASE_DB_URL) {
  Write-Error "Set SUPABASE_DB_URL environment variable (postgres connection string)."
  Write-Output "Example: $env:SUPABASE_DB_URL = 'postgres://user:pass@host:5432/postgres'"
  exit 1
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$migDir = Join-Path $scriptDir 'supabase_migrations'

Get-ChildItem -Path $migDir -Filter '*.sql' | Sort-Object Name | ForEach-Object {
  Write-Output "Applying $($_.FullName)"
  & psql $env:SUPABASE_DB_URL -f $_.FullName
}

Write-Output "Migrations applied."
