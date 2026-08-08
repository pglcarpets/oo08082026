#!/usr/bin/env node
/**
 * Verify CSS @import paths under site/focss/ resolve with Tailwind's CSS rules.
 */
import enhancedResolve from "enhanced-resolve";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  process.env.FOCSS_IMPORT_ROOT ?? path.dirname(fileURLToPath(import.meta.url)),
  process.env.FOCSS_IMPORT_ROOT ? "." : "../..",
);
const focssRoot = path.join(root, "site", "focss");
const importRe = /@import\s+(?:url\(\s*)?(?:["']([^"']+)["']|([^\s;)]+))\s*\)?/g;

const failures = [];
const cssResolver = enhancedResolve.ResolverFactory.createResolver({
  fileSystem: new enhancedResolve.CachedInputFileSystem(fs, 4_000),
  useSyncFileSystemCalls: true,
  extensions: [".css"],
  mainFields: ["style"],
  conditionNames: ["style"],
  modules: [
    "node_modules",
    ...(process.env.NODE_PATH?.split(path.delimiter) ?? []),
  ],
});

function resolveImport(fromFile, spec) {
  try {
    const target = cssResolver.resolveSync({}, path.dirname(fromFile), spec);
    return fs.statSync(target).isFile();
  } catch {
    return false;
  }
}

function walk(dir) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name.name);
    if (name.isDirectory()) {
      walk(full);
      continue;
    }
    if (!name.name.endsWith(".css")) continue;
    const text = fs.readFileSync(full, "utf8");
    let match;
    while ((match = importRe.exec(text)) !== null) {
      const spec = match[1] ?? match[2];
      if (!resolveImport(full, spec)) {
        failures.push(`${path.relative(root, full)}: cannot resolve ${spec}`);
      }
    }
  }
}

walk(focssRoot);

if (failures.length) {
  console.error("verify-focss-imports: failed\n" + failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}
console.log("verify-focss-imports: ok");
