# Configure Cloudflare managed Security.txt for oando.co.in (clears Security Insights).
# Requires an API token with Zone:Security Center Edit (or Zone:Edit).
# Usage:
#   $env:CLOUDFLARE_API_TOKEN = <your-token>
#   pnpm exec powershell -File scripts/configure-cf-security-txt.ps1 -Token $env:CLOUDFLARE_API_TOKEN

param(
  [string]$Token = $env:CLOUDFLARE_API_TOKEN,
  [string]$ZoneName = "oando.co.in"
)

$ErrorActionPreference = "Stop"

if (-not $Token -or $Token.Trim().Length -lt 10) {
  Write-Error @"
Missing API token with Security Center edit permission.

Create one at: https://dash.cloudflare.com/profile/api-tokens
  Template: Edit zone DNS  OR custom with:
    - Zone > Zone > Read
    - Zone > Security Center > Edit  (or Zone Settings / Zone Edit)

Then set CLOUDFLARE_API_TOKEN in your .env.local and run:
  powershell -File scripts/configure-cf-security-txt.ps1
"@
}

$headers = @{
  Authorization  = "Bearer $Token"
  "Content-Type" = "application/json"
}

$zones = Invoke-RestMethod -Method GET -Headers $headers `
  -Uri "https://api.cloudflare.com/client/v4/zones?name=$ZoneName"
if (-not $zones.success -or $zones.result.Count -lt 1) {
  Write-Error "Could not resolve zone $ZoneName. Check token permissions (Zone Read)."
}
$zoneId = $zones.result[0].id
Write-Host "zone=$ZoneName id=$zoneId"

$body = @{
  enabled              = $true
  contact              = @("mailto:sales@oando.co.in", "tel:+91-98356-30940")
  expires              = "2027-08-09T00:00:00.000Z"
  preferred_languages  = "en, hi"
  canonical            = @("https://oando.co.in/.well-known/security.txt")
  policy               = @("https://oando.co.in/privacy/")
  hiring               = @("https://oando.co.in/career/")
} | ConvertTo-Json -Depth 4

$put = Invoke-RestMethod -Method PUT -Headers $headers `
  -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/security-center/securitytxt" `
  -Body $body

if (-not $put.success) {
  Write-Error ($put | ConvertTo-Json -Depth 6)
}

Write-Host "OK: Cloudflare managed security.txt enabled for $ZoneName"
Write-Host "Next: Security Insights > re-scan, or Archive the old insight."
Write-Host "Public file (already live): https://oando.co.in/.well-known/security.txt"
