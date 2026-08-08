import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

for (const rel of ["site/results", "site/test-results"]) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) continue;
  fs.rmSync(abs, { recursive: true, force: true });
  console.log(`prune-site-dumps: removed ${rel}`);
}
