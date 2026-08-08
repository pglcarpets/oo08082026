/**
 * Operator tool (Phase 5 D6): compare storage descriptor.json against the
 * active release record (disk descriptor or block_descriptors row).
 *
 * Usage (repo root):
 *   node scripts/verify-png-release.mjs --slug=oando-linear-desk-1600
 *   node scripts/verify-png-release.mjs --slug=… --authority=disk
 *   node scripts/verify-png-release.mjs --slug=… --authority=db
 *
 * Exit 0 = match; exit 1 = drift or missing side; exit 2 = usage / config error.
 */
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Module from "node:module";

const require = createRequire(import.meta.url);
require("./general/loadEnvLocal.cjs").loadEnvLocal();

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "server-only") {
    return {};
  }
  return originalLoad(request, parent, isMain);
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const slugFlag = argv.find((a) => a.startsWith("--slug="));
  const authorityFlag = argv.find((a) => a.startsWith("--authority="));
  const slug = slugFlag?.slice("--slug=".length).trim() || "";
  const authority =
    authorityFlag?.slice("--authority=".length).trim().toLowerCase() || "auto";
  return { slug, authority };
}

function readDiskDescriptor(slug) {
  const candidates = [
    path.join(repoRoot, "site", "inventory", "descriptors", `${slug}.json`),
    path.join(repoRoot, "inventory", "descriptors", `${slug}.json`),
  ];
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    try {
      return { path: file, descriptor: JSON.parse(readFileSync(file, "utf8")) };
    } catch (error) {
      return { path: file, error: String(error?.message ?? error) };
    }
  }
  return { path: candidates[0], error: "missing" };
}

function pointerFields(descriptor) {
  if (!descriptor || typeof descriptor !== "object") {
    return { planSymbolPngUrl: null, planSymbolPngChecksum: null, planSymbolMime: null };
  }
  return {
    planSymbolPngUrl: descriptor.planSymbolPngUrl ?? null,
    planSymbolPngChecksum: descriptor.planSymbolPngChecksum ?? null,
    planSymbolMime: descriptor.planSymbolMime ?? null,
  };
}

function comparePointers(storage, release) {
  const a = pointerFields(storage);
  const b = pointerFields(release);
  const drifts = [];
  for (const key of Object.keys(a)) {
    if (a[key] !== b[key]) {
      drifts.push({ field: key, storage: a[key], release: b[key] });
    }
  }
  return drifts;
}

export async function verifyPngRelease({ slug, authority = "auto", deps }) {
  if (!slug) {
    return { ok: false, code: 2, error: "Provide --slug=<descriptor-slug>" };
  }

  const storagePath = `planner-symbols/${slug}/descriptor.json`;
  const storage = await deps.downloadCatalogAssetText({ path: storagePath });
  if (!storage.ok) {
    return {
      ok: false,
      code: 1,
      error: `storage_descriptor: ${storage.reason}`,
      storagePath,
    };
  }

  let storageDescriptor;
  try {
    storageDescriptor = JSON.parse(storage.body);
  } catch (error) {
    return {
      ok: false,
      code: 1,
      error: `storage_descriptor_json: ${error?.message ?? error}`,
      storagePath,
    };
  }

  const resolvedAuthority =
    authority === "auto" ? deps.getSvgReleaseAuthority() : authority;

  let releaseDescriptor = null;
  let releaseSource = "";

  if (resolvedAuthority === "disk") {
    const disk = deps.readDiskDescriptor(slug);
    if (disk.error) {
      return {
        ok: false,
        code: 1,
        error: `disk_release: ${disk.error}`,
        storagePath,
        releasePath: disk.path,
      };
    }
    releaseDescriptor = disk.descriptor;
    releaseSource = disk.path;
  } else if (resolvedAuthority === "db") {
    const row = await deps.readBlockDescriptorRow(slug);
    if (!row.ok) {
      return {
        ok: false,
        code: 1,
        error: `db_release: ${row.error}`,
        storagePath,
      };
    }
    releaseDescriptor = row.descriptor;
    releaseSource = `block_descriptors:${slug}`;
  } else {
    return {
      ok: false,
      code: 2,
      error: `unknown authority: ${resolvedAuthority}`,
    };
  }

  const drifts = comparePointers(storageDescriptor, releaseDescriptor);
  if (drifts.length > 0) {
    return {
      ok: false,
      code: 1,
      error: "pointer_drift",
      authority: resolvedAuthority,
      storagePath,
      releaseSource,
      drifts,
      storage: pointerFields(storageDescriptor),
      release: pointerFields(releaseDescriptor),
    };
  }

  return {
    ok: true,
    code: 0,
    authority: resolvedAuthority,
    storagePath,
    releaseSource,
    pointers: pointerFields(storageDescriptor),
  };
}

