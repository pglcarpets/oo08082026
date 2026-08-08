import "server-only";

export type RateLimitInfo = {
  count: number;
  lastReset: number;
};

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

export interface RateLimitBackend {
  check(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
}

const MEMORY_MAP_MAX_KEYS = 10_000;
const AI_RATE_LIMIT_KEY_PATTERN =
  /^(ai-advisor|planner-ai-advisor|planner-sketch-to-plan|filter|generate-alt|configurator-smart-wizard|nav-search|studio-ai-generate|studio-ai-suggest|studio-ai-restyle):/i;

const rateLimitMap = new Map<string, RateLimitInfo>();
let defaultBackendPromise: Promise<RateLimitBackend> | null = null;

export function hasDistributedRateLimit(): boolean {
  return Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() &&
      (process.env.SUPABASE_URL?.trim() ||
        process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
  );
}

export function isAiScopedRateLimitKey(key: string): boolean {
  return AI_RATE_LIMIT_KEY_PATTERN.test(key);
}

function evictMemoryEntriesIfNeeded(now: number, windowMs: number): void {
  if (rateLimitMap.size <= MEMORY_MAP_MAX_KEYS) {return;}

  for (const [entryKey, info] of rateLimitMap) {
    if (now - info.lastReset > windowMs) {
      rateLimitMap.delete(entryKey);
    }
  }

  while (rateLimitMap.size > MEMORY_MAP_MAX_KEYS) {
    const oldestKey = rateLimitMap.keys().next().value;
    if (!oldestKey) {break;}
    rateLimitMap.delete(oldestKey);
  }
}

function applyMemoryRateLimit(
  key: string,
  limit: number = 20,
  windowMs: number = 60000,
): RateLimitResult {
  const now = Date.now();
  evictMemoryEntriesIfNeeded(now, windowMs);

  const info = rateLimitMap.get(key) ?? { count: 0, lastReset: now };

  if (now - info.lastReset > windowMs) {
    info.count = 0;
    info.lastReset = now;
  }

  if (info.count >= limit) {
    return { success: false, limit, remaining: 0, reset: info.lastReset + windowMs };
  }

  info.count += 1;
  rateLimitMap.set(key, info);

  return {
    success: true,
    limit,
    remaining: limit - info.count,
    reset: info.lastReset + windowMs,
  };
}

function memoryRateLimitOrFailClosed(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  if (
    process.env.NODE_ENV === "production" &&
    isAiScopedRateLimitKey(key) &&
    !hasDistributedRateLimit()
  ) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Date.now() + windowMs,
    };
  }

  return applyMemoryRateLimit(key, limit, windowMs);
}

export async function rateLimit(
  key: string,
  limit: number = 20,
  windowMs: number = 60000,
  backend?: RateLimitBackend,
): Promise<RateLimitResult> {
  if (backend) {
    return backend.check(key, limit, windowMs);
  }

  if (hasDistributedRateLimit()) {
    defaultBackendPromise ??= createSupabaseRateLimitBackend();
    try {
      const distributedBackend = await defaultBackendPromise;
      return await distributedBackend.check(key, limit, windowMs);
    } catch {
      // Setting up (or querying) the distributed backend failed — never let a
      // rate-limiter infra hiccup 500 the calling API route. Reset the cached
      // promise so a transient failure (e.g. a cold-start dynamic-import glitch)
      // doesn't permanently poison every future request, then fail open to the
      // in-memory limiter for this call.
      defaultBackendPromise = null;
      return memoryRateLimitOrFailClosed(key, limit, windowMs);
    }
  }

  return memoryRateLimitOrFailClosed(key, limit, windowMs);
}

export async function createSupabaseRateLimitBackend(): Promise<RateLimitBackend> {
  const { createAdminServiceClient } = await import("@/platform/supabase/adminServer");
  const supabase = createAdminServiceClient();

  if (!supabase) {
    return {
      check(key, limit, windowMs) {
        return Promise.resolve(
          memoryRateLimitOrFailClosed(key, limit, windowMs),
        );
      },
    };
  }

  return {
    async check(key, limit, windowMs) {
      try {
        const now = Date.now();
        const windowStart = now - windowMs;
        const { data: rawData, error } = await supabase
          .from("rate_limits")
          .select("count, window_start")
          .eq("key", key)
          .maybeSingle();

        const data = rawData as { count?: number | null; window_start?: number | null } | null;

        if (error) {
          return memoryRateLimitOrFailClosed(key, limit, windowMs);
        }

        let currentCount = 0;
        let currentWindow = now;

        if (
          data &&
          typeof data.window_start === "number" &&
          data.window_start > windowStart
        ) {
          currentCount = Number(data.count) || 0;
          currentWindow = data.window_start;
        }

        if (currentCount >= limit) {
          return {
            success: false,
            limit,
            remaining: 0,
            reset: currentWindow + windowMs,
          };
        }

        const nextCount = currentCount + 1;
        const upsertPayload = {
          key,
          count: nextCount,
          window_start: currentWindow,
        } as { key: string; count: number; window_start: number };
        // rate_limits table rows not present in generated supabase DB types (platform/drizzle or config/database/types); cast to allow upsert of known shape. Reason: runtime table for rate limiting. Owner: lib/rateLimit. Removal: when rate_limits added to schema + regen types.
        type RateLimitsUpsertClient = {
          upsert: (payload: {
            key: string;
            count: number;
            window_start: number;
          }) => Promise<{ error: unknown }>;
        };
        const rateLimitsTable = supabase.from("rate_limits") as unknown as RateLimitsUpsertClient;
        const { error: upsertError } = await rateLimitsTable.upsert(upsertPayload);

        if (upsertError) {
          return memoryRateLimitOrFailClosed(key, limit, windowMs);
        }

        return {
          success: true,
          limit,
          remaining: limit - nextCount,
          reset: currentWindow + windowMs,
        };
      } catch {
        return memoryRateLimitOrFailClosed(key, limit, windowMs);
      }
    },
  };
}
