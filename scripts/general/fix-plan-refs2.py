#!/usr/bin/env python3
import os

plans_dir = 'plans'

expected = [
    '00-README.md', '01-handover.md', '02-testing-plan.md',
    '03-ops-deploy-plan.md', '04-database-plan.md', '05-workspaces-plan.md',
    '06-site-plan.md', '07-tech-docs-plan.md', '08-oo-start-checklist.md'
]

# Specific fixes for double-numbered and corrupted patterns
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
    '.../HANDOVER.md': '01-handover.md',
    '(`.../HANDOVER.md`)': '(01-handover.md)',
}

# Also fix remaining old-style references in text
old_to_new = {
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

for f in expected:
    path = os.path.join(plans_dir, f)
    with open(path, 'r', encoding='utf-8', errors='replace') as file:
        content = file.read()
    
    original = content
    
    # Apply specific fixes first
    for old, new in fixes.items():
        content = content.replace(old, new)
    
    # Apply general old-to-new replacements
    for old, new in old_to_new.items():
        content = content.replace(old, new)
    
    if content != original:
        with open(path, 'w', encoding='utf-8') as f_out:
            f_out.write(content)
        print(f'Fixed: {f}')
    else:
        print(f'OK: {f}')

print('Done.')
