/**
 * contact-sheet.mjs
 * Builds a grid montage ("contact sheet") of every image in a folder so a human
 * can visually review them at once. Writes a PNG per folder to results/contact-sheets/.
 *
 * Usage:
 *   node scripts/contact-sheet.mjs --root "site/public/assets/catalog"              # all product folders >10 imgs
 *   node scripts/contact-sheet.mjs --dir "site/.../oando-seating--caneva"            # single folder
 * Options: --cols <n> (default 5)  --thumb <px> (default 240)  --all (include folders <=10)
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const argRoot = process.argv.indexOf("--root");
const ROOT = argRoot >= 0 ? process.argv[argRoot + 1] : undefined;
const argDir = process.argv.indexOf("--dir");
const DIR = argDir >= 0 ? process.argv[argDir + 1] : undefined;
const argCols = process.argv.indexOf("--cols");
const COLS = argCols >= 0 ? Number(process.argv[argCols + 1]) : 5;
const argThumb = process.argv.indexOf("--thumb");
const THUMB = argThumb >= 0 ? Number(process.argv[argThumb + 1]) : 240;
const INCLUDE_ALL = process.argv.includes("--all");

const OUT_DIR = path.resolve("results/asset-cutover/contact-sheets");
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
    else acc.push(full);
  }
  return acc;
}

async function makeSheet(folder, files) {
  const thumbs = [];
  for (const f of files) {
    try {
      const buf = await sharp(f, { failOn: "none" })
        .rotate()
        .resize({ width: THUMB, height: THUMB, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      thumbs.push(buf);
    } catch {
      thumbs.push(null); // failed decode -> blank cell
    }
  }
  const rows = Math.max(1, Math.ceil(thumbs.length / COLS));
  const cellW = THUMB;
  const cellH = THUMB;
  const pad = 8;
  const labelH = 24;
  const W = COLS * cellW + (COLS + 1) * pad;
  const H = rows * (cellH + labelH) + (rows + 1) * pad;

  const canvas = sharp({
    create: {
      width: W,
      height: H,
      channels: 4,
      background: { r: 24, g: 24, b: 24, alpha: 1 },
    },
  });

  const comps = [];
  thumbs.forEach((buf, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = pad + col * (cellW + pad);
    const y = pad + row * (cellH + labelH + pad);
    if (buf) {
      comps.push({ input: buf, left: x, top: y });
    }
    const name = path.basename(files[i]);
    comps.push({
      input: {
        text: {
          text: name,
          rgba: true,
          fontfile: "C:/Windows/Fonts/arial.ttf",
          width: cellW - 8,
          height: labelH,
          align: "center",
        },
      },
      left: x,
      top: y + cellH,
    });
  });

  const out = await canvas.composite(comps).png().toBuffer();
  const outPath = path.join(OUT_DIR, `${path.basename(folder)}.png`);
  await fs.writeFile(outPath, out);
  return outPath;
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const targets = [];
  if (DIR) {
    const files = (await walk(DIR)).filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()));
    targets.push({ folder: DIR, files });
  } else if (ROOT) {
    const _counts = [];
    const allDirs = (await walk(ROOT)).filter((f) => path.extname(f).toLowerCase() === ".webp");
    // group by parent dir
    const byDir = new Map();
    for (const f of allDirs) {
      const d = path.dirname(f);
      if (!byDir.has(d)) byDir.set(d, []);
      byDir.get(d).push(f);
    }
    for (const [dir, files] of byDir) {
      targets.push({ folder: dir, files });
    }
    // only product folders (name starts with oando-)
    const prod = targets.filter((t) => /oando-.+--/.test(path.basename(t.folder)));
    const picks =
      INCLUDE_ALL ? prod : prod.filter((t) => t.files.length > 10);
    for (const t of picks) {
      const rel = path.relative(ROOT, t.folder);
      const outPath = await makeSheet(t.folder, t.files);
      console.log(`${rel} (${t.files.length}) -> ${outPath}`);
    }
    return;
  }
  for (const t of targets) {
    const outPath = await makeSheet(t.folder, t.files);
    console.log(`${t.folder} (${t.files.length}) -> ${outPath}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});