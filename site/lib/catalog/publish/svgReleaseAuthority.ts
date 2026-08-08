/**
 * Live released-SVG authority mode (owner model).
 *
 * | Environment | Released SVG authority |
 * |-------------|------------------------|
 * | Dev / local / test | **disk** (temp authoring) unless `SVG_RELEASE_AUTHORITY=db` |
 * | Production (`NODE_ENV=production`) | **db only** — disk never release authority |
 *
 * - `disk`: inventory + public/svg-catalog are local temp authoring authority.
 * - `db`: storage / Products DB is public release authority (no disk override).
 *
 * Disk S4 (`public/svg-catalog`) writes only run in local dev/test
 * (`NODE_ENV=development|test`) unless forced off with `SVG_DISK_WRITE=0`.
 * Production never writes catalog SVG bytes to disk (even if `SVG_DISK_WRITE=1`).
 *
 * The same dev-disk / live-web split governs the PNG dev mirror — see
 * `isPngDevMirrorWriteEnabled`.
 *
 * **Phase 7 Stage A:** every `public/svg-catalog` mention in this module is a
 * labelled legacy write gate. The live publish path (`publishToStorageAction`)
 * emits PNG bytes and never calls the SVG disk writer.
 */

export type SvgReleaseAuthority = "disk" | "db";

export type SvgDualWriteModeForAuthority =
  | "enabled"
  | "skipped_no_db"
  | "skipped_r2_unavailable"
  | "skipped_schema_missing";

/**
 * Injectable env bag for authority helpers. Wider than `NodeJS.ProcessEnv`
 * because Next marks `NODE_ENV` required/readonly and tests pass partial bags
 * (including unknown values like `"staging"`).
 */
export type SvgAuthorityEnv = Readonly<Record<string, string | undefined>>;

export function getSvgReleaseAuthority(
  env: SvgAuthorityEnv = process.env,
): SvgReleaseAuthority {
  const raw = env.SVG_RELEASE_AUTHORITY?.trim().toLowerCase() ?? "";
  if (raw === "db" || raw === "database" || raw === "r2") {
    return "db";
  }
  const nodeEnv = env.NODE_ENV?.trim().toLowerCase() ?? "";
  // Owner model: deploy/production is DB-only — never disk as release authority.
  if (nodeEnv === "production") {
    return "db";
  }
  return "disk";
}

export function isDbSvgReleaseAuthority(
  env: SvgAuthorityEnv = process.env,
): boolean {
  return getSvgReleaseAuthority(env) === "db";
}

function isDevOrTestNodeEnv(env: SvgAuthorityEnv): boolean {
  const nodeEnv = env.NODE_ENV?.trim().toLowerCase() ?? "";
  return nodeEnv === "development" || nodeEnv === "test";
}

/**
 * Legacy dual-write flag. Owner model does **not** use dual-write
 * (dev=disk, prod=db). Kept off unless an old script sets `SVG_DUAL_WRITE=1`.
 */
export function isSvgDualWriteEnabled(
  env: SvgAuthorityEnv = process.env,
): boolean {
  const raw = env.SVG_DUAL_WRITE?.trim().toLowerCase() ?? "";
  return raw === "1" || raw === "true" || raw === "on" || raw === "yes";
}

/**
 * Whether publish may write `public/svg-catalog/{slug}.svg` (S4).
 *
 * - `SVG_DISK_WRITE=0|false|off|no` → never
 * - `NODE_ENV=production` → never (even if `SVG_DISK_WRITE=1`)
 * - `SVG_DISK_WRITE=1` → on in development/test only
 * - unset + `SVG_RELEASE_AUTHORITY=db` → off
 * - unset + development/test → on (local `pnpm run dev` only)
 * - unset + production/scripts → off
 */
export function isSvgCatalogDiskWriteEnabled(
  env: SvgAuthorityEnv = process.env,
): boolean {
  const raw = env.SVG_DISK_WRITE?.trim().toLowerCase() ?? "";
  if (raw === "0" || raw === "false" || raw === "off" || raw === "no") {
    return false;
  }
  const nodeEnv = env.NODE_ENV?.trim().toLowerCase() ?? "";
  if (nodeEnv === "production") {
    return false;
  }
  if (raw === "1" || raw === "true" || raw === "on" || raw === "yes") {
    return isDevOrTestNodeEnv(env);
  }
  if (getSvgReleaseAuthority(env) === "db") {
    return false;
  }
  return isDevOrTestNodeEnv(env);
}

/**
 * Whether a publish may write the PNG dev mirror
 * (`site/public/png-catalog/{slug}.png`) and the shape-draft disk mirror.
 *
 * Owner model, made explicit: **dev writes to disk, live writes to the web.**
 * Storage remains the byte authority in both (L7) — this only governs the local
 * mirror, which is never release authority.
 *
 * - `PNG_DISK_MIRROR=0|false|off|no` → never
 * - `NODE_ENV=production` → never (production is web-only; do not touch the FS)
 * - `PNG_DISK_MIRROR=1|true|on|yes` → on in development/test only
 * - unset + development/test → on
 * - unset + anything else (scripts, unknown NODE_ENV) → off
 */
export function isPngDevMirrorWriteEnabled(
  env: SvgAuthorityEnv = process.env,
): boolean {
  const raw = env.PNG_DISK_MIRROR?.trim().toLowerCase() ?? "";
  if (raw === "0" || raw === "false" || raw === "off" || raw === "no") {
    return false;
  }
  const nodeEnv = env.NODE_ENV?.trim().toLowerCase() ?? "";
  if (nodeEnv === "production") {
    return false;
  }
  if (raw === "1" || raw === "true" || raw === "on" || raw === "yes") {
    return isDevOrTestNodeEnv(env);
  }
  return isDevOrTestNodeEnv(env);
}

/**
 * Legacy gate for old dual-write pipeline callers.
 * Owner model never requires dual-write — always returns null unless a caller
 * explicitly enables `SVG_DUAL_WRITE=1` and deps are missing.
 */
export function getDbReleaseAuthorityDualWriteBlockError(input: {
  readonly dualWriteReady: boolean;
  readonly mode?: SvgDualWriteModeForAuthority;
  readonly productsDbConfigured?: boolean;
  readonly env?: SvgAuthorityEnv;
}): string | null {
  if (!isDbSvgReleaseAuthority(input.env)) {
    return null;
  }
  if (!isSvgDualWriteEnabled(input.env)) {
    return null;
  }
  if (input.dualWriteReady) {
    return null;
  }
  if (input.mode === "skipped_no_db") {
    return "DB release authority requires PRODUCTS_DATABASE_URL";
  }
  if (input.mode === "skipped_r2_unavailable") {
    return "DB release authority requires reachable R2 catalog storage";
  }
  if (input.mode === "skipped_schema_missing") {
    return "DB release authority requires planner_managed_products.published_svg_revision_id (run db:apply)";
  }
  if (input.productsDbConfigured === false) {
    return "DB release authority requires PRODUCTS_DATABASE_URL";
  }
  return "DB release authority requires reachable R2 catalog storage";
}
