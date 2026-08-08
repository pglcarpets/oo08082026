/**
 * Gate: AGENTS.md stays the process floor and points at live facts.
 * Exit 0 = clean. Exit 1 = violations.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const agentsPath = path.join(root, "AGENTS.md");
const violations = [];

if (!fs.existsSync(agentsPath)) {
  violations.push("missing: AGENTS.md");
} else {
  const text = fs.readFileSync(agentsPath, "utf8");

  // `README.md`, not `Readme.md` — Windows resolves either, Linux CI does not.
  const requiredAuthorities = [
    "AGENTS.md",
    "README.md",
    "Testing-handbook.md",
    "Failures.md",
  ];
  for (const name of requiredAuthorities) {
    if (!fs.existsSync(path.join(root, name))) {
      violations.push(`root authority missing: ${name}`);
    }
    if (!text.includes(name)) {
      violations.push(`AGENTS.md must reference root authority: ${name}`);
    }
  }

  // Kebab-case filenames as shipped in Agents/ and routed from the AGENTS.md
  // handbook table. The pre-rename `NN — Title.md` form is gone; do not
  // reintroduce it here without renaming the files too.
  const handbooks = [
    ["01-standard.md", "Standard"],
    ["02-testing.md", "Testing"],
    ["03-browser.md", "Browser"],
    ["04-failures.md", "Failures"],
    ["05-documentation.md", "Documentation"],
    ["06-architecture.md", "Architecture"],
    ["07-css.md", "CSS"],
  ];
  for (const [file, label] of handbooks) {
    const abs = path.join(root, "Agents", file);
    if (!fs.existsSync(abs)) {
      violations.push(`handbook missing: Agents/${file}`);
    }
    if (!text.includes(file) && !text.includes(`Agents/${file}`)) {
      violations.push(`AGENTS.md must route ${label} → Agents/${file}`);
    }
  }

  const requiredPhrases = [
    "User Wins",
    "check:layout",
    "localhost:3000",
    "site/",
    "pnpm",
    "Never create worktrees",
  ];
  for (const phrase of requiredPhrases) {
    if (!text.includes(phrase)) {
      violations.push(`AGENTS.md missing required phrase: ${phrase}`);
    }
  }
}

if (violations.length) {
  console.error(
    "check:agents-md FAIL:\n" +
      violations.map((item) => `  ${item}`).join("\n"),
  );
  process.exit(1);
}

console.log("check:agents-md OK");
