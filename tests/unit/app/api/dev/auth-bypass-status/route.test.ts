import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "@/app/api/dev/auth-bypass-status/route";
import { isDevAuthBypassEnabled } from "@/lib/auth/devAuthBypass";
import { setNodeEnv } from "@/tests/helpers/setNodeEnv";

vi.mock("@/lib/auth/devAuthBypass", () => ({
  isDevAuthBypassEnabled: vi.fn(),
}));

describe("app/api/dev/auth-bypass-status/route.ts", () => {
  const originalEnv = process.env.DEV_AUTH_BYPASS;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.DEV_AUTH_BYPASS;
    } else {
      process.env.DEV_AUTH_BYPASS = originalEnv;
    }
    setNodeEnv(originalNodeEnv);
  });

  it("GET reports bypass disabled without secrets", async () => {
    vi.mocked(isDevAuthBypassEnabled).mockReturnValue(false);
    process.env.DEV_AUTH_BYPASS = "0";
    setNodeEnv("test");

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.bypassEnabled).toBe(false);
    expect(body.flagSet).toBe(false);
    expect(body.nodeEnv).toBe("test");
    expect(body).not.toHaveProperty("secret");
    expect(JSON.stringify(body)).not.toMatch(/api[_-]?key|password|token/i);
  });

  it("GET reports bypass enabled when helper says so", async () => {
    vi.mocked(isDevAuthBypassEnabled).mockReturnValue(true);
    process.env.DEV_AUTH_BYPASS = "1";
    setNodeEnv("development");

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.bypassEnabled).toBe(true);
    expect(body.flagSet).toBe(true);
    expect(body.nodeEnv).toBe("development");
  });

  it("GET returns 404 in production (PX-S08 — no exposure of bypass state)", async () => {
    setNodeEnv("production");

    const res = await GET();
    expect(res.status).toBe(404);
  });
});
