# Create private pglcarpets/oo08082026 and push shallow main (fixes wrong GitHub account on push)
$ErrorActionPreference = 'Continue'
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root
New-Item -ItemType Directory -Force -Path results | Out-Null
$log = Join-Path $root 'results\create-private-repo.log'
function WL($m) { Add-Content $log $m; Write-Host $m }

function Run-External {
  param(
    [string[]]$Command,
    [switch]$AllowFail
  )
  $output = & $Command[0] $Command[1..($Command.Length - 1)] 2>&1
  $output | ForEach-Object { WL $_ }
  if (-not $AllowFail -and $LASTEXITCODE -ne 0) {
    throw "Command failed ($LASTEXITCODE): $($Command -join ' ')"
  }
  return $LASTEXITCODE
}

Set-Content $log "Create private repo $(Get-Date -Format o)"

WL '=== Use pglcarpets for git + gh ==='
Run-External @('gh', 'auth', 'switch', '-u', 'pglcarpets')
Run-External @('gh', 'auth', 'setup-git')
$ghUser = (gh api user --jq '.login').ToString().Trim()
WL "Active GitHub user: $ghUser"

WL '=== Create private repo (skip if exists) ==='
$viewExit = Run-External @('gh', 'repo', 'view', 'pglcarpets/oo08082026') -AllowFail
if ($viewExit -ne 0) {
  Run-External @('gh', 'repo', 'create', 'pglcarpets/oo08082026', '--private', '--description', 'OO Studio / Planner')
  WL 'Created private repo'
} else {
  WL 'Repo already exists'
}

WL '=== Origin ==='
git remote remove origin 2>$null
git remote add origin https://github.com/pglcarpets/oo08082026.git
Run-External @('git', 'remote', '-v')

WL '=== Push main (shallow history) ==='
Run-External @('git', 'push', '-u', 'origin', 'main', '--force')

WL '=== Done ==='
Run-External @('git', 'log', '--oneline', '-1')
WL 'https://github.com/pglcarpets/oo08082026'
