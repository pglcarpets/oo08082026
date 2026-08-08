#!/usr/bin/env node
/**
 * Organize seating chairs into 4 category subfolders: mesh, leather, visitor, cafe.
 * Chairs are currently flat under seating/. Move each into its category folder.
 */
import { readdir, rename, mkdir, cp, rm } from 'node:fs/promises';
import { join } from 'node:path';

const SEATING = 'site/public/assets/catalog/seating';

// Category mapping (slug suffix after oando-seating--)
const CATEGORIES = {
  mesh: ['x-mesh', 'logica', 'flex', 'mozio'],
  leather: ['grace', 'moonlight', 'pinnacle', 'rider'],
  visitor: ['arvo', 'breeze', 'brim', 'canaret', 'copse', 'crotch', 'crox', 'dive', 'ember', 'flare', 'flip', 'fynn', 'leaf', 'lisbo', 'nordic', 'phoenix', 'revoq', 'rio', 'rock', 'smile', 'snap', 'solace', 'spino', 'sway', 'toro', 'zilo'],
  cafe: ['cafe-sleek', 'caneva', 'caneva-high', 'casca', 'fluid-x', 'fusion', 'halo', 'lexus', 'myel', 'nuvic', 'orbit', 'sullion'],
};

async function main() {
  // Build reverse: slug -> category
  const slugToCat = new Map();
  for (const [cat, slugs] of Object.entries(CATEGORIES)) {
    for (const slug of slugs) slugToCat.set(slug, cat);
  }

  // Create category folders
  for (const cat of Object.keys(CATEGORIES)) {
    await mkdir(join(SEATING, cat), { recursive: true });
  }

  const entries = await readdir(SEATING, { withFileTypes: true });
  let moved = 0;
  let unclassified = [];

  for (const e of entries) {
    if (!e.isDirectory()) continue;
    if (Object.keys(CATEGORIES).includes(e.name)) continue; // skip the category folders themselves

    // Extract slug: oando-seating--<slug>
    const match = e.name.match(/^oando-seating--(.+)$/);
    if (!match) { unclassified.push(e.name); continue; }
    const slug = match[1];

    const cat = slugToCat.get(slug);
    if (!cat) { unclassified.push(e.name); continue; }

    const src = join(SEATING, e.name);
    const dst = join(SEATING, cat, e.name);
    try {
      // Try rename first (fast), fall back to copy+delete
      try {
        await rename(src, dst);
      } catch {
        await cp(src, dst, { recursive: true });
        await rm(src, { recursive: true, force: true });
      }
      console.log(`MOVE: ${e.name} → ${cat}/`);
      moved++;
    } catch (err) {
      console.log(`FAIL: ${e.name} → ${cat}/ — ${err.code || err.message}`);
    }
  }

  console.log(`\nDone. Moved ${moved} chairs into categories.`);
  if (unclassified.length) {
    console.log(`Unclassified (left in place): ${unclassified.join(', ')}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });