/**
 * Phase 02 — svgBlockDescriptorLoader (`§02-LOAD`)
 *
 * The single loader entry point for `BlockDescriptor` JSON files on disk.
 * Reads from `site/inventory/descriptors/{slug}.json` synchronously, validates
 * structure + checksum via the canonical Zod schema (see ./svgTypes), and
 * returns either a typed descriptor or an `PlannerDescriptorError` variant.
 *
 * Re-exports the canonical schema surface (Phase 02 §02-CAT-01: single
 * source-of-truth file). Do NOT re-export the schema from any other path
 * (admin, portal, planner route) — Phase 06 must consume from here.
 *
 * Forbidden:
 *  - `any`, `@ts-ignore` (§02-LOAD-03).
 *  - `unknown` casts anywhere except the `tryLoad` boundary (JSON.parse).
 *  - Path-traversal (`..`, absolute paths) (§02-LOAD-02).
 *  - Reading non-`.json` files (§02-LOAD-02).
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { resolveBlockDescriptorsDir } from "../../paths/sitePackageRoot";

import {
  isLatestPointerFilename,
  isLegacyDescriptorFilename,
  isVersionedDescriptorFilename,
  resolveDescriptorReadPath,
  slugFromLatestPointerFilename,
} from "./descriptorPointer";

import {
  BLOCK_DESCRIPTOR_SLUG_REGEX,
  parseBlockDescriptor,
  toPlannerDescriptorErrorHttp,
  type PlannerDescriptorError,
  type PlannerResult,
} from "./svgTypes";
import type { BlockDescriptor } from "./svgTypes";

/** Loader-side re-exports of the canonical schema (single source rule). */
export {
  BLOCK_DESCRIPTOR_SCHEMA_VERSION,
  BLOCK_DESCRIPTOR_SLUG_REGEX,
  PlannerDescriptorErrorKindSchema,
  parseBlockDescriptor,
  toPlannerDescriptorErrorHttp,
  type BlockDescriptor,
  type PlannerDescriptorError,
  type PlannerResult,
  /** Phase 06 schema surface — keep imports centralized here. */
} from "./svgTypes";

export {
  BlockDescriptorConfigurableSchema,
  BlockDescriptorFixedSchema,
  BlockDescriptorGeometrySchema,
  BlockDescriptorIdentitySchema,
  BlockDescriptorParametricSchema,
  BlockDescriptorSchema,
  BlockDescriptorThemeTokensSchema,
  BlockDescriptorVec2Schema,
  BlockDescriptorViewBoxSchema,
  BlockDescriptorBlockSchema,
  BLOCK_DESCRIPTOR_VARIANTS,
  MountPlaneSchema,
  MountingPointSchema,
  blockDescriptorChecksum,
  canonicalizeBlockDescriptorInput,
  computeBlockDescriptorChecksum,
  freezeFreshDescriptor,
  freezeRewriteDescriptor,
  plannerErr,
  plannerOk,
  type BlockDescriptorConfigurable,
  type BlockDescriptorFixed,
  type BlockDescriptorGeometry,
  type BlockDescriptorIdentity,
  type BlockDescriptorParametric,
  type BlockDescriptorVariant,
  type BlockDescriptorViewBox,
  type BlockDescriptorBlock,
  type MountPlane,
  type MountingPoint,
} from "./svgTypes";

/** Default loader directory pinned to `site/inventory/descriptors/` (cwd-safe). */
export const BLOCK_DESCRIPTORS_DIR_DEFAULT = resolveBlockDescriptorsDir();

/** Type guard for `unknown` inputs at the loader boundary (JSON.parse). */
function isPromiseLikeRejectReason(value: unknown): value is { message: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof (value as { message: unknown }).message === "string"
  );
}

/**
 * Reject paths that escape the loader directory or violate the slug format.
 * Centralized so traversal attempts cannot reach the disk layer.
 */
