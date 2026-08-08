# Fix blank/unlinked commit author and re-push to ayushonmicrosoft/oo05082026
$ErrorActionPreference = 'Continue'
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root
New-Item -ItemType Directory -Force -Path results | Out-Null
$log = Join-Path $root 'results\fix-commit-author.log'
function WL($m) { Add-Content $log $m; Write-Host $m }

Set-Content $log "Fix commit author $(Get-Date -Format o)"

$author = 'Ayush Kumar A <ayush@oneandonlyfurniture.onmicrosoft.com>'

WL '=== Before ==='
git show -s --format=fuller HEAD 2>&1 | ForEach-Object { WL $_ }
$fileCount = (git ls-tree -r HEAD --name-only | Measure-Object -Line).Lines
WL "files in commit: $fileCount"

if ($fileCount -eq 0) {
  throw 'Commit tree is empty locally — cannot fix with amend only'
}

WL '=== Switch GitHub account ==='
& gh auth switch -u ayushonmicrosoft 2>&1 | ForEach-Object { WL $_ }
& gh auth setup-git 2>&1 | ForEach-Object { WL $_ }

WL '=== Amend author (keep message and tree) ==='
git commit --amend --author=$author --no-edit 2>&1 | ForEach-Object { WL $_ }
if ($LASTEXITCODE -ne 0) { throw 'git commit --amend failed' }

WL '=== After amend ==='
git show -s --format=fuller HEAD 2>&1 | ForEach-Object { WL $_ }

WL '=== Force push ==='
git push -u origin main --force 2>&1 | ForEach-Object { WL $_ }
if ($LASTEXITCODE -ne 0) { throw 'git push --force failed' }

WL '=== Done ==='
WL (git rev-parse HEAD)
WL 'https://github.com/ayushonmicrosoft/oo05082026'
