/**
 * Merge catalog/products/imported/{slug} into family SKU galleries.
 * Usage: pnpm exec node scripts/merge-products-imported-into-families.mjs
 */
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
  copyFileSync,
} from "node:fs";
import { join, resolve, extname, basename } from "node:path";

const ROOT = resolve(process.cwd());
const CAT = resolve(ROOT, "site/public/assets/catalog");
const IMP = join(CAT, "products/imported");
const LEATHER = new Set(["grace", "pinnacle", "moonlight", "rider"]);

const ALIASES = {
  breez: "breeze",
  xmesh: "x-mesh",
  eclipse: "eclips",
  collaborative: "cocoon-pod",
};

/** imported slug → preferred family when creating a new SKU */
const CREATE_FAMILY = {
  "accesory-part": "storage",
  accessories: "storage",
  allure: "soft-seating",
  cabin: "storage",
  "cafe-discussion-tables": "tables",
  classy: "soft-seating",
  crew: "soft-seating",
  eclipse: "soft-seating",
  "folding-table": "tables",
  "lab-furniture": "educational",
  "meeting-table": "tables",
  mellow: "soft-seating",
  omnia: "soft-seating",
  pod: "collaborative",
  storage: "storage",
  wiesner: "soft-seating",
  "workstations-copy": "workstations",
  zino: "soft-seating",
  solace: "seating",
  mozio: "seating",
};

function sha1(file) {
  return createHash("sha1").update(readFileSync(file)).digest("hex");
}

function listImageFiles(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  const walk = (d) => {
    for (const name of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, name.name);
      if (name.isDirectory()) walk(p);
      else if (
        name.name !== ".gitkeep" &&
        /\.(webp|jpe?g|png|gif|avif)$/i.test(name.name)
      ) {
        out.push(p);
      }
    }
  };
  walk(dir);
  return out;
}

/** Build suffix → [{ familyRelPath, sku, abs }] */
function indexSkus() {
  const map = new Map();
  const walk = (dir, relParts = []) => {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir, { withFileTypes: true })) {
      if (!name.isDirectory()) continue;
      const p = join(dir, name.name);
      const rel = [...relParts, name.name];
      if (name.name.startsWith("oando-")) {
        const m = name.name.match(/^oando-(.+)--(.+)$/);
        if (m) {
          const suffix = m[2].toLowerCase();
          if (!map.has(suffix)) map.set(suffix, []);
          map.get(suffix).push({
            sku: name.name,
            rel: rel.join("/"),
            abs: p,
            family: m[1],
          });
        }
      } else if (!["products", "flagship", "_inbox"].includes(name.name)) {
        walk(p, rel);
      }
    }
  };
  walk(CAT, []);
  return map;
}

function seatingBucket(slug) {
  return LEATHER.has(slug) ? "leather" : "non-leather";
}

function createSkuPath(family, slug) {
  const sku = `oando-${family}--${slug}`;
  if (family === "seating") {
    return {
      sku,
      rel: `seating/${seatingBucket(slug)}/${sku}`,
      abs: join(CAT, "seating", seatingBucket(slug), sku),
      family,
    };
  }
  return {
    sku,
    rel: `${family}/${sku}`,
    abs: join(CAT, family, sku),
    family,
  };
}

