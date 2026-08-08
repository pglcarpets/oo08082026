#!/usr/bin/env python3
import os, re

plans_dir = 'plans'

expected = [
    '00-README.md', '01-handover.md', '02-testing-plan.md',
    '03-ops-deploy-plan.md', '04-database-plan.md', '05-workspaces-plan.md',
    '06-site-plan.md', '07-tech-docs-plan.md', '08-oo-start-checklist.md'
]

# Replace ANY occurrence of these strings anywhere in the file
fixes = {
    '02-02-testing-plan.md': '02-testing-plan.md',
    '03-03-ops-deploy-plan.md': '03-ops-deploy-plan.md',
    '04-04-database-plan.md': '04-database-plan.md',
    '05-05-workspaces-plan.md': '05-workspaces-plan.md',
    '06-06-site-plan.md': '06-site-plan.md',
    '07-07-tech-docs-plan.md': '07-tech-docs-plan.md',
    '00-00-README.md': '00-README.md',
    '01-01-handover.md': '01-handover.md',
    '08-08-oo-start-checklist.md': '08-oo-start-checklist.md',
    './HANDOVER.md': '01-handover.md',
    '.../HANDOVER.md': '01-handover.md',
    # Fix the corrupted link format
    '[`HANDOVER.md`](.../HANDOVER.md)': '[`HANDOVER.md`](01-handover.md)',
}

for f in expected:
    path = os.path.join(plans_dir, f)
    with open(path, 'r', encoding='utf-8', errors='replace') as file:
        content = file.read()
    
    original = content
    
    for old, new in fixes.items():
        content = content.replace(old, new)
    
    if content != original:
        with open(path, 'w', encoding='utf-8') as f_out:
            f_out.write(content)
        print(f'Fixed: {f}')
    else:
        print(f'OK: {f}')

print('Done.')
