#!/usr/bin/env python3
import os

mapping = {
    'README.md': '00-README.md',
    'handover.md': '01-handover.md',
    'testing-plan.md': '02-testing-plan.md',
    'ops-deploy-plan.md': '03-ops-deploy-plan.md',
    'database-plan.md': '04-database-plan.md',
    'workspaces-plan.md': '05-workspaces-plan.md',
    'site-plan.md': '06-site-plan.md',
    'tech-docs-plan.md': '07-tech-docs-plan.md',
}

# Update check-plans-purity.mjs
with open('scripts/general/check-plans-purity.mjs', 'r', encoding='utf-8') as f:
    content = f.read()

for old, new in mapping.items():
    content = content.replace(f'"{old}"', f'"{new}"')

with open('scripts/general/check-plans-purity.mjs', 'w', encoding='utf-8') as f:
    f.write(content)
print('check-plans-purity.mjs updated')

# Update test file
test_file = 'tests/unit/scripts/root-surface-purity.test.ts'
if os.path.exists(test_file):
    with open(test_file, 'r', encoding='utf-8') as f:
        content = f.read()
    for old, new in mapping.items():
        content = content.replace(old, new)
    with open(test_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'{test_file} updated')
else:
    print(f'{test_file} not found')
