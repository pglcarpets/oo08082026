/**
 * Five-majors hash-based recovery merge + dedupe.
 *
 * A. SHA1 index of assets/{marketing,catalog,planner,studio,others}
 *    excluding others/legacy/recovery
 * B. Merge recovery/** : skip if hash already known; else classify + copy
 * C. Dedupe within majors (same hash → keep canonical path, delete extras)
 * D. Optionally delete recovery (--delete-recovery)
 *
 * Usage (repo root):
 *   node scripts/five-majors-hash-dedup.mjs
 *   node scripts/five-majors-hash-dedup.mjs --dry
 *   node scripts/five-majors-hash-dedup.mjs --skip-dedupe
 *   node scripts/five-majors-hash-dedup.mjs --delete-recovery
 *   node scripts/five-majors-hash-dedup.mjs --limit 200
 */
import { createHash } from "node:crypto";
import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  MEDIA_EXT,
  classify,
  dumpKindFromName,
} from "./lib/recoveryClassify.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");
const ASSETS = path.join(REPO, "site/public/assets");
const RECOVERY = path.join(ASSETS, "others/legacy/recovery");
const LOG_DIR = path.join(REPO, "results/asset-cutover");
const MAJORS = ["marketing", "catalog", "planner", "studio", "others"];
const MIN_FREE_BYTES = 10 * 1024 * 1024 * 1024;
const FREE_CHECK_EVERY = 200;
const HASH_CONCURRENCY = 12;

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const SKIP_DEDUPE = args.includes("--skip-dedupe");
const DELETE_RECOVERY = args.includes("--delete-recovery");
const LIMIT = (() => {
  const i = args.indexOf("--limit");
  return i >= 0 ? Number(args[i + 1]) || 0 : 0;
})();

const HASH_MEDIA = new Set([
  ".webp",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".svg",
  ".avif",
  ".mp4",
  ".webm",
  ".ico",
]);

// ——— helpers ———

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function freeBytesOnDrive(absPath) {
  if (typeof fs.statfs === "function") {
    try {
      const s = await fs.statfs(path.parse(absPath).root || absPath);
      return Number(s.bfree) * Number(s.bsize);
    } catch {
      /* fall through */
    }
  }
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execFileAsync = promisify(execFile);
  const drive = path.parse(absPath).root.replace(/\\$/, "");
  const { stdout } = await execFileAsync(
    "powershell.exe",
    ["-NoProfile", "-Command", `(Get-PSDrive -Name '${drive.replace(":", "")}').Free`],
    { windowsHide: true },
  );
  return Number(String(stdout).trim());
}

function posixRel(from, to) {
  return path.relative(from, to).split(path.sep).join("/");
}

function isUnderRecovery(absPath) {
  const n = path.resolve(absPath).toLowerCase();
  const r = path.resolve(RECOVERY).toLowerCase();
  return n === r || n.startsWith(r + path.sep);
}

function isHashableMedia(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return HASH_MEDIA.has(ext) || MEDIA_EXT.has(ext);
}

async function sha1File(absPath) {
  const hash = createHash("sha1");
  const stream = createReadStream(absPath);
  for await (const chunk of stream) {
    hash.update(chunk);
  }
  return hash.digest("hex");
}

async function* walkFiles(dir, { skipRecovery = false } = {}) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (
        ent.name === "node_modules" ||
        ent.name === ".git" ||
        ent.name === ".next"
      ) {
        continue;
      }
      if (skipRecovery && ent.name === "recovery") {
        // only skip the recovery folder under legacy
        const parent = path.basename(dir).toLowerCase();
        if (parent === "legacy") continue;
      }
      if (skipRecovery && isUnderRecovery(full)) continue;
      yield* walkFiles(full, { skipRecovery });
    } else if (ent.isFile()) {
      yield full;
    }
  }
}

