from __future__ import annotations

import argparse
import json
import os
import subprocess
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import urlparse
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "docs" / "ops"
BLOCKED_HOSTS = {
    "images.unsplash.com",
    "catalogindia.in",
    "www.catalogindia.in",
    "static.wixstatic.com",
    "res.cloudinary.com",
}


def parse_dotenv(filepath: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    if not filepath.exists():
        return env
    for raw in filepath.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def env_get(key: str, fallback: dict[str, str]) -> str:
    return os.environ.get(key, "").strip() or fallback.get(key, "").strip()


def is_external_url(value: str) -> bool:
    return value.startswith("http://") or value.startswith("https://")


def scan_supabase_assets(base_url: str, service_key: str) -> dict[str, Any]:
    endpoint = (
        f"{base_url}/rest/v1/products"
        "?select=slug,flagship_image,images,scene_images"
    )
    req = Request(
        endpoint,
        headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Accept": "application/json",
        },
    )
    with urlopen(req, timeout=60) as resp:
        rows = json.loads(resp.read().decode("utf-8"))

    by_host: dict[str, int] = defaultdict(int)
    blocked_hits: list[dict[str, Any]] = []
    external_rows = 0

    for row in rows:
        slug = str(row.get("slug") or "").strip()
        assets: list[str] = []
        flagship = str(row.get("flagship_image") or "").strip()
        if flagship:
            assets.append(flagship)
        for field in ("images", "scene_images"):
            raw = row.get(field)
            if isinstance(raw, list):
                assets.extend(str(item).strip() for item in raw if str(item).strip())

        row_external: list[str] = []
        row_blocked: list[str] = []
        for asset in assets:
            if not is_external_url(asset):
                continue
            row_external.append(asset)
            host = urlparse(asset).hostname or "unknown"
            by_host[host] += 1
            if host in BLOCKED_HOSTS:
                row_blocked.append(asset)

        if row_external:
            external_rows += 1
        if row_blocked:
            blocked_hits.append(
                {
                    "slug": slug,
                    "count": len(row_blocked),
                    "samples": row_blocked[:5],
                }
            )

    return {
        "totalProducts": len(rows),
        "productsWithExternalAssets": external_rows,
        "externalHostCounts": dict(sorted(by_host.items(), key=lambda kv: kv[1], reverse=True)),
        "blockedHostHits": blocked_hits,
    }


def scan_source_for_blocked_hosts() -> dict[str, Any]:
    pattern = "|".join(sorted({h.replace(".", r"\.") for h in BLOCKED_HOSTS}))
    cmd = [
        "rg",
        "-n",
        pattern,
        "app",
        "components",
        "lib",
        "--glob",
        "!**/node_modules/**",
    ]
    proc = subprocess.run(cmd, cwd=str(ROOT), capture_output=True, text=True, check=False)
    lines = [line for line in proc.stdout.splitlines() if line.strip()]
    return {
        "matchCount": len(lines),
        "matches": lines[:200],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Audit external/third-party asset hosts in Supabase and source.")
    parser.add_argument("--fail-on-hit", action="store_true", help="Exit with code 1 when blocked hosts are found.")
    args = parser.parse_args()

    env_file = parse_dotenv(ROOT / ".env.local")
    supabase_url = env_get("NEXT_PUBLIC_SUPABASE_URL", env_file)
    service_key = env_get("SUPABASE_SERVICE_ROLE_KEY", env_file) or env_get("NEXT_PUBLIC_SUPABASE_ANON_KEY", env_file)

    supabase_report: dict[str, Any]
    if supabase_url and service_key:
        supabase_report = scan_supabase_assets(supabase_url, service_key)
    else:
        supabase_report = {
            "skipped": True,
            "reason": "Missing NEXT_PUBLIC_SUPABASE_URL and/or service key",
        }

    source_report = scan_source_for_blocked_hosts()
    blocked_count_db = len(supabase_report.get("blockedHostHits", [])) if isinstance(supabase_report, dict) else 0
    blocked_count_code = int(source_report.get("matchCount", 0))

    result = {
        "generatedAt": datetime.now().isoformat(timespec="seconds"),
        "blockedHosts": sorted(BLOCKED_HOSTS),
        "supabase": supabase_report,
        "source": source_report,
        "summary": {
            "blockedDbRows": blocked_count_db,
            "blockedCodeMatches": blocked_count_code,
        },
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    out_path = OUT_DIR / f"external-asset-audit-{stamp}.json"
    out_path.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")

    print(out_path)
    print(f"blocked_db_rows={blocked_count_db}")
    print(f"blocked_code_matches={blocked_count_code}")

    if args.fail_on_hit and (blocked_count_db > 0 or blocked_count_code > 0):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
