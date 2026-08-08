#!/usr/bin/env node
/**
 * Static audit for API route safety gaps (CSRF, auth, rate-limit, rejection header).
 *
 * Catches the class of bugs fixed on planner/plans routes:
 *   - mutating handlers without CSRF
 *   - CSRF rejects without `x-csrf-rejected` (browserApiFetch retry signal)
 *   - admin routes without session gate
 *   - protected mutators without rate limiting
 *   - public form mutators without rate limiting
 *   - CSRF failures coded as INVALID_INPUT / INSUFFICIENT_PERMISSIONS instead of CSRF_FAILED
 *
 * Usage:
 *   node scripts/audit-api-route-safety.mjs
 *   node scripts/audit-api-route-safety.mjs --json
 *   node scripts/audit-api-route-safety.mjs --matrix
 *   node scripts/audit-api-route-safety.mjs --warn-only
 *
 * Exit 1 when any error-severity issue is found (unless --warn-only).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(__dirname, "../..");
const siteRoot = path.join(monorepoRoot, "site");
const apiRoot = path.join(siteRoot, "app", "api");

const jsonMode = process.argv.includes("--json");
const matrixMode = process.argv.includes("--matrix");
const warnOnly = process.argv.includes("--warn-only");

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Relative api paths (posix, no leading slash) that intentionally skip CSRF.
 * Public marketing / telemetry mutators use rate limits (+ honeypot where relevant)
 * instead of double-submit CSRF.
 */
const CSRF_OPTIONAL = new Set([
  "tracking",
  "log-error",
  "customer-queries",
  "nav-search",
]);

/**
 * Paths that always require CSRF on mutating methods (prefix match).
 * Public marketing mutators stay optional via CSRF_OPTIONAL exact match first.
 * Member AI helpers (filter rank, generate-alt, smart-wizard) require CSRF.
 */
const CSRF_REQUIRED_PREFIXES = [
  "admin/",
  "admin",
  // Legacy lowercase planner surface + dual plans API
  "planner/",
  "planner",
  "plans",
  // Forked product surfaces (case-sensitive path segments)
  "Planner/",
  "Planner",
  "Studio/",
  "Studio",
  "theme/manage",
  "customer-queries/manage",
  "ai-advisor",
  "audit",
  "filter",
  "generate-alt",
  "configurator/smart-wizard",
];

/**
 * Public / site form mutators that must keep rate limiting even without CSRF.
 * Exact path match.
 */
const PUBLIC_FORM_MUTATORS = new Set([
  "customer-queries",
  "tracking",
  "log-error",
  "nav-search",
]);