function nextImageIndex(galleryDir) {
  let max = 0;
  if (!existsSync(galleryDir)) return 0;
  for (const name of readdirSync(galleryDir)) {
    const m = name.match(/^image-(\d+)\./i);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max;
}

function _mergeIntoGallery(srcFiles, galleryAbs, stats, log, label) {
  mkdirSync(galleryAbs, { recursive: true });
  const hashMap = new Map();
  for (const f of listImageFiles(galleryAbs)) {
    try {
      hashMap.set(sha1(f), basename(f));
    } catch {
      /* skip */
    }
  }
  let max = nextImageIndex(galleryAbs);
  let copied = 0;
  let skipped = 0;
  for (const src of srcFiles) {
    let h;
    try {
      h = sha1(src);
    } catch {
      continue;
    }
    if (hashMap.has(h)) {
      skipped++;
      stats.skipHash++;
      log.push({ action: "skip-hash", src: basename(src), dest: label });
      continue;
    }
    const ext = extname(src).toLowerCase() || ".webp";
    const base = basename(src);
    let destName = null;
    if (/^image-\d+\./i.test(base)) {
      const cand = join(galleryAbs, base);
      if (!existsSync(cand)) destName = base;
    }
    if (!destName) {
      max += 1;
      destName = `image-${max}${ext}`;
      while (existsSync(join(galleryAbs, destName))) {
        max += 1;
        destName = `image-${max}${ext}`;
      }
    }
    const dest = join(galleryAbs, destName);
    // prefer move within same volume; fallback copy+delete
    try {
      renameSync(src, dest);
    } catch {
      copyFileSync(src, dest);
      try {
        rmSync(src);
      } catch {
        /* keep copy */
      }
    }
    hashMap.set(h, destName);
    copied++;
    stats.copy++;
    log.push({
      action: "move",
      src: basename(src),
      dest: `${label}/${destName}`,
    });
  }
  return { copied, skipped };
}

function resolveDests(slug, skuIndex) {
  const key = (ALIASES[slug] || slug).toLowerCase();
  const hits = skuIndex.get(key) || [];
  if (hits.length > 0) return hits;

  // special multi-name mappings
  if (slug === "pod") {
    const pods = [
      ...(skuIndex.get("cocoon-pod") || []),
      ...(skuIndex.get("solace-pod") || []),
    ];
    return pods.length ? pods : [createSkuPath("collaborative", "pod")];
  }
  if (slug === "workstations-copy") {
    // dump into a dedicated legacy workstation SKU
    return [createSkuPath("workstations", "legacy-imported")];
  }
  if (slug === "storage") {
    return [createSkuPath("storage", "legacy-imported")];
  }
  if (slug === "cabin") {
    return [createSkuPath("storage", "cabin")];
  }
  if (slug === "meeting-table") {
    return [createSkuPath("tables", "meeting-table")];
  }
  if (slug === "cafe-discussion-tables") {
    return [createSkuPath("tables", "cafe-discussion")];
  }
  if (slug === "folding-table") {
    return [createSkuPath("tables", "folding-table")];
  }
  if (slug === "accesory-part") {
    return [createSkuPath("storage", "accessories")];
  }
  if (slug === "lab-furniture") {
    return [createSkuPath("educational", "lab-furniture")];
  }
  if (slug === "collaborative") {
    return [createSkuPath("collaborative", "legacy-imported")];
  }

  const fam = CREATE_FAMILY[slug] || "soft-seating";
  return [createSkuPath(fam, key)];
}

function main() {
  if (!existsSync(IMP)) {
    console.log("No products/imported — nothing to merge");
    return;
  }

  const skuIndex = indexSkus();
  const stats = { folders: 0, copy: 0, skipHash: 0, createdSkus: [] };
  const log = [];

  const folders = readdirSync(IMP, { withFileTypes: true }).filter((d) =>
    d.isDirectory(),
  );

  for (const dirent of folders) {
    const slug = dirent.name;
    const srcDir = join(IMP, slug);
    const srcFiles = listImageFiles(srcDir);
    stats.folders++;
    if (srcFiles.length === 0) {
      log.push({ action: "empty", slug });
      continue;
    }

    let dests = resolveDests(slug, skuIndex);
    // multi-hit: merge into ALL matching SKUs (e.g. casca seating + soft-seating)
    console.log(
      `\n=== ${slug} (${srcFiles.length} files) → ${dests.length} dest(s) ===`,
    );

    for (const d of dests) {
      if (!existsSync(d.abs)) {
        mkdirSync(join(d.abs, "gallery"), { recursive: true });
        stats.createdSkus.push(d.rel);
        console.log(`  CREATE ${d.rel}`);
      }
      const _gal = join(d.abs, "gallery");
      // For multi-dest, only first dest moves files; others need copy from...
      // Better: first pass compute hashes once, copy to all dests from original
    }

    // Re-list after potential prior moves in same folder — work on file list snapshot
    // Multi-dest: copy to each (first rename into first dest, copy from dest to others is wrong)
    // Approach: copy to each dest with hash; delete sources after all dests done
    for (const d of dests) {
      const gal = join(d.abs, "gallery");
      mkdirSync(gal, { recursive: true });
      const hashMap = new Map();
      for (const f of listImageFiles(gal)) {
        try {
          hashMap.set(sha1(f), basename(f));
        } catch {
          /* */
        }
      }
      let max = nextImageIndex(gal);
      let c = 0;
      let s = 0;
      for (const src of srcFiles) {
        if (!existsSync(src)) continue;
        let h;
        try {
          h = sha1(src);
        } catch {
          continue;
        }
        if (hashMap.has(h)) {
          s++;
          stats.skipHash++;
          continue;
        }
        const ext = extname(src).toLowerCase() || ".webp";
        const base = basename(src);
        let destName = null;
        if (/^image-\d+\./i.test(base) && !existsSync(join(gal, base))) {
          destName = base;
        }
        if (!destName) {
          max += 1;
          destName = `image-${max}${ext}`;
          while (existsSync(join(gal, destName))) {
            max += 1;
            destName = `image-${max}${ext}`;
          }
        }
        copyFileSync(src, join(gal, destName));
        hashMap.set(h, destName);
        c++;
        stats.copy++;
        log.push({
          action: "copy",
          slug,
          dest: `${d.rel}/gallery/${destName}`,
        });
      }
      console.log(
        `  ${d.rel}/gallery: copy=${c} skip=${s} now=${listImageFiles(gal).length}`,
      );
    }

    // remove sources after successful distribute
    for (const src of srcFiles) {
      try {
        if (existsSync(src)) rmSync(src);
      } catch {
        /* */
      }
    }
    // remove empty slug tree
    try {
      rmSync(srcDir, { recursive: true, force: true });
      log.push({ action: "removed-folder", slug });
    } catch (e) {
      log.push({ action: "remove-fail", slug, error: String(e) });
    }
  }

  // clean empty imported
  try {
    const left = readdirSync(IMP).filter((n) => n !== ".gitkeep");
    if (left.length === 0) {
      // keep products/imported/.gitkeep
      if (!existsSync(join(IMP, ".gitkeep"))) {
        writeFileSync(join(IMP, ".gitkeep"), "");
      }
    } else {
      console.log("remaining under imported:", left.join(", "));
    }
  } catch {
    /* */
  }

  const report = {
    generatedAt: new Date().toISOString(),
    stats,
    createdSkus: stats.createdSkus,
    logSample: log.slice(0, 100),
    logCount: log.length,
  };
  const out = resolve(ROOT, "results/asset-cutover/merge-products-imported.json");
  mkdirSync(resolve(ROOT, "results/asset-cutover"), { recursive: true });
  writeFileSync(out, JSON.stringify({ ...report, log }, null, 2));
  console.log("\n=== SUMMARY ===");
  console.log(JSON.stringify(stats, null, 2));
  console.log("report", out);
}

main();
