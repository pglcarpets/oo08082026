/**
 * Mirror site/public/assets/ → Cloudflare R2 with SAME relative keys
 * (no extra "assets/" prefix — keys are catalog/…, marketing/…).
 *
 * Default is dry-run. --apply uploads.
 * Refuses --apply if path-map.generated.json is missing (run asset-path-map first).
 * Exits cleanly with a message if R2 credentials are missing.
 *
 * Usage:
 *   pnpm exec node scripts/mirror-assets-to-r2.mjs --dry
 *   pnpm exec node scripts/mirror-assets-to-r2.mjs --apply --bucket=oando-asset-cdn
 *   pnpm exec node scripts/mirror-assets-to-r2.mjs --dry --limit=20
 *
 * Env (from .env.local): CLOUDFLARE_R2_* / CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_S3_URL
 * Same intact-pair pattern as scripts/count-r2-objects.mjs
 *
 * Report: results/asset-cutover/mirror-r2-report.json
 */
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS_ROOT = join(ROOT, "site", "public", "assets");
const FORWARD_MAP_PATH = join(ROOT, "results", "asset-cutover", "path-map.generated.json");
const REPORT_PATH = join(ROOT, "plans", "asset-cutover", "mirror-r2-report.json");

/** Skip junk / quarantine when publishing CDN. */
const SKIP_DIR_NAMES = new Set([
  "_inbox",
  "_quarantine",
  "backups",
  "node_modules",
  ".git",
]);

loadDotenv({ path: join(ROOT, ".env.local") });
loadDotenv({ path: join(ROOT, "site", ".env.local") });

/**
 * Intact S3 pair only — never mix R2_* access with ACCESS_* secret.
 * (Same rule as count-r2-objects.mjs)
 */
function resolveIntactCredentials() {
  const pairs = [
    [
      process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      "cloudflare-r2",
    ],
    [
      process.env.CLOUDFLARE_ACCESS_KEY_ID,
      process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
      "cloudflare-access",
    ],
    [
      process.env.CLOULD_ACCESS_KEY_ID,
      process.env.CLOULDFLARE_S3_SECRET_ACCESS_KEY,
      "legacy-typo",
    ],
  ];
  for (const [access, secret, source] of pairs) {
    const accessKeyId = access?.trim() ?? "";
    const secretAccessKey = secret?.trim() ?? "";
    if (accessKeyId && secretAccessKey) {
      return { accessKeyId, secretAccessKey, source };
    }
  }
  return null;
}

