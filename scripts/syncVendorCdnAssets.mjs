#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_DIR = path.join(ROOT, "public");

export const VENDOR_DOWNLOADS = [
  {
    url: "https://cdn.jsdelivr.net/npm/@google/model-viewer@4.3.1/dist/model-viewer.min.js",
    dest: "cdn/vendor/model-viewer@4.3.1/model-viewer.min.js",
  },
  {
    url: "https://www.gstatic.com/draco/versioned/decoders/1.5.6/draco_decoder.js",
    dest: "cdn/vendor/draco/1.5.6/draco_decoder.js",
  },
  {
    url: "https://www.gstatic.com/draco/versioned/decoders/1.5.6/draco_decoder.wasm",
    dest: "cdn/vendor/draco/1.5.6/draco_decoder.wasm",
  },
  {
    url: "https://www.gstatic.com/draco/versioned/decoders/1.5.6/draco_wasm_wrapper.js",
    dest: "cdn/vendor/draco/1.5.6/draco_wasm_wrapper.js",
  },
  {
    url: "https://www.gstatic.com/basis-universal/versioned/2021-04-15-ba1c3e4/basis_transcoder.js",
    dest: "cdn/vendor/basis-universal/2021-04-15-ba1c3e4/basis_transcoder.js",
  },
  {
    url: "https://www.gstatic.com/basis-universal/versioned/2021-04-15-ba1c3e4/basis_transcoder.wasm",
    dest: "cdn/vendor/basis-universal/2021-04-15-ba1c3e4/basis_transcoder.wasm",
  },
];

export const REQUIRED_LOCAL_PATHS = [
  "cdn/vendor/model-viewer@4.3.1/model-viewer.min.js",
  "cdn/vendor/draco/1.5.6/draco_wasm_wrapper.js",
  "cdn/vendor/basis-universal/2021-04-15-ba1c3e4/basis_transcoder.wasm",
  // tldraw-assets removed 2026-07-09 — package + public/tldraw-assets gone (open3d destination)
  "cdn/lebombo_1k.hdr",
  "cdn/potsdamer_platz_1k.hdr",
];

export async function downloadFile(url, destPath, publicDir = PUBLIC_DIR, fetchImpl = fetch) {
  const absoluteDest = path.join(publicDir, destPath);
  const dir = path.dirname(absoluteDest);
  fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(absoluteDest) && fs.statSync(absoluteDest).size > 0) {
    console.log(`skip (exists): ${destPath}`);
    return true;
  }

  const response = await fetchImpl(url);
  if (!response.ok) {
    console.error(`failed: ${url} (${response.status})`);
    return false;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(absoluteDest, buffer);
  console.log(`downloaded: ${destPath}`);
  return true;
}

export function verifyRequiredPaths(publicDir = PUBLIC_DIR, required = REQUIRED_LOCAL_PATHS) {
  const missing = required.filter((relPath) => {
    const absolute = path.join(publicDir, relPath);
    return !fs.existsSync(absolute) || fs.statSync(absolute).size === 0;
  });

  if (missing.length > 0) {
    console.error("missing required local assets:");
    for (const relPath of missing) {
      console.error(`  - public/${relPath}`);
    }
    return { ok: false, missing };
  }

  console.log(`verified ${required.length} required local assets`);
  return { ok: true, missing: [] };
}

export async function syncVendorCdnAssets({
  publicDir = PUBLIC_DIR,
  downloads = VENDOR_DOWNLOADS,
  fetchImpl = fetch,
  download = true,
} = {}) {
  console.log("syncing vendor CDN assets into public/...");

  let ok = true;
  if (download) {
    for (const item of downloads) {
      const success = await downloadFile(item.url, item.dest, publicDir, fetchImpl);
      ok = ok && success;
    }
  }

  const verified = verifyRequiredPaths(publicDir);
  ok = verified.ok && ok;
  return { ok, missing: verified.missing };
}

async function main() {
  const result = await syncVendorCdnAssets();
  if (!result.ok) {
    process.exit(1);
  }
  console.log("vendor CDN sync complete");
}

function isDirectRun() {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return path.resolve(entry) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
}

if (isDirectRun()) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
