// @vitest-environment node
import { describe, expect, it } from "vitest";
import sharp from "sharp";

import { planSymbolRasterBox } from "@/lib/catalog/planSymbolPngContract";
import { BadRequestError } from "@studio/server/studioStore";
import {
  prepareStudioFurnitureCatalogFiles,
  resolveFurnitureFootprintMm,
} from "@studio/server/prepareStudioFurnitureCatalogFiles";

const SAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
  <rect width="20" height="20" fill="#123" />
</svg>`;

async function makePng(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 1, g: 2, b: 3, alpha: 1 },
    },
  })
    .png()
    .toBuffer();
}

describe("prepareStudioFurnitureCatalogFiles", () => {
  it("injects server-rendered top_png + checksum when top_svg is present", async () => {
    const payload = {
      name: "Desk",
      top_svg: SAMPLE_SVG,
      top_png: `data:image/png;base64,${(await makePng(8, 8)).toString("base64")}`,
    };

    const prepared = await prepareStudioFurnitureCatalogFiles("f_desk_prep", payload, {
      width_mm: 1000,
      depth_mm: 600,
    });

    expect(prepared.top_png_checksum).toMatch(/^[a-f0-9]{64}$/);
    expect(typeof prepared.payload.top_png).toBe("string");
    expect(String(prepared.payload.top_png).startsWith("data:image/png;base64,")).toBe(true);

    // Server PNG must replace the tiny client stub.
    const bytes = Buffer.from(String(prepared.payload.top_png).split(",")[1]!, "base64");
    const meta = await sharp(bytes).metadata();
    const box = planSymbolRasterBox(1000, 600);
    expect(meta.width).toBe(box.rasterWidthPx);
    expect(meta.height).toBe(box.rasterHeightPx);

    // SVG present as data URL so disk persist can decode it.
    expect(String(prepared.payload.top_svg)).toMatch(/^data:image\/svg\+xml/);
    expect(decodeURIComponent(String(prepared.payload.top_svg).split(",")[1]!)).toContain("<rect");
  });

  it("throws BadRequestError when client-only top_png fails quality gate", async () => {
    const payload = {
      top_png: `data:image/png;base64,${(await makePng(16, 16)).toString("base64")}`,
    };

    await expect(
      prepareStudioFurnitureCatalogFiles("f_bad_prep", payload, {
        width_mm: 1000,
        depth_mm: 600,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);

    await expect(
      prepareStudioFurnitureCatalogFiles("f_bad_prep", payload, {
        width_mm: 1000,
        depth_mm: 600,
      }),
    ).rejects.toThrow(/Substandard|dimensions mismatch|rejected/i);
  });

  it("passes through when no raster assets are provided", async () => {
    const payload = { name: "Meta only" };
    const prepared = await prepareStudioFurnitureCatalogFiles("f_meta", payload, {
      width_mm: 100,
      depth_mm: 100,
    });
    expect(prepared.top_png_checksum).toBeNull();
    expect(prepared.payload).toEqual(payload);
  });
});

describe("resolveFurnitureFootprintMm", () => {
  it("reads dimensions object", () => {
    expect(
      resolveFurnitureFootprintMm({
        dimensions: { width_mm: 1200, depth_mm: 800, height_mm: 750 },
      }),
    ).toEqual({ width_mm: 1200, depth_mm: 800 });
  });

  it("falls back to top-level width_mm/depth_mm", () => {
    expect(resolveFurnitureFootprintMm({ width_mm: 500, depth_mm: 400 })).toEqual({
      width_mm: 500,
      depth_mm: 400,
    });
  });

  it("defaults missing numbers to 0", () => {
    expect(resolveFurnitureFootprintMm({})).toEqual({ width_mm: 0, depth_mm: 0 });
  });

  it("ignores array dimensions and falls back to top-level", () => {
    expect(
      resolveFurnitureFootprintMm({
        dimensions: [1, 2] as unknown as Record<string, number>,
        width_mm: 111,
        depth_mm: 222,
      }),
    ).toEqual({ width_mm: 111, depth_mm: 222 });
  });
});

describe("prepareStudioFurnitureCatalogFiles — data URL SVG passthrough", () => {
  it("keeps existing top_svg data URLs and still server-renders PNG", async () => {
    const dataSvg = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SAMPLE_SVG)}`;
    const prepared = await prepareStudioFurnitureCatalogFiles(
      "f_data_svg",
      { top_svg: dataSvg },
      { width_mm: 700, depth_mm: 700 },
    );
    expect(prepared.top_png_checksum).toMatch(/^[a-f0-9]{64}$/);
    expect(prepared.payload.top_svg).toBe(dataSvg);
  });

  it("accepts contract client PNG without inventing top_svg", async () => {
    const box = planSymbolRasterBox(500, 500);
    const good = await makePng(box.rasterWidthPx, box.rasterHeightPx);
    const prepared = await prepareStudioFurnitureCatalogFiles(
      "f_client_only",
      { top_png: `data:image/png;base64,${good.toString("base64")}`, name: "X" },
      { width_mm: 500, depth_mm: 500 },
    );
    expect(prepared.top_png_checksum).toMatch(/^[a-f0-9]{64}$/);
    expect(prepared.payload.top_svg).toBeUndefined();
    expect(String(prepared.payload.top_png).startsWith("data:image/png;base64,")).toBe(true);
  });

  it("normalizes empty-string top_svg without blocking client PNG accept", async () => {
    const box = planSymbolRasterBox(500, 500);
    const good = await makePng(box.rasterWidthPx, box.rasterHeightPx);
    const prepared = await prepareStudioFurnitureCatalogFiles(
      "f_empty_svg_field",
      {
        top_svg: "",
        top_png: `data:image/png;base64,${good.toString("base64")}`,
      },
      { width_mm: 500, depth_mm: 500 },
    );
    expect(prepared.top_png_checksum).toMatch(/^[a-f0-9]{64}$/);
    expect(prepared.payload.top_svg).toBe("");
  });

  it("throws BadRequestError when SVG footprint is non-positive (fail-closed)", async () => {
    await expect(
      prepareStudioFurnitureCatalogFiles(
        "f_zero_mm",
        { top_svg: SAMPLE_SVG },
        { width_mm: 0, depth_mm: 600 },
      ),
    ).rejects.toBeInstanceOf(BadRequestError);

    await expect(
      prepareStudioFurnitureCatalogFiles(
        "f_zero_mm",
        { top_svg: SAMPLE_SVG },
        { width_mm: 0, depth_mm: 600 },
      ),
    ).rejects.toThrow(/Server PNG render|width_mm|footprint/i);
  });

  it("does not leave client top_png when server SVG raster replaces it", async () => {
    const clientTiny = await makePng(8, 8);
    const clientUrl = `data:image/png;base64,${clientTiny.toString("base64")}`;
    const prepared = await prepareStudioFurnitureCatalogFiles(
      "f_no_client_trust",
      { top_svg: SAMPLE_SVG, top_png: clientUrl },
      { width_mm: 900, depth_mm: 500 },
    );
    expect(prepared.payload.top_png).not.toBe(clientUrl);
    const serverBytes = Buffer.from(String(prepared.payload.top_png).split(",")[1]!, "base64");
    expect(serverBytes.equals(clientTiny)).toBe(false);
    expect(prepared.top_png_checksum).toMatch(/^[a-f0-9]{64}$/);
  });
});
