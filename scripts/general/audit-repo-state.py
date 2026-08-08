#!/usr/bin/env python3
import json, os, sys

print("=" * 60)
print("REPO STATE AUDIT")
print("=" * 60)

# 1. Console errors
print("\n--- 1. CONSOLE AUDIT ERRORS ---")
try:
    with open('results/console-audit/errors.json') as f:
        d = json.load(f)
    total = sum(len(v) for v in d.get('routes', {}).values())
    print(f"Total console errors: {total}")
    for route, errs in d.get('routes', {}).items():
        print(f"  {route}: {len(errs)} errors")
        for e in errs[:2]:
            msg = e.get('message', str(e)) if isinstance(e, dict) else str(e)
            print(f"    - {msg[:100]}")
except Exception as ex:
    print(f"Error reading console audit: {ex}")

# 2. Asset cutover issues
print("\n--- 2. ASSET CUTOVER ---")
try:
    with open('results/asset-cutover/smoke-report.json') as f:
        d = json.load(f)
    print(f"Overall: {d.get('overall', 'unknown')}")
    for check in d.get('phase04', {}).get('checks', []):
        wstatus = check.get('worker', {}).get('status', '?')
        s3ok = check.get('s3Get', {}).get('ok', False)
        print(f"  {check.get('key','')[:60]}: worker={wstatus} s3={s3ok}")
except Exception as ex:
    print(f"Error reading asset cutover: {ex}")

# 3. Deploy status
print("\n--- 3. DEPLOY STATUS ---")
try:
    with open('results/deploy/vercel-deploy.log', 'rb') as f:
        raw = f.read()
    # Try UTF-16 first
    try:
        text = raw.decode('utf-16-le')
    except:
        text = raw.decode('utf-8', errors='replace')
    lines = text.replace('\r\n', '\n').split('\n')
    print(f"Deploy log lines: {len(lines)}")
    issues = [l for l in lines if any(x in l.lower() for x in ['error','fail','timeout','404','500','broken']) and len(l.strip()) > 5]
    print(f"Potential issues: {len(issues)}")
    for i in issues[:8]:
        print(f"  {i.strip()[:120]}")
except Exception as ex:
    print(f"Error reading deploy log: {ex}")

# 4. Test results
print("\n--- 4. TEST RESULTS ---")
for name in ['vitest-results.json', 'vitest-tech-docs-results.json']:
    try:
        with open(f'results/tests/{name}') as f:
            d = json.load(f)
        print(f"  {name}: {d.get('numPassedTests',0)}/{d.get('numTotalTests',0)} passed, {d.get('numFailedTests',0)} failed")
    except Exception as ex:
        print(f"  {name}: not found")

# 5. Full test run log issues
print("\n--- 5. FULL TEST RUN ISSUES ---")
try:
    with open('results/tests/full-test-run-4.log', 'rb') as f:
        raw = f.read()
    try:
        text = raw.decode('utf-16-le')
    except:
        text = raw.decode('utf-8', errors='replace')
    lines = text.replace('\r\n', '\n').split('\n')
    issues = [l for l in lines if any(x in l for x in ['failed','Error:','timeout','missing','broken','FAIL']) and len(l.strip()) > 10]
    print(f"Issues found: {len(issues)}")
    for i in issues[:10]:
        print(f"  {i.strip()[:120]}")
except Exception as ex:
    print(f"Error reading test log: {ex}")

# 6. Package.json analysis
print("\n--- 6. DEPENDENCY ANALYSIS ---")
try:
    with open('package.json') as f:
        pkg = json.load(f)
    deps = pkg.get('dependencies', {})
    devdeps = pkg.get('devDependencies', {})
    print(f"Production deps: {len(deps)}")
    print(f"Dev deps: {len(devdeps)}")
    # Check for potential issues
    if 'next' in deps:
        print(f"  Next.js: {deps['next']}")
    if 'react' in deps:
        print(f"  React: {deps['react']}")
    if 'typescript' in devdeps:
        print(f"  TypeScript: {devdeps['typescript']}")
except Exception as ex:
    print(f"Error reading package.json: {ex}")

# 7. Site structure
print("\n--- 7. SITE STRUCTURE ---")
try:
    site_files = []
    for root, dirs, files in os.walk('site/app'):
        for f in files:
            site_files.append(os.path.join(root, f))
    tsx = [f for f in site_files if f.endswith('.tsx')]
    ts = [f for f in site_files if f.endswith('.ts')]
    print(f"  site/app files: {len(site_files)} total, {len(tsx)} .tsx, {len(ts)} .ts")
except Exception as ex:
    print(f"Error scanning site: {ex}")

# 8. Check for missing critical files
print("\n--- 8. CRITICAL FILES CHECK ---")
critical = [
    '.env.local',
    'site/next.config.js',
    'site/next.config.ts',
    'site/next.config.mjs',
    'site/postcss.config.js',
    'site/tailwind.config.js',
    'site/tailwind.config.ts',
]
for f in critical:
    exists = os.path.exists(f)
    print(f"  {f}: {'EXISTS' if exists else 'MISSING'}")

print("\n" + "=" * 60)
print("AUDIT COMPLETE")
print("=" * 60)
