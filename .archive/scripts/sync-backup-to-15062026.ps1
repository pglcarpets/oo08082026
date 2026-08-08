# Mirror E:\16062026 -> E:\Goodsites\15062026 (includes deletions).
# Safe to run repeatedly. Logs append to BACKUP-SYNC.log on the backup root.

param(
  # Defaults match owner backup layout (comment header); override when needed.
  [string]$Source = "E:\16062026",
  [string]$Destination = "E:\Goodsites\15062026",
  [switch]$Quiet
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $Source)) {
  throw "Source missing: $Source"
}

if (-not (Test-Path -LiteralPath $Destination)) {
  New-Item -ItemType Directory -Path $Destination -Force | Out-Null
}

$logPath = Join-Path $Destination 'BACKUP-SYNC.log'
$started = Get-Date

if (-not $Quiet) {
  Write-Host "[backup:sync] $($started.ToString('u'))  $Source -> $Destination"
}

$robocopyArgs = @(
  $Source,
  $Destination,
  '/MIR',
  '/COPY:DAT',
  '/DCOPY:DAT',
  '/R:2',
  '/W:2',
  "/LOG+:$logPath",
  '/TEE',
  '/NP',
  '/NDL',
  '/NFL'
)

& robocopy @robocopyArgs | Out-Null
$code = $LASTEXITCODE

# Robocopy: 0-7 = success
if ($code -ge 8) {
  throw "robocopy failed with exit code $code (see $logPath)"
}

$line = "{0}  OK  exit={1}  {2} -> {3}" -f (Get-Date).ToString('u'), $code, $Source, $Destination
Add-Content -LiteralPath $logPath -Value $line

if (-not $Quiet) {
  Write-Host "[backup:sync] done (robocopy exit $code)"
}

exit 0