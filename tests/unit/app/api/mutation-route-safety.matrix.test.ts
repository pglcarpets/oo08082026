// @vitest-environment node
/**
 * Static CSRF + rate-limit matrix for mutation routes.
 *
 * Complements scripts/general/audit-api-route-safety.mjs with focused source asserts
 * on admin ops, planner handoff, and site form mutators (unit/static proof).
 *
 * AF-14: admin mutators are discovered under app/api/admin so new routes
 * cannot skip the matrix by omission from a hand list.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const apiRoot = path.join(repoRoot, "site", "app", "api");
const adminApiRoot = path.join(apiRoot, "admin");

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function readRoute(...segments: string[]): string {
  const file = path.join(apiRoot, ...segments, "route.ts");
  expect(fs.existsSync(file), `missing ${file}`).toBe(true);
  return fs.readFileSync(file, "utf8");
}

function walkRouteFiles(dir: string, files: string[] = []): string[] {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return files;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      walkRouteFiles(full, files);
    } else if (entry === "route.ts" || entry === "route.js") {
      files.push(full);
    }
  }
  return files;
}

function toApiPath(absFile: string): string {
  return path
    .relative(apiRoot, absFile)
    .replaceAll("\\", "/")
    .replace(/\/route\.(ts|js)$/, "");
}

function extractExportedMethods(source: string): string[] {
  const methods = new Set<string>();
  for (const m of source.matchAll(
    /\bexport\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/g,
  )) {
    methods.add(m[1]);
  }
  for (const m of source.matchAll(
    /\bexport\s+const\s+(GET|POST|PUT|PATCH|DELETE)\s*=/g,
  )) {
    methods.add(m[1]);
  }
  return [...methods];
}

// The shared admin mutation guard (site/app/api/admin/_lib/server.ts) performs
// enforceAdminRateLimit + resolveAuthContext("admin") + validateCsrfRequest +
// the CSRF_REJECTION_HEADER_NAME response in one call, so routes that use it
// satisfy CSRF/rate-limit/auth-gate/rejection-header without repeating the
// literal calls inline.
const ADMIN_MUTATION_GUARD = /\b(?:ensureCsrfAdminMutationGuard|enforceAdminMutationGuard)\s*\(/;

function hasCsrf(source: string): boolean {
  return (
    /requireCsrf\s*:\s*true/.test(source) ||
    /validateCsrfRequest\s*\(/.test(source) ||
    ADMIN_MUTATION_GUARD.test(source)
  );
}

function hasRateLimit(source: string): boolean {
  return (
    /withAuth\s*[<(]/.test(source) ||
    /\brateLimit\s*\(/.test(source) ||
    /\benforceAdminRateLimit\s*\(/.test(source) ||
    /\benforcePublicApiRateLimit\s*\(/.test(source) ||
    ADMIN_MUTATION_GUARD.test(source)
  );
}

function hasRejectionHeader(source: string): boolean {
  if (/requireCsrf\s*:\s*true/.test(source) && /withAuth\s*[<(]/.test(source)) {
    return true;
  }
  return (
    /CSRF_REJECTION_HEADER_NAME/.test(source) ||
    /["']x-csrf-rejected["']/.test(source) ||
    ADMIN_MUTATION_GUARD.test(source)
  );
}

function hasAdminAuthGate(source: string): boolean {
  return (
    /withAuth\s*[<(]/.test(source) ||
    /requireAdminSession\s*\(/.test(source) ||
    /role\s*:\s*["']admin["']/.test(source) ||
    ADMIN_MUTATION_GUARD.test(source)
  );
}

/**
 * For withAuth exports, each mutating method must either use requireCsrf:true
 * on that export (or file-level withAuth CSRF) or manual validateCsrfRequest.
 * Manual function exports must call validateCsrfRequest in the same file, or
 * go through the shared admin mutation guard.
 */
