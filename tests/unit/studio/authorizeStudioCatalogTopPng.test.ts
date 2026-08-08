// @vitest-environment node
import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import sharp from "sharp";

import { planSymbolRasterBox } from "@/lib/catalog/planSymbolPngContract";
import { authorizeStudioCatalogTopPng } from "@studio/server/authorizeStudioCatalogTopPng";
import * as pngPublishChecksum from "@/lib/catalog/publish/pngPublishChecksum";
import * as renderTopPngFromSvg from "@studio/server/renderTopPngFromSvg";
import * as studioStore from "@studio/server/studioStore";

const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <rect x="4" y="4" width="32" height="32" fill="#556" />
</svg>`;

async function makePng(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 10, g: 20, b: 30, alpha: 1 },
    },
  })
    .png()
    .toBuffer();
}

function pngDataUrl(png: Buffer): string {
  return `data:image/png;base64,${png.toString("base64")}`;
}

describe("authorizeStudioCatalogTopPng", () => {
  it("returns none when neither top_svg nor top_png is provided", async () => {
    const result = await authorizeStudioCatalogTopPng({
      itemId: "f_empty",
      widthMm: 1000,
      depthMm: 600,
    });
    expect(result).toEqual({ kind: "none" });
  });

  it("server-renders top_svg, quality-gates, and returns checksum hex", async () => {
    const widthMm = 1000;
    const depthMm = 600;
    const result = await authorizeStudioCatalogTopPng({
      itemId: "f_desk",
      topSvg: SAMPLE_SVG,
      topPng: pngDataUrl(await makePng(32, 32)), // client PNG must not win
      widthMm,
      depthMm,
    });

    expect(result.kind).toBe("accepted");
    if (result.kind !== "accepted") return;

    expect(result.checksum).toMatch(/^[a-f0-9]{64}$/);
    expect(result.checksum).toBe(createHash("sha256").update(result.png).digest("hex"));

    const box = planSymbolRasterBox(widthMm, depthMm);
    const meta = await sharp(result.png).metadata();
    expect(meta.width).toBe(box.rasterWidthPx);
    expect(meta.height).toBe(box.rasterHeightPx);

    expect(result.topPngDataUrl.startsWith("data:image/png;base64,")).toBe(true);
    const fromUrl = Buffer.from(result.topPngDataUrl.split(",")[1]!, "base64");
    expect(fromUrl.equals(result.png)).toBe(true);
  });

  it("rejects client top_png that fails the plan-symbol quality gate", async () => {
    const bad = await makePng(32, 32);
    const result = await authorizeStudioCatalogTopPng({
      itemId: "f_bad",
      topPng: pngDataUrl(bad),
      widthMm: 1000,
      depthMm: 600,
    });
    expect(result.kind).toBe("rejected");
    if (result.kind !== "rejected") return;
    expect(result.error).toMatch(/dimensions mismatch|substandard|quality/i);
  });

  it("rejects invalid PNG signature from client top_png", async () => {
    const result = await authorizeStudioCatalogTopPng({
      itemId: "f_sig",
      topPng: "data:image/png;base64," + Buffer.from("not-a-png").toString("base64"),
      widthMm: 100,
      depthMm: 100,
    });
    expect(result.kind).toBe("rejected");
    if (result.kind !== "rejected") return;
    expect(result.error).toMatch(/invalid png signature|quality|png/i);
  });

  it("accepts contract-sized client top_png with checksum when no SVG", async () => {
    const box = planSymbolRasterBox(800, 400);
    const good = await makePng(box.rasterWidthPx, box.rasterHeightPx);
    const result = await authorizeStudioCatalogTopPng({
      itemId: "f_good",
      topPng: pngDataUrl(good),
      widthMm: 800,
      depthMm: 400,
    });
    expect(result.kind).toBe("accepted");
    if (result.kind !== "accepted") return;
    expect(result.checksum).toMatch(/^[a-f0-9]{64}$/);
    expect(result.png.equals(good)).toBe(true);
  });

  it("prefers server SVG raster over substandard client PNG", async () => {
    const result = await authorizeStudioCatalogTopPng({
      itemId: "f_prefer_svg",
      topSvg: SAMPLE_SVG,
      topPng: pngDataUrl(await makePng(8, 8)),
      widthMm: 600,
      depthMm: 600,
    });
    expect(result.kind).toBe("accepted");
    if (result.kind !== "accepted") return;
    const box = planSymbolRasterBox(600, 600);
    const meta = await sharp(result.png).metadata();
    expect(meta.width).toBe(box.rasterWidthPx);
    expect(meta.height).toBe(box.rasterHeightPx);
  });

  it("rejects server render when footprint mm is invalid", async () => {
    const result = await authorizeStudioCatalogTopPng({
      itemId: "f_zero_mm",
      topSvg: SAMPLE_SVG,
      widthMm: 0,
      depthMm: 600,
    });
    expect(result.kind).toBe("rejected");
    if (result.kind !== "rejected") return;
    expect(result.error).toMatch(/Server PNG render|width_mm|footprint/i);
  });

  it("rejects client-only top_png when widthMm is 0 (fail-closed, no pad-only accept)", async () => {
    // 0×0 footprint → quality gate expects pad-only 160×160; without a positive-mm
    // guard a crafted pad-only PNG would be accepted and checksummed (CR-2 #2).
    const padOnly = await makePng(160, 160);
    const result = await authorizeStudioCatalogTopPng({
      itemId: "f_client_zero_w",
      topPng: pngDataUrl(padOnly),
      widthMm: 0,
      depthMm: 0,
    });
    expect(result.kind).toBe("rejected");
    if (result.kind !== "rejected") return;
    expect(result.error).toMatch(/width_mm|depth_mm|footprint|positive|invalid/i);
  });

  it("rejects client-only top_png when depthMm is negative", async () => {
    // Negative mm must fail closed before quality gate (nonsensical expected boxes).
    const padOnly = await makePng(160, 160);
    const result = await authorizeStudioCatalogTopPng({
      itemId: "f_client_neg_d",
      topPng: pngDataUrl(padOnly),
      widthMm: 800,
      depthMm: -1,
    });
    expect(result.kind).toBe("rejected");
    if (result.kind !== "rejected") return;
    expect(result.error).toMatch(/depth_mm|footprint|positive|invalid/i);
  });

  it("rejects malformed client top_png data URL", async () => {
    const result = await authorizeStudioCatalogTopPng({
      itemId: "f_bad_url",
      topPng: "not-a-data-url",
      widthMm: 100,
      depthMm: 100,
    });
    expect(result.kind).toBe("rejected");
    if (result.kind !== "rejected") return;
    expect(result.error).toMatch(/Invalid top_png|data URL/i);
  });

  it("rejects when checksumPngBuffer throws after quality pass", async () => {
    const box = planSymbolRasterBox(400, 400);
    const good = await makePng(box.rasterWidthPx, box.rasterHeightPx);
    const spy = vi.spyOn(pngPublishChecksum, "checksumPngBuffer").mockImplementation(() => {
      throw new Error("checksum boom");
    });

    try {
      const result = await authorizeStudioCatalogTopPng({
        itemId: "f_checksum_fail",
        topPng: pngDataUrl(good),
        widthMm: 400,
        depthMm: 400,
      });
      expect(result.kind).toBe("rejected");
      if (result.kind !== "rejected") return;
      expect(result.error).toMatch(/checksum boom/);
    } finally {
      spy.mockRestore();
    }
  });

  it("stringifies non-Error checksum failures", async () => {
    const box = planSymbolRasterBox(400, 400);
    const good = await makePng(box.rasterWidthPx, box.rasterHeightPx);
    const spy = vi.spyOn(pngPublishChecksum, "checksumPngBuffer").mockImplementation(() => {
      throw "checksum-string";
    });

    try {
      const result = await authorizeStudioCatalogTopPng({
        itemId: "f_checksum_str",
        topPng: pngDataUrl(good),
        widthMm: 400,
        depthMm: 400,
      });
      expect(result.kind).toBe("rejected");
      if (result.kind !== "rejected") return;
      expect(result.error).toMatch(/checksum-string/);
    } finally {
      spy.mockRestore();
    }
  });

  it("ignores whitespace-only asset fields as none", async () => {
    const result = await authorizeStudioCatalogTopPng({
      itemId: "f_ws",
      topSvg: "   ",
      topPng: "\n",
      widthMm: 100,
      depthMm: 100,
    });
    expect(result).toEqual({ kind: "none" });
  });

  it("stringifies non-Error server render failures", async () => {
    const spy = vi
      .spyOn(renderTopPngFromSvg, "renderTopPngFromSvg")
      .mockRejectedValueOnce("render-string-fail");
    try {
      const result = await authorizeStudioCatalogTopPng({
        itemId: "f_render_str",
        topSvg: SAMPLE_SVG,
        widthMm: 100,
        depthMm: 100,
      });
      expect(result.kind).toBe("rejected");
      if (result.kind !== "rejected") return;
      expect(result.error).toMatch(/render-string-fail/);
    } finally {
      spy.mockRestore();
    }
  });

  it("stringifies non-Error decodeDataUrl failures", async () => {
    const spy = vi.spyOn(studioStore, "decodeDataUrl").mockImplementation(() => {
      throw "decode-string-fail";
    });
    try {
      const result = await authorizeStudioCatalogTopPng({
        itemId: "f_decode_str",
        topPng: "data:image/png;base64,AAAA",
        widthMm: 100,
        depthMm: 100,
      });
      expect(result.kind).toBe("rejected");
      if (result.kind !== "rejected") return;
      expect(result.error).toMatch(/decode-string-fail/);
    } finally {
      spy.mockRestore();
    }
  });

  it("rejects non-string asset fields as none (no client-trust side channel)", async () => {
    const result = await authorizeStudioCatalogTopPng({
      itemId: "f_types",
      topSvg: { markup: SAMPLE_SVG } as unknown as string,
      topPng: 12345 as unknown as string,
      widthMm: 1000,
      depthMm: 600,
    });
    expect(result).toEqual({ kind: "none" });
  });

  it("quality-rejects server-rendered PNG when quality gate fails after raster", async () => {
    const spy = vi
      .spyOn(renderTopPngFromSvg, "renderTopPngFromSvg")
      .mockResolvedValueOnce(await makePng(16, 16));
    try {
      const result = await authorizeStudioCatalogTopPng({
        itemId: "f_gate_after_render",
        topSvg: SAMPLE_SVG,
        widthMm: 1000,
        depthMm: 600,
      });
      expect(result.kind).toBe("rejected");
      if (result.kind !== "rejected") return;
      expect(result.error).toMatch(/Substandard plan-symbol PNG rejected/i);
    } finally {
      spy.mockRestore();
    }
  });
});
