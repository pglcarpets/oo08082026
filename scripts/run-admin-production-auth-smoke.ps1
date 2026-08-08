# Admin unauthenticated gate proof — production standalone server, no DEV_AUTH_BYPASS.
# Evidence: results/admin/production-auth/
#
# Avoids attaching to leftover `pnpm dev` on :3000 by binding a dedicated PORT
# and starting `pnpm run start` ourselves (Playwright webServer is skipped when
# PLAYWRIGHT_BASE_URL is set).

$ErrorActionPreference = "Stop"
$siteRoot = Split-Path -Parent $PSScriptRoot
$repoRoot = Split-Path -Parent $siteRoot
Set-Location $siteRoot

$evidenceDir = Join-Path $repoRoot "results/admin/production-auth"
New-Item -ItemType Directory -Force -Path $evidenceDir | Out-Null

# .env.local often sets DEV_AUTH_BYPASS=1 for local UI work. Force non-"1".
Remove-Item Env:DEV_AUTH_BYPASS -ErrorAction SilentlyContinue
$env:DEV_AUTH_BYPASS = "0"
$env:NODE_ENV = "production"

$smokePort = if ($env:ADMIN_AUTH_SMOKE_PORT) { $env:ADMIN_AUTH_SMOKE_PORT } else { "3105" }
$env:PORT = $smokePort
$baseUrl = "http://localhost:$smokePort"
$env:PLAYWRIGHT_BASE_URL = $baseUrl

$serverProc = $null
$exit = 1

try {
  Write-Host "Building standalone server (NODE_ENV=production, DEV_AUTH_BYPASS=0, PORT=$smokePort)..."
  pnpm run build
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Write-Host "Starting production server on $baseUrl ..."
  $env:DEV_AUTH_BYPASS = "0"
  $env:NODE_ENV = "production"
  $env:PORT = $smokePort
  $stdoutLog = Join-Path $evidenceDir "server-stdout.log"
  $stderrLog = Join-Path $evidenceDir "server-stderr.log"
  $serverProc = Start-Process -FilePath "cmd.exe" `
    -ArgumentList @("/c", "pnpm run start > `"$stdoutLog`" 2> `"$stderrLog`"") `
    -WorkingDirectory $siteRoot `
    -PassThru `
    -WindowStyle Hidden

  $ready = $false
  $deadline = (Get-Date).AddMinutes(2)
  while ((Get-Date) -lt $deadline) {
    if ($serverProc.HasExited) {
      Write-Host "Production server exited early with code $($serverProc.ExitCode)"
      break
    }
    try {
      $resp = Invoke-WebRequest -Uri $baseUrl -UseBasicParsing -TimeoutSec 2
      if ($resp.StatusCode -ge 200) {
        $ready = $true
        break
      }
    } catch {
      Start-Sleep -Milliseconds 500
    }
  }

  if (-not $ready) {
    Write-Host "Production server did not become ready on $baseUrl"
    $exit = 1
  } else {
    Write-Host "Running admin-smoke.spec.ts against $baseUrl ..."
    $env:DEV_AUTH_BYPASS = "0"
    $env:NODE_ENV = "production"
    $env:PLAYWRIGHT_BASE_URL = $baseUrl
    pnpm exec playwright test -c config/build/playwright.config.ts tests/e2e/admin-smoke.spec.ts --reporter=list
    $exit = $LASTEXITCODE
  }
}
finally {
  if ($null -ne $serverProc -and -not $serverProc.HasExited) {
    Write-Host "Stopping production server PID $($serverProc.Id)..."
    Stop-Process -Id $serverProc.Id -Force -ErrorAction SilentlyContinue
    # Also kill children listening on smoke port
    Get-NetTCPConnection -LocalPort ([int]$smokePort) -State Listen -ErrorAction SilentlyContinue |
      ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
      }
  }

  $runMeta = @{
    command = "pnpm run build && pnpm run start (PORT=$smokePort) && playwright admin-smoke"
    exitCode = $exit
    nodeEnv = $env:NODE_ENV
    devAuthBypass = $env:DEV_AUTH_BYPASS
    port = $smokePort
    playWrightBaseUrl = $baseUrl
    at = (Get-Date).ToString("o")
  } | ConvertTo-Json -Depth 4

  Set-Content -Path (Join-Path $evidenceDir "run-meta.json") -Value $runMeta -Encoding utf8
}

exit $exit
