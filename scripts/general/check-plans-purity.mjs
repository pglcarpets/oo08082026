import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const root = process.env.PLANS_PURITY_ROOT
  ? path.resolve(process.env.PLANS_PURITY_ROOT)
  : process.env.MONOREPO_ROOT
    ? path.resolve(process.env.MONOREPO_ROOT)
    : defaultRoot;
const planRoot = path.join(root, "plans");
const planLabel = "plans";
/**
 * `plans/` is flat Markdown programme plans only.
 * Audit reports live in `agent-reports/`; generated artifacts in `results/`.
 */
const requiredPlanDocs = ["README.md"];
const violations = [];

if (!fs.existsSync(planRoot)) {
  console.log(
    "check:plans-purity OK - no plans/ directory (programme plans retired)",
  );
  process.exit(0);
}

function collect(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(dir, entry.name);
    return entry.isDirectory() ? collect(absolute) : [path.relative(planRoot, absolute).replace(/\\/g, "/")];
  });
}

const allFiles = collect(planRoot);
const markdown = allFiles.filter((file) => file.endsWith(".md"));

for (const doc of requiredPlanDocs) {
  if (!markdown.includes(doc)) {
    violations.push(`missing: ${planLabel}/${doc}`);
  }
}

for (const f of markdown) {
  if (/(^|\/)(OUTSTANDING(-ITEMS)?|FINISH-PLAN|COMPLETION-CONTRACT|CHECKLIST|FEATURES)\.md$/i.test(f)) {
    violations.push(`retired plan doc name: ${planLabel}/${f}`);
  }
}

for (const entry of fs.readdirSync(planRoot, { withFileTypes: true })) {
  if (entry.isDirectory()) {
    violations.push(`unexpected plan subfolder: ${planLabel}/${entry.name}/ (plans/ is flat Markdown-only)`);
  }
}

for (const f of allFiles) {
  if (!f.endsWith(".md")) {
    violations.push(
      `unexpected non-Markdown file: ${planLabel}/${f} (plans/ is Markdown-only)`,
    );
  }
}

if (violations.length) {
  console.error("check:plans-purity FAIL:\n" + violations.map((item) => `  ${item}`).join("\n"));
  process.exit(1);
}

console.log(
  "check:plans-purity OK - README + programme plan docs, no subfolders or non-Markdown",
);
