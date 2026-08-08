# Finish open repo matters: clear git lock, commit, push, show CI status.
$ErrorActionPreference = 'Stop'
Set-Location 'E:\oo08082026'

$lock = Join-Path (Get-Location) '.git\index.lock'
if (Test-Path -LiteralPath $lock) {
  if (Get-Process git -ErrorAction SilentlyContinue) {
    throw '.git/index.lock exists and git is running — stop other git processes first.'
  }
  Write-Host 'Removing stale .git/index.lock'
  Remove-Item -LiteralPath $lock -Force
}

Write-Host '=== git status -sb ==='
git status -sb

Write-Host '=== git diff --stat ==='
git diff --stat

$paths = @(
  '.github/workflows',
  'site',
  'tests',
  'plans',
  'scripts',
  'tech-docs-generator/scripts/extract-ci.mjs',
  'AGENTS.md',
  'CONTENTS.md',
  'DOC-MAP.md',
  'Failures.md',
  'START.md',
  'Agents',
  'docs'
)

foreach ($p in $paths) {
  if (Test-Path -LiteralPath $p) {
    git add -- $p
  }
}

Write-Host '=== Staged ==='
git diff --cached --stat

$null = git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
  git commit -m @"
docs: align repository documentation and scripts with live architecture

- Update script paths, repo references, and DB table locations
- Remove stale HANDOVER.md references; fix blocker IDs (F1 -> P0)
- Align furniture_catalog and block_descriptors checks with Admin DB
"@
} else {
  Write-Host 'Nothing to commit.'
}

Write-Host '=== Push ==='
git push -u origin HEAD

Write-Host '=== Recent Actions runs ==='
gh run list --limit 8 2>&1

Write-Host 'Done.'
