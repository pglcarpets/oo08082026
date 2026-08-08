# Sync GitHub Actions secrets for nightly Supabase → R2 backups from repo-root .env.local.
# Usage: pnpm --filter oando-site run backup:github-secrets:sync

param(
  [string]$EnvFile = (Join-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) '.env.local')
)

$ErrorActionPreference = 'Stop'

$secretNames = @(
  'PRODUCTS_DATABASE_URL',
  'SUPABASE_AUTH_DATABASE_URL',
  'CLOULDFLARE_S3_URL',
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOULD_ACCESS_KEY_ID',
  'CLOULDFLARE_S3_SECRET_ACCESS_KEY',
  'CLOUDFLARE_R2_CATALOG_BUCKET'
)

if (-not (Test-Path -LiteralPath $EnvFile)) {
  throw "Missing env file: $EnvFile"
}

function Get-EnvValue([string]$Name) {
  $pattern = "^\s*$([regex]::Escape($Name))\s*=\s*(.*)$"
  foreach ($line in Get-Content -LiteralPath $EnvFile) {
    if ($line -match $pattern) {
      $raw = $Matches[1].Trim()
      if (($raw.StartsWith('"') -and $raw.EndsWith('"')) -or ($raw.StartsWith("'") -and $raw.EndsWith("'"))) {
        return $raw.Substring(1, $raw.Length - 2)
      }
      return $raw
    }
  }
  return $null
}

$set = 0
$skipped = 0

foreach ($name in $secretNames) {
  $value = Get-EnvValue $name
  if ([string]::IsNullOrWhiteSpace($value)) {
    Write-Host "Skip $name (empty)"
    $skipped += 1
    continue
  }
  $value | gh secret set $name
  Write-Host "Set $name"
  $set += 1
}

Write-Host "Done: $set secrets set, $skipped skipped."
