#!/usr/bin/env python3
import os, re

plans_dir = 'plans'

# Mapping from old names to new numbered names
mapping = {
    'testing-plan.md': '02-testing-plan.md',
    'ops-deploy-plan.md': '03-ops-deploy-plan.md',
    'database-plan.md': '04-database-plan.md',
    'workspaces-plan.md': '05-workspaces-plan.md',
    'site-plan.md': '06-site-plan.md',
    'tech-docs-plan.md': '07-tech-docs-plan.md',
    'handover.md': '01-handover.md',
    'oo-start-checklist.md': '08-oo-start-checklist.md',
    'README.md': '00-README.md',
}

# Also fix double-numbered artifacts
double_fixes = {
    '02-02-testing-plan.md': '02-testing-plan.md',
    '03-03-ops-deploy-plan.md': '03-ops-deploy-plan.md',
    '04-04-database-plan.md': '04-database-plan.md',
    '05-05-workspaces-plan.md': '05-workspaces-plan.md',
    '06-06-site-plan.md': '06-site-plan.md',
    '07-07-tech-docs-plan.md': '07-tech-docs-plan.md',
}

# Fix HANDOVER.md link (it's now 01-handover.md in the same dir)
handover_fix = {
    './HANDOVER.md': '01-handover.md',
    '../HANDOVER.md': '01-handover.md',
}

expected = [
    '00-README.md', '01-handover.md', '02-testing-plan.md',
    '03-ops-deploy-plan.md', '04-database-plan.md', '05-workspaces-plan.md',
    '06-site-plan.md', '07-tech-docs-plan.md', '08-oo-start-checklist.md'
]

for f in expected:
    path = os.path.join(plans_dir, f)
    with open(path, 'r', encoding='utf-8', errors='replace') as file:
        content = file.read()
    
    original = content
    
    # Fix double-numbered first
    for old, new in double_fixes.items():
        content = content.replace(old, new)
    
    # Fix old unnumbered names
    for old, new in mapping.items():
        content = content.replace(old, new)
    
    # Fix HANDOVER.md link
    for old, new in handover_fix.items():
        content = content.replace(old, new)
    
    if content != original:
        with open(path, 'w', encoding='utf-8') as f_out:
            f_out.write(content)
        print(f'Fixed: {f}')
    else:
        print(f'OK: {f}')

print('Done.')