function validateSlug(slug: unknown): PlannerResult<string, PlannerDescriptorError> {
  if (typeof slug !== "string") {
    return {
      ok: false,
      error: {
        kind: "invalid",
        code: "422.invalid",
        fieldPath: "slug",
        message: "slug must be a string",
        issues: [{ path: "slug", message: "expected string" }],
      },
    };
  }
  if (!BLOCK_DESCRIPTOR_SLUG_REGEX.test(slug)) {
    return {
      ok: false,
      error: {
        kind: "invalid",
        code: "422.invalid",
        fieldPath: "slug",
        message: `slug "${slug}" does not match required pattern ^[a-z][a-z0-9-]{1,63}$`,
        issues: [{ path: "slug", message: "slug does not match kebab regex" }],
      },
    };
  }
  return { ok: true, value: slug };
}

/** Read a single JSON file from the loader directory. Strict boundary check. */
function readDescriptorFile(
  slug: string,
  dir: string,
): PlannerResult<string, PlannerDescriptorError> {
  let resolved: string | null;
  try {
    resolved = resolveDescriptorReadPath(slug, dir);
  } catch {
    return {
      ok: false,
      error: {
        kind: "invalid",
        code: "422.invalid",
        fieldPath: "slug",
        message: `slug "${slug}" could not be resolved against ${dir}`,
        issues: [{ path: "slug", message: "slug resolution failed" }],
      },
    };
  }
  if (!resolved) {
    return {
      ok: false,
      error: {
        kind: "notFound",
        code: "404.not_found",
        fieldPath: `slug:${slug}`,
        message: `Block descriptor "${slug}" not found in ${dir}`,
        slug,
      },
    };
  }
  const dirNormalized = path.resolve(dir);
  if (
    !resolved.startsWith(dirNormalized + path.sep) &&
    resolved !== dirNormalized
  ) {
    return {
      ok: false,
      error: {
        kind: "invalid",
        code: "422.invalid",
        fieldPath: "slug",
        message: `slug "${slug}" escapes the loader directory`,
        issues: [{ path: "slug", message: "path traversal attempt rejected" }],
      },
    };
  }
  let stats;
  try {
    stats = statSync(resolved);
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    return {
      ok: false,
      error: {
        kind: "invalid",
        code: "422.invalid",
        fieldPath: `slug:${slug}`,
        message: `Block descriptor "${slug}" could not be stat'd: ${detail}`,
        issues: [{ path: "slug", message: detail }],
      },
    };
  }
  if (!stats.isFile()) {
    return {
      ok: false,
      error: {
        kind: "invalid",
        code: "422.invalid",
        fieldPath: `slug:${slug}`,
        message: `Block descriptor path "${resolved}" is not a regular file`,
        issues: [{ path: "slug", message: "expected file" }],
      },
    };
  }
  if (!resolved.endsWith(".json")) {
    return {
      ok: false,
      error: {
        kind: "invalid",
        code: "422.invalid",
        fieldPath: `slug:${slug}`,
        message: `Block descriptor path "${resolved}" extension must be .json`,
        issues: [{ path: "slug", message: "expected .json extension" }],
      },
    };
  }

  let contents: string;
  try {
    contents = readFileSync(resolved, "utf8");
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    return {
      ok: false,
      error: {
        kind: "invalid",
        code: "422.invalid",
        fieldPath: `slug:${slug}`,
        message: `Block descriptor "${slug}" could not be read: ${detail}`,
        issues: [{ path: "slug", message: detail }],
      },
    };
  }
  return { ok: true, value: contents };
}

/**
 * Boundary function. Accepts a slug plus optional `{ dir }`, reads the
 * descriptor from disk, parses JSON, and validates via the canonical Zod
 * `BlockDescriptorSchema` parser. Returns a discriminated `Result` whose
 * `error` is one of the four `PlannerDescriptorError` variants.
 */
