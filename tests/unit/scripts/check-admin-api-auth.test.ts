// @vitest-environment node
/**
 * Governance: every admin route module must import an auth helper.
 * Edge proxy does not cookie-gate API GETs — handlers are the real gate.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const monorepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
const adminApiRoot = path.join(monorepoRoot, "site/app/api/admin");

function listRouteFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) return listRouteFiles(absolute);
    return entry.name === "route.ts" ? [absolute] : [];
  });
}

const AUTH_MARKERS = [
  "withAuth",
  "requireAdminSession",
  "enforceAdminMutationGuard",
  "resolveAuthContext",
];

describe("admin API auth inventory", () => {
  it("every site/app/api/admin/**/route.ts imports an admin auth helper", () => {
    const routes = listRouteFiles(adminApiRoot);
    expect(routes.length).toBeGreaterThan(0);

    const missing: string[] = [];
    for (const file of routes) {
      const source = fs.readFileSync(file, "utf8");
      const ok = AUTH_MARKERS.some((marker) => source.includes(marker));
      if (!ok) {
        missing.push(path.relative(monorepoRoot, file).replace(/\\/g, "/"));
      }
    }

    expect(missing, `ungated admin routes:\n${missing.join("\n")}`).toEqual([]);
  });
});
