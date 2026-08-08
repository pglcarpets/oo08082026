# Verify remote ayushonmicrosoft/oo05082026 has all files
$ErrorActionPreference = 'Continue'
Set-Location (Split-Path $PSScriptRoot -Parent)
New-Item -ItemType Directory -Force -Path results | Out-Null
$log = Join-Path (Get-Location) 'results\remote-verify.txt'

$lines = [System.Collections.Generic.List[string]]::new()
function L($m) { $lines.Add($m); Write-Host $m }

L "Remote verify $(Get-Date -Format o)"
L ""

$repo = gh repo view ayushonmicrosoft/oo05082026 --json name,isPrivate,url,defaultBranchRef,pushedAt 2>&1
L "=== Repo ==="
L ($repo | Out-String)

L "=== Remote commit ==="
L (gh api repos/ayushonmicrosoft/oo05082026/commits/main --jq '.sha, .commit.message' 2>&1 | Out-String)

L "=== Remote tree file count ==="
$tree = gh api 'repos/ayushonmicrosoft/oo05082026/git/trees/main?recursive=1' --jq '.truncated, (.tree | length)' 2>&1
L ($tree | Out-String)

$head = (git rev-parse HEAD).Trim()
$origin = (git rev-parse origin/main).Trim()
$localCount = (git ls-files | Measure-Object -Line).Lines

L "=== Local ==="
L "HEAD: $head"
L "origin/main: $origin"
L "local tracked files: $localCount"
L "SHAs match: $($head -eq $origin)"

$lines | Set-Content -Path $log -Encoding utf8
