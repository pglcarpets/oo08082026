# Shallow history: one commit, private pglcarpets/oo08082026, no prior remote history
$ErrorActionPreference = 'Continue'
$root = Split-Path $PSScriptRoot -Parent
$log  = Join-Path $root 'results\shallow-push.log'

New-Item -ItemType Directory -Force -Path (Join-Path $root 'results') | Out-Null
function WL($m) { Add-Content -Path $log -Value $m; Write-Host $m }

Set-Content -Path $log -Value "Shallow push $(Get-Date -Format o)"
Set-Location $root

WL "`n========== GitHub auth =========="
WL (gh auth status 2>&1 | Out-String)
$ghUser = (gh api user --jq '.login' 2>&1).ToString().Trim()
WL "Logged in as: $ghUser"

WL "`n========== Create private repo if missing =========="
$repoCreated = $false
gh repo view pglcarpets/oo08082026 2>&1 | ForEach-Object { WL $_ }
if ($LASTEXITCODE -ne 0) {
  gh repo create oo08082026 --private --description 'OO Studio / Planner' 2>&1 | ForEach-Object { WL $_ }
  $repoCreated = ($LASTEXITCODE -eq 0)
} else {
  WL 'Repo already exists'
}
WL "REPO_CREATED=$repoCreated"

WL "`n========== Origin: pglcarpets only =========="
git remote remove origin 2>$null
git remote add origin https://github.com/pglcarpets/oo08082026.git
WL (git remote -v 2>&1 | Out-String)

WL "`n========== Orphan branch (single commit) =========="
git checkout --orphan shallow-main 2>&1 | ForEach-Object { WL $_ }
git add -A 2>&1 | ForEach-Object { WL $_ }
git -c user.name='Ayush Kumar A' -c user.email='mayoite@gmail.com' `
  commit -m 'Initial commit: OO Studio / Planner' 2>&1 | ForEach-Object { WL $_ }
git branch -D main 2>$null
git branch -m main 2>&1 | ForEach-Object { WL $_ }
$commitHash = (git rev-parse HEAD 2>&1).ToString().Trim()
WL "COMMIT_HASH=$commitHash"

WL "`n========== Force push =========="
git push -u origin main --force 2>&1 | ForEach-Object { WL $_ }
$success = ($LASTEXITCODE -eq 0)

WL "`n========== Verify =========="
WL (git log --oneline -3 2>&1 | Out-String)
WL (git remote -v 2>&1 | Out-String)
WL "SUCCESS=$success"

if (-not $success) { exit 1 }
