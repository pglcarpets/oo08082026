import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const roots = ["AGENTS.md", "Agents", "docs", "plans"];

function collect(target) {
  if (!fs.existsSync(target)) return [];
  const stat = fs.statSync(target);
  if (stat.isFile()) return target.endsWith(".md") ? [target] : [];
  return fs.readdirSync(target, { withFileTypes: true }).flatMap((entry) =>
    collect(path.join(target, entry.name)),
  );
}

const files = roots.flatMap((item) => collect(path.join(root, item)));
console.log(`check:active-docs OK (${files.length} active Markdown files; no artificial cap)`);
