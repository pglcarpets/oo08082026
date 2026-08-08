# Watch E:\16062026 and mirror to E:\Goodsites\15062026 after changes settle.
# Run in a dedicated terminal, or install via install-backup-sync.ps1 (scheduled task).

param(
  [string]$Source = "E:\16062026",
  [string]$Destination = "E:\Goodsites\15062026",
  [int]$DebounceSeconds = 45
)

$ErrorActionPreference = 'Stop'
$syncScript = Join-Path $PSScriptRoot 'sync-backup-to-15062026.ps1'

if (-not (Test-Path -LiteralPath $syncScript)) {
  throw "Missing sync script: $syncScript"
}

$timer = $null
$pending = $false

function Invoke-DebouncedSync {
  if ($script:timer) {
    $script:timer.Stop()
    $script:timer.Dispose()
  }
  $script:timer = New-Object System.Timers.Timer
  $script:timer.Interval = $DebounceSeconds * 1000
  $script:timer.AutoReset = $false
  $script:timer.Add_Elapsed({
    $script:pending = $false
    try {
      & $syncScript -Source $Source -Destination $Destination -Quiet
    } catch {
      Write-Warning $_
    }
  })
  $script:timer.Start()
  $script:pending = $true
}

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $Source
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true
$watcher.NotifyFilter = [IO.NotifyFilters]'FileName, DirectoryName, LastWrite, Size'

$onChange = {
  $rel = $Event.SourceEventArgs.FullPath.Substring($Source.Length).TrimStart('\')
  if ($rel -match '^(node_modules|\.next)(\\|$)') { return }
  if ($rel -match '^BACKUP-SYNC\.log$') { return }
  Invoke-DebouncedSync
}

Register-ObjectEvent -InputObject $watcher -EventName Created -Action $onChange | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName Changed -Action $onChange | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName Deleted -Action $onChange | Out-Null
Register-ObjectEvent -InputObject $watcher -EventName Renamed -Action $onChange | Out-Null

Write-Host "[backup:watch] Watching $Source -> $Destination (debounce ${DebounceSeconds}s)"
Write-Host "[backup:watch] Press Ctrl+C to stop."

# Initial sync on start
& $syncScript -Source $Source -Destination $Destination

try {
  while ($true) { Start-Sleep -Seconds 1 }
} finally {
  $watcher.EnableRaisingEvents = $false
  $watcher.Dispose()
  if ($script:timer) { $script:timer.Dispose() }
}