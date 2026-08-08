#!/usr/bin/env python3
import os, shutil

# Move checklist to plans
src = 'oo-start-checklist.md'
dst = 'plans/08-oo-start-checklist.md'

if os.path.exists(src):
    shutil.move(src, dst)
    print(f'Moved: {src} -> {dst}')
else:
    print(f'Source not found: {src}')
    exit(1)

# Update handover.md reference
handover = 'plans/01-handover.md'
with open(handover, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('oo-start-checklist.md', '08-oo-start-checklist.md')
with open(handover, 'w', encoding='utf-8') as f:
    f.write(content)
print(f'Updated: {handover}')

# Update generator script
gen = 'scripts/general/generate-session-docs.py'
with open(gen, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('oo-start-checklist.md', '08-oo-start-checklist.md')
with open(gen, 'w', encoding='utf-8') as f:
    f.write(content)
print(f'Updated: {gen}')

# Update check-plans-purity.mjs
purity = 'scripts/general/check-plans-purity.mjs'
with open(purity, 'r', encoding='utf-8') as f:
    content = f.read()

# Add to rootPlanDocs list
old_list = '''const rootPlanDocs = [
  "04-database-plan.md",
  "01-handover.md",
  "03-ops-deploy-plan.md",
  "06-site-plan.md",
  "07-tech-docs-plan.md",
  "02-testing-plan.md",
  "05-workspaces-plan.md",
];'''

new_list = '''const rootPlanDocs = [
  "08-oo-start-checklist.md",
  "04-database-plan.md",
  "01-handover.md",
  "03-ops-deploy-plan.md",
  "06-site-plan.md",
  "07-tech-docs-plan.md",
  "02-testing-plan.md",
  "05-workspaces-plan.md",
];'''

content = content.replace(old_list, new_list)

with open(purity, 'w', encoding='utf-8') as f:
    f.write(content)
print(f'Updated: {purity}')

print('Done.')
