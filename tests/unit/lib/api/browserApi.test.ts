import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  apiPath,
  ensureCsrfToken,
  browserApiFetch,
  invalidateCsrfToken,
} from "@/lib/api/browserApi";

/**
 * Next.js `trailingSlash: true` (config/build/next.config.js) requires
 * browser `/api/*` URLs to keep a trailing slash so fetches are not redirected.
 */
describe("browserApi", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    invalidateCsrfToken();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("apiPath (trailingSlash: true)", () => {
    it("adds a trailing slash to bare /api/* paths", () => {
      expect(apiPath("/api/products")).toBe("/api/products/");
      expect(apiPath("/api/csrf")).toBe("/api/csrf/");
      expect(apiPath("/api/admin/features")).toBe("/api/admin/features/");
    });

    it("preserves an existing trailing slash", () => {
      expect(apiPath("/api/products/")).toBe("/api/products/");
      expect(apiPath("/api/csrf/")).toBe("/api/csrf/");
    });

    it("keeps query strings after the trailing slash", () => {
      expect(apiPath("/api/products?id=123")).toBe("/api/products/?id=123");
      expect(apiPath("/api/products/?id=123")).toBe("/api/products/?id=123");
      expect(apiPath("/api/theme/manage?active=1")).toBe(
        "/api/theme/manage/?active=1",
      );
    });

    it("leaves non-/api paths unchanged", () => {
      expect(apiPath("/not-api")).toBe("/not-api");
      expect(apiPath("/oostudio")).toBe("/oostudio");
      expect(apiPath("https://example.com/api/x")).toBe(
        "https://example.com/api/x",
      );
    });
  });

  describe("ensureCsrfToken", () => {
    it("fetches token from /api/csrf/ with credentials", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce(
        Response.json({ token: "token123" }, { status: 200 }),
      );

      const token = await ensureCsrfToken();
      expect(token).toBe("token123");
      expect(mockFetch).toHaveBeenCalledWith("/api/csrf/", {
        credentials: "include",
        cache: "no-store",
      });
    });

    it("reuses an in-flight bootstrap (single fetch)", async () => {
      const mockFetch = vi.mocked(fetch);
      let resolveFetch!: (value: Response) => void;
      mockFetch.mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            resolveFetch = resolve;
          }),
      );

      const a = ensureCsrfToken();
      const b = ensureCsrfToken();
      resolveFetch(Response.json({ token: "shared" }));
      await expect(Promise.all([a, b])).resolves.toEqual(["shared", "shared"]);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("clears cache on failure so a later call can retry", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch
        .mockResolvedValueOnce(new Response(null, { status: 500 }))
        .mockResolvedValueOnce(Response.json({ token: "recovered" }));

      await expect(ensureCsrfToken()).rejects.toThrow(
        "CSRF bootstrap failed (500)",
      );
      await expect(ensureCsrfToken()).resolves.toBe("recovered");
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("rejects when response body has no token", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce(Response.json({}));

      await expect(ensureCsrfToken()).rejects.toThrow(
        "CSRF bootstrap response missing token",
      );
    });
  });

  describe("browserApiFetch", () => {
    it("does not bootstrap CSRF for safe GET requests", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));

      const response = await browserApiFetch("/api/products", { method: "GET" });
      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch.mock.calls[0]?.[0]).toBe("/api/products/");
      expect(mockFetch.mock.calls[0]?.[1]).toEqual(
        expect.objectContaining({
          method: "GET",
          credentials: "include",
        }),
      );
      const headers = mockFetch.mock.calls[0]?.[1]?.headers as
        | Record<string, string>
        | undefined;
      expect(headers?.["x-csrf-token"]).toBeUndefined();
    });

    it("bootstraps CSRF before the first mutating request", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch
        .mockResolvedValueOnce(Response.json({ token: "token123" }))
        .mockResolvedValueOnce(new Response(null, { status: 200 }));

      const response = await browserApiFetch("/api/update", { method: "POST" });
      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(2);
      const request = mockFetch.mock.calls[1];
      expect(request?.[0]).toBe("/api/update/");
      expect(request?.[1]).toEqual(
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({ "x-csrf-token": "token123" }),
        }),
      );
    });

    it("attaches CSRF for PUT/PATCH/DELETE", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValue(Response.json({ token: "t" }));

      for (const method of ["PUT", "PATCH", "DELETE"] as const) {
        invalidateCsrfToken();
        mockFetch.mockReset();
        mockFetch
          .mockResolvedValueOnce(Response.json({ token: "t" }))
          .mockResolvedValueOnce(new Response(null, { status: 204 }));

        await browserApiFetch("/api/item", { method });
        expect(mockFetch.mock.calls[1]?.[0]).toBe("/api/item/");
        expect(mockFetch.mock.calls[1]?.[1]).toEqual(
          expect.objectContaining({
            method,
            headers: expect.objectContaining({ "x-csrf-token": "t" }),
          }),
        );
      }
    });

    it("does not retry an authorization 403 without CSRF rejection header", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch
        .mockResolvedValueOnce(Response.json({ token: "token123" }))
        .mockResolvedValueOnce(
          Response.json({ error: "Forbidden" }, { status: 403 }),
        );

      const response = await browserApiFetch("/api/update", { method: "POST" });

      expect(response.status).toBe(403);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("refreshes once after an explicit CSRF rejection", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch
        .mockResolvedValueOnce(Response.json({ token: "firstToken" }))
        .mockResolvedValueOnce(
          Response.json(
            { error: { message: "Invalid or missing CSRF token" } },
            { status: 403, headers: { "X-CSRF-Rejected": "1" } },
          ),
        )
        .mockResolvedValueOnce(Response.json({ token: "secondToken" }))
        .mockResolvedValueOnce(new Response(null, { status: 200 }));

      const response = await browserApiFetch("/api/update", { method: "POST" });

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(4);
      expect(mockFetch.mock.calls[3]?.[1]).toEqual(
        expect.objectContaining({
          headers: expect.objectContaining({ "x-csrf-token": "secondToken" }),
        }),
      );
    });

    it("invalidates token when retry still has CSRF rejection", async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch
        .mockResolvedValueOnce(Response.json({ token: "first" }))
        .mockResolvedValueOnce(
          new Response(null, {
            status: 403,
            headers: { "X-CSRF-Rejected": "1" },
          }),
        )
        .mockResolvedValueOnce(Response.json({ token: "second" }))
        .mockResolvedValueOnce(
          new Response(null, {
            status: 403,
            headers: { "X-CSRF-Rejected": "1" },
          }),
        )
        // third ensureCsrf after invalidate — must re-fetch
        .mockResolvedValueOnce(Response.json({ token: "third" }))
        .mockResolvedValueOnce(new Response(null, { status: 200 }));

      const rejected = await browserApiFetch("/api/update", { method: "POST" });
      expect(rejected.status).toBe(403);

      const ok = await browserApiFetch("/api/update", { method: "POST" });
      expect(ok.status).toBe(200);
      expect(mockFetch.mock.calls[4]?.[0]).toBe("/api/csrf/");
      expect(mockFetch.mock.calls[5]?.[1]).toEqual(
        expect.objectContaining({
          headers: expect.objectContaining({ "x-csrf-token": "third" }),
        }),
      );
    });
  });
});
