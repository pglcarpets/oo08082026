#!/usr/bin/env python3

def update_site_plan():
    path = 'plans/site-plan.md'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    old = '**Status:** PARTIAL — member suite landings claimed 2026-08-06; marketing ledger has 10 open findings (3 major, 1 blocker-equivalent); responsive audit not re-run 2026-08-08; console audit reveals new product-page hydration mismatches; full gate OPEN.'
    new = '**Status:** PARTIAL — member suite landings claimed 2026-08-06; marketing ledger has 10 open findings; responsive audit not re-run 2026-08-08; console audit reveals product-page hydration mismatches + 404 resource errors on 6 routes; theme fetch fails (falls back to local tokens); full gate OPEN.'
    content = content.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('site-plan updated')

update_site_plan()