/**
 * Site TS modules — relative URL from this script. Requires `node --import tsx`
 * (CLI re-execs). Avoid bare Windows absolute paths (ERR_UNSUPPORTED_ESM_URL_SCHEME).
 *
 * @param {string} relativeUnderSite
 */
async function importSiteTsModule(relativeUnderSite) {
  const specifier = new URL(
    `../site/${relativeUnderSite.replace(/\\/g, "/")}`,
    import.meta.url,
  ).href;
  return import(specifier);
}

async function buildDefaultDeps() {
  const { downloadCatalogAssetText } = await importSiteTsModule(
    "features/shared/catalog/catalogAssetStorage.server.ts",
  );
  const { getSvgReleaseAuthority } = await importSiteTsModule(
    "lib/catalog/publish/svgReleaseAuthority.ts",
  );

  async function readBlockDescriptorRow(slug) {
    try {
      const { productsDb } = await importSiteTsModule(
        "platform/drizzle/productsDb.ts",
      );
      const { blockDescriptors } = await importSiteTsModule(
        "platform/drizzle/schema/catalog.ts",
      );
      const { eq } = await import("drizzle-orm");
      const rows = await productsDb
        .select({ descriptor: blockDescriptors.descriptor })
        .from(blockDescriptors)
        .where(eq(blockDescriptors.slug, slug))
        .limit(1);
      if (!rows[0]) {
        return { ok: false, error: "row_missing" };
      }
      return { ok: true, descriptor: rows[0].descriptor };
    } catch (error) {
      return { ok: false, error: String(error?.message ?? error) };
    }
  }

  return {
    downloadCatalogAssetText,
    getSvgReleaseAuthority: () => getSvgReleaseAuthority(),
    readDiskDescriptor,
    readBlockDescriptorRow,
  };
}

/**
 * @returns {boolean} true if this process should stop (child already ran)
 */
function reexecWithTsxIfNeeded() {
  if (process.env.VERIFY_PNG_RELEASE_TSX === "1") {
    return false;
  }
  const { spawnSync } = require("node:child_process");
  const scriptPath = fileURLToPath(import.meta.url);
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", scriptPath, ...process.argv.slice(2)],
    {
      stdio: "inherit",
      env: { ...process.env, VERIFY_PNG_RELEASE_TSX: "1" },
      cwd: repoRoot,
    },
  );
  process.exit(result.status ?? 1);
  return true;
}

/**
 * Exit without racing Windows libuv handle teardown (undici/supabase keep-alive
 * sockets already CLOSING when process.exit runs → UV_HANDLE_CLOSING assert).
 */
async function exitClean(code) {
  process.exitCode = code;
  try {
    const undici = await import("undici");
    const dispatcher = undici.getGlobalDispatcher?.();
    if (dispatcher && typeof dispatcher.close === "function") {
      await dispatcher.close();
    }
  } catch {
    // undici optional / already closed
  }
  // One tick so stdout/stderr flush; avoid process.exit mid-close on win32.
  await new Promise((resolve) => setImmediate(resolve));
  process.exit(code);
}

async function main() {
  const { slug, authority } = parseArgs(process.argv.slice(2));
  if (!slug) {
    console.error("Usage: node scripts/verify-png-release.mjs --slug=<slug> [--authority=disk|db|auto]");
    await exitClean(2);
    return;
  }

  reexecWithTsxIfNeeded();

  const deps = await buildDefaultDeps();
  const result = await verifyPngRelease({ slug, authority, deps });
  if (result.ok) {
    console.log(
      `verify-png-release OK slug=${slug} authority=${result.authority} release=${result.releaseSource}`,
    );
    console.log(JSON.stringify(result.pointers, null, 2));
    await exitClean(0);
    return;
  }
  console.error(`verify-png-release FAIL: ${result.error}`);
  if (result.drifts) {
    console.error(JSON.stringify(result.drifts, null, 2));
  }
  await exitClean(result.code ?? 1);
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  main().catch((error) => {
    console.error(error);
    process.exit(2);
  });
}
