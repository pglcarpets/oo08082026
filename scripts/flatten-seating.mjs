#!/usr/bin/env node
/**
 * Flatten seating: move all chairs from leather/ and non-leather/ up to seating/
 * Then remove empty leather/ and non-leather/ folders.
 */
import { readdir, rename, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';

const SEATING = 'site/public/assets/catalog/seating';

async function main() {
  let moved = 0;
  
  for (const sub of ['leather', 'non-leather']) {
    const subDir = join(SEATING, sub);
    let entries;
    try {
      entries = await readdir(subDir, { withFileTypes: true });
    } catch { continue; }
    
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const src = join(subDir, e.name);
      const dst = join(SEATING, e.name);
      
      // Check if destination already exists
      try {
        await stat(dst);
        console.log(`SKIP (exists): ${e.name}`);
        continue;
      } catch { /* doesn't exist, safe to move */ }
      
      try {
        await rename(src, dst);
        console.log(`MOVE: ${sub}/${e.name} → ${e.name}`);
        moved++;
      } catch (err) {
        console.log(`FAIL: ${sub}/${e.name} — ${err.code || err.message}`);
      }
    }
    
    // Remove empty sub-folder
    try {
      await rm(subDir, { recursive: true });
      console.log(`RMDIR: ${sub}/`);
    } catch (e) {
      console.log(`RMDIR FAIL: ${sub}/ — ${e.message}`);
    }
  }
  
  console.log(`\nDone. Moved ${moved} chair folders.`);
}

main().catch(e => { console.error(e); process.exit(1); });