/** Map hash → { paths: string[], size: number, canonical?: string } */
class HashIndex {
  constructor() {
    /** @type {Map<string, { paths: string[], size: number }>} */
    this.map = new Map();
    this.fileCount = 0;
    this.bytesHashed = 0;
  }
  has(hash) {
    return this.map.has(hash);
  }
  get(hash) {
    return this.map.get(hash);
  }
  add(hash, absPath, size) {
    const rel = posixRel(ASSETS, absPath);
    let e = this.map.get(hash);
    if (!e) {
      e = { paths: [], size };
      this.map.set(hash, e);
    }
    if (!e.paths.includes(rel)) e.paths.push(rel);
    if (size > e.size) e.size = size;
    this.fileCount++;
  }
  removePath(hash, absPath) {
    const rel = posixRel(ASSETS, absPath);
    const e = this.map.get(hash);
    if (!e) return;
    e.paths = e.paths.filter((p) => p !== rel);
    if (!e.paths.length) this.map.delete(hash);
  }
}

async function mapPool(items, concurrency, fn) {
  const results = Array.from({ length: items.length });
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  const n = Math.min(concurrency, Math.max(1, items.length));
  await Promise.all(Array.from({ length: n }, () => worker()));
  return results;
}

// ——— A. Build index ———

async function buildIndex(index) {
  console.log("[A] Building SHA1 index of majors (excluding recovery)…");
  const files = [];
  for (const major of MAJORS) {
    const root = path.join(ASSETS, major);
    if (!(await exists(root))) continue;
    for await (const f of walkFiles(root, { skipRecovery: true })) {
      if (isUnderRecovery(f)) continue;
      if (!isHashableMedia(f)) continue;
      files.push(f);
    }
  }
  console.log(`[A] ${files.length} media files to hash`);
  let done = 0;
  await mapPool(files, HASH_CONCURRENCY, async (f) => {
    try {
      const st = await fs.stat(f);
      const h = await sha1File(f);
      index.add(h, f, st.size);
      index.bytesHashed += st.size;
    } catch (err) {
      console.warn("[A] hash fail", f, err.message);
    }
    done++;
    if (done % 500 === 0 || done === files.length) {
      console.log(`  … indexed ${done}/${files.length}`);
    }
  });
  console.log(
    `[A] unique hashes=${index.map.size} files=${index.fileCount} bytes=${(index.bytesHashed / 1e9).toFixed(2)} GB`,
  );
  return files.length;
}

// ——— B. Merge recovery ———

function recoverySourceTag(absPath) {
  const rel = posixRel(RECOVERY, absPath);
  const parts = rel.split("/");
  // from-e/dump/...  or from-d/dump/...  or all/...
  if (parts[0] === "from-e" || parts[0] === "from-d") {
    return `${parts[0]}/${parts[1] || "root"}`;
  }
  if (parts[0] === "all") return "all";
  return parts[0] || "recovery";
}

function recoveryRelForClassify(absPath) {
  const rel = posixRel(RECOVERY, absPath);
  const parts = rel.split("/");
  // strip from-e/<dump>/ or from-d/<dump>/ prefix → content-relative path
  if (parts[0] === "from-e" || parts[0] === "from-d") {
    return parts.slice(2).join("/");
  }
  if (parts[0] === "all") {
    return parts.slice(1).join("/");
  }
  return rel;
}

function kindForRecoveryPath(absPath) {
  const rel = posixRel(RECOVERY, absPath);
  const parts = rel.split("/");
  if (parts[0] === "from-e" || parts[0] === "from-d") {
    return dumpKindFromName(parts[1] || "");
  }
  return "images";
}

function originalsPath(destAbs, base) {
  // park next to dest under _originals/
  return path.join(path.dirname(destAbs), "_originals", base);
}

/**
 * Canonical score: higher = prefer keep.
 * Prefer catalog family oando SKU gallery over products/imported.
 * Prefer webp; prefer shorter structured paths.
 */
function canonicalScore(relPosix) {
  const r = relPosix.replace(/\\/g, "/").toLowerCase();
  let s = 0;
  if (r.startsWith("catalog/")) s += 1000;
  if (r.startsWith("marketing/")) s += 800;
  if (r.startsWith("planner/")) s += 700;
  if (r.startsWith("studio/")) s += 700;
  if (r.startsWith("others/")) s += 100;
  if (/\/oando-[a-z0-9-]+--/.test(r)) s += 300;
  if (/\/gallery\//.test(r)) s += 200;
  if (/\/products\/imported\//.test(r)) s -= 250;
  if (/\/legacy-flat\//.test(r) || /\/_legacy-/.test(r)) s -= 100;
  if (/\/from-recovery\//.test(r)) s -= 150;
  if (/\/_originals\//.test(r)) s -= 400;
  if (/\/_quarantine\//.test(r)) s -= 500;
  if (r.endsWith(".webp")) s += 50;
  if (r.endsWith(".png") || r.endsWith(".jpg") || r.endsWith(".jpeg")) s += 10;
  // shallower paths slightly preferred among equals
  s -= r.split("/").length;
  return s;
}

async function placeNewHash(src, srcHash, srcSize, destAbs, stats, index) {
  const destNorm = path.resolve(destAbs).toLowerCase();
  const recoveryNorm = path.resolve(RECOVERY).toLowerCase();
  if (destNorm === recoveryNorm || destNorm.startsWith(recoveryNorm + path.sep)) {
    stats.actions.skip_recovery_self++;
    return "skip_recovery_self";
  }

  const ext = path.extname(destAbs).toLowerCase();
  const base = path.basename(destAbs);

  // Prefer webp sibling: if placing jpg/png and .webp exists at dest stem
  if (ext === ".jpg" || ext === ".jpeg" || ext === ".png") {
    const webpDest = destAbs.replace(/\.(jpe?g|png)$/i, ".webp");
    if (await exists(webpDest)) {
      // hash is still new — park under _originals only if not elsewhere (it isn't)
      const park = originalsPath(destAbs, base);
      if (!(await exists(park))) {
        if (!DRY) {
          await ensureDir(path.dirname(park));
          await fs.copyFile(src, park);
          index.add(srcHash, park, srcSize);
        }
        stats.actions.parked_originals++;
        stats.copiedBytes += srcSize;
        return "parked_originals_webp_prefer";
      }
      // already have park path — skip
      stats.actions.skipped_webp_prefer++;
      return "skipped_webp_prefer";
    }
  }

  if (await exists(destAbs)) {
    let destSize = 0;
    let destHash = null;
    try {
      destSize = (await fs.stat(destAbs)).size;
      destHash = await sha1File(destAbs);
    } catch {
      destSize = 0;
    }

    if (destHash === srcHash) {
      // same content at dest — should already be in index, but ensure
      index.add(srcHash, destAbs, srcSize);
      stats.actions.skipped_hash_dup++;
      return "skipped_hash_dup_at_dest";
    }

    // different hash at dest path
    if (srcSize > destSize) {
      // keep larger (source) at dest; park old dest if its hash not elsewhere
      const _oldOnlyHere =
        destHash &&
        index.has(destHash) &&
        (index.get(destHash).paths.length === 1 ||
          (index.get(destHash).paths.length === 0));
      // more carefully: after removing dest, would hash disappear?
      const entry = destHash ? index.get(destHash) : null;
      const destRel = posixRel(ASSETS, destAbs);
      const otherCopies =
        entry ? entry.paths.filter((p) => p !== destRel).length : 0;

      if (!DRY) {
        if (destHash && otherCopies === 0) {
          const park = originalsPath(destAbs, path.basename(destAbs) + ".replaced");
          await ensureDir(path.dirname(park));
          try {
            await fs.rename(destAbs, park);
            index.removePath(destHash, destAbs);
            index.add(destHash, park, destSize);
            stats.actions.parked_replaced++;
          } catch {
            // if rename fails, still overwrite
            if (destHash) index.removePath(destHash, destAbs);
          }
        } else if (destHash) {
          index.removePath(destHash, destAbs);
        }
        await ensureDir(path.dirname(destAbs));
        await fs.copyFile(src, destAbs);
        index.add(srcHash, destAbs, srcSize);
      } else {
        index.add(srcHash, destAbs, srcSize);
      }
      stats.actions.copied++;
      stats.copiedBytes += srcSize;
      return "copied_overwrite_larger";
    }

    // dest larger or equal size but different hash — keep dest; park source if unique
    if (!DRY) {
      const park = originalsPath(destAbs, base);
      if (!(await exists(park))) {
        await ensureDir(path.dirname(park));
        await fs.copyFile(src, park);
        index.add(srcHash, park, srcSize);
        stats.actions.parked_originals++;
        stats.copiedBytes += srcSize;
        return "parked_originals_dest_larger";
      }
      // try unique name
      const park2 = originalsPath(
        destAbs,
        `${path.parse(base).name}.${srcHash.slice(0, 8)}${path.extname(base)}`,
      );
      if (!(await exists(park2))) {
        await ensureDir(path.dirname(park2));
        await fs.copyFile(src, park2);
        index.add(srcHash, park2, srcSize);
        stats.actions.parked_originals++;
        stats.copiedBytes += srcSize;
        return "parked_originals_dest_larger";
      }
    } else {
      index.add(srcHash, destAbs + "._originals", srcSize);
      stats.actions.parked_originals++;
      return "parked_originals_dest_larger";
    }
    stats.actions.skipped_dest_larger++;
    return "skipped_dest_larger_no_park";
  }

  // dest free
  if (!DRY) {
    await ensureDir(path.dirname(destAbs));
    await fs.copyFile(src, destAbs);
  }
  index.add(srcHash, destAbs, srcSize);
  stats.actions.copied++;
  stats.copiedBytes += srcSize;
  return "copied";
}

async function mergeRecovery(index, stats) {
  console.log("[B] Merging recovery with hash skip…");
  if (!(await exists(RECOVERY))) {
    console.error("Recovery missing:", RECOVERY);
    process.exit(1);
  }

  const files = [];
  for await (const f of walkFiles(RECOVERY)) {
    if (!isHashableMedia(f)) {
      stats.actions.skipped_non_media++;
      continue;
    }
    files.push(f);
  }
  console.log(`[B] ${files.length} recovery media files`);
  if (LIMIT) console.log(`[B] limit=${LIMIT}`);

  let free = await freeBytesOnDrive(ASSETS);
  stats.freeStartBytes = free;
  console.log(`[B] free start ${(free / 1e9).toFixed(2)} GB`);
  if (free > 0 && free < MIN_FREE_BYTES) {
    console.error("Abort: free < 10 GB");
    process.exit(2);
  }

  let processed = 0;
  for (const file of files) {
    if (LIMIT && processed >= LIMIT) break;
    processed++;
    stats.processed++;

    let srcSize = 0;
    try {
      srcSize = (await fs.stat(file)).size;
    } catch (e) {
      stats.actions.error++;
      if (stats.errors.length < 50) stats.errors.push({ file, error: String(e.message || e) });
      continue;
    }

    let srcHash;
    try {
      srcHash = await sha1File(file);
    } catch (e) {
      stats.actions.error++;
      if (stats.errors.length < 50) stats.errors.push({ file, error: "hash:" + String(e.message || e) });
      continue;
    }

    if (index.has(srcHash)) {
      stats.actions.skipped_hash_dup++;
      stats.byClass["skip.hash-dup"] = (stats.byClass["skip.hash-dup"] || 0) + 1;
      continue;
    }

    const rel = recoveryRelForClassify(file);
    const sourceTag = recoverySourceTag(file);
    const kind = kindForRecoveryPath(file);
    const decision = classify(rel, sourceTag, kind);
    stats.byClass[decision.class] = (stats.byClass[decision.class] || 0) + 1;

    if (decision.major === "skip" || !decision.destRel) {
      stats.actions.skip_recovery_self++;
      continue;
    }

    // never write back into recovery
    let destRel = decision.destRel;
    if (destRel.replace(/\\/g, "/").toLowerCase().includes("legacy/recovery")) {
      destRel = `others/misc/from-recovery/${sourceTag}/${path.basename(file)}`;
      decision.major = "others";
      decision.class = "others.rerouted-from-recovery";
    }

    const destAbs = path.join(ASSETS, destRel);
    let action;
    try {
      action = await placeNewHash(file, srcHash, srcSize, destAbs, stats, index);
    } catch (e) {
      stats.actions.error++;
      if (stats.errors.length < 80) {
        stats.errors.push({ file, dest: destRel, error: String(e.message || e) });
      }
      continue;
    }

    if (
      action === "copied" ||
      action === "copied_overwrite_larger" ||
      action === "parked_originals_webp_prefer" ||
      action === "parked_originals_dest_larger"
    ) {
      const major = decision.major;
      if (stats.byMajor[major]) {
        stats.byMajor[major].copied++;
        stats.byMajor[major].bytes += srcSize;
      }
      if (stats.samples.copied.length < 50) {
        stats.samples.copied.push({
          from: posixRel(RECOVERY, file),
          to: destRel,
          major: decision.major,
          class: decision.class,
          action,
          bytes: srcSize,
          hash: srcHash.slice(0, 12),
        });
      }
    }

    if (stats.processed % FREE_CHECK_EVERY === 0) {
      try {
        free = await freeBytesOnDrive(ASSETS);
        if (free < MIN_FREE_BYTES) {
          console.error(`[B] STOP low space after ${stats.processed}`);
          stats.actions.stopped_low_space = 1;
          break;
        }
      } catch {
        /* ignore */
      }
    }
    if (stats.processed % 2000 === 0) {
      console.log(
        `  … ${stats.processed}/${files.length} | copied=${stats.actions.copied} hash-dup=${stats.actions.skipped_hash_dup} parked=${stats.actions.parked_originals} free=${(free / 1e9).toFixed(1)}GB`,
      );
    }
  }

  console.log(
    `[B] done processed=${stats.processed} copied=${stats.actions.copied} hash-dup=${stats.actions.skipped_hash_dup} parked=${stats.actions.parked_originals} err=${stats.actions.error}`,
  );
}

// ——— C. Dedupe within majors ———

async function dedupeMajors(stats) {
  console.log("[C] Deduping within majors (hash groups)…");
  /** @type {Map<string, string[]>} */
  const groups = new Map();
  let scanned = 0;

  for (const major of MAJORS) {
    const root = path.join(ASSETS, major);
    if (!(await exists(root))) continue;
    for await (const f of walkFiles(root, { skipRecovery: true })) {
      if (isUnderRecovery(f)) continue;
      if (!isHashableMedia(f)) continue;
      try {
        const h = await sha1File(f);
        const rel = posixRel(ASSETS, f);
        if (!groups.has(h)) groups.set(h, []);
        groups.get(h).push(rel);
        scanned++;
      } catch {
        /* skip */
      }
      if (scanned % 1000 === 0) console.log(`  … hashed ${scanned} for dedupe`);
    }
  }

  let multi = 0;
  let deleted = 0;
  let deletedBytes = 0;
  const samples = [];

  for (const [hash, paths] of groups) {
    if (paths.length < 2) continue;
    multi++;
    // sort by canonical score desc
    const ranked = paths
      .map((p) => ({ p, score: canonicalScore(p) }))
      .sort((a, b) => b.score - a.score || a.p.localeCompare(b.p));
    const keep = ranked[0].p;
    for (let i = 1; i < ranked.length; i++) {
      const drop = ranked[i].p;
      const abs = path.join(ASSETS, drop);
      try {
        const st = await fs.stat(abs);
        if (!DRY) await fs.unlink(abs);
        deleted++;
        deletedBytes += st.size;
        if (samples.length < 40) {
          samples.push({ keep, drop, hash: hash.slice(0, 12), bytes: st.size });
        }
      } catch (e) {
        if (stats.errors.length < 80) {
          stats.errors.push({ file: abs, error: "dedupe:" + String(e.message || e) });
        }
      }
    }
  }

  stats.dedupe = {
    scanned,
    uniqueHashes: groups.size,
    multiHashGroups: multi,
    deleted,
    deletedBytes,
    samples,
  };
  console.log(
    `[C] scanned=${scanned} multi-groups=${multi} deleted=${deleted} (${(deletedBytes / 1e6).toFixed(1)} MB)`,
  );
}

// ——— D. Delete recovery ———

async function deleteRecovery(stats) {
  console.log("[D] Deleting recovery tree…");
  if (!(await exists(RECOVERY))) {
    console.log("[D] already gone");
    stats.recoveryDeleted = false;
    stats.recoveryAlreadyGone = true;
    return;
  }
  if (DRY) {
    console.log("[D] dry — would Remove-Item recovery");
    stats.recoveryDeleted = false;
    stats.recoveryDryWouldDelete = true;
    return;
  }
  // Use PowerShell for robust long-path recursive delete on Windows
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execFileAsync = promisify(execFile);
  const target = RECOVERY;
  try {
    await execFileAsync(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        `Remove-Item -LiteralPath '${target.replace(/'/g, "''")}' -Recurse -Force -ErrorAction Stop`,
      ],
      { windowsHide: true, maxBuffer: 20 * 1024 * 1024 },
    );
  } catch (e) {
    // fallback fs.rm
    console.warn("[D] PowerShell remove failed, trying fs.rm:", e.message);
    await fs.rm(RECOVERY, { recursive: true, force: true, maxRetries: 3 });
  }
  const gone = !(await exists(RECOVERY));
  stats.recoveryDeleted = gone;
  console.log(gone ? "[D] recovery removed" : "[D] WARNING: recovery still present");
  if (!gone) process.exitCode = 4;
}

// ——— counts per major ———

async function countPerMajor() {
  const out = {};
  for (const major of MAJORS) {
    const root = path.join(ASSETS, major);
    let files = 0;
    let bytes = 0;
    if (await exists(root)) {
      for await (const f of walkFiles(root, { skipRecovery: true })) {
        if (isUnderRecovery(f)) continue;
        try {
          const st = await fs.stat(f);
          files++;
          bytes += st.size;
        } catch {
          /* skip */
        }
      }
    }
    out[major] = { files, bytes };
  }
  // recovery residual
  let recFiles = 0;
  let recBytes = 0;
  if (await exists(RECOVERY)) {
    for await (const f of walkFiles(RECOVERY)) {
      try {
        const st = await fs.stat(f);
        recFiles++;
        recBytes += st.size;
      } catch {
        /* skip */
      }
    }
  }
  out._recovery = { files: recFiles, bytes: recBytes, exists: await exists(RECOVERY) };
  return out;
}

// ——— logs ———

function renderMarkdown(stats) {
  const lines = [];
  lines.push("# Five majors — hash dedup merge");
  lines.push("");
  lines.push(`**Started:** ${stats.startedAt}`);
  lines.push(`**Ended:** ${stats.endedAt}`);
  lines.push(`**Duration:** ${stats.durationSec}s`);
  lines.push(`**Dry run:** ${stats.dry}`);
  lines.push(
    `**E: free start/end:** ${(stats.freeStartBytes / 1e9).toFixed(2)} GB → ${(stats.freeEndBytes / 1e9).toFixed(2)} GB`,
  );
  lines.push("");
  lines.push("## Policy");
  lines.push("");
  lines.push("- SHA1 hash index of majors (excluding `others/legacy/recovery`)");
  lines.push("- Recovery file skipped if hash already present anywhere (no duplication)");
  lines.push("- New hash only: classify into marketing|catalog|planner|studio|others");
  lines.push("- Dest conflict: keep larger; webp preferred; loser → `_originals/` if unique hash");
  lines.push("- Second pass: multi-path same hash → keep canonical, delete extras");
  lines.push("- Then delete recovery tree when `--delete-recovery`");
  lines.push("");
  lines.push("## A. Index");
  lines.push("");
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|------:|`);
  lines.push(`| Files hashed | ${stats.indexFiles} |`);
  lines.push(`| Unique hashes | ${stats.indexUniqueHashes} |`);
  lines.push(`| Bytes hashed | ${((stats.indexBytes || 0) / 1e9).toFixed(3)} GB |`);
  lines.push("");
  lines.push("## B. Merge recovery");
  lines.push("");
  lines.push(`| Metric | Count |`);
  lines.push(`|--------|------:|`);
  lines.push(`| Files processed | ${stats.processed} |`);
  lines.push(`| **Copied (new hash)** | **${stats.actions.copied}** |`);
  lines.push(`| Copied bytes | ${(stats.copiedBytes / 1e6).toFixed(1)} MB |`);
  lines.push(`| Skipped hash-dup | ${stats.actions.skipped_hash_dup} |`);
  lines.push("| Parked `_originals` | " + stats.actions.parked_originals + " |");
  lines.push(`| Parked replaced dest | ${stats.actions.parked_replaced} |`);
  lines.push(`| Skipped webp prefer | ${stats.actions.skipped_webp_prefer} |`);
  lines.push(`| Skipped dest larger | ${stats.actions.skipped_dest_larger} |`);
  lines.push(`| Skipped non-media | ${stats.actions.skipped_non_media} |`);
  lines.push(`| Skip recovery-self | ${stats.actions.skip_recovery_self} |`);
  lines.push(`| Errors | ${stats.actions.error} |`);
  lines.push(`| Stopped low space | ${stats.actions.stopped_low_space} |`);
  lines.push("");
  lines.push("## Copied per major");
  lines.push("");
  lines.push("| Major | Files | MB |");
  lines.push("|-------|------:|---:|");
  for (const [k, v] of Object.entries(stats.byMajor)) {
    lines.push(`| ${k} | ${v.copied} | ${(v.bytes / 1e6).toFixed(1)} |`);
  }
  lines.push("");
  if (stats.dedupe) {
    lines.push("## C. Dedupe within majors");
    lines.push("");
    lines.push(`| Metric | Value |`);
    lines.push(`|--------|------:|`);
    lines.push(`| Scanned | ${stats.dedupe.scanned} |`);
    lines.push(`| Unique hashes | ${stats.dedupe.uniqueHashes} |`);
    lines.push(`| Multi-path groups | ${stats.dedupe.multiHashGroups} |`);
    lines.push(`| **Deleted dupes** | **${stats.dedupe.deleted}** |`);
    lines.push(`| Deleted bytes | ${(stats.dedupe.deletedBytes / 1e6).toFixed(1)} MB |`);
    lines.push("");
  }
  lines.push("## D. Recovery delete");
  lines.push("");
  lines.push(`- recoveryDeleted: **${stats.recoveryDeleted}**`);
  if (stats.recoveryAlreadyGone) lines.push("- was already gone");
  if (stats.recoveryDryWouldDelete) lines.push("- dry run — not deleted");
  lines.push("");
  lines.push("## Files remaining per major (post)");
  lines.push("");
  lines.push("| Major | Files | MB |");
  lines.push("|-------|------:|---:|");
  if (stats.countsAfter) {
    for (const m of MAJORS) {
      const c = stats.countsAfter[m];
      lines.push(`| ${m} | ${c.files} | ${(c.bytes / 1e6).toFixed(1)} |`);
    }
    const r = stats.countsAfter._recovery;
    lines.push(
      `| recovery residual | ${r.files} | ${(r.bytes / 1e6).toFixed(1)} | exists=${r.exists} |`,
    );
  }
  lines.push("");
  lines.push("## Classification (non-dup decisions)");
  lines.push("");
  lines.push("| Class | Count |");
  lines.push("|-------|------:|");
  const classes = Object.entries(stats.byClass).sort((a, b) => b[1] - a[1]);
  for (const [c, n] of classes.slice(0, 80)) {
    lines.push(`| \`${c}\` | ${n} |`);
  }
  lines.push("");
  if (stats.samples.copied.length) {
    lines.push("## Sample copies");
    lines.push("");
    for (const s of stats.samples.copied.slice(0, 25)) {
      lines.push(`- \`${s.action}\` ${s.from} → \`${s.to}\` (${s.bytes} B)`);
    }
    lines.push("");
  }
  if (stats.errors.length) {
    lines.push("## Errors (sample)");
    lines.push("");
    for (const e of stats.errors.slice(0, 30)) {
      lines.push(`- ${e.file}: ${e.error}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

async function main() {
  const started = new Date();
  console.log(
    `[five-majors] repo=${REPO} dry=${DRY} delete-recovery=${DELETE_RECOVERY} skip-dedupe=${SKIP_DEDUPE} limit=${LIMIT || "none"}`,
  );

  const stats = {
    startedAt: started.toISOString(),
    dry: DRY,
    freeStartBytes: 0,
    freeEndBytes: 0,
    processed: 0,
    indexFiles: 0,
    indexUniqueHashes: 0,
    indexBytes: 0,
    byMajor: {
      marketing: { copied: 0, bytes: 0 },
      catalog: { copied: 0, bytes: 0 },
      planner: { copied: 0, bytes: 0 },
      studio: { copied: 0, bytes: 0 },
      others: { copied: 0, bytes: 0 },
    },
    byClass: {},
    actions: {
      copied: 0,
      skipped_hash_dup: 0,
      parked_originals: 0,
      parked_replaced: 0,
      skipped_webp_prefer: 0,
      skipped_dest_larger: 0,
      skipped_non_media: 0,
      skip_recovery_self: 0,
      error: 0,
      stopped_low_space: 0,
    },
    copiedBytes: 0,
    errors: [],
    samples: { copied: [] },
    dedupe: null,
    recoveryDeleted: false,
    countsAfter: null,
  };

  const index = new HashIndex();
  stats.indexFiles = await buildIndex(index);
  stats.indexUniqueHashes = index.map.size;
  stats.indexBytes = index.bytesHashed;

  await mergeRecovery(index, stats);

  if (!SKIP_DEDUPE) {
    await dedupeMajors(stats);
  } else {
    console.log("[C] skipped");
  }

  if (DELETE_RECOVERY) {
    await deleteRecovery(stats);
  } else {
    console.log("[D] skipped (pass --delete-recovery to remove)");
  }

  stats.countsAfter = await countPerMajor();
  try {
    stats.freeEndBytes = await freeBytesOnDrive(ASSETS);
  } catch {
    stats.freeEndBytes = 0;
  }
  stats.endedAt = new Date().toISOString();
  stats.durationSec = Math.round((Date.now() - started.getTime()) / 1000);

  await ensureDir(LOG_DIR);
  const jsonPath = path.join(LOG_DIR, "FIVE-MAJORS-DEDUP-LOG.json");
  const mdPath = path.join(LOG_DIR, "FIVE-MAJORS-DEDUP-LOG.md");
  await fs.writeFile(jsonPath, JSON.stringify(stats, null, 2), "utf8");
  await fs.writeFile(mdPath, renderMarkdown(stats), "utf8");

  console.log("\n========== FIVE-MAJORS SUMMARY ==========");
  console.log(`index:     ${stats.indexFiles} files / ${stats.indexUniqueHashes} hashes`);
  console.log(`processed: ${stats.processed}`);
  console.log(`copied:    ${stats.actions.copied} (${(stats.copiedBytes / 1e6).toFixed(1)} MB)`);
  console.log(`hash-dup:  ${stats.actions.skipped_hash_dup}`);
  console.log(`parked:    ${stats.actions.parked_originals}`);
  if (stats.dedupe) console.log(`dedupe del:${stats.dedupe.deleted}`);
  console.log(`recovery:  deleted=${stats.recoveryDeleted}`);
  console.log("remaining:");
  for (const m of MAJORS) {
    const c = stats.countsAfter[m];
    console.log(`  ${m}: ${c.files} files (${(c.bytes / 1e6).toFixed(1)} MB)`);
  }
  console.log(
    `  recovery residual: ${stats.countsAfter._recovery.files} exists=${stats.countsAfter._recovery.exists}`,
  );
  console.log(
    `free: ${(stats.freeStartBytes / 1e9).toFixed(2)} → ${(stats.freeEndBytes / 1e9).toFixed(2)} GB`,
  );
  console.log(`log: ${mdPath}`);
  console.log(`json: ${jsonPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
