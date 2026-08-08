import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const forbidden = [
  // Site is a live product track (plan/Site/). Buyer/UI/SEO are retired plan roots.
  /plan\/(Buyer|UI|SEO)\//i,
  /plan\/Security\//i,
  /plan\/[^\s)`]+\/PHASE-/i,
  /ayushdocs\//i,
  /agents-work\/reports/i,
  /results\/[^\s)`]+.*\b(pass|done|accepted)\b/i,
];

function collect(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(dir, entry.name);
    return entry.isDirectory() ? collect(absolute) : absolute.endsWith(".md") ? [absolute] : [];
  });
}

const violations = [];
for (const file of collect(path.join(root, "docs"))) {
  fs.readFileSync(file, "utf8").split(/\r?\n/).forEach((line, index) => {
    if (forbidden.some((pattern) => pattern.test(line))) {
      violations.push(`${path.relative(root, file)}:${index + 1}`);
    }
  });
}

if (violations.length) {
  console.error("check:docs-purity FAIL:\n" + violations.map((item) => `  ${item}`).join("\n"));
  process.exit(1);
}
console.log("check:docs-purity OK");
