/**
 * Name-mirror coverage for lib/storage/r2Catalog (mocked SDK).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.fn();
const S3Client = vi.fn(function MockS3Client(this: { send: typeof send }) {
  this.send = send;
});
const GetObjectCommand = vi.fn(function MockGetObjectCommand(
  this: { input: unknown },
  input: unknown,
) {
  this.input = input;
});
const PutObjectCommand = vi.fn(function MockPutObjectCommand(
  this: { input: unknown },
  input: unknown,
) {
  this.input = input;
});

const ListObjectsV2Command = vi.fn(function MockListObjectsV2Command(
  this: { input: unknown },
  input: unknown,
) {
  this.input = input;
});

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
}));

describe("r2Catalog", () => {
  const originalEnv = { ...process.env };
  const originalArgv = [...process.argv];

  beforeEach(() => {
    vi.resetModules();
    send.mockReset();
    S3Client.mockClear();
    GetObjectCommand.mockClear();
    PutObjectCommand.mockClear();
    ListObjectsV2Command.mockClear();
    process.env = { ...originalEnv };
    process.argv = [...originalArgv];
    delete process.env.CLOUDFLARE_R2_CATALOG_BUCKET;
    delete process.env.CLOUDFLARE_R2_BUCKET;
    delete process.env.R2_CATALOG_BUCKET;
    delete process.env.CLOULDFLARE_S3_URL;
    delete process.env.CLOUDFLARE_S3_URL;
    delete process.env.CLOUDFLARE_ACCOUNT_ID;
    delete process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    delete process.env.CLOULD_ACCESS_KEY_ID;
    delete process.env.CLOUDFLARE_ACCESS_KEY_ID;
    delete process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    delete process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
    delete process.env.CLOULDFLARE_S3_SECRET_ACCESS_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
    process.argv = originalArgv;
  });

  it("defaults bucket name and accepts --bucket CLI override", async () => {
    const mod = await import("@/lib/storage/r2Catalog");
    expect(mod.DEFAULT_CATALOG_BUCKET).toBe("oando-asset-cdn");
    expect(mod.resolveCatalogBucketName()).toBe("oando-asset-cdn");

    process.argv = ["node", "script", "--bucket=custom-bucket"];
    expect(mod.resolveCatalogBucketName()).toBe("custom-bucket");
  });

  it("resolves R2 endpoint from explicit URL or account id", async () => {
    const mod = await import("@/lib/storage/r2Catalog");
    expect(mod.resolveR2Endpoint()).toBeNull();

    process.env.CLOUDFLARE_S3_URL = "https://example.r2.cloudflarestorage.com/";
    expect(mod.resolveR2Endpoint()).toBe(
      "https://example.r2.cloudflarestorage.com/",
    );

    delete process.env.CLOUDFLARE_S3_URL;
    process.env.CLOUDFLARE_ACCOUNT_ID = "acct123";
    expect(mod.resolveR2Endpoint()).toBe(
      "https://acct123.r2.cloudflarestorage.com",
    );
  });

  it("resolves credentials only when both access and secret exist", async () => {
    const mod = await import("@/lib/storage/r2Catalog");
    expect(mod.resolveR2Credentials()).toBeNull();

    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = "key";
    expect(mod.resolveR2Credentials()).toBeNull();

    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = "secret";
    expect(mod.resolveR2Credentials()).toEqual({
      accessKeyId: "key",
      secretAccessKey: "secret",
    });
  });

  it("accepts canonical CLOUDFLARE_* and documented typo aliases", async () => {
    const mod = await import("@/lib/storage/r2Catalog");

    process.env.CLOUDFLARE_ACCESS_KEY_ID = "canon-key";
    process.env.CLOUDFLARE_SECRET_ACCESS_KEY = "canon-secret";
    expect(mod.resolveR2Credentials()).toEqual({
      accessKeyId: "canon-key",
      secretAccessKey: "canon-secret",
    });

    delete process.env.CLOUDFLARE_ACCESS_KEY_ID;
    delete process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
    process.env.CLOULD_ACCESS_KEY_ID = "typo-key";
    process.env.CLOULDFLARE_S3_SECRET_ACCESS_KEY = "typo-secret";
    expect(mod.resolveR2Credentials()).toEqual({
      accessKeyId: "typo-key",
      secretAccessKey: "typo-secret",
    });
  });

  /**
   * RED contract: two documented key *names* exist (R2_* vs ACCESS_*), but they are
   * one logical S3 credential. Never mix access from pair A with secret from pair B.
   * Precedence: complete R2_* pair → complete ACCESS_* pair → complete typo pair.
   */
  it("never mixes the two R2/S3 key pairs field-by-field", async () => {
    const mod = await import("@/lib/storage/r2Catalog");

    // Incomplete R2 pair + complete generic pair → use generic intact (not R2 access + generic secret)
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = "r2-access-only";
    process.env.CLOUDFLARE_ACCESS_KEY_ID = "generic-access";
    process.env.CLOUDFLARE_SECRET_ACCESS_KEY = "generic-secret";
    expect(mod.resolveR2Credentials()).toEqual({
      accessKeyId: "generic-access",
      secretAccessKey: "generic-secret",
    });

    // Complete R2 pair wins over a different complete generic pair
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = "r2-secret";
    expect(mod.resolveR2Credentials()).toEqual({
      accessKeyId: "r2-access-only",
      secretAccessKey: "r2-secret",
    });
  });

  it("reports which intact pair source was selected", async () => {
    const mod = await import("@/lib/storage/r2Catalog");
    process.env.CLOUDFLARE_ACCESS_KEY_ID = "generic-access";
    process.env.CLOUDFLARE_SECRET_ACCESS_KEY = "generic-secret";
    expect(mod.resolveR2CredentialSource()).toBe("cloudflare-access");

    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = "r2-access";
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = "r2-secret";
    expect(mod.resolveR2CredentialSource()).toBe("cloudflare-r2");
  });

  it("maps content types by object key extension", async () => {
    const { contentTypeForKey } = await import("@/lib/storage/r2Catalog");
    expect(contentTypeForKey("a.JSON")).toBe("application/json");
    expect(contentTypeForKey("a.svg")).toBe("image/svg+xml");
    expect(contentTypeForKey("a.jpg")).toBe("image/jpeg");
    expect(contentTypeForKey("a.jpeg")).toBe("image/jpeg");
    expect(contentTypeForKey("a.png")).toBe("image/png");
    expect(contentTypeForKey("a.webp")).toBe("image/webp");
    expect(contentTypeForKey("a.pdf")).toBe("application/pdf");
    expect(contentTypeForKey("a.bin")).toBe("application/octet-stream");
  });

  it("throws when createR2CatalogClient lacks endpoint or credentials", async () => {
    const { createR2CatalogClient } = await import("@/lib/storage/r2Catalog");
    expect(() => createR2CatalogClient()).toThrow(/Missing R2 config/i);
  });

  it("creates an S3 client when endpoint and credentials are present", async () => {
    process.env.CLOUDFLARE_S3_URL = "https://example.r2.cloudflarestorage.com";
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = "key";
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = "secret";

    const { createR2CatalogClient } = await import("@/lib/storage/r2Catalog");
    const client = createR2CatalogClient();
    expect(S3Client).toHaveBeenCalledWith(
      expect.objectContaining({
        region: "auto",
        endpoint: "https://example.r2.cloudflarestorage.com",
        credentials: { accessKeyId: "key", secretAccessKey: "secret" },
      }),
    );
    expect(client).toBeDefined();
  });

  it("returns null from readR2ObjectText without credentials", async () => {
    const { readR2ObjectText } = await import("@/lib/storage/r2Catalog");
    await expect(readR2ObjectText("backups/catalog/catalog-latest.json")).resolves.toBeNull();
  });

  it("reads object body text when R2 responds", async () => {
    process.env.CLOUDFLARE_S3_URL = "https://example.r2.cloudflarestorage.com";
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = "key";
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = "secret";
    send.mockResolvedValue({
      Body: {
        transformToString: vi.fn().mockResolvedValue('{"ok":true}'),
      },
    });

    const { readR2ObjectText } = await import("@/lib/storage/r2Catalog");
    await expect(readR2ObjectText("k.json")).resolves.toBe('{"ok":true}');
  });

  it("returns null when the GetObject call fails", async () => {
    process.env.CLOUDFLARE_S3_URL = "https://example.r2.cloudflarestorage.com";
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = "key";
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = "secret";
    send.mockRejectedValue(new Error("network"));

    const { readR2ObjectText } = await import("@/lib/storage/r2Catalog");
    await expect(readR2ObjectText("missing.json")).resolves.toBeNull();
  });

  it("writes immutable objects with explicit content metadata", async () => {
    process.env.CLOUDFLARE_S3_URL = "https://example.r2.cloudflarestorage.com";
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = "key";
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = "secret";
    send.mockResolvedValue({});

    const { writeR2ObjectText } = await import("@/lib/storage/r2Catalog");
    await writeR2ObjectText("svg-revisions/r1/symbol.svg", "<svg/>");

    expect(PutObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        Bucket: "oando-asset-cdn",
        Key: "svg-revisions/r1/symbol.svg",
        Body: "<svg/>",
        ContentType: "image/svg+xml",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
  });

  it("probeR2CatalogAccess is false when credentials are missing", async () => {
    const mod = await import("@/lib/storage/r2Catalog");
    mod.resetR2CatalogProbeCache();
    const result = await mod.probeR2CatalogAccess({ force: true });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/missing/i);
  });

  it("probeR2CatalogAccess is false on Unauthorized (401)", async () => {
    process.env.CLOUDFLARE_S3_URL = "https://example.r2.cloudflarestorage.com";
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = "key";
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = "secret";
    const err = Object.assign(new Error("Unauthorized"), {
      name: "Unauthorized",
      $metadata: { httpStatusCode: 401 },
    });
    send.mockRejectedValue(err);

    const mod = await import("@/lib/storage/r2Catalog");
    mod.resetR2CatalogProbeCache();
    const result = await mod.probeR2CatalogAccess({ force: true });
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/Unauthorized|401/i);
  });

  it("probeR2CatalogAccess is true when ListObjects succeeds", async () => {
    process.env.CLOUDFLARE_S3_URL = "https://example.r2.cloudflarestorage.com";
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = "key";
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = "secret";
    send.mockResolvedValue({ KeyCount: 0 });

    const mod = await import("@/lib/storage/r2Catalog");
    mod.resetR2CatalogProbeCache();
    const result = await mod.probeR2CatalogAccess({ force: true });
    expect(result.ok).toBe(true);
    expect(ListObjectsV2Command).toHaveBeenCalled();
  });
});
