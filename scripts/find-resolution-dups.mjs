#!/usr/bin/env node
/**
 * Find duplicate images at different resolutions in catalog.
 * Uses sharp to compute perceptual hash (average hash) and groups visually similar images.
 * 
 * Output: results/asset-cutover/resolution-dups.json + .md
 */

import { readdir, stat, writeFile, mkdir } from 'node:fs/promises';
import { join, relative, extname } from 'node:path';
import sharp from 'sharp';

const ROOT = 'site/public/assets/catalog';
const OUT_DIR = 'results/asset-cutover';

// Image extensions to scan
const IMG_EXTS = new Set(['.webp', '.jpg', '.jpeg', '.png']);

async function walk(dir) {
  const files = [];
  for await (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(full));
    } else if (IMG_EXTS.has(extname(entry.name).toLowerCase())) {
      files.push(full);
    }
  }
  return files;
}

// Compute average perceptual hash (8x8 = 64 bit)
async function phash(path) {
  try {
    const { data } = await sharp(path)
      .resize(8, 8, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // Average
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i];
    const avg = sum / data.length;
    
    // Bits
    let hash = 0n;
    for (let i = 0; i < data.length; i++) {
      if (data[i] > avg) hash |= (1n << BigInt(i));
    }
    return hash.toString(16).padStart(16, '0');
  } catch {
    return null;
  }
}

async function main() {
  console.log(`Scanning ${ROOT} for resolution duplicates...`);
  
  const files = await walk(ROOT);
  console.log(`Found ${files.length} images`);
  
  // Hash all
  const hashed = [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const h = await phash(f);
    if (h) {
      const s = await stat(f);
      const meta = await sharp(f).metadata();
      hashed.push({
        path: relative(ROOT, f),
        hash: h,
        size: s.size,
        width: meta.width,
        height: meta.height,
      });
    }
    if (i % 100 === 0) process.stdout.write(`\r  hashed ${i}/${files.length}`);
  }
  console.log(`\r  ✓ hashed ${hashed.length}/${files.length}        `);
  
  // Group by hash
  const groups = new Map();
  for (const item of hashed) {
    if (!groups.has(item.hash)) groups.set(item.hash, []);
    groups.get(item.hash).push(item);
  }
  
  // Filter to groups with >1 member AND different dimensions (resolution dups)
  const resDups = [];
  for (const [hash, members] of groups) {
    if (members.length < 2) continue;
    // Check if dimensions differ
    const dims = new Set(members.map(m => `${m.width}x${m.height}`));
    if (dims.size > 1) {
      // Sort by size desc (keep largest)
      members.sort((a, b) => b.size - a.size);
      resDups.push({ hash, members });
    }
  }
  
  console.log(`Found ${resDups.length} resolution-duplicate groups`);
  
  // Stats
  let wasteBytes = 0;
  for (const g of resDups) {
    // Keep largest, waste = sum of rest
    for (let i = 1; i < g.members.length; i++) {
      wasteBytes += g.members[i].size;
    }
  }
  
  // Write JSON
  await mkdir(OUT_DIR, { recursive: true });
  const jsonPath = join(OUT_DIR, 'resolution-dups.json');
  await writeFile(jsonPath, JSON.stringify({
    generated: new Date().toISOString(),
    root: ROOT,
    groups: resDups.length,
    wasteMB: Math.round(wasteBytes / 1024 / 1024 * 10) / 10,
    data: resDups,
  }, null, 2));
  console.log(`Wrote ${jsonPath}`);
  
  // Write MD
  const mdPath = join(OUT_DIR, 'resolution-dups.md');
  let md = `# Resolution duplicates (same image, different sizes)\n\n`;
  md += `**Generated:** ${new Date().toISOString()}\n`;
  md += `**Root:** \`${ROOT}\`\n`;
  md += `**Groups:** ${resDups.length} · **Waste if keep largest per group:** ${Math.round(wasteBytes/1024/1024*10)/10} MB\n\n`;
  md += `> These are visually identical images at different resolutions. Keep the largest; delete the rest.\n\n`;
  md += `| # | Waste (KB) | Keep (largest) | Delete (smaller) |\n`;
  md += `|---|-----------:|----------------|------------------|\n`;
  
  resDups.forEach((g, i) => {
    const keep = g.members[0];
    const del = g.members.slice(1);
    const waste = del.reduce((s, m) => s + m.size, 0);
    md += `| ${i+1} | ${Math.round(waste/1024)} | \`${keep.path}\` (${keep.width}×${keep.height}) | ${del.map(m => `\`${m.path}\` (${m.width}×${m.height})`).join('<br>')} |\n`;
  });
  
  await writeFile(mdPath, md);
  console.log(`Wrote ${mdPath}`);
}

main().catch(e => { console.error(e); process.exit(1); });
