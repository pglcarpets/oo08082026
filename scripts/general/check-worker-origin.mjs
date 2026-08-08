#!/usr/bin/env node
/**
 * check-worker-origin.mjs
 *
 * Verifies the Cloudflare Worker origin config matches the live Vercel project:
 *   1. Reads VERCEL_ORIGIN from workers/oando-worker-proxy/wrangler.toml
 *   2. Probes the Worker via https://oando.co.in/<probe-path>
 *   3. Compares x-oando-proxy header (must be cloudflare-worker) and the
 *      response against a direct probe of the configured VERCEL_ORIGIN
 *   4. Exits non-zero on any drift.
 *
 * Usage: node scripts/general/check-worker-origin.mjs [--probe /ooplanner/]
 *
 * Added 2026-08-07 (ops-deploy-plan.md #5).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const WRANGLER = path.join(ROOT, "workers/oando-worker-proxy/wrangler.toml");
const APEX = "https://oando.co.in";

const argv = process.argv.slice(2);
let probePath = "/ooplanner/";
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--probe" && argv[i + 1]) { probePath = argv[++i]; }
}

function readWranglerOrigin() {
  if (!fs.existsSync(WRANGLER)) {
    process.stderr.write(`check-worker-origin: missing ${path.relative(ROOT, WRANGLER)}\n`);
    process.exit(1);
  }
  const src = fs.readFileSync(WRANGLER, "utf8");
  // [vars] block, VERCEL_ORIGIN = "..."
  const m = src.match(/VERCEL_ORIGIN\s*=\s*"([^"]+)"/);
  if (!m) {
    process.stderr.write("check-worker-origin: VERCEL_ORIGIN not found in wrangler.toml\n");
    process.exit(1);
  }
  return m[1].replace(/\/+$/, "");
}

async function head(url) {
  const r = await fetch(url, { method: "HEAD", redirect: "manual" });
  return { status: r.status, headers: Object.fromEntries(r.headers.entries()) };
}

const origin = readWranglerOrigin();
const apexUrl = `${APEX}${probePath}`;
const originUrl = `${origin}${probePath}`;

console.log(`check-worker-origin: VERCEL_ORIGIN=${origin}`);
console.log(`check-worker-origin: probe=${probePath}`);

let apexResp, originResp;
try { apexResp = await head(apexUrl); } catch (e) { console.error(`apex fetch failed: ${e.message}`); process.exit(1); }
try { originResp = await head(originUrl); } catch (e) { console.error(`origin fetch failed: ${e.message}`); process.exit(1); }

const errors = [];

if (apexResp.headers["x-oando-proxy"] !== "cloudflare-worker") {
  errors.push(`apex missing x-oando-proxy: cloudflare-worker (got "${apexResp.headers["x-oando-proxy"]}")`);
}
if (originResp.headers["server"] !== "Vercel") {
  errors.push(`origin server not Vercel (got "${originResp.headers["server"]}")`);
}
if (apexResp.status !== originResp.status) {
  errors.push(`status drift: apex=${apexResp.status}, origin=${originResp.status}`);
}
// Same matched path on both
const aMatch = apexResp.headers["x-matched-path"];
const oMatch = originResp.headers["x-matched-path"];
if (aMatch && oMatch && aMatch !== oMatch) {
  errors.push(`x-matched-path drift: apex=${aMatch}, origin=${oMatch}`);
}

if (errors.length) {
  console.error("check-worker-origin: FAILED");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log("check-worker-origin: OK");
process.exit(0);
