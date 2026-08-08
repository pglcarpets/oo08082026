import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type * as rateLimitType0 from "../../../site/lib/rateLimit";
import { setNodeEnv } from "@/tests/helpers/setNodeEnv";

const mockFrom = vi.fn();
const mockCreateClient = vi.fn().mockImplementation(() => ({
  from: mockFrom,
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: (
    url: string,
    key: string,
    options?: { auth?: { persistSession?: boolean; autoRefreshToken?: boolean } },
  ) => mockCreateClient(url, key, options),
}));

describe('rateLimit', () => {
  let rateLimitModule: typeof rateLimitType0;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    originalEnv = { ...process.env };
    // Clear Supabase env keys to test memory rate limit by default
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    rateLimitModule = await import('../../../site/lib/rateLimit');
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('applyMemoryRateLimit', () => {
    it('should allow requests within limit and decrement remaining count', async () => {
      const res1 = await rateLimitModule.rateLimit('user-1', 2, 60000);
      expect(res1.success).toBe(true);
      expect(res1.remaining).toBe(1);

      const res2 = await rateLimitModule.rateLimit('user-1', 2, 60000);
      expect(res2.success).toBe(true);
      expect(res2.remaining).toBe(0);

      const res3 = await rateLimitModule.rateLimit('user-1', 2, 60000);
      expect(res3.success).toBe(false);
      expect(res3.remaining).toBe(0);
    });

    it('should reset count after window expires', async () => {
      vi.useFakeTimers();
      const res1 = await rateLimitModule.rateLimit('user-2', 1, 1000);
      expect(res1.success).toBe(true);

      const res2 = await rateLimitModule.rateLimit('user-2', 1, 1000);
      expect(res2.success).toBe(false);

      // Advance time by 1001ms
      vi.advanceTimersByTime(1001);

      const res3 = await rateLimitModule.rateLimit('user-2', 1, 1000);
      expect(res3.success).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('custom backend', () => {
    it('should delegate check to custom backend', async () => {
      const customBackend = {
        check: vi.fn().mockResolvedValue({
          success: true,
          limit: 5,
          remaining: 4,
          reset: 12345,
        }),
      };

      const res = await rateLimitModule.rateLimit('user-3', 5, 60000, customBackend);
      expect(customBackend.check).toHaveBeenCalledWith('user-3', 5, 60000);
      expect(res.success).toBe(true);
      expect(res.remaining).toBe(4);
    });
  });

  describe('createSupabaseRateLimitBackend', () => {
    it('should fallback to memory if keys are missing', async () => {
      const backend = await rateLimitModule.createSupabaseRateLimitBackend();
      const res = await backend.check('user-4', 1, 10000);
      expect(res.success).toBe(true);
    });

    it('should instantiate supabase client when keys exist and perform rate limiting', async () => {
      process.env.SUPABASE_URL = 'https://supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'srv-key';

      const mockMaybeSingle = vi.fn();
      const mockUpsert = vi.fn();

      mockFrom.mockImplementation((_tableName: string) => {
        const builder = {
          select: vi.fn(),
          eq: vi.fn(),
          maybeSingle: mockMaybeSingle,
          upsert: mockUpsert,
        };
        builder.select.mockReturnValue(builder);
        builder.eq.mockReturnValue(builder);
        return builder;
      });

      // 1. Happy path: new request
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });
      mockUpsert.mockResolvedValue({ error: null });

      const backend = await rateLimitModule.createSupabaseRateLimitBackend();
      expect(mockCreateClient).toHaveBeenCalledWith('https://supabase.co', 'srv-key', expect.any(Object));

      const res1 = await backend.check('user-5', 2, 60000);
      expect(res1.success).toBe(true);
      expect(res1.remaining).toBe(1);

      // 2. Path: exceeding limit
      mockMaybeSingle.mockResolvedValue({
        data: { count: 2, window_start: Date.now() },
        error: null,
      });

      const res2 = await backend.check('user-5', 2, 60000);
      expect(res2.success).toBe(false);

      // 3. Path: error fallback to memory rate limiter
      mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'db error' } });
      const res3 = await backend.check('user-5', 10, 60000);
      // fallback memory limit will succeed as count is reset or tracked locally
      expect(res3.success).toBe(true);
    });
  });

  describe('production AI fail-closed', () => {
    it('rejects AI-scoped keys when distributed backend is unavailable', async () => {
      setNodeEnv('production');
      const res = await rateLimitModule.rateLimit('filter:1.2.3.4', 12, 60_000);
      expect(res.success).toBe(false);
    });
  });
});
