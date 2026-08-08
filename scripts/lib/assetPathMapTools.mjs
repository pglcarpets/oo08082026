/**
 * Shared helpers for asset path-map rewrite scripts.
 * Map source of truth: results/asset-cutover/path-map.generated.json
 * (built by scripts/asset-path-map.mjs).
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { config as loadDotenv } from "dotenv";

const here = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(here, "..", "..");
export const OUT_DIR = join(REPO_ROOT, "results", "asset-cutover");
export const FORWARD_MAP_PATH = join(OUT_DIR, "path-map.generated.json");
export const REVERSE_MAP_PATH = join(OUT_DIR, "path-map-reverse.generated.json");

/** Code roots for path-string rewrites (ts/tsx/json only). */
export const CODE_ROOTS = [
  "site/features",
  "site/i18n/messages",
  "site/components",
  "tests",
];

const CODE_EXT = /\.(ts|tsx|json)$/i;

/**
 * @param {string[]} argv
 */
export function parseRewriteFlags(argv) {
  /** @type {{ dry: boolean, apply: boolean, code: boolean, db: boolean, all: boolean, help: boolean }} */
  const flags = {
    dry: true,
    apply: false,
    code: false,
    db: false,
    all: false,
    help: false,
  };
  for (const a of argv) {
    if (a === "--help" || a === "-h") flags.help = true;
    else if (a === "--apply") {
      flags.apply = true;
      flags.dry = false;
    } else if (a === "--dry") {
      flags.dry = true;
      flags.apply = false;
    } else if (a === "--code") flags.code = true;
    else if (a === "--db") flags.db = true;
    else if (a === "--all") flags.all = true;
  }
  if (flags.all) {
    flags.code = true;
    flags.db = true;
  }
  // Default target: code only (works offline without Supabase).
  if (!flags.code && !flags.db && !flags.help) {
    flags.code = true;
  }
  return flags;
}

export function loadEnvLocal() {
  loadDotenv({ path: join(REPO_ROOT, ".env.local") });
  loadDotenv({ path: join(REPO_ROOT, "site", ".env.local") });
}

/**
 * Longest-key-first ordered entries.
 * @param {Record<string, string>} map
 * @returns {[string, string][]}
 */
export function orderMapEntries(map) {
  return Object.entries(map)
    .filter(([from, to]) => typeof from === "string" && typeof to === "string" && from && to && from !== to)
    .sort((a, b) => b[0].length - a[0].length || a[0].localeCompare(b[0]));
}

/**
 * Apply path map with placeholders so replacements cannot re-match other keys.
 * @param {string} text
 * @param {[string, string][]} orderedEntries longest-first
 */
export function applyPathMap(text, orderedEntries) {
  if (!text || typeof text !== "string") {
    return { text, hits: 0, hitKeys: /** @type {Record<string, number>} */ ({}) };
  }
  let out = text;
  /** @type {string[]} */
  const tokens = [];
  /** @type {Record<string, number>} */
  const hitKeys = {};

  for (const [from, to] of orderedEntries) {
    if (!out.includes(from)) continue;
    const parts = out.split(from);
    const count = parts.length - 1;
    if (count <= 0) continue;
    const token = `\0§PM${tokens.length}§\0`;
    tokens.push(to);
    out = parts.join(token);
    hitKeys[from] = (hitKeys[from] || 0) + count;
  }

  for (let i = 0; i < tokens.length; i++) {
    out = out.split(`\0§PM${i}§\0`).join(tokens[i]);
  }

  const hits = Object.values(hitKeys).reduce((a, b) => a + b, 0);
  return { text: out, hits, hitKeys };
}

/**
 * Load forward map; build via asset-path-map if missing.
 * @param {{ rebuild?: boolean }} [opts]
 */
export async function loadForwardMap(opts = {}) {
  if (!opts.rebuild && existsSync(FORWARD_MAP_PATH)) {
    const raw = JSON.parse(readFileSync(FORWARD_MAP_PATH, "utf8"));
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      return /** @type {Record<string, string>} */ (raw);
    }
  }

  console.warn(
    `[path-map] ${relative(REPO_ROOT, FORWARD_MAP_PATH)} missing or invalid — building via asset-path-map.mjs`,
  );
  const { buildPathMap } = await import("../asset-path-map.mjs");
  const { map } = buildPathMap();
  const ordered = Object.fromEntries(orderMapEntries(map));
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(FORWARD_MAP_PATH, JSON.stringify(ordered, null, 2) + "\n", "utf8");
  return ordered;
}

/**
 * Invert forward map. Collisions: keep the longest old path as reverse target.
 * @param {Record<string, string>} forward
 */
export function invertPathMap(forward) {
  /** @type {Record<string, string>} */
  const rev = {};
  /** @type {{ newPath: string, kept: string, dropped: string }[]} */
  const conflicts = [];

  for (const [from, to] of Object.entries(forward)) {
    if (typeof from !== "string" || typeof to !== "string" || !from || !to || from === to) {
      continue;
    }
    if (rev[to] && rev[to] !== from) {
      const kept = from.length >= rev[to].length ? from : rev[to];
      const dropped = kept === from ? rev[to] : from;
      conflicts.push({ newPath: to, kept, dropped });
      rev[to] = kept;
    } else {
      rev[to] = from;
    }
  }

  const ordered = Object.fromEntries(orderMapEntries(rev));
  return { map: ordered, conflicts };
}

/**
 * Load reverse map from disk, or invert forward map (and optionally write reverse).
 * @param {{ write?: boolean }} [opts]
 */
export async function loadReverseMap(opts = {}) {
  if (existsSync(REVERSE_MAP_PATH)) {
    const raw = JSON.parse(readFileSync(REVERSE_MAP_PATH, "utf8"));
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      return {
        map: /** @type {Record<string, string>} */ (raw),
        conflicts: [],
        source: REVERSE_MAP_PATH,
      };
    }
  }

  if (!existsSync(FORWARD_MAP_PATH)) {
    throw new Error(
      `Missing path map. Run first:\n  pnpm exec node scripts/asset-path-map.mjs\nExpected: ${relative(REPO_ROOT, FORWARD_MAP_PATH)}`,
    );
  }

  const forward = await loadForwardMap();
  const { map, conflicts } = invertPathMap(forward);
  if (opts.write !== false) {
    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(REVERSE_MAP_PATH, JSON.stringify(map, null, 2) + "\n", "utf8");
  }
  return { map, conflicts, source: "inverted-from-forward" };
}

/**
 * @param {string} dir
 * @param {string[]} [acc]
 */
export function walkCodeFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === "node_modules" || ent.name === ".next" || ent.name === "dist") {
      continue;
    }
    const p = join(dir, ent.name);
    if (ent.isDirectory()) walkCodeFiles(p, acc);
    else if (CODE_EXT.test(ent.name)) acc.push(p);
  }
  return acc;
}

/**
 * Rewrite path strings in code trees.
 * @param {[string, string][]} orderedEntries
 * @param {{ apply: boolean }} opts
 */
export function rewriteCodePaths(orderedEntries, opts) {
  const samples = [];
  let filesScanned = 0;
  let filesTouched = 0;
  let replacementHits = 0;
  /** @type {string[]} */
  const changedFiles = [];

  for (const rootRel of CODE_ROOTS) {
    const rootAbs = join(REPO_ROOT, rootRel);
    const files = walkCodeFiles(rootAbs);
    for (const file of files) {
      filesScanned++;
      const before = readFileSync(file, "utf8");
      const { text: after, hits, hitKeys } = applyPathMap(before, orderedEntries);
      if (hits === 0 || after === before) continue;
      filesTouched++;
      replacementHits += hits;
      const rel = relative(REPO_ROOT, file).split("\\").join("/");
      changedFiles.push(rel);
      if (samples.length < 40) {
        samples.push({
          file: rel,
          hits,
          topKeys: Object.entries(hitKeys)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([k, n]) => ({ from: k, count: n })),
        });
      }
      if (opts.apply) {
        writeFileSync(file, after, "utf8");
      }
    }
  }

  return {
    filesScanned,
    filesWouldChange: filesTouched,
    filesChanged: opts.apply ? filesTouched : 0,
    replacementHits,
    changedFiles,
    samples,
  };
}

/**
 * Products Supabase client (catalog images live on Products project).
 * Uses service role when available.
 */
export function createProductsClient() {
  loadEnvLocal();
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    process.env.PRODUCTS_SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.PRODUCTS_SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    return {
      error:
        "Missing Products Supabase env (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local).",
      client: null,
    };
  }

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return { error: null, client };
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} sb
 */
export async function fetchAllProducts(sb) {
  const pageSize = 500;
  let from = 0;
  /** @type {any[]} */
  const all = [];
  for (;;) {
    const { data, error } = await sb
      .from("products")
      .select("id,slug,images,flagship_image,scene_images")
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data?.length) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

/**
 * @param {unknown} value
 * @param {[string, string][]} orderedEntries
 */
function rewriteValue(value, orderedEntries) {
  if (typeof value === "string") {
    return applyPathMap(value, orderedEntries);
  }
  if (Array.isArray(value)) {
    /** @type {Record<string, number>} */
    const hitKeys = {};
    let hits = 0;
    const next = value.map((item) => {
      if (typeof item !== "string") return item;
      const r = applyPathMap(item, orderedEntries);
      hits += r.hits;
      for (const [k, n] of Object.entries(r.hitKeys)) {
        hitKeys[k] = (hitKeys[k] || 0) + n;
      }
      return r.text;
    });
    return { text: next, hits, hitKeys };
  }
  return { text: value, hits: 0, hitKeys: {} };
}

/**
 * Rewrite products.images / flagship_image / scene_images.
 * @param {[string, string][]} orderedEntries
 * @param {{ apply: boolean }} opts
 */
export async function rewriteDbProductPaths(orderedEntries, opts) {
  const { client, error } = createProductsClient();
  if (!client) {
    return {
      skipped: true,
      reason: error,
      rowsScanned: 0,
      rowsWouldChange: 0,
      rowsChanged: 0,
      replacementHits: 0,
      samples: [],
      errors: [error],
    };
  }

  const products = await fetchAllProducts(client);
  const samples = [];
  /** @type {string[]} */
  const errors = [];
  let rowsWouldChange = 0;
  let rowsChanged = 0;
  let replacementHits = 0;

  for (const row of products) {
    const img = rewriteValue(row.images || [], orderedEntries);
    const flag = rewriteValue(row.flagship_image, orderedEntries);
    const scene = rewriteValue(row.scene_images || [], orderedEntries);
    const hits = img.hits + flag.hits + scene.hits;
    if (hits === 0) continue;

    const imagesChanged =
      JSON.stringify(img.text) !== JSON.stringify(row.images || []);
    const flagChanged = flag.text !== row.flagship_image;
    const sceneChanged =
      JSON.stringify(scene.text) !== JSON.stringify(row.scene_images || []);
    if (!imagesChanged && !flagChanged && !sceneChanged) continue;

    rowsWouldChange++;
    replacementHits += hits;
    if (samples.length < 30) {
      samples.push({
        id: row.id,
        slug: row.slug,
        hits,
        flagship_before: row.flagship_image,
        flagship_after: flag.text,
      });
    }

    if (opts.apply) {
      const { error: upErr } = await client
        .from("products")
        .update({
          images: img.text,
          flagship_image: flag.text ?? null,
          scene_images: scene.text,
        })
        .eq("id", row.id);
      if (upErr) {
        errors.push(`${row.slug || row.id}: ${upErr.message}`);
      } else {
        rowsChanged++;
      }
    }
  }

  return {
    skipped: false,
    rowsScanned: products.length,
    rowsWouldChange,
    rowsChanged: opts.apply ? rowsChanged : 0,
    replacementHits,
    samples,
    errors,
  };
}

/**
 * @param {string} reportPath
 * @param {object} report
 */
export function writeReport(reportPath, report) {
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
}
