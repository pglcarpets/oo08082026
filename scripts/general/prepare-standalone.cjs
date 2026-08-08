/**
 * Copy .next/static and public/ into the Next.js standalone output directory.
 * Required when next.config sets output: "standalone" (DigitalOcean / bare-metal).
 *
 * Product app lives under site/; monorepo scripts/ at repo root.
 */
const fs = require("node:fs");
const path = require("node:path");

const monorepoRoot = path.join(__dirname, "../..");
const siteRoot = path.join(monorepoRoot, "site");
const standaloneRoot = path.join(siteRoot, ".next", "standalone");
const standaloneSiteRoot = path.join(standaloneRoot, "site");
const staticSrc = path.join(siteRoot, ".next", "static");
const staticDest = path.join(standaloneRoot, ".next", "static");
const staticSiteDest = path.join(standaloneSiteRoot, ".next", "static");
const publicSrc = path.join(siteRoot, "public");
const publicDest = path.join(standaloneRoot, "public");
const publicSiteDest = path.join(standaloneSiteRoot, "public");

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    return;
  }
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(from, to);
    } else {
      fs.copyFileSync(from, to);
    }
  }
}

if (!fs.existsSync(standaloneRoot)) {
  console.log(
    "[prepare-standalone] No site/.next/standalone output — skipping (not a standalone build).",
  );
  process.exit(0);
}

copyRecursive(staticSrc, staticDest);
copyRecursive(publicSrc, publicDest);
if (fs.existsSync(standaloneSiteRoot)) {
  copyRecursive(staticSrc, staticSiteDest);
  copyRecursive(publicSrc, publicSiteDest);
}

// Copy generate-svg tree into standalone for runtime dynamic import.
const genSrc = path.join(monorepoRoot, "scripts", "generate-svg.mjs");
const fixSrc = path.join(monorepoRoot, "scripts", "generate-svg", "_fixtures");
const copyGen = (base) => {
  if (!fs.existsSync(genSrc)) return;
  const sDest = path.join(base, "scripts", "generate-svg.mjs");
  fs.mkdirSync(path.dirname(sDest), { recursive: true });
  fs.copyFileSync(genSrc, sDest);
  if (fs.existsSync(fixSrc)) {
    copyRecursive(fixSrc, path.join(base, "scripts", "generate-svg", "_fixtures"));
  }
};
copyGen(standaloneRoot);
if (fs.existsSync(standaloneSiteRoot)) copyGen(standaloneSiteRoot);
console.log("[prepare-standalone] Copied static assets into site/.next/standalone");
