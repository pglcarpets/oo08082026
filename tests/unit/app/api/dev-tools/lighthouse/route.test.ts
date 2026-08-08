import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import { GET } from "@/app/api/dev-tools/lighthouse/route";
import { enforcePublicApiRateLimit } from "@/app/api/_lib/public";
import { setNodeEnv } from "@/tests/helpers/setNodeEnv";

vi.mock("@/app/api/_lib/public", () => ({
  enforcePublicApiRateLimit: vi.fn(),
}));

vi.mock("fs/promises", () => ({
  default: {
    access: vi.fn(),
    readFile: vi.fn(),
    readdir: vi.fn(),
    stat: vi.fn(),
  },
}));

describe("app/api/dev-tools/lighthouse/route.ts", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    setNodeEnv("test");
    vi.mocked(enforcePublicApiRateLimit).mockResolvedValue(null);
  });

  afterEach(() => {
    setNodeEnv(originalNodeEnv);
  });

  it("returns 429 when rate limited", async () => {
    vi.mocked(enforcePublicApiRateLimit).mockResolvedValue(
      Response.json({ error: "Too many requests" }, { status: 429 }) as never,
    );
    const res = await GET(new Request("http://localhost/api/dev-tools/lighthouse"));
    expect(res.status).toBe(429);
  });

  it("returns 404 in production", async () => {
    setNodeEnv("production");
    const res = await GET(new Request("http://localhost/api/dev-tools/lighthouse"));
    expect(res.status).toBe(404);
  });

  it("returns empty list when tmp directory is missing", async () => {
    vi.mocked(fs.access).mockRejectedValue(new Error("missing"));
    const res = await GET(new Request("http://localhost/api/dev-tools/lighthouse"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });

  it("returns 400 for invalid file name", async () => {
    vi.mocked(fs.access).mockResolvedValue(undefined);
    const res = await GET(
      new Request("http://localhost/api/dev-tools/lighthouse?file=../secret.json"),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("invalid file");
  });
});
