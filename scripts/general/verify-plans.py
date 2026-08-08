#!/usr/bin/env python3
import os, re

plans_dir = 'plans'
expected = [
    '00-README.md', '01-handover.md', '02-testing-plan.md',
    '03-ops-deploy-plan.md', '04-database-plan.md', '05-workspaces-plan.md',
    '06-site-plan.md', '07-tech-docs-plan.md', '08-oo-start-checklist.md'
]

print('=== Checking plan files exist ===')
missing = []
for f in expected:
    if not os.path.exists(os.path.join(plans_dir, f)):
        missing.append(f)

if missing:
    print('MISSING:', missing)
else:
    print('All 9 plan files present')

print('\n=== Checking broken cross-references ===')
for f in expected:
    path = os.path.join(plans_dir, f)
    with open(path, 'r', encoding='utf-8', errors='replace') as file:
        content = file.read()
    links = re.findall(r'\]\(\.?/?([^)]+)\)', content)
    for link in links:
        if link.endswith('.md'):
            # Check if file exists relative to plans dir
            target = os.path.join(plans_dir, link)
            if not os.path.exists(target) and not os.path.exists(link):
                print(f'BROKEN in {f}: {link}')

print('\n=== Checking for old unnumbered references ===')
old_names = ['testing-plan.md', 'ops-deploy-plan.md', 'database-plan.md',
             'workspaces-plan.md', 'site-plan.md', 'tech-docs-plan.md',
             'handover.md', 'oo-start-checklist.md']
for f in expected:
    path = os.path.join(plans_dir, f)
    with open(path, 'r', encoding='utf-8', errors='replace') as file:
        content = file.read()
    for old in old_names:
        if old in content:
            print(f'OLD REF in {f}: {old}')

print('\nDone.')
