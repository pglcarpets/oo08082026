/**
 * Gate: Agents/ handbooks stay complete and pure (no ad-hoc dumps).
 * Exit 0 = clean. Exit 1 = violations.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const agentsDir = path.join(root, "Agents");
const violations = [];

// Kebab-case filenames as shipped and as routed from AGENTS.md. The pre-rename
// `NN — Title.md` form is retired — keep this list in step with
// check-agents-md.mjs and the AGENTS.md handbook table.
const required = [
  "01-standard.md",
  "02-testing.md",
  "03-browser.md",
  "04-failures.md",
  "05-documentation.md",
  "06-architecture.md",
  "07-css.md",
  "INDEX.md",
];

if (!fs.existsSync(agentsDir) || !fs.statSync(agentsDir).isDirectory()) {
  violations.push("missing: Agents/");
} else {
  for (const name of required) {
    const abs = path.join(agentsDir, name);
    if (!fs.existsSync(abs)) {
      violations.push(`missing: Agents/${name}`);
    }
  }

  const entries = fs.readdirSync(agentsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      violations.push(`extra directory under Agents/: ${entry.name}`);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith(".md")) {
      violations.push(`non-Markdown under Agents/: ${entry.name}`);
    }
  }
}

if (violations.length) {
  console.error(
    "check:agents-folder FAIL:\n" +
      violations.map((item) => `  ${item}`).join("\n"),
  );
  process.exit(1);
}

console.log("check:agents-folder OK");
