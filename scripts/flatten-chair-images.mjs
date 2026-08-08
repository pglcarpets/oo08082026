#!/usr/bin/env node
/**
 * Flatten every catalog product folder: move all images from subdirectories
 * (gallery/, detail/, models/, etc.) up to the product folder root, then delete
 * the now-empty subdirs. Applies to the whole catalog tree.
 *
 * A "product folder" matches oando-<family>--<slug>.
 */
import { readdir, rename, rm, stat, copyFile } from 'node:fs/promises';
import { join, basename } from 'node:path';

const CATALOG = 'site/public/assets/catalog';
const IMG_EXTS = new Set(['.webp', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.avif']);

function extname(name) {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.substring(i).toLowerCase() : '';
}

async function findImages(dir, out) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      await findImages(full, out);
    } else if (IMG_EXTS.has(extname(e.name))) {
      out.push(full);
    }
  }
}

async function findProductFolders(dir, out) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const full = join(dir, e.name);
    if (/^oando-.+--.+$/.test(e.name)) {
      out.push(full);
    } else {
      await findProductFolders(full, out);
    }
  }
}

async function main() {
  const products = [];
  await findProductFolders(CATALOG, products);
  console.log(`Found ${products.length} product folders`);

  let moved = 0;
  let removedDirs = 0;

  for (const product of products) {
    const images = [];
    await findImages(product, images);

    for (const img of images) {
      const name = basename(img);
      const dest = join(product, name);
      // Skip if file already exists at root
      try {
        await stat(dest);
        continue;
      } catch { /* ok to move */ }
      try {
        await rename(img, dest);
        moved++;
      } catch {
        try {
          await copyFile(img, dest);
          await rm(img, { force: true });
          moved++;
        } catch (e) {
          console.log(`  FAIL move ${img}: ${e.message}`);
        }
      }
    }

    // Remove now-empty subdirs inside product
    let entries;
    try { entries = await readdir(product, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      if (e.isDirectory()) {
        const subDir = join(product, e.name);
        try {
          await rm(subDir, { recursive: true, force: true });
          removedDirs++;
          console.log(`RMDIR: ${basename(product)}/${e.name}`);
        } catch (e) {
          console.log(`  FAIL rmdir ${subDir}: ${e.message}`);
        }
      }
    }
  }

  console.log(`\nDone. Moved ${moved} images to product roots, removed ${removedDirs} subdirs.`);
}

main().catch(e => { console.error(e); process.exit(1); });