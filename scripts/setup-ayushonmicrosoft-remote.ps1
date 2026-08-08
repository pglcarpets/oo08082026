# One-time: create pglcarpets/oo08082026 and push (no link to ayushonmicrosoft)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

New-Item -ItemType Directory -Force -Path results | Out-Null

Write-Host "=== GitHub auth ==="
gh auth status | Tee-Object results\gh-auth.txt
$ghUser = gh api user --jq ".login"
Write-Host "Logged in as: $ghUser"
$ghUser | Set-Content results\gh-user.txt

if ($ghUser -ne "pglcarpets") {
  Write-Warning "Expected pglcarpets but logged in as $ghUser. Run: gh auth login"
}

Write-Host "=== Create repo (skip if exists) ==="
$repoExists = $false
try {
  gh repo view pglcarpets/oo08082026 *> $null
  $repoExists = $LASTEXITCODE -eq 0
} catch {}

if (-not $repoExists) {
  gh repo create oo08082026 --private --description "OO Studio / Planner"
  if ($LASTEXITCODE -ne 0) { throw "gh repo create failed" }
} else {
  Write-Host "Repo pglcarpets/oo08082026 already exists"
}

Write-Host "=== Point origin at pglcarpets only ==="
git remote remove origin 2>$null
git remote add origin https://github.com/pglcarpets/oo08082026.git

Write-Host "=== Push main ==="
git push -u origin main
if ($LASTEXITCODE -ne 0) {
  Write-Warning "Normal push failed. If repo is empty or you want a fresh copy, run: git push -u origin main --force"
  exit 1
}

git remote -v | Tee-Object results\remote-setup.txt
Write-Host "Done. Default remote: https://github.com/pglcarpets/oo08082026.git"
