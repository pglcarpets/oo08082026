import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('env.server', () => {
  // Dynamic import + vi.resetModules is slow under parallel Windows forks.
  const IMPORT_TEST_TIMEOUT_MS = 30_000;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    vi.resetModules();
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should read valid environment variables', async () => {
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.OPENROUTER_API_KEY_PRIMARY = 'test-openrouter-key';
    process.env.OPENROUTER_API_KEY_BACKUP = '';
    process.env.OPENROUTER_MODEL = 'test-model';
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.GEMINI_MODEL = 'test-gemini-model';

    const { env } = await import('../../../site/lib/env.server');

    expect(env.OPENAI_API_KEY).toBe('test-openai-key');
    expect(env.OPENROUTER_API_KEY_PRIMARY).toBe('test-openrouter-key');
    expect(env.OPENROUTER_API_KEY_BACKUP).toBeUndefined();
    expect(env.OPENROUTER_MODEL).toBe('test-model');
    expect(env.GEMINI_API_KEY).toBe('test-gemini-key');
    expect(env.GEMINI_MODEL).toBe('test-gemini-model');
  }, IMPORT_TEST_TIMEOUT_MS);

  it('should throw an error and console.error when environment validation fails', async () => {
    // Force Zod validation failure by passing a non-string or we can use another trick.
    // Zod's safeParse will validate the object. Let's set process.env to something invalid.
    // E.g. we can set OPENAI_API_KEY to an array or another type that doesn't parse as string
    process.env.OPENAI_API_KEY = [] as unknown as string;

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { env } = await import('../../../site/lib/env.server');

    expect(() => env.OPENAI_API_KEY).toThrow('Invalid server environment variables');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  }, IMPORT_TEST_TIMEOUT_MS);

  it('resolves Cloudflare S3 keys as an intact pair (R2_* wins over ACCESS_*)', async () => {
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = 'r2-access';
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = 'r2-secret';
    process.env.CLOUDFLARE_ACCESS_KEY_ID = 'generic-access';
    process.env.CLOUDFLARE_SECRET_ACCESS_KEY = 'generic-secret';
    // Must never be used as S3 secret
    process.env.CLOUDFLARE_SECRET_Authorization = 'not-an-s3-secret';

    const { env } = await import('../../../site/lib/env.server');

    expect(env.CLOUDFLARE_ACCESS_KEY_ID).toBe('r2-access');
    expect(env.CLOUDFLARE_SECRET_ACCESS_KEY).toBe('r2-secret');
  }, IMPORT_TEST_TIMEOUT_MS);

  it('does not mix incomplete R2 access with generic secret', async () => {
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = 'r2-access-only';
    delete process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    process.env.CLOUDFLARE_ACCESS_KEY_ID = 'generic-access';
    process.env.CLOUDFLARE_SECRET_ACCESS_KEY = 'generic-secret';

    const { env } = await import('../../../site/lib/env.server');

    expect(env.CLOUDFLARE_ACCESS_KEY_ID).toBe('generic-access');
    expect(env.CLOUDFLARE_SECRET_ACCESS_KEY).toBe('generic-secret');
  }, IMPORT_TEST_TIMEOUT_MS);
});
