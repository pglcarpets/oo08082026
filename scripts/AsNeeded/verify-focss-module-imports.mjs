#!/usr/bin/env node
/**
 * FOCSS CSS-module @import chain verifier.
 * - Resolves relative @import in *.module.css under site/focss/
 * - Detects import cycles
 * - Emits stable graph hash for CI regression
 *
 * Exit 0 = ok.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const focssRoot = path.join(repoRoot, "site", "focss");
const importRe = /@import\s+["']([^"']+)["']/g;

/** @type {Map<string, string[]>} */
const graph = new Map();

function walkModules(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walkModules(full, acc);
      continue;
    }
    if (ent.name.endsWith(".module.css")) acc.push(full);
  }
  return acc;
}

function relKey(abs) {
  return path.relative(focssRoot, abs).replace(/\\/g, "/");
}

function resolveImport(fromFile, spec) {
  if (!spec.startsWith(".")) return null;
  const base = path.dirname(fromFile);
  const direct = path.normalize(path.join(base, spec));
  if (fs.existsSync(direct)) return direct;
  if (fs.existsSync(`${direct}.css`)) return `${direct}.css`;
  return null;
}

const modules = walkModules(focssRoot);
const failures = [];

for (const file of modules) {
  const key = relKey(file);
  const imports = [];
  const text = fs.readFileSync(file, "utf8");
  let match;
  while ((match = importRe.exec(text)) !== null) {
    const spec = match[1];
    const resolved = resolveImport(file, spec);
    if (!resolved) {
      failures.push(`${key}: cannot resolve ${spec}`);
      continue;
    }
    if (!resolved.endsWith(".module.css")) {
      failures.push(`${key}: @import ${spec} must target another .module.css`);
      continue;
    }
    imports.push(relKey(resolved));
  }
  graph.set(key, imports.sort());
}

/** @type {string[]} */
const stack = [];
/** @type {Set<string>} */
const visiting = new Set();
/** @type {Set<string>} */
const visited = new Set();
/** @type {string[]} */
const cycles = [];

function dfs(node) {
  if (visited.has(node)) return;
  if (visiting.has(node)) {
    const start = stack.indexOf(node);
    cycles.push([...stack.slice(start), node].join(" -> "));
    return;
  }
  visiting.add(node);
  stack.push(node);
  for (const next of graph.get(node) ?? []) dfs(next);
  stack.pop();
  visiting.delete(node);
  visited.add(node);
}

for (const node of [...graph.keys()].sort()) dfs(node);

const hashLines = [...graph.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([file, imports]) => `${file}=>${imports.join(",")}`);
const graphHash = crypto
  .createHash("sha256")
  .update(hashLines.join("\n"))
  .digest("hex");

const report = {
  ok: failures.length === 0 && cycles.length === 0,
  moduleCount: modules.length,
  importEdgeCount: hashLines.reduce((n, line) => n + (line.includes("=>") && line.split("=>")[1] ? line.split("=>")[1].split(",").filter(Boolean).length : 0), 0),
  graphHash,
  modulesWithImports: hashLines.filter((l) => l.includes("=>") && l.split("=>")[1]).map((l) => l.split("=>")[0]),
  failures,
  cycles,
};

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