const ADMIN_AUTH_MARKERS = [
  /withAuth\s*[<(]/,
  /requireAdminSession\s*\(/,
  /resolveAuthContext\s*\(\s*["']admin["']\s*\)/,
  /role\s*:\s*["']admin["']/,
];

const RATE_LIMIT_MARKERS = [
  /withAuth\s*[<(]/,
  /\brateLimit\s*\(/,
  /\benforceAdminRateLimit\s*\(/,
  /\benforcePublicApiRateLimit\s*\(/,
  /\benforceRateLimit\s*\(/,
];

const CSRF_REJECTION_HEADER_MARKERS = [
  /CSRF_REJECTION_HEADER_NAME/,
  /["']x-csrf-rejected["']/,
];

function walk(dir, files = []) {
  if (!statSync(dir).isDirectory()) return files;
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, files);
    } else if (entry === "route.ts" || entry === "route.js") {
      files.push(full);
    }
  }
  return files;
}

function toApiPath(absFile) {
  const rel = path.relative(apiRoot, absFile).replaceAll("\\", "/");
  return rel.replace(/\/route\.(ts|js)$/, "");
}

function extractExportedMethods(source) {
  const methods = new Set();
  // export async function POST / export function GET
  for (const m of source.matchAll(
    /\bexport\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/g,
  )) {
    methods.add(m[1]);
  }
  // export const POST = withAuth(...) / export const GET = ...
  for (const m of source.matchAll(
    /\bexport\s+const\s+(GET|POST|PUT|PATCH|DELETE)\s*=/g,
  )) {
    methods.add(m[1]);
  }
  return [...methods];
}

function hasAny(source, patterns) {
  return patterns.some((re) => re.test(source));
}

function csrfRequiredForPath(apiPath) {
  if (CSRF_OPTIONAL.has(apiPath)) return false;
  return CSRF_REQUIRED_PREFIXES.some(
    (prefix) => apiPath === prefix || apiPath.startsWith(prefix),
  );
}

function isAdminPath(apiPath) {
  return apiPath === "admin" || apiPath.startsWith("admin/");
}

function isPlannerPath(apiPath) {
  return (
    apiPath === "planner" ||
    apiPath.startsWith("planner/") ||
    apiPath === "Planner" ||
    apiPath.startsWith("Planner/") ||
    apiPath === "Studio" ||
    apiPath.startsWith("Studio/")
  );
}

function hasWithAuthCsrf(source) {
  return /requireCsrf\s*:\s*true/.test(source) && /withAuth\s*[<(]/.test(source);
}

function hasManualCsrf(source) {
  return /validateCsrfRequest\s*\(/.test(source);
}

function hasCsrfCoverage(source) {
  return hasWithAuthCsrf(source) || hasManualCsrf(source);
}

function hasCsrfRejectionHeader(source) {
  // withAuth + requireCsrf sets the header inside withAuth implementation
  if (hasWithAuthCsrf(source)) return true;
  return hasAny(source, CSRF_REJECTION_HEADER_MARKERS);
}

/**
 * CSRF failure path coded as INVALID_INPUT or INSUFFICIENT_PERMISSIONS
 * (historical bugs: plans used INVALID_INPUT; audit used INSUFFICIENT_PERMISSIONS).
 */
function hasWrongCsrfCode(source) {
  if (!hasManualCsrf(source) && !/CSRF|csrf/.test(source)) return false;

  // validateCsrfRequest → nearby API_ERROR_CODES.* that is not CSRF_FAILED
  const csrfBlocks = [
    ...source.matchAll(
      /validateCsrfRequest[\s\S]{0,500}?API_ERROR_CODES\.(\w+)/g,
    ),
  ];
  if (
    csrfBlocks.some(
      (m) => m[1] === "INVALID_INPUT" || m[1] === "INSUFFICIENT_PERMISSIONS",
    )
  ) {
    return true;
  }

  // Message mentions CSRF but code is wrong stable name
  if (
    /Invalid or missing CSRF token/i.test(source) &&
    /API_ERROR_CODES\.(INVALID_INPUT|INSUFFICIENT_PERMISSIONS)/.test(source) &&
    !/API_ERROR_CODES\.CSRF_FAILED/.test(source)
  ) {
    return true;
  }

  return false;
}

/**
 * Per-method CSRF: if export is withAuth and file has requireCsrf:true, all
 * withAuth mutators are covered. Manual validateCsrfRequest is per-function —
 * check each mutating function body contains validateCsrfRequest.
 */
function mutatingMethodMissingCsrf(source, method) {
  if (hasWithAuthCsrf(source)) {
    const withAuthExport = new RegExp(
      `export\\s+const\\s+${method}\\s*=\\s*withAuth`,
    );
    if (withAuthExport.test(source)) return false;
  }

  const fnRe = new RegExp(
    `export\\s+(?:async\\s+)?function\\s+${method}\\s*\\([\\s\\S]*?\\)\\s*\\{`,
  );
  const fnMatch = fnRe.exec(source);
  if (fnMatch) {
    const start = fnMatch.index + fnMatch[0].length;
    const body = sliceBalancedBlock(source, start - 1);
    if (/validateCsrfRequest\s*\(/.test(body)) return false;
    if (/requireCsrf\s*:\s*true/.test(body)) return false;
    if (/assertCsrf|ensureCsrf|checkCsrf|csrfFailedResponse/.test(body)) {
      return false;
    }
    return true;
  }

  const constWithAuth = new RegExp(
    `export\\s+const\\s+${method}\\s*=\\s*withAuth`,
  );
  if (constWithAuth.test(source)) {
    return !/requireCsrf\s*:\s*true/.test(source);
  }

  const constAny = new RegExp(`export\\s+const\\s+${method}\\s*=`);
  if (constAny.test(source)) {
    return !hasCsrfCoverage(source);
  }

  return true;
}

function sliceBalancedBlock(source, openBraceIndex) {
  let depth = 0;
  for (let i = openBraceIndex; i < source.length; i++) {
    const ch = source[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return source.slice(openBraceIndex, i + 1);
    }
  }
  return source.slice(openBraceIndex);
}

function adminMissingAuth(source) {
  return !hasAny(source, ADMIN_AUTH_MARKERS);
}

function missingRateLimit(source) {
  return !hasAny(source, RATE_LIMIT_MARKERS);
}

function classifySurface(apiPath) {
  if (isAdminPath(apiPath)) return "admin";
  if (isPlannerPath(apiPath)) return "planner";
  if (apiPath === "plans" || apiPath.startsWith("plans/")) return "plans";
  if (apiPath === "customer-queries" || apiPath.startsWith("customer-queries/")) {
    return "site-form";
  }
  if (PUBLIC_FORM_MUTATORS.has(apiPath)) return "site-public";
  if (apiPath === "theme/manage" || apiPath.startsWith("theme/")) return "theme";
  if (apiPath === "ai-advisor" || apiPath.startsWith("planner/ai-advisor")) {
    return "ai";
  }
  if (apiPath === "audit") return "audit";
  return "other";
}

const issues = [];
/** @type {Array<Record<string, string | boolean | null>>} */
const matrix = [];

function addIssue({ file, apiPath, method, id, severity, message }) {
  issues.push({ file, apiPath, method: method ?? null, id, severity, message });
}

if (!statSync(apiRoot).isDirectory()) {
  process.stderr.write(`audit-api-route-safety: missing ${apiRoot}\n`);
  process.exit(1);
}

const routeFiles = walk(apiRoot).sort();

for (const abs of routeFiles) {
  const apiPath = toApiPath(abs);
  const rel = path.relative(siteRoot, abs).replaceAll("\\", "/");
  const source = readFileSync(abs, "utf8");
  const methods = extractExportedMethods(source);
  const mutators = methods.filter((m) => MUTATING.has(m));
  const needsCsrf = csrfRequiredForPath(apiPath) && mutators.length > 0;
  const csrfPresent = hasCsrfCoverage(source);
  const ratePresent = !missingRateLimit(source);
  const authPresent = hasAny(source, ADMIN_AUTH_MARKERS) || /withAuth\s*[<(]/.test(source);

  if (mutators.length > 0) {
    matrix.push({
      apiPath,
      file: rel,
      surface: classifySurface(apiPath),
      methods: mutators.join(","),
      csrfRequired: needsCsrf,
      csrfOptional: CSRF_OPTIONAL.has(apiPath),
      csrfPresent,
      rateLimitPresent: ratePresent,
      authPresent,
      rejectionHeaderOk: !csrfPresent || hasCsrfRejectionHeader(source),
      csrfCodeOk: !csrfPresent || !hasWrongCsrfCode(source),
    });
  }

  // Admin: every route must gate auth (GET included)
  if (isAdminPath(apiPath) && methods.length > 0 && adminMissingAuth(source)) {
    addIssue({
      file: rel,
      apiPath,
      id: "missing-admin-auth",
      severity: "error",
      message:
        "admin route has no withAuth(role:admin) / requireAdminSession / resolveAuthContext(admin)",
    });
  }

  if (needsCsrf) {
    for (const method of mutators) {
      if (mutatingMethodMissingCsrf(source, method)) {
        addIssue({
          file: rel,
          apiPath,
          method,
          id: "missing-csrf",
          severity: "error",
          message: `${method} mutator lacks requireCsrf:true or validateCsrfRequest`,
        });
      }
    }

    if (hasCsrfCoverage(source) && !hasCsrfRejectionHeader(source)) {
      addIssue({
        file: rel,
        apiPath,
        id: "missing-csrf-rejection-header",
        severity: "error",
        message:
          "CSRF check present but response never sets x-csrf-rejected (CSRF_REJECTION_HEADER_NAME)",
      });
    }

    if (hasWrongCsrfCode(source)) {
      addIssue({
        file: rel,
        apiPath,
        id: "csrf-wrong-error-code",
        severity: "error",
        message:
          "CSRF failure uses API_ERROR_CODES.INVALID_INPUT or INSUFFICIENT_PERMISSIONS; use CSRF_FAILED",
      });
    }
  } else if (csrfPresent && mutators.length > 0) {
    // Optional path that still implements CSRF: hygiene still required
    if (!hasCsrfRejectionHeader(source)) {
      addIssue({
        file: rel,
        apiPath,
        id: "missing-csrf-rejection-header",
        severity: "error",
        message:
          "optional-CSRF path implements CSRF but never sets x-csrf-rejected",
      });
    }
    if (hasWrongCsrfCode(source)) {
      addIssue({
        file: rel,
        apiPath,
        id: "csrf-wrong-error-code",
        severity: "warn",
        message:
          "optional-CSRF path uses non-CSRF_FAILED code on CSRF reject",
      });
    }
  }

  // Rate limit on protected mutators (admin / planner / member plans)
  if (
    mutators.length > 0 &&
    (isAdminPath(apiPath) ||
      isPlannerPath(apiPath) ||
      apiPath === "plans" ||
      apiPath.startsWith("plans/")) &&
    missingRateLimit(source)
  ) {
    addIssue({
      file: rel,
      apiPath,
      id: "missing-rate-limit",
      severity: "error",
      message:
        "protected mutator has no rateLimit / withAuth / enforceAdminRateLimit",
    });
  }

  // Public / site form mutators always need rate limiting
  if (
    mutators.length > 0 &&
    PUBLIC_FORM_MUTATORS.has(apiPath) &&
    missingRateLimit(source)
  ) {
    addIssue({
      file: rel,
      apiPath,
      id: "missing-public-rate-limit",
      severity: "error",
      message:
        "public/site form mutator has no rateLimit / withAuth / enforcePublicApiRateLimit",
    });
  }

  // customer-queries public intake: honeypot expected (anti-bot alongside rate limit)
  if (apiPath === "customer-queries" && mutators.includes("POST")) {
    if (!/honeypot|website/.test(source)) {
      addIssue({
        file: rel,
        apiPath,
        id: "missing-public-form-honeypot",
        severity: "warn",
        message:
          "public customer-queries POST should keep a honeypot field (website) or documented equivalent",
      });
    }
  }

  // Planner + member plans mutators must use withAuth (CSRF header via requireCsrf)
  if (
    (isPlannerPath(apiPath) ||
      apiPath === "plans" ||
      apiPath.startsWith("plans/")) &&
    mutators.length > 0
  ) {
    if (!/withAuth\s*[<(]/.test(source)) {
      addIssue({
        file: rel,
        apiPath,
        id: "planner-mutator-no-withAuth",
        severity: "error",
        message:
          "planner/plans mutator must use withAuth + requireCsrf (not manual CSRF-only)",
      });
    } else if (!/requireCsrf\s*:\s*true/.test(source)) {
      addIssue({
        file: rel,
        apiPath,
        id: "planner-mutator-no-requireCsrf",
        severity: "error",
        message: "withAuth mutator missing requireCsrf: true",
      });
    }
  }
}

const errors = issues.filter((i) => i.severity === "error");
const warns = issues.filter((i) => i.severity === "warn");

function printMatrix(rows) {
  const headers = [
    "apiPath",
    "surface",
    "methods",
    "csrfReq",
    "csrf",
    "rate",
    "auth",
    "hdr",
    "code",
  ];
  const lines = [headers.join("\t")];
  for (const r of rows) {
    lines.push(
      [
        r.apiPath,
        r.surface,
        r.methods,
        r.csrfRequired ? "Y" : r.csrfOptional ? "opt" : "n",
        r.csrfPresent ? "Y" : "N",
        r.rateLimitPresent ? "Y" : "N",
        r.authPresent ? "Y" : "N",
        r.rejectionHeaderOk ? "Y" : "N",
        r.csrfCodeOk ? "Y" : "N",
      ].join("\t"),
    );
  }
  process.stdout.write(lines.join("\n") + "\n");
}

if (jsonMode) {
  process.stdout.write(
    JSON.stringify(
      {
        ok: errors.length === 0,
        routesScanned: routeFiles.length,
        mutatorsScanned: matrix.length,
        errorCount: errors.length,
        warnCount: warns.length,
        issues,
        matrix,
      },
      null,
      2,
    ) + "\n",
  );
} else {
  process.stdout.write(
    `audit-api-route-safety: scanned ${routeFiles.length} route file(s), ${matrix.length} mutator route(s)\n`,
  );
  if (matrixMode) {
    printMatrix(matrix);
  }
  if (issues.length === 0) {
    process.stdout.write("audit-api-route-safety: ok\n");
  } else {
    process.stderr.write(
      `audit-api-route-safety: ${errors.length} error(s), ${warns.length} warning(s)\n`,
    );
    for (const i of issues) {
      const where = i.method ? `${i.file} [${i.method}]` : i.file;
      process.stderr.write(`  ${i.severity.toUpperCase()} ${i.id} — ${where}\n`);
      process.stderr.write(`    ${i.message}\n`);
    }
  }
}

if (!warnOnly && errors.length > 0) {
  process.exit(1);
}

process.exit(0);
