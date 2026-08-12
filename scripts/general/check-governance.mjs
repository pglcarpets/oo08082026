/**
 * Governance gate — the rules in docs/governance/rules.md that are not covered by
 * an existing checker.
 *
 *   D2  no `npx` in package scripts            (resolves outside the lockfile)
 *   D3  overrides live in pnpm-workspace.yaml  (package.json overrides are not read)
 *   D6  no gate-reachable script needs pwsh/python (CI is ubuntu-latest)
 *   P2  script-src does not permit 'unsafe-inline' in production
 *   P4  every migration has a rollback path
 *   S2  no report files outside the named deliverables
 *
 * Each sub-check ratchets against a recorded baseline (governance §7): it fails
 * when the count rises, not on the existing debt.
 *
 *   node scripts/general/check-governance.mjs
 *   node scripts/general/check-governance.mjs --update
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const BASELINE_FILE = path.join(ROOT, "config/quality/governance-baseline.json");

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const scripts = pkg.scripts || {};

/** Scripts CI actually runs, plus everything they transitively call. */
function gateReachable() {
  const workflowDir = path.join(ROOT, ".github/workflows");
  const ci = fs.existsSync(workflowDir)
    ? fs
        .readdirSync(workflowDir)
        .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
        .map((f) => fs.readFileSync(path.join(workflowDir, f), "utf8"))
        .join("\n")
    : "";

  const seen = new Set();
  const queue = Object.keys(scripts).filter((n) =>
    new RegExp(`pnpm run ${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`).test(ci),
  );

  while (queue.length) {
    const name = queue.shift();
    if (seen.has(name)) continue;
    seen.add(name);
    const body = scripts[name] || "";
    for (const other of Object.keys(scripts)) {
      if (seen.has(other)) continue;
      if (new RegExp(`pnpm run ${other.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`).test(body)) {
        queue.push(other);
      }
    }
  }
  return seen;
}

const reachable = gateReachable();
const checks = {};

// D2 — npx anywhere in package scripts
checks.D2_npx = Object.entries(scripts)
  .filter(([, body]) => /\bnpx\b/.test(body))
  .map(([name]) => name);

// D3 — a package.json overrides block pnpm does not read
checks.D3_dead_overrides = pkg.overrides ? ["package.json#overrides"] : [];

// D6 — pwsh/python inside a CI-reachable chain
checks.D6_nonportable_in_gate = [...reachable].filter((n) => /\b(pwsh|python)\b/.test(scripts[n] || ""));

// P2 — 'unsafe-inline' in script-src, production path
checks.P2_csp_unsafe_inline = [];
{
  const proxy = path.join(ROOT, "site/proxy.ts");
  if (fs.existsSync(proxy)) {
    fs.readFileSync(proxy, "utf8").split("\n").forEach((ln, i) => {
      if (/script-src/.test(ln) && /'unsafe-inline'/.test(ln)) {
        checks.P2_csp_unsafe_inline.push(`site/proxy.ts:${i + 1}`);
      }
    });
  }
}

// P4 — migrations with no rollback path
checks.P4_migration_no_rollback = [];
for (const dir of ["site/platform/supabase/migrations", "site/platform/supabase/migrations.admin"]) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  for (const f of fs.readdirSync(abs).filter((n) => n.endsWith(".sql"))) {
    const body = fs.readFileSync(path.join(abs, f), "utf8");
    if (!/--\s*rollback|^\s*--\s*down\b/im.test(body)) {
      checks.P4_migration_no_rollback.push(`${dir}/${f}`);
    }
  }
}

// S2 — stray *report* files under plans/ (not the programme plan set).
// Programme plans are pinned by `check:plans-purity` (flat MD only; audits → agent-reports).
const ROOT_PLAN_DOCS = new Set([
  "oo-ux-shell-program.md",
  "phase1-mobile-app-shell.md",
]);
const PLAN_ROOT_OK = (name) => name === "README.md" || ROOT_PLAN_DOCS.has(name);
const REPORT_LIKE = /(report|handover|outstanding|finish-plan|completion-contract)/i;

const plansDir = path.join(ROOT, "plans");
const plansDirExists = fs.existsSync(plansDir);
checks.S2_stray_report = plansDirExists
  ? fs
  .readdirSync(plansDir, { withFileTypes: true })
  .filter((e) => {
    if (e.isDirectory()) return false;
    if (!e.name.endsWith(".md")) return false;
    if (PLAN_ROOT_OK(e.name)) return false;
    return REPORT_LIKE.test(e.name);
  })
  .map((e) => `plans/${e.name}`)
  .concat(
    fs
      .readdirSync(plansDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .flatMap((e) => {
        const sub = path.join(plansDir, e.name);
        return fs.existsSync(sub)
          ? fs
              .readdirSync(sub)
              .filter((n) => n.endsWith(".md") && REPORT_LIKE.test(n))
              .map((n) => `plans/${e.name}/${n}`)
          : [];
      }),
  )
  : [];

const counts = Object.fromEntries(Object.entries(checks).map(([k, v]) => [k, v.length]));

if (process.argv.includes("--update")) {
  fs.mkdirSync(path.dirname(BASELINE_FILE), { recursive: true });
  fs.writeFileSync(BASELINE_FILE, JSON.stringify(counts, null, 1) + "\n");
  console.log("check:governance baseline recorded —", JSON.stringify(counts));
  process.exit(0);
}

if (!fs.existsSync(BASELINE_FILE)) {
  console.error("check:governance FAIL: no baseline. Run with --update to record one.");
  process.exit(1);
}

const baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, "utf8"));
const failures = [];

for (const [rule, items] of Object.entries(checks)) {
  const was = baseline[rule] ?? 0;
  if (items.length > was) {
    failures.push(
      `  ${rule}: ${was} -> ${items.length}\n` +
        items.slice(0, 10).map((i) => `      ${i}`).join("\n"),
    );
  }
}

if (failures.length) {
  console.error("check:governance FAIL: violations increased\n" + failures.join("\n"));
  process.exit(1);
}

const open = Object.entries(counts).filter(([, n]) => n > 0);
console.log(
  "check:governance OK — " +
    (open.length ? open.map(([k, n]) => `${k}=${n}`).join(" ") + " (all at or below baseline)" : "no violations"),
);
