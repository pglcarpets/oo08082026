import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { isDevAuthBypassEnabled } from "@/lib/auth/devAuthBypass";

/** Dev-only placeholder when bucket env is unset under `DEV_AUTH_BYPASS=1`. */
export const DEV_FALLBACK_CATALOG_BUCKET = "r2-catalog-bucket-not-configured";

/** @deprecated Use `DEV_FALLBACK_CATALOG_BUCKET` — kept for scripts/tests. */
export const DEFAULT_CATALOG_BUCKET = DEV_FALLBACK_CATALOG_BUCKET;

/** Web path `/assets/catalog/...` → candidate R2 object keys (clean-bucket layout). */
export function catalogAssetR2Keys(webPath: string): string[] {
  const trimmed = webPath.trim().replace(/^\/+/, "");
  if (!trimmed) {return [];}

  const keys = new Set<string>();
  keys.add(trimmed);
  if (trimmed.startsWith("assets/catalog/")) {
    keys.add(trimmed.slice("assets/".length));
  }
  if (trimmed.includes("/gallery/")) {
    const withoutGallery = trimmed.replace(/\/gallery\//, "/");
    keys.add(withoutGallery);
    if (withoutGallery.startsWith("assets/catalog/")) {
      keys.add(withoutGallery.slice("assets/".length));
    }
  }

  const numbered = trimmed.match(/^(.*\/image-)0*(\d+)(\.[a-z0-9]+)$/i);
  if (numbered) {
    keys.add(`${numbered[1]}${numbered[2]}${numbered[3]}`);
    keys.add(`${numbered[1]}0${numbered[2]}${numbered[3]}`);
  }

  return [...keys];
}

export function resolveCatalogAssetBuckets(): string[] {
  return [resolveCatalogBucketName()];
}

function readCatalogBucketFromEnv(): string | null {
  return (
    process.env.CLOUDFLARE_R2_CATALOG_BUCKET?.trim() ||
    process.env.CLOUDFLARE_R2_BUCKET?.trim() ||
    process.env.R2_CATALOG_BUCKET?.trim() ||
    null
  );
}

export function resolveCatalogBucketName(): string {
  const cliArg = process.argv.find((arg) => arg.startsWith("--bucket="));
  if (cliArg) {
    return cliArg.slice("--bucket=".length).trim();
  }

  const fromEnv = readCatalogBucketFromEnv();
  if (fromEnv) {
    return fromEnv;
  }

  if (isDevAuthBypassEnabled()) {
    return DEV_FALLBACK_CATALOG_BUCKET;
  }

  throw new Error(
    "Missing catalog R2 bucket: set CLOUDFLARE_R2_CATALOG_BUCKET (or CLOUDFLARE_R2_BUCKET / R2_CATALOG_BUCKET).",
  );
}

export function resolveR2Endpoint(): string | null {
  // Prefer canonical S3 endpoint; accept legacy typo S3 URL only.
  // Do not use CLOULDFLARE_URL (often a dashboard URL, not S3).
  const explicit =
    process.env.CLOUDFLARE_S3_URL?.trim() ||
    process.env.CLOULDFLARE_S3_URL?.trim();

  if (explicit) {
    return explicit;
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  if (accountId) {
    return `https://${accountId}.r2.cloudflarestorage.com`;
  }

  return null;
}

/** Intact S3 credential pair sources (never mix access/secret across pairs). */
export type R2CredentialSource =
  | "cloudflare-r2"
  | "cloudflare-access"
  | "legacy-typo"
  | null;

type R2CredentialPair = {
  accessKeyId: string;
  secretAccessKey: string;
  source: Exclude<R2CredentialSource, null>;
};

function readIntactPair(
  accessKey: string | undefined,
  secretKey: string | undefined,
  source: Exclude<R2CredentialSource, null>,
): R2CredentialPair | null {
  const accessKeyId = accessKey?.trim() ?? "";
  const secretAccessKey = secretKey?.trim() ?? "";
  if (!accessKeyId || !secretAccessKey) {
    return null;
  }
  return { accessKeyId, secretAccessKey, source };
}

/**
 * Resolve R2 S3 API credentials as an **intact pair**.
 *
 * Two env *names* exist for the same role (R2-prefixed and generic ACCESS_*).
 * They are aliases of one logical credential, not two independent systems.
 * Precedence (first complete pair wins):
 * 1. `CLOUDFLARE_R2_ACCESS_KEY_ID` + `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
 * 2. `CLOUDFLARE_ACCESS_KEY_ID` + `CLOUDFLARE_SECRET_ACCESS_KEY`
 * 3. Legacy typo aliases `CLOULD_ACCESS_KEY_ID` + `CLOULDFLARE_S3_SECRET_ACCESS_KEY`
 *
 * Never mix access from one pair with secret from another.
 * Never use Cloudflare API tokens / Authorization headers as S3 secrets.
 */
export function resolveR2CredentialPair(): R2CredentialPair | null {
  return (
    readIntactPair(
      process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      "cloudflare-r2",
    ) ||
    readIntactPair(
      process.env.CLOUDFLARE_ACCESS_KEY_ID,
      process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
      "cloudflare-access",
    ) ||
    readIntactPair(
      process.env.CLOULD_ACCESS_KEY_ID,
      process.env.CLOULDFLARE_S3_SECRET_ACCESS_KEY,
      "legacy-typo",
    )
  );
}

export function resolveR2CredentialSource(): R2CredentialSource {
  return resolveR2CredentialPair()?.source ?? null;
}

export function resolveR2Credentials(): { accessKeyId: string; secretAccessKey: string } | null {
  const pair = resolveR2CredentialPair();
  if (!pair) {
    return null;
  }
  return { accessKeyId: pair.accessKeyId, secretAccessKey: pair.secretAccessKey };
}

export function createR2CatalogClient(): S3Client {
  const endpoint = resolveR2Endpoint();
  const credentials = resolveR2Credentials();

  if (!endpoint || !credentials) {
    throw new Error(
      "Missing R2 config (S3 URL or account id, access key, secret key).",
    );
  }

  return new S3Client({
    region: "auto",
    endpoint,
    credentials,
  });
}

export function contentTypeForKey(key: string): string {
  const lower = key.toLowerCase();
  if (lower.endsWith(".json")) {return "application/json";}
  if (lower.endsWith(".svg")) {return "image/svg+xml";}
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {return "image/jpeg";}
  if (lower.endsWith(".png")) {return "image/png";}
  if (lower.endsWith(".webp")) {return "image/webp";}
  if (lower.endsWith(".pdf")) {return "application/pdf";}
  return "application/octet-stream";
}

export async function readR2ObjectText(key: string, bucket = resolveCatalogBucketName()): Promise<string | null> {
  if (!resolveR2Credentials()) {return null;}

  try {
    const client = createR2CatalogClient();
    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
    return (await response.Body?.transformToString("utf-8")) ?? null;
  } catch {
    return null;
  }
}

export async function readCatalogAssetBytes(
  webPath: string,
): Promise<{ body: Uint8Array; contentType: string } | null> {
  if (!resolveR2Credentials()) {return null;}

  const client = createR2CatalogClient();
  const keys = catalogAssetR2Keys(webPath);
  const buckets = resolveCatalogAssetBuckets();

  for (const bucket of buckets) {
    for (const key of keys) {
      try {
        const response = await client.send(
          new GetObjectCommand({ Bucket: bucket, Key: key }),
        );
        const body = await response.Body?.transformToByteArray();
        if (!body || body.byteLength === 0) {continue;}
        const contentType =
          response.ContentType?.trim() || contentTypeForKey(key);
        return { body, contentType };
      } catch {
        // try next key / bucket
      }
    }
  }

  return null;
}

export async function writeR2ObjectText(
  key: string,
  body: string,
  contentType = contentTypeForKey(key),
  bucket = resolveCatalogBucketName(),
): Promise<void> {
  const client = createR2CatalogClient();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

/** Binary immutable artifacts (PNG masters/thumbnails) for dual-write cutover path. */
export async function writeR2ObjectBytes(
  key: string,
  body: Uint8Array | Buffer,
  contentType = contentTypeForKey(key),
  bucket = resolveCatalogBucketName(),
): Promise<void> {
  const client = createR2CatalogClient();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}

/** Cached probe so publish paths do not hit R2 on every request. */
const R2_PROBE_TTL_MS = 60_000;
let r2ProbeCache: { at: number; ok: boolean; reason?: string } | null = null;

export function resetR2CatalogProbeCache(): void {
  r2ProbeCache = null;
}

export type R2CatalogProbeResult = {
  ok: boolean;
  reason?: string;
  source: R2CredentialSource;
};

/**
 * Live check: can we list the catalog bucket with the configured intact S3 pair?
 * Used to gate DB/R2 dual-write so disk authority still publishes when R2 is misconfigured.
 */
export async function probeR2CatalogAccess(options?: {
  force?: boolean;
}): Promise<R2CatalogProbeResult> {
  const source = resolveR2CredentialSource();
  const force = options?.force === true;
  if (!force && r2ProbeCache && Date.now() - r2ProbeCache.at < R2_PROBE_TTL_MS) {
    return {
      ok: r2ProbeCache.ok,
      reason: r2ProbeCache.reason,
      source,
    };
  }

  if (!resolveR2Endpoint() || !resolveR2Credentials()) {
    r2ProbeCache = {
      at: Date.now(),
      ok: false,
      reason: "missing_r2_config",
    };
    return { ok: false, reason: "missing_r2_config", source };
  }

  try {
    const client = createR2CatalogClient();
    await client.send(
      new ListObjectsV2Command({
        Bucket: resolveCatalogBucketName(),
        MaxKeys: 1,
      }),
    );
    r2ProbeCache = { at: Date.now(), ok: true };
    return { ok: true, source };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status =
      error &&
      typeof error === "object" &&
      "$metadata" in error &&
      error.$metadata &&
      typeof error.$metadata === "object" &&
      "httpStatusCode" in error.$metadata
        ? Number((error.$metadata as { httpStatusCode?: number }).httpStatusCode)
        : undefined;
    const reason =
      status !== undefined && Number.isFinite(status)
        ? `${message} (${status})`
        : message;
    r2ProbeCache = { at: Date.now(), ok: false, reason };
    return { ok: false, reason, source };
  }
}

export async function isR2CatalogReady(options?: {
  force?: boolean;
}): Promise<boolean> {
  return (await probeR2CatalogAccess(options)).ok;
}