export function tryLoad(
  slug: string,
  options?: { dir?: string },
): PlannerResult<BlockDescriptor, PlannerDescriptorError> {
  const slugCheck = validateSlug(slug);
  if (slugCheck.ok === false) {
    return slugCheck;
  }

  const dir = options?.dir ?? BLOCK_DESCRIPTORS_DIR_DEFAULT;
  const fileResult = readDescriptorFile(slugCheck.value, dir);
  if (fileResult.ok === false) {
    return fileResult;
  }

  // JSON.parse is the `unknown` boundary — past this point, the value is
  // typed by the canonical Zod schema. No `as any`, no `@ts-ignore`.
  let rawJson: unknown;
  try {
    rawJson = JSON.parse(fileResult.value);
  } catch (cause) {
    const detail =
      cause instanceof Error
        ? cause.message
        : isPromiseLikeRejectReason(cause)
          ? cause.message
          : String(cause);
    return {
      ok: false,
      error: {
        kind: "invalid",
        code: "422.invalid",
        fieldPath: `slug:${slug}`,
        message: `Block descriptor "${slug}" contains malformed JSON: ${detail}`,
        issues: [{ path: "json.parse", message: detail }],
      },
    };
  }

  return parseBlockDescriptor(rawJson);
}

/**
 * Throwing variant — admin/portal/phaser test fixtures that want a hard failure.
 * Phase 06 inventory consumer should prefer `tryLoad` and handle errors via
 * the `PlannerDescriptorError` discriminated union.
 */
export function loadBySlug(
  slug: string,
  options?: { dir?: string },
): BlockDescriptor {
  const result = tryLoad(slug, options);
  if (result.ok === false) {
    const http = toPlannerDescriptorErrorHttp(result.error);
    throw new Error(
      `[svgBlockDescriptorLoader] loadBySlug ${slug} failed: ${http.status} ${http.body.code} ${http.body.fieldPath} ${http.body.message}`,
    );
  }
  return result.value;
}

interface LoadAllCacheEntry {
  descriptors: ReadonlyMap<string, BlockDescriptor>;
  dir: string;
}

let loadAllCache: LoadAllCacheEntry | null = null;

/**
 * Lazy `loadAll` behind a getter (§02-LOAD-10 / Phase 02 risk register:
 * "Loader init-on-import blocking cold start"). The planner first-paint only
 * reads the slugs it consumes; bulk loading is intentional and cached.
 */
export function loadAll(
  options?: { dir?: string; forceReload?: boolean },
): BlockDescriptor[] {
  const dir = options?.dir ?? BLOCK_DESCRIPTORS_DIR_DEFAULT;
  if (!options?.forceReload && loadAllCache && loadAllCache.dir === dir) {
    return Array.from(loadAllCache.descriptors.values());
  }
  if (!existsSync(dir)) {
    loadAllCache = { descriptors: new Map(), dir };
    return [];
  }
  const entries: string[] = readdirSync(dir);
  const descriptors = new Map<string, BlockDescriptor>();
  const slugs = new Set<string>();

  for (const entry of entries) {
    if (isLatestPointerFilename(entry)) {
      const slug = slugFromLatestPointerFilename(entry);
      if (slug) {slugs.add(slug);}
      continue;
    }
    if (
      isLegacyDescriptorFilename(entry) &&
      !isVersionedDescriptorFilename(entry)
    ) {
      slugs.add(entry.slice(0, -".json".length));
    }
  }

  for (const slug of slugs) {
    const result = tryLoad(slug, { dir });
    if (!result.ok) {continue;}
    descriptors.set(result.value.slug, result.value);
  }
  loadAllCache = { descriptors, dir };
  return Array.from(descriptors.values());
}

/**
 * Clear the loader cache. Tests call this between scenarios; Phase 03 may call
 * it when a new descriptor file lands on disk.
 */
export function clearLoaderCache(): void {
  loadAllCache = null;
}