function resolveEndpoint() {
  return (
    process.env.CLOUDFLARE_S3_URL?.trim() ||
    process.env.CLOULDFLARE_S3_URL?.trim() ||
    (process.env.CLOUDFLARE_ACCOUNT_ID
      ? `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : null)
  );
}

function contentType(file) {
  const e = extname(file).toLowerCase();
  if (e === ".webp") return "image/webp";
  if (e === ".jpg" || e === ".jpeg") return "image/jpeg";
  if (e === ".png") return "image/png";
  if (e === ".svg") return "image/svg+xml";
  if (e === ".gif") return "image/gif";
  if (e === ".json") return "application/json";
  if (e === ".glb") return "model/gltf-binary";
  if (e === ".woff2") return "font/woff2";
  if (e === ".woff") return "font/woff";
  if (e === ".otf") return "font/otf";
  if (e === ".ttf") return "font/ttf";
  return "application/octet-stream";
}

/**
 * @param {string} dir
 * @param {{ key: string, abs: string, size: number }[]} [acc]
 */
function walkAssets(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === ".gitkeep") continue;
    const abs = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (SKIP_DIR_NAMES.has(ent.name)) continue;
      walkAssets(abs, acc);
    } else {
      const rel = relative(ASSETS_ROOT, abs).split("\\").join("/");
      // Keys = relative under assets/ (catalog/..., marketing/...) — no assets/ prefix
      acc.push({ key: rel, abs, size: statSync(abs).size });
    }
  }
  return acc;
}

function parseArgs(argv) {
  let dry = true;
  let apply = false;
  let bucket =
    process.env.CLOUDFLARE_R2_CATALOG_BUCKET?.trim() ||
    process.env.CLOUDFLARE_R2_BUCKET?.trim() ||
    "oando-asset-cdn";
  let limit = 0;
  let help = false;

  for (const a of argv) {
    if (a === "--help" || a === "-h") help = true;
    else if (a === "--apply") {
      apply = true;
      dry = false;
    } else if (a === "--dry") {
      dry = true;
      apply = false;
    } else if (a.startsWith("--bucket=")) {
      bucket = a.slice("--bucket=".length).trim() || bucket;
    } else if (a.startsWith("--limit=")) {
      limit = Math.max(0, Number(a.slice("--limit=".length)) || 0);
    }
  }
  return { dry, apply, bucket, limit, help };
}

function printHelp() {
  console.log(`mirror-assets-to-r2.mjs — upload site/public/assets → R2

Usage:
  pnpm exec node scripts/mirror-assets-to-r2.mjs [--dry|--apply] [--bucket=NAME] [--limit=N]

Keys: relative paths under assets/ (catalog/…, marketing/…) — does not double "assets/".
Default: --dry
--apply requires results/asset-cutover/path-map.generated.json (run asset-path-map.mjs first).
`);
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  if (flags.help) {
    printHelp();
    process.exit(0);
  }

  if (!existsSync(ASSETS_ROOT)) {
    console.error(`Missing assets root: ${ASSETS_ROOT}`);
    process.exit(1);
  }

  if (flags.apply && !existsSync(FORWARD_MAP_PATH)) {
    console.error(
      "Refusing --apply: path-map.generated.json missing.\n" +
        "Run first: pnpm exec node scripts/asset-path-map.mjs\n" +
        `Expected: ${relative(ROOT, FORWARD_MAP_PATH)}`,
    );
    process.exit(1);
  }

  const endpoint = resolveEndpoint();
  const credentials = resolveIntactCredentials();

  if (!endpoint || !credentials) {
    console.error(
      "Missing R2 endpoint or intact S3 pair.\n" +
        "Need CLOUDFLARE_ACCOUNT_ID (or CLOUDFLARE_S3_URL) and\n" +
        "CLOUDFLARE_R2_ACCESS_KEY_ID + CLOUDFLARE_R2_SECRET_ACCESS_KEY in .env.local.\n" +
        "Skipping mirror (no credentials).",
    );
    const skipReport = {
      generatedAt: new Date().toISOString(),
      skipped: true,
      reason: "missing-r2-credentials",
      mode: flags.apply ? "apply" : "dry",
      bucket: flags.bucket,
    };
    mkdirSync(dirname(REPORT_PATH), { recursive: true });
    writeFileSync(REPORT_PATH, JSON.stringify(skipReport, null, 2) + "\n");
    process.exit(0);
  }

  let files = walkAssets(ASSETS_ROOT);
  const totalFound = files.length;
  if (flags.limit > 0) {
    files = files.slice(0, flags.limit);
  }

  console.log(
    JSON.stringify(
      {
        mode: flags.apply ? "apply" : "dry",
        bucket: flags.bucket,
        credentialSource: credentials.source,
        assetsRoot: relative(ROOT, ASSETS_ROOT),
        totalFound,
        planned: files.length,
        limit: flags.limit || null,
        mapPresent: existsSync(FORWARD_MAP_PATH),
      },
      null,
      2,
    ),
  );

  /** @type {object} */
  const report = {
    generatedAt: new Date().toISOString(),
    skipped: false,
    mode: flags.apply ? "apply" : "dry",
    bucket: flags.bucket,
    endpoint,
    credentialSource: credentials.source,
    assetsRoot: relative(ROOT, ASSETS_ROOT).split("\\").join("/"),
    totalFound,
    planned: files.length,
    limit: flags.limit || null,
    uploaded: 0,
    failed: 0,
    bytesPlanned: files.reduce((s, f) => s + f.size, 0),
    sampleKeys: files.slice(0, 12).map((f) => f.key),
    errors: /** @type {string[]} */ ([]),
  };

  if (!flags.apply) {
    console.log(
      `dry-run: would upload ${files.length} objects (${report.bytesPlanned} bytes) to s3://${flags.bucket}/`,
    );
    mkdirSync(dirname(REPORT_PATH), { recursive: true });
    writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + "\n");
    console.log(`report: ${relative(ROOT, REPORT_PATH)}`);
    return;
  }

  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    },
    forcePathStyle: true,
  });

  let i = 0;
  for (const file of files) {
    i++;
    try {
      await client.send(
        new PutObjectCommand({
          Bucket: flags.bucket,
          Key: file.key,
          Body: createReadStream(file.abs),
          ContentType: contentType(file.abs),
        }),
      );
      report.uploaded++;
      if (report.uploaded % 50 === 0 || report.uploaded === files.length) {
        console.log(`upload ${report.uploaded}/${files.length}`);
      }
    } catch (e) {
      report.failed++;
      const msg = e instanceof Error ? e.message : String(e);
      report.errors.push(`${file.key}: ${msg}`);
      console.error("UP_FAIL", file.key, msg);
    }
  }

  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + "\n");
  console.log(
    `done uploaded=${report.uploaded} failed=${report.failed} report=${relative(ROOT, REPORT_PATH)}`,
  );
  if (report.failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
