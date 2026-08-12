// @vitest-environment node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const scriptPath = path.join(siteRoot, "scripts/general/audit-api-route-safety.mjs");

type MatrixRow = {
  apiPath: string;
  surface: string;
  methods: string;
  csrfRequired: boolean;
  csrfOptional: boolean;
  csrfPresent: boolean;
  rateLimitPresent: boolean;
  authPresent: boolean;
  rejectionHeaderOk: boolean;
  csrfCodeOk: boolean;
};

type AuditJson = {
  ok: boolean;
  routesScanned: number;
  mutatorsScanned: number;
  errorCount: number;
  warnCount: number;
  issues: Array<{ id: string; severity: string; apiPath: string }>;
  matrix: MatrixRow[];
};

function runAuditJson(): AuditJson {
  const output = execFileSync(process.execPath, [scriptPath, "--json"], {
    cwd: siteRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 10 * 1024 * 1024,
  });
  return JSON.parse(output) as AuditJson;
}

describe("audit-api-route-safety", () => {
  it("ships the static API safety audit script with expected contracts", () => {
    expect(fs.existsSync(scriptPath)).toBe(true);
    const source = fs.readFileSync(scriptPath, "utf8");
    expect(source).toContain("CSRF_OPTIONAL");
    expect(source).toContain("CSRF_REQUIRED_PREFIXES");
    expect(source).toContain("PUBLIC_FORM_MUTATORS");
    expect(source).toContain("missing-csrf");
    expect(source).toContain("missing-rate-limit");
    expect(source).toContain("missing-public-rate-limit");
    expect(source).toContain("csrf-wrong-error-code");
    expect(source).toContain("--matrix");
    expect(source).toContain("--json");
    // TST-S31 / API-2 — `other` surface enforcement + documented allowlist
    expect(source).toContain("OTHER_PUBLIC_GET_ALLOWLIST");
    expect(source).toContain("missing-other-rate-limit");
    expect(source).toContain("other-get-no-auth");
  });

  it("exits 0 on the live app/api tree and reports zero errors", () => {
    const text = execFileSync(process.execPath, [scriptPath], {
      cwd: siteRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    expect(text).toMatch(/audit-api-route-safety: scanned \d+ route file\(s\)/);
    expect(text).toContain("audit-api-route-safety: ok");
  });

  it("json matrix covers admin ops, planner handoff, and site forms", () => {
    const result = runAuditJson();
    expect(result.ok).toBe(true);
    expect(result.errorCount).toBe(0);
    expect(result.routesScanned).toBeGreaterThan(40);
    expect(result.mutatorsScanned).toBeGreaterThan(20);
    expect(Array.isArray(result.matrix)).toBe(true);

    const byPath = Object.fromEntries(result.matrix.map((row) => [row.apiPath, row]));

    // Admin ops + catalog managers (live app/api tree)
    for (const key of [
      "admin/plans",
      "admin/plans/[id]",
      "admin/themes/publish",
      "admin/features",
      "admin/price-books/[bookId]/action",
      "admin/catalogs/[type]",
      "admin/catalogs/[type]/[id]",
      "customer-queries/manage",
      "theme/manage",
    ]) {
      expect(byPath[key], `missing matrix row ${key}`).toBeDefined();
      expect(byPath[key].csrfRequired).toBe(true);
      expect(byPath[key].csrfPresent).toBe(true);
      expect(byPath[key].rateLimitPresent).toBe(true);
      expect(byPath[key].rejectionHeaderOk).toBe(true);
      expect(byPath[key].csrfCodeOk).toBe(true);
    }

    // Dual plans API (member surface) stays locked
    expect(byPath.plans).toBeDefined();
    expect(byPath.plans.csrfRequired).toBe(true);
    expect(byPath.plans.csrfPresent).toBe(true);
    expect(byPath.plans.rateLimitPresent).toBe(true);
    expect(byPath.plans.surface).toBe("plans");

    // Site public form: CSRF optional, rate limit required
    expect(byPath["customer-queries"]).toBeDefined();
    expect(byPath["customer-queries"].csrfOptional).toBe(true);
    expect(byPath["customer-queries"].csrfRequired).toBe(false);
    expect(byPath["customer-queries"].rateLimitPresent).toBe(true);
    expect(byPath["customer-queries"].surface).toBe("site-form");

    // Authenticated audit mutator: CSRF required + fail-closed codes
    expect(byPath.audit).toBeDefined();
    expect(byPath.audit.csrfRequired).toBe(true);
    expect(byPath.audit.csrfPresent).toBe(true);
    expect(byPath.audit.csrfCodeOk).toBe(true);
    expect(byPath.audit.rejectionHeaderOk).toBe(true);

    // F4b: site AI / member helpers require CSRF (not public-form optional)
    for (const key of [
      "ai-advisor",
      "filter",
      "generate-alt",
      "configurator/smart-wizard",
    ]) {
      expect(byPath[key], `missing matrix row ${key}`).toBeDefined();
      expect(byPath[key].csrfRequired).toBe(true);
      expect(byPath[key].csrfPresent).toBe(true);
      expect(byPath[key].rateLimitPresent).toBe(true);
      expect(byPath[key].rejectionHeaderOk).toBe(true);
    }

    // Forked Planner / Studio mutators (case-sensitive segments)
    for (const key of [
      "Planner/projects",
      "Planner/projects/[id]",
      "Planner/catalog/upload",
      "Studio/furniture",
      "Studio/furniture/[id]",
      "Studio/furniture/upload",
      "Studio/ai/generate",
      "Studio/ai/suggest",
      "Studio/ai/restyle",
    ]) {
      expect(byPath[key], `missing matrix row ${key}`).toBeDefined();
      expect(byPath[key].csrfRequired).toBe(true);
      expect(byPath[key].csrfPresent).toBe(true);
      expect(byPath[key].rateLimitPresent).toBe(true);
      expect(byPath[key].authPresent).toBe(true);
    }
  });

  it("matrix mode prints a TSV header row", () => {
    const output = execFileSync(process.execPath, [scriptPath, "--matrix"], {
      cwd: siteRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    expect(output).toContain("apiPath\tsurface\tmethods\tcsrfReq\tcsrf\trate\tauth\thdr\tcode");
    expect(output).toContain("Planner/projects");
    expect(output).toContain("customer-queries");
    expect(output).toContain("admin/plans");
  });
});
