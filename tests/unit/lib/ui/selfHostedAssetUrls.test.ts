import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  resolveSelfHostedAssetUrl,
  resolveSelfHostedAssetDir,
  resolveModelViewerDecoderUrls,
} from "@/lib/ui/selfHostedAssetUrls";

describe("selfHostedAssetUrls", () => {
  const globalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = globalFetch;
    vi.unstubAllGlobals();
  });

  describe("resolveSelfHostedAssetUrl", () => {
    it("should return local path if window is undefined (SSR)", async () => {
      vi.stubGlobal("window", undefined);
      const url = await resolveSelfHostedAssetUrl("local-src", "cdn-src");
      expect(url).toBe("local-src");
    });

    it("should return local path if reachable via HEAD request", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
      });

      const url = await resolveSelfHostedAssetUrl("local-src", "cdn-src");
      expect(url).toBe("local-src");
      expect(global.fetch).toHaveBeenCalledWith("local-src", expect.objectContaining({ method: "HEAD" }));
    });

    it("should return local path if reachable via GET request after HEAD fails", async () => {
      global.fetch = vi.fn()
        .mockRejectedValueOnce(new Error("HEAD failed"))
        .mockResolvedValueOnce({ ok: true });

      const url = await resolveSelfHostedAssetUrl("local-src", "cdn-src");
      expect(url).toBe("local-src");
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should fallback to CDN if both HEAD and GET fail", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const url = await resolveSelfHostedAssetUrl("local-src", "cdn-src");
      expect(url).toBe("cdn-src");
    });
  });

  describe("resolveSelfHostedAssetDir", () => {
    it("should return local directory if probe file is reachable", async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true });

      const dir = await resolveSelfHostedAssetDir("local-probe.js", "local-dir/", "cdn-dir/");
      expect(dir).toBe("local-dir/");
    });

    it("should return cdn directory if probe file is not reachable", async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false });

      const dir = await resolveSelfHostedAssetDir("local-probe.js", "local-dir/", "cdn-dir");
      expect(dir).toBe("cdn-dir/"); // should normalize with trailing slash
    });
  });

  describe("resolveModelViewerDecoderUrls", () => {
    it("should resolve both directories", async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true });

      const dirs = await resolveModelViewerDecoderUrls();
      expect(dirs.dracoDir).toBe("/assets/others/legacy/cdn/vendor/draco/1.5.6/");
      expect(dirs.ktx2Dir).toBe("/assets/others/legacy/cdn/vendor/basis-universal/2021-04-15-ba1c3e4/");
    });
  });
});