function mutatingMethodHasCsrf(source: string, method: string): boolean {
  const withAuthExport = new RegExp(
    `export\\s+const\\s+${method}\\s*=\\s*withAuth`,
  );
  if (withAuthExport.test(source)) {
    // Prefer per-export options; accept file-level requireCsrf:true (withAuth pattern).
    return /requireCsrf\s*:\s*true/.test(source);
  }

  const fnExport = new RegExp(
    `export\\s+(?:async\\s+)?function\\s+${method}\\b`,
  );
  if (fnExport.test(source)) {
    return /validateCsrfRequest\s*\(/.test(source) || ADMIN_MUTATION_GUARD.test(source);
  }

  return hasCsrf(source);
}

type AdminMutatorRow = {
  apiPath: string;
  methods: string[];
  source: string;
};

function discoverAdminMutators(): AdminMutatorRow[] {
  const files = walkRouteFiles(adminApiRoot);
  const rows: AdminMutatorRow[] = [];
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    const methods = extractExportedMethods(source).filter((m) => MUTATING.has(m));
    if (methods.length === 0) continue;
    rows.push({ apiPath: toApiPath(file), methods, source });
  }
  return rows.sort((a, b) => a.apiPath.localeCompare(b.apiPath));
}

describe("mutation route CSRF + rate-limit matrix (static)", () => {
  describe("AF-14 admin mutators (auto-discovered)", () => {
    const adminMutators = discoverAdminMutators();

    it("discovers every known admin mutation surface", () => {
      const paths = adminMutators.map((r) => r.apiPath);
      // Live admin mutators (product-studio retired → /api/Studio under fork surface)
      for (const required of [
        "admin/plans",
        "admin/plans/[id]",
        "admin/themes/publish",
        "admin/features",
        "admin/price-books/[bookId]/action",
        "admin/catalogs/[type]",
        "admin/catalogs/[type]/[id]",
      ]) {
        expect(paths, `missing mutator ${required}`).toContain(required);
      }
      expect(adminMutators.length).toBeGreaterThanOrEqual(7);
    });

    it.each(
      discoverAdminMutators().map((row) => [row.apiPath, row] as const),
    )("%s has CSRF + rate limit + admin gate + rejection hygiene", (_apiPath, row) => {
      const { source, methods } = row as AdminMutatorRow;
      expect(methods.length).toBeGreaterThan(0);
      expect(hasCsrf(source)).toBe(true);
      expect(hasRateLimit(source)).toBe(true);
      expect(hasRejectionHeader(source)).toBe(true);
      expect(hasAdminAuthGate(source)).toBe(true);
      for (const method of methods) {
        expect(
          mutatingMethodHasCsrf(source, method),
          `${row.apiPath} ${method} missing CSRF`,
        ).toBe(true);
      }
      if (/Invalid or missing CSRF token/i.test(source)) {
        expect(source).not.toMatch(
          /API_ERROR_CODES\.(INVALID_INPUT|INSUFFICIENT_PERMISSIONS)/,
        );
      }
    });

    it("GET-only admin routes are not required to carry CSRF", () => {
      const files = walkRouteFiles(adminApiRoot);
      const getOnly: string[] = [];
      for (const file of files) {
        const source = fs.readFileSync(file, "utf8");
        const methods = extractExportedMethods(source);
        const mutators = methods.filter((m) => MUTATING.has(m));
        if (mutators.length === 0 && methods.includes("GET")) {
          getOnly.push(toApiPath(file));
        }
      }
      // Sanity: known read surfaces exist and stay out of mutator matrix
      expect(getOnly).toEqual(
        expect.arrayContaining([
          "admin/analytics",
          "admin/price-books",
          "admin/themes",
        ]),
      );
      for (const apiPath of getOnly) {
        const row = adminMutators.find((r) => r.apiPath === apiPath);
        expect(row, `${apiPath} must not be classified as mutator`).toBeUndefined();
      }
    });
  });

  describe("admin ops mutators (named lock — residual non-admin paths)", () => {
    const adminOps: Array<{ segments: string[]; methods: RegExp }> = [
      { segments: ["customer-queries", "manage"], methods: /export async function PATCH/ },
      { segments: ["theme", "manage"], methods: /export async function POST/ },
    ];

    it.each(adminOps)(
      "$segments join has CSRF + rate limit + rejection hygiene",
      ({ segments, methods }) => {
        const source = readRoute(...segments);
        expect(source).toMatch(methods);
        expect(hasCsrf(source)).toBe(true);
        expect(hasRateLimit(source)).toBe(true);
        expect(hasRejectionHeader(source)).toBe(true);
        // Fail-closed: no CSRF message with wrong error codes
        if (/Invalid or missing CSRF token/i.test(source)) {
          expect(source).not.toMatch(
            /API_ERROR_CODES\.(INVALID_INPUT|INSUFFICIENT_PERMISSIONS)/,
          );
        }
      },
    );
  });

  describe("forked Planner / Studio mutators + dual plans API", () => {
    it("Planner projects mutators keep withAuth + requireCsrf + rate limit", () => {
      const collection = readRoute("Planner", "projects");
      expect(collection).toMatch(/export const POST\s*=\s*withAuth/);
      expect(collection).toMatch(/requireCsrf:\s*true/);
      expect(hasRateLimit(collection)).toBe(true);

      const byId = readRoute("Planner", "projects", "[id]");
      expect(byId).toMatch(/export const PATCH\s*=\s*withAuth/);
      expect(byId).toMatch(/export const DELETE\s*=\s*withAuth/);
      expect(byId).toMatch(/requireCsrf:\s*true/);
      expect(hasRateLimit(byId)).toBe(true);
    });

    it("Studio furniture + AI mutators keep CSRF + rate limit", () => {
      for (const segments of [
        ["Studio", "furniture"],
        ["Studio", "furniture", "[id]"],
        ["Studio", "furniture", "upload"],
        ["Studio", "ai", "generate"],
        ["Studio", "ai", "suggest"],
        ["Studio", "ai", "restyle"],
      ]) {
        const source = readRoute(...segments);
        expect(hasCsrf(source)).toBe(true);
        expect(hasRateLimit(source)).toBe(true);
        expect(source).toMatch(/requireCsrf:\s*true/);
      }
    });

    it("plans collection keeps withAuth requireCsrf on POST", () => {
      const source = readRoute("plans");
      expect(hasCsrf(source)).toBe(true);
      expect(hasRateLimit(source)).toBe(true);
      expect(source).toMatch(/requireCsrf:\s*true/);
    });
  });

  describe("site public forms", () => {
    it("customer-queries POST is rate-limited with honeypot (CSRF optional)", () => {
      const source = readRoute("customer-queries");
      expect(source).toMatch(/export async function POST/);
      expect(hasRateLimit(source)).toBe(true);
      expect(source).toMatch(/honeypot|website/);
      // Public intake intentionally skips double-submit CSRF
      expect(source).not.toMatch(/requireCsrf:\s*true/);
      expect(source).not.toMatch(/validateCsrfRequest/);
    });

    it("tracking and log-error stay rate-limited without CSRF", () => {
      for (const segments of [["tracking"], ["log-error"]]) {
        const source = readRoute(...segments);
        expect(source).toMatch(/export async function POST/);
        expect(hasRateLimit(source)).toBe(true);
      }
    });
  });

  describe("authenticated non-admin mutators", () => {
    it("audit POST uses CSRF_FAILED + rejection header", () => {
      const source = readRoute("audit");
      expect(hasCsrf(source)).toBe(true);
      expect(hasRateLimit(source)).toBe(true);
      expect(hasRejectionHeader(source)).toBe(true);
      expect(source).toMatch(/API_ERROR_CODES\.CSRF_FAILED/);
      expect(source).not.toMatch(
        /validateCsrfRequest[\s\S]{0,400}?API_ERROR_CODES\.(INVALID_INPUT|INSUFFICIENT_PERMISSIONS)/,
      );
    });
  });

  describe("F4b site / AI mutators", () => {
    it.each([
      ["ai-advisor"],
      ["filter"],
      ["generate-alt"],
      ["configurator", "smart-wizard"],
      ["theme", "manage"],
    ])("%s requires CSRF + rate limit + rejection hygiene", (...segments) => {
      const source = readRoute(...segments);
      expect(hasCsrf(source)).toBe(true);
      expect(hasRateLimit(source)).toBe(true);
      expect(hasRejectionHeader(source)).toBe(true);
      if (/Invalid or missing CSRF token/i.test(source)) {
        expect(source).not.toMatch(
          /API_ERROR_CODES\.(INVALID_INPUT|INSUFFICIENT_PERMISSIONS)/,
        );
      }
    });

    it("public marketing mutators stay rate-limited without CSRF", () => {
      for (const segments of [
        ["customer-queries"],
        ["tracking"],
        ["log-error"],
        ["nav-search"],
      ]) {
        const source = readRoute(...segments);
        expect(source).toMatch(/export async function POST/);
        expect(hasRateLimit(source)).toBe(true);
        expect(source).not.toMatch(/requireCsrf:\s*true/);
        expect(source).not.toMatch(/validateCsrfRequest/);
      }
    });
  });
});
