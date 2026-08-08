import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { setTimeout } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const typesDir = path.join(root, "site", ".next", "types");
const requiredTypeFiles = ["cache-life.d.ts", "routes.d.ts", "validator.ts"];
const typegenWaitMs = 30_000;

if (fs.existsSync(typesDir)) {
  fs.rmSync(typesDir, { recursive: true, force: true });
  console.log("prune-stale-next-types: removed site/.next/types");
} else {
  console.log("prune-stale-next-types: nothing to remove");
}

const typegen = spawnSync(
  "pnpm",
  ["exec", "next", "typegen", "site"],
  { cwd: root, stdio: "inherit", shell: process.platform === "win32" },
);

if (typegen.status !== 0) {
  process.exit(typegen.status ?? 1);
}

const deadline = Date.now() + typegenWaitMs;
let missing = requiredTypeFiles;

while (Date.now() < deadline) {
  missing = requiredTypeFiles.filter(
    (name) => !fs.existsSync(path.join(typesDir, name)),
  );
  if (missing.length === 0) {
    console.log("prune-stale-next-types: next types ready");
    process.exit(0);
  }
  await setTimeout(50);
}

console.error(
  `prune-stale-next-types: timed out waiting for ${missing.join(", ")}`,
);
process.exit(1);
