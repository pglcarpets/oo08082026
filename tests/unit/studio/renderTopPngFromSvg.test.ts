// @vitest-environment node
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import sharp from "sharp";

import { planSymbolRasterBox } from "@/lib/catalog/planSymbolPngContract";
import {
  renderTopPngFromSvg,
  svgMarkupFromInput,
} from "@studio/server/renderTopPngFromSvg";

const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="80" viewBox="0 0 100 80">
  <rect x="10" y="10" width="80" height="60" fill="#8a8680" stroke="#2c2a28" stroke-width="2"/>
</svg>`;

describe("svgMarkupFromInput", () => {
  it("returns raw SVG markup unchanged", () => {
    expect(svgMarkupFromInput(SAMPLE_SVG)).toContain("<svg");
  });

  it("decodes data:image/svg+xml;base64 URLs", () => {
    const dataUrl = `data:image/svg+xml;base64,${Buffer.from(SAMPLE_SVG, "utf8").toString("base64")}`;
    expect(svgMarkupFromInput(dataUrl)).toContain("<rect");
  });

  it("decodes data:image/svg+xml;charset=utf-8, percent-encoded URLs", () => {
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SAMPLE_SVG)}`;
    expect(svgMarkupFromInput(dataUrl)).toContain('width="100"');
  });

  it("rejects empty input", () => {
    expect(() => svgMarkupFromInput("")).toThrow(/svg/i);
  });

  it("rejects malformed data URLs without a comma", () => {
    expect(() => svgMarkupFromInput("data:image/svg+xml;base64")).toThrow(/Malformed/i);
  });

  it("rejects non-svg data URLs", () => {
    expect(() => svgMarkupFromInput("data:image/png;base64,aaaa")).toThrow(/svg/i);
  });

  it("accepts data URLs that only mention svg in the media type token", () => {
    // header contains "svg" without the full image/svg+xml token spelling edge
    const dataUrl = `data:image/svg;base64,${Buffer.from(SAMPLE_SVG, "utf8").toString("base64")}`;
    expect(svgMarkupFromInput(dataUrl)).toContain("<svg");
  });

  it("treats nullish input as empty", () => {
    expect(() => svgMarkupFromInput(null as unknown as string)).toThrow(/non-empty/i);
  });
});

describe("renderTopPngFromSvg", () => {
  it("rasterizes SVG to plan-symbol contract pixel box", async () => {
    const widthMm = 1000;
    const depthMm = 600;
    const box = planSymbolRasterBox(widthMm, depthMm);

    const png = await renderTopPngFromSvg(SAMPLE_SVG, widthMm, depthMm);

    expect(png.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(
      true,
    );
    const meta = await sharp(png).metadata();
    expect(meta.width).toBe(box.rasterWidthPx);
    expect(meta.height).toBe(box.rasterHeightPx);
  });

  it("accepts SVG data URLs from Studio client export", async () => {
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SAMPLE_SVG)}`;
    const box = planSymbolRasterBox(800, 400);
    const png = await renderTopPngFromSvg(dataUrl, 800, 400);
    const meta = await sharp(png).metadata();
    expect(meta.width).toBe(box.rasterWidthPx);
    expect(meta.height).toBe(box.rasterHeightPx);
  });

  it("produces stable non-empty bytes for the same SVG + footprint", async () => {
    const a = await renderTopPngFromSvg(SAMPLE_SVG, 500, 500);
    const b = await renderTopPngFromSvg(SAMPLE_SVG, 500, 500);
    expect(a.length).toBeGreaterThan(32);
    expect(createHash("sha256").update(a).digest("hex")).toBe(
      createHash("sha256").update(b).digest("hex"),
    );
  });

  it("rejects non-positive footprint mm", async () => {
    await expect(renderTopPngFromSvg(SAMPLE_SVG, 0, 100)).rejects.toThrow(/width|footprint|mm/i);
    await expect(renderTopPngFromSvg(SAMPLE_SVG, 100, -1)).rejects.toThrow(/depth|footprint|mm/i);
  });

  it("rejects non-finite footprint mm", async () => {
    await expect(renderTopPngFromSvg(SAMPLE_SVG, Number.NaN, 100)).rejects.toThrow(
      /Invalid footprint width_mm/i,
    );
    await expect(renderTopPngFromSvg(SAMPLE_SVG, 100, Number.POSITIVE_INFINITY)).rejects.toThrow(
      /Invalid footprint depth_mm/i,
    );
  });

  it("rejects footprint mm above the catalog max (DoS cap)", async () => {
    // 20001 mm is above STUDIO_TOP_PNG_MAX_FOOTPRINT_MM (20000)
    await expect(renderTopPngFromSvg(SAMPLE_SVG, 20_001, 100)).rejects.toThrow(
      /footprint|width_mm|max|limit|too large/i,
    );
    await expect(renderTopPngFromSvg(SAMPLE_SVG, 100, 20_001)).rejects.toThrow(
      /footprint|depth_mm|max|limit|too large/i,
    );
  });

  it("rejects footprint that would exceed max raster edge after planSymbolRasterBox", async () => {
    // 2 px/mm + 40 mm pad → raster edge = mm*2 + 160; 5000 mm → 10160 px > 8192
    await expect(renderTopPngFromSvg(SAMPLE_SVG, 5_000, 600)).rejects.toThrow(
      /raster|edge|px|max|limit|too large/i,
    );
  });

  it("rejects oversized SVG markup before sharp (string length cap)", async () => {
    // > 2 MiB of payload — must fail closed without rasterizing
    const filler = "A".repeat(2 * 1024 * 1024 + 1);
    const huge = `<svg xmlns="http://www.w3.org/2000/svg"><desc>${filler}</desc></svg>`;
    await expect(renderTopPngFromSvg(huge, 100, 100)).rejects.toThrow(
      /svg|size|bytes|limit|too large|oversized/i,
    );
  });
});
