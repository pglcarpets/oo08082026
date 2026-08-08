#!/usr/bin/env node
/**
 * Delete duplicate images:
 * - Exact byte-identical (from prune-review-plan.json)
 * - Resolution duplicates (from resolution-dups.json)
 * 
 * Keeps the largest file per group. Skips flagship/ folder.
 */
import { readFile } from 'node:fs/promises';
import { unlink, stat } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = 'site/public/assets';
const CATALOG_ROOT = 'site/public/assets/catalog';

function normalize(p) { return p.replace(/\\/g, '/'); }

async function deleteFile(path) {
  try {
    await unlink(path);
    return true;
  } catch (e) {
    console.error(`  FAIL: ${path} — ${e.message}`);
    return false;
  }
}

async function main() {
  let deleted = 0;
  let savedBytes = 0;
  
  // 1. Exact duplicates (prune-review-plan.json)
  console.log('Processing exact duplicates...');
  const prunePlan = JSON.parse(await readFile('results/asset-cutover/prune-review-plan.json', 'utf-8'));
  
  for (const group of prunePlan.groups) {
    // Skip if any path is in flagship/
    if (group.paths.some(p => p.includes('flagship/'))) continue;
    
    // Get sizes for each path
    const withSize = [];
    for (const p of group.paths) {
      const fullPath = join(ROOT, p);
      try {
        const s = await stat(fullPath);
        withSize.push({ path: p, size: s.size });
      } catch { /* file may not exist */ }
    }
    if (withSize.length < 2) continue;
    
    // Sort by size desc, keep first
    const sorted = [...withSize].sort((a, b) => b.size - a.size);
    const toDelete = sorted.slice(1);
    
    for (const file of toDelete) {
      const fullPath = join(ROOT, file.path);
      if (await deleteFile(fullPath)) {
        deleted++;
        savedBytes += file.size;
        console.log(`  DEL: ${file.path} (${(file.size/1024).toFixed(1)} KB)`);
      }
    }
  }
  
  // 2. Resolution duplicates (resolution-dups.json)
  console.log('\nProcessing resolution duplicates...');
  const resDups = JSON.parse(await readFile('results/asset-cutover/resolution-dups.json', 'utf-8'));
  
  for (const group of resDups.data) {
    // Skip if any member is in flagship/
    if (group.members.some(m => normalize(m.path).includes('flagship/'))) continue;
    
    // Already sorted by size desc in the script that generated it
    const _keep = group.members[0];
    const toDelete = group.members.slice(1);
    
    for (const file of toDelete) {
      const fullPath = join(CATALOG_ROOT, normalize(file.path));
      try {
        const s = await stat(fullPath);
        if (await deleteFile(fullPath)) {
          deleted++;
          savedBytes += s.size;
          console.log(`  DEL: ${normalize(file.path)} (${file.width}×${file.height}, ${(s.size/1024).toFixed(1)} KB)`);
        }
      } catch (e) {
        // File might have been deleted as exact dup already
        if (e.code !== 'ENOENT') {
          console.error(`  FAIL: ${file.path} — ${e.message}`);
        }
      }
    }
  }
  
  console.log(`\nDone. Deleted ${deleted} files, saved ${(savedBytes/1024/1024).toFixed(2)} MB.`);
}

main().catch(e => { console.error(e); process.exit(1); });
