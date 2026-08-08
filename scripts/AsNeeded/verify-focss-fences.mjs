/**
 * FOCSS layout-entry fences.
 * Exit 0 = ok.
 * Product foundation inlined into admin/planner/studio entries (no features/product/).
 */
import fs from "node:fs";
import path from "node:path";

const focss = path.resolve("site/focss");
const read = (rel) => fs.readFileSync(path.join(focss, rel), "utf8");

const fails = [];
const fail = (msg) => fails.push(msg);

const root = read("base/root.css");
const site = read("site/entry.css");
const runtime = read("base/runtime.css");
const planner = read("planner/entry.css");
const studio = read("studio/entry.css");
const admin = read("admin/entry.css");

const importSpecs = (src) =>
  [...src.matchAll(/@import\s+["']([^"']+)["']/g)].map((m) => m[1]);

if (/@source\b/.test(root) || /@source\b/.test(site) || /@source\b/.test(admin) || /@source\b/.test(planner) || /@source\b/.test(studio)) {
  fail("raw @source in root/site/product entries — must live only in base/scan.css");
}

const rootImports = importSpecs(root);
const siteImportList = importSpecs(site);
const runtimeImports = importSpecs(runtime);
const plannerImportList = importSpecs(planner);
const studioImportList = importSpecs(studio);
const adminImportList = importSpecs(admin);

const isDocument = (s) => /document\.css/.test(s);

const productBaseImports = [
  "../base/scan.css",
  "../base/runtime.css",
  "../base/index.css",
  "../base/document.css",
];

function requireProductBase(label, list) {
  for (const expected of productBaseImports) {
    if (!list.includes(expected)) {
      fail(`${label} must import ${expected}`);
    }
  }
  if (list.some((s) => s.includes("shadcn") || s.includes("features/product"))) {
    fail(`${label} must not import shadcn or features/product`);
  }
  const docIdx = list.findIndex(isDocument);
  const firstLocal = list.findIndex((s) => s.startsWith("./"));
  if (docIdx < 0) {
    fail(`${label} must import ../base/document.css`);
  } else if (firstLocal >= 0 && docIdx > firstLocal) {
    fail(`${label}: ../base/document.css must come before zone-local sheets`);
  }
}

if (siteImportList.some((s) => s.includes("shadcn"))) {
  fail("site/entry.css must not import shadcn");
}
if (rootImports.some((s) => /runtime|document/.test(s))) {
  fail("base/root.css must not import runtime or document");
}

requireProductBase("admin/entry.css", adminImportList);
requireProductBase("studio/entry.css", studioImportList);

// Planner is self-contained: palette + own sheets only.
const plannerNeeds = [
  "tailwindcss",
  "../base/tokens/palette.css",
  "./base/palette.css",
  "./base/semantic.css",
  "./base/layout.css",
  "./base/document.css",
];
for (const expected of plannerNeeds) {
  if (!plannerImportList.includes(expected)) {
    fail(`planner/entry.css must import ${expected}`);
  }
}
if (
  plannerImportList.some((s) =>
    [
      "../base/scan.css",
      "../base/runtime.css",
      "../base/index.css",
      "../base/document.css",
    ].includes(s),
  )
) {
  fail("planner/entry.css must not import full product base (scan/runtime/index/document)");
}
if (plannerImportList.some((s) => s.includes("shadcn") || s.includes("admin/"))) {
  fail("planner/entry.css must not import shadcn or admin");
}

if (runtimeImports.some(isDocument)) {
  fail("base/runtime.css must not import document");
}
if (fs.existsSync(path.join(focss, "entries"))) {
  fail("site/focss/entries/ must be removed");
}
if (fs.existsSync(path.join(focss, "base/product.css"))) {
  fail("base/product.css must not exist — product base is inlined in zone entries");
}
if (fs.existsSync(path.join(focss, "product"))) {
  fail("site/focss/product/ must be removed");
}
if (fs.existsSync(path.join(focss, "features/product"))) {
  fail("features/product/ must be removed — base is inlined in admin/planner/studio entries");
}
if (fs.existsSync(path.join(focss, "base/shadcn-theme.css"))) {
  fail("base/shadcn-theme.css must be removed (shadcn retired)");
}
if (fs.existsSync(path.join(focss, "features/shadcn"))) {
  fail("features/shadcn/ must be removed (shadcn pack retired)");
}

const docIdx = siteImportList.findIndex(isDocument);
const baseIdx = siteImportList.findIndex((s) => s.includes("../base/index.css") || s === "../base/index.css");
if (docIdx < 0 || baseIdx < 0 || docIdx >= baseIdx) {
  fail("site/entry.css: document.css must come before ../base/index.css");
}
if (!siteImportList.some((s) => s.includes("./components/index.css"))) {
  fail("site/entry.css must import ./components/index.css");
}
if (fs.existsSync(path.join(focss, "site/index.css"))) {
  fail("site/index.css must be removed — use site/entry.css only");
}
if (fs.existsSync(path.join(focss, "site/base"))) {
  fail("site/base/ must be removed — sheets live under site/");
}

if (fails.length) {
  console.error(JSON.stringify({ ok: false, fails }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true }, null, 2));
