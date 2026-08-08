#!/usr/bin/env node
/**
 * trim-catalog.mjs
 * Per product folder, keep at most MAX images (default 10), choosing the best
 * set: dedupe near-identical images (phash + hamming distance) keeping the
 * highest-resolution copy, then if still over MAX keep the highest-resolution
 * images first. Removed images are MOVED to a quarantine folder (reversible),
 * never hard-deleted.
 *
 * Usage:
 *   node scripts/trim-catalog.mjs --root "site/public/assets/catalog" [--max 10] [--dry-run]
 *   --dry-run  compute but do not move anything (writes a plan JSON)
 * Options: --families "seating,soft-seating"  (limit scope)
 *          --no-dedupe                        (skip phash dedup, just keep top-N by res)
 */

import { readdir, stat, writeFile, mkdir, rename, copyFile, rm } from 'node:fs/promises';
import { join, relative, extname, dirname, basename } from 'node:path';
import sharp from 'sharp';

const argRoot = process.argv.indexOf('--root');
const ROOT = argRoot >= 0 ? process.argv[argRoot + 1] : 'site/public/assets/catalog';
const argMax = process.argv.indexOf('--max');
const MAX = argMax >= 0 ? Number(process.argv[argMax + 1]) : 10;
const DRY = process.argv.includes('--dry-run');
const NO_DEDUPE = process.argv.includes('--no-dedupe');
const argFam = process.argv.indexOf('--families');
const FAMILIES = argFam >= 0
  ? process.argv[argFam + 1].split(',').map((s) => s.trim()).filter(Boolean)
  : null;

const QUARANTINE = join('results', 'asset-cutover', 'quarantine');
const PLAN_OUT = join('results', 'asset-cutover', 'trim-plan.json');

const IMG_EXTS = new Set(['.webp', '.jpg', '.jpeg', '.png', '.gif', '.avif']);

async function walk(dir, acc = []) {
  let ents;
  try { ents = await readdir(dir, { withFileTypes: true }); } catch { return acc; }
  for (const e of ents) {
    const full = join(dir, e.name);
    if (e.isDirectory()) await walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

// 8x8 grayscale average hash -> 64-bit hex string
async function phash(file) {
  try {
    const { data } = await sharp(file, { failOn: 'none' })
      .resize(8, 8, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    const avg = sum / data.length;
    let hash = 0n;
    for (let i = 0; i < data.length; i++) {
      if (data[i] > avg) hash |= (1n << BigInt(i));
    }
    return hash.toString(16).padStart(16, '0');
  } catch { return null; }
}

function hamming(a, b) {
  const x = BigInt('0x' + a) ^ BigInt('0x' + b);
  let n = 0;
  let v = x;
  while (v) { v &= v - 1n; n++; }
  return n;
}

async function imageInfo(file) {
  try {
    const [s, meta] = await Promise.all([stat(file), sharp(file, { failOn: 'none' }).metadata()]);
    return { size: s.size, width: meta.width || 0, height: meta.height || 0, area: (meta.width || 0) * (meta.height || 0) };
  } catch { return { size: 0, width: 0, height: 0, area: 0 }; }
}

async function releaseHandles() {
  sharp.cache(false);
  if (typeof global.gc === "function") global.gc();
  await new Promise((r) => setTimeout(r, 300));
}

async function main() {
  const all = (await walk(ROOT)).filter((f) => IMG_EXTS.has(extname(f).toLowerCase()));
  // group by product folder (parent dir)
  const byDir = new Map();
  for (const f of all) {
    const d = dirname(f);
    if (!byDir.has(d)) byDir.set(d, []);
    byDir.get(d).push(f);
  }

  let plan = { generated: new Date().toISOString(), root: ROOT, max: MAX, folders: [] };
  let totalRemoved = 0;
  let totalKept = 0;

  for (const [dir, files] of byDir) {
    const fam = relative(ROOT, dir).split(/[\\/]/)[0];
    if (FAMILIES && !FAMILIES.includes(fam)) continue;
    if (files.length <= MAX) continue;

    const info = new Map();
    for (const f of files) info.set(f, await imageInfo(f));

    let keep;
    if (NO_DEDUPE) {
      // keep top MAX by area
      const sorted = [...files].sort((a, b) => info.get(b).area - info.get(a).area || info.get(b).size - info.get(a).size);
      keep = sorted.slice(0, MAX);
    } else {
      // 1) compute hashes
      const hashed = [];
      for (const f of files) {
        const h = await phash(f);
        hashed.push({ file: f, hash: h });
      }
      // 2) cluster near-duplicates (hamming <= 10) keeping highest area
      const used = Array.from({ length: hashed.length }, () => false);
      const reps = [];
      for (let i = 0; i < hashed.length; i++) {
        if (used[i] || !hashed[i].hash) continue;
        const cluster = [];
        for (let j = i; j < hashed.length; j++) {
          if (!used[j] && hashed[j].hash && hamming(hashed[i].hash, hashed[j].hash) <= 10) {
            used[j] = true;
            cluster.push(hashed[j].file);
          }
        }
        // representative = highest area
        cluster.sort((a, b) => info.get(b).area - info.get(a).area || info.get(b).size - info.get(a).size);
        reps.push(cluster[0]);
      }
      // 3) if reps > MAX, keep top MAX by area
      reps.sort((a, b) => info.get(b).area - info.get(a).area || info.get(b).size - info.get(a).size);
      keep = reps.slice(0, MAX);
    }

    const keepSet = new Set(keep);
    const remove = files.filter((f) => !keepSet.has(f));
    if (remove.length === 0) continue;

    const rel = relative(ROOT, dir).split('\\').join('/');
    plan.folders.push({
      folder: rel,
      before: files.length,
      after: keep.length,
      removed: remove.length,
      kept: keep.map((f) => basename(f)),
      removed_files: remove.map((f) => basename(f)),
      removed_mb: +(remove.reduce((s, f) => s + info.get(f).size, 0) / 1048576).toFixed(2),
    });
    totalRemoved += remove.length;
    totalKept += keep.length;

    if (!DRY) {
      await releaseHandles();
      const base = join(QUARANTINE, rel);
      await mkdir(base, { recursive: true });
      for (const f of remove) {
        const dest = join(base, basename(f));
        try {
          await rename(f, dest);
        } catch {
          // cross-device / locked -> copy+remove
          try {
            await copyFile(f, dest);
            await rm(f, { force: true });
          } catch (e) {
            console.error(`  !! could not quarantine ${f}: ${e.message}`);
          }
        }
      }
    }
  }

  await mkdir(dirname(PLAN_OUT), { recursive: true });
  await writeFile(PLAN_OUT, JSON.stringify(plan, null, 2), 'utf8');

  const totMB = plan.folders.reduce((s, f) => s + f.removed_mb, 0);
  console.log(`\nFolders trimmed: ${plan.folders.length}`);
  console.log(`Images removed: ${totalRemoved} (~${totMB.toFixed(2)} MB)`);
  console.log(`Mode: ${DRY ? 'DRY-RUN (no moves)' : 'LIVE (moved to quarantine)'}`);
  console.log(`Plan: ${PLAN_OUT}`);
  if (!DRY) console.log(`Quarantine: ${QUARANTINE}`);
  for (const f of plan.folders) {
    console.log(`  ${f.folder}: ${f.before} -> ${f.after} (removed ${f.removed}, -${f.removed_mb}MB)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });