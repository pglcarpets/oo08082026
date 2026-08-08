#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
const wired = new Set();

for (const cmd of Object.values(pkg.scripts)) {
  for (const m of String(cmd).matchAll(/scripts[\\/][^\s'"]+/g)) {
    wired.add(m[0].replace(/\\/g, "/"));
  }
}

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (["node_modules", "lib"].includes(e.name)) continue;
      walk(p, acc);
    } else if (/\.(mts|cjs|ts|mjs|js|py|ps1|sh)$/.test(e.name)) {
      acc.push(path.relative(path.join(repoRoot, "scripts"), p).replace(/\\/g, "/"));
    }
  }
  return acc;
}

const files = walk(path.join(repoRoot, "scripts")).sort();
const isWired = (rel) =>
  Array.from(wired).some(
    (w) => rel === w.replace("scripts/", "") || w.endsWith(rel) || rel.endsWith(w.replace("scripts/", "")),
  );

console.log(JSON.stringify(files.filter((rel) => !isWired(rel)), null, 2));
