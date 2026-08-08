import { describe, expect, it, vi } from "vitest";
import sharp from "sharp";

import { assertPlanSymbolPngQuality } from "@/lib/catalog/publish/planSymbolPngQualityGate";
import { planSymbolRasterBox } from "@/lib/catalog/planSymbolPngContract";

async function makePng(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 255, g: 0, b: 0, alpha: 0.5 },
    },
  })
    .png()
    .toBuffer();
}

describe("assertPlanSymbolPngQuality", () => {
  it("accepts PNG within ±1 px of contract raster box", async () => {
    const box = planSymbolRasterBox(1000, 600);
    const png = await makePng(box.rasterWidthPx, box.rasterHeightPx);
    const result = await assertPlanSymbolPngQuality(png, {
      slug: "desk-1000",
      widthMm: 1000,
      depthMm: 600,
    });
    expect(result).toEqual({ ok: true });
  });

  it("rejects invalid signature", async () => {
    const result = await assertPlanSymbolPngQuality(Buffer.from("svg-bytes"), {
      slug: "x",
      widthMm: 100,
      depthMm: 100,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/invalid png signature/);
  });

  it("rejects dimension mismatch", async () => {
    const png = await makePng(32, 32);
    const result = await assertPlanSymbolPngQuality(png, {
      slug: "tiny",
      widthMm: 1000,
      depthMm: 600,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/dimensions mismatch/);
  });

  it("rejects empty buffers", async () => {
    const result = await assertPlanSymbolPngQuality(Buffer.alloc(0), {
      slug: "empty",
      widthMm: 100,
      depthMm: 100,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/empty png/);
  });

  it("accepts PNG within one pixel of contract raster box", async () => {
    const box = planSymbolRasterBox(800, 400);
    const png = await makePng(box.rasterWidthPx + 1, box.rasterHeightPx - 1);
    const result = await assertPlanSymbolPngQuality(png, {
      slug: "near-match",
      widthMm: 800,
      depthMm: 400,
    });
    expect(result).toEqual({ ok: true });
  });

  it("rejects buffers shorter than the PNG signature", async () => {
    const result = await assertPlanSymbolPngQuality(Buffer.alloc(4), {
      slug: "short",
      widthMm: 100,
      depthMm: 100,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/invalid png signature/);
  });

  it("rejects non-buffer input", async () => {
    const result = await assertPlanSymbolPngQuality("not-a-buffer" as unknown as Buffer, {
      slug: "not-buffer",
      widthMm: 100,
      depthMm: 100,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/empty png/);
  });

  it("reports sharp decode failures", async () => {
    const png = await makePng(64, 64);
    vi.spyOn(sharp.prototype, "metadata").mockRejectedValueOnce(
      new Error("corrupt png"),
    );

    const result = await assertPlanSymbolPngQuality(png, {
      slug: "corrupt",
      widthMm: 100,
      depthMm: 100,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/png decode failed for corrupt: corrupt png/);
  });

  it("stringifies non-Error sharp decode failures", async () => {
    const png = await makePng(64, 64);
    vi.spyOn(sharp.prototype, "metadata").mockRejectedValueOnce("corrupt");

    const result = await assertPlanSymbolPngQuality(png, {
      slug: "corrupt",
      widthMm: 100,
      depthMm: 100,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/png decode failed for corrupt: corrupt/);
  });

  it("treats missing sharp dimensions as zero and fails mismatch", async () => {
    const png = await makePng(64, 64);
    vi.spyOn(sharp.prototype, "metadata").mockResolvedValueOnce({});

    const result = await assertPlanSymbolPngQuality(png, {
      slug: "no-dimensions",
      widthMm: 1000,
      depthMm: 600,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/dimensions mismatch/);
    expect(result.error).toContain("0x0");
  });
});
