/**
 * detect-corrupt-images.mjs
 * Scans catalog images for visual corruption (not decode failures).
 * Detects: low entropy, extreme color dominance, tiny file sizes, high noise.
 *
 * Usage:
 *   node scripts/detect-corrupt-images.mjs --root "site/public/assets/catalog"
 *   node scripts/detect-corrupt-images.mjs --dir "site/.../specific-folder"
 * Options: --quarantine (move to quarantine instead of just reporting)
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const argRoot = process.argv.indexOf("--root");
const ROOT = argRoot >= 0 ? process.argv[argRoot + 1] : undefined;
const argDir = process.argv.indexOf("--dir");
const DIR = argDir >= 0 ? process.argv[argDir + 1] : undefined;
const QUARANTINE = process.argv.includes("--quarantine");

const QUARANTINE_DIR = path.resolve("results/asset-cutover/quarantine-corrupt");
const IMAGE_EXT = new Set([".webp", ".jpg", ".jpeg", ".png", ".gif", ".avif"]);

async function walk(dir, acc = []) {
  let ents;
  try {
    ents = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of ents) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, acc);
    else if (IMAGE_EXT.has(path.extname(e.name).toLowerCase())) acc.push(full);
  }
  return acc;
}

async function analyzeImage(file) {
  try {
    const stats = await fs.stat(file);
    const metadata = await sharp(file, { failOn: "none" }).metadata();
    const { width, height, channels } = metadata;

    // Skip tiny images (icons, placeholders)
    if (width < 100 || height < 100) return null;

    // Get pixel data for analysis
    const { data } = await sharp(file, { failOn: "none" })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixelCount = width * height;
    const bytesPerPixel = channels;

    // Check 1: File size vs expected (corrupted images often have wrong size)
    const expectedMinSize = pixelCount * bytesPerPixel * 0.1; // 10% of raw
    if (stats.size < expectedMinSize && stats.size < 50000) {
      return { file, reason: "tiny_file", size: stats.size, expected: expectedMinSize };
    }

    // Check 2: Low entropy (mostly one color or pattern)
    const colorCounts = new Map();
    for (let i = 0; i < data.length; i += bytesPerPixel) {
      const key = Array.from(data.slice(i, i + bytesPerPixel)).join(",");
      colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
    }

    const uniqueColors = colorCounts.size;
    const dominantCount = Math.max(...colorCounts.values());
    const dominantRatio = dominantCount / pixelCount;

    // If >90% is one color, likely corrupted
    if (dominantRatio > 0.9) {
      return { file, reason: "dominant_color", ratio: dominantRatio, uniqueColors };
    }

    // Check 3: Extreme brightness (all white or all black)
    let totalBrightness = 0;
    for (let i = 0; i < data.length; i += bytesPerPixel) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      totalBrightness += (r + g + b) / 3;
    }
    const avgBrightness = totalBrightness / pixelCount;

    if (avgBrightness > 250 || avgBrightness < 5) {
      return { file, reason: "extreme_brightness", brightness: avgBrightness };
    }

    // Check 4: High variance in small regions (noise corruption)
    // Sample 10x10 grid and check variance
    const gridSize = 10;
    const cellW = Math.floor(width / gridSize);
    const cellH = Math.floor(height / gridSize);
    const cellVariances = [];

    for (let gy = 0; gy < gridSize; gy++) {
      for (let gx = 0; gx < gridSize; gx++) {
        const xStart = gx * cellW;
        const yStart = gy * cellH;
        const xEnd = xStart + cellW;
        const yEnd = yStart + cellH;

        let sum = 0;
        let sumSq = 0;
        let count = 0;

        for (let y = yStart; y < yEnd; y++) {
          for (let x = xStart; x < xEnd; x++) {
            const idx = (y * width + x) * bytesPerPixel;
            const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            sum += brightness;
            sumSq += brightness * brightness;
            count++;
          }
        }

        const mean = sum / count;
        const variance = sumSq / count - mean * mean;
        cellVariances.push(variance);
      }
    }

    const avgVariance = cellVariances.reduce((a, b) => a + b, 0) / cellVariances.length;
    const maxVariance = Math.max(...cellVariances);
    const minVariance = Math.min(...cellVariances);

    // If variance is extremely high everywhere, likely noise corruption
    if (avgVariance > 5000 && minVariance > 3000) {
      return { file, reason: "high_noise", avgVariance, minVariance };
    }

    // If variance is extremely low everywhere, likely flat corruption
    if (avgVariance < 10 && maxVariance < 50) {
      return { file, reason: "flat_image", avgVariance, maxVariance };
    }

    return null;
  } catch (err) {
    return { file, reason: "analysis_error", error: err.message };
  }
}

async function main() {
  const targetDir = DIR || ROOT;
  if (!targetDir) {
    console.error("Usage: node scripts/detect-corrupt-images.mjs --root <dir> or --dir <dir>");
    process.exit(1);
  }

  console.log(`Scanning ${targetDir} for corrupted images...`);

  const files = await walk(targetDir);
  console.log(`Found ${files.length} images to analyze`);

  const corrupt = [];
  for (let i = 0; i < files.length; i++) {
    const result = await analyzeImage(files[i]);
    if (result) {
      corrupt.push(result);
      if (i % 100 === 0) console.log(`  Analyzed ${i}/${files.length}...`);
    }
  }

  console.log(`\nFound ${corrupt.length} potentially corrupted images:`);

  if (QUARANTINE) {
    await fs.mkdir(QUARANTINE_DIR, { recursive: true });
    for (const item of corrupt) {
      const dest = path.join(QUARANTINE_DIR, path.basename(item.file));
      try {
        await fs.rename(item.file, dest);
        console.log(`  Quarantined: ${path.basename(item.file)} (${item.reason})`);
      } catch (err) {
        console.error(`  Failed to quarantine ${path.basename(item.file)}: ${err.message}`);
      }
    }
  } else {
    for (const item of corrupt) {
      console.log(`  ${path.basename(item.file)}: ${item.reason}`);
    }
  }

  // Write report
  const reportPath = path.resolve("results/asset-cutover/corrupt-images-report.json");
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(corrupt, null, 2));
  console.log(`\nReport written to ${reportPath}`);
}

main().catch(console.error);
