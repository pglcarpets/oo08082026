/**
 * Contract tests for Studio furniture collection API — catalog PNG authority.
 * POST /api/Studio/furniture must server-render top_png from top_svg, quality-gate,
 * store checksum, and reject substandard canvases (Task 09a/09b).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import sharp from "sharp";

import { planSymbolRasterBox } from "@/lib/catalog/planSymbolPngContract";
import { rateLimit } from "@/lib/rateLimit";
import { validateCsrfRequest } from "@/lib/security/csrf";
import { rateLimitResult } from "@/tests/helpers/rateLimitResult";
import {
  persistFurnitureAssets,
  shortId,
  nowIso,
  writeFurnitureItem,
} from "@studio/server/studioStore";
import { POST } from "@/app/api/Studio/furniture/route";

vi.mock("@studio/server/studioStore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@studio/server/studioStore")>();
  return {
    ...actual,
    listFurnitureCatalog: vi.fn(async () => []),
    persistFurnitureAssets: vi.fn(),
    writeFurnitureItem: vi.fn(),
    shortId: vi.fn(() => "abc123"),
    nowIso: vi.fn(() => "2026-07-31T12:00:00.000Z"),
  };
});

vi.mock("@studio/server/studioFurnitureSeed", () => ({
  ensureFurnitureSeeded: vi.fn(async () => undefined),
}));

vi.mock("@/lib/rateLimit", () => ({
  rateLimit: vi.fn(),
}));

vi.mock("@/lib/security/csrf", () => ({
  validateCsrfRequest: vi.fn(),
}));

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

describe("app/api/Studio/furniture/route.ts — catalog PNG authority", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(shortId).mockReturnValue("abc123");
    vi.mocked(nowIso).mockReturnValue("2026-07-31T12:00:00.000Z");
    vi.mocked(writeFurnitureItem).mockResolvedValue(undefined);
    vi.mocked(persistFurnitureAssets).mockImplementation(async (itemId, payload) => {
      const urls: Record<string, string> = {};
      if (typeof payload.top_png === "string" && payload.top_png) {
        urls.top_png_url = `/api/files/furniture/${itemId}_top.png`;
        urls.thumbnail_url = `/api/files/furniture/${itemId}_thumb.png`;
      }
      if (typeof payload.top_svg === "string" && payload.top_svg) {
        urls.top_svg_url = `/api/files/furniture/${itemId}_top.svg`;
      }
      return urls;
    });
    vi.mocked(rateLimit).mockResolvedValue(rateLimitResult({ success: true, reset: 0 }));
    vi.mocked(validateCsrfRequest).mockResolvedValue(true);
  });

  const postJson = (body: unknown) =>
    new NextRequest("http://localhost/api/Studio/furniture", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": "test-token",
      },
      body: JSON.stringify(body),
    });

  it("server-renders top_png from top_svg, persists URL, and stores checksum", async () => {
    const res = await POST(
      postJson({
        name: "Desk",
        category: "Desks",
        dimensions: { width_mm: 1000, depth_mm: 600, height_mm: 750 },
        top_svg: SAMPLE_SVG,
        top_png: pngDataUrl(await makePng(8, 8)),
        is_custom: true,
      }),
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.top_png_url).toBe("/api/files/furniture/f_desk_abc123_top.png");
    expect(body.top_svg_url).toBe("/api/files/furniture/f_desk_abc123_top.svg");
    expect(body.top_png_checksum).toMatch(/^[a-f0-9]{64}$/);

    expect(persistFurnitureAssets).toHaveBeenCalledOnce();
    const [, persistPayload] = vi.mocked(persistFurnitureAssets).mock.calls[0]!;
    expect(String(persistPayload.top_png).startsWith("data:image/png;base64,")).toBe(true);
    const bytes = Buffer.from(String(persistPayload.top_png).split(",")[1]!, "base64");
    const meta = await sharp(bytes).metadata();
    const box = planSymbolRasterBox(1000, 600);
    expect(meta.width).toBe(box.rasterWidthPx);
    expect(meta.height).toBe(box.rasterHeightPx);

    expect(writeFurnitureItem).toHaveBeenCalledOnce();
    const written = vi.mocked(writeFurnitureItem).mock.calls[0]![0];
    expect(written.top_png_checksum).toBe(body.top_png_checksum);
  });

  it("returns 400 when client-only top_png fails the plan-symbol quality gate", async () => {
    const res = await POST(
      postJson({
        name: "Bad",
        dimensions: { width_mm: 1000, depth_mm: 600, height_mm: 750 },
        top_png: pngDataUrl(await makePng(32, 32)),
      }),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(String(body.detail)).toMatch(/Substandard|dimensions mismatch|rejected/i);
    expect(persistFurnitureAssets).not.toHaveBeenCalled();
    expect(writeFurnitureItem).not.toHaveBeenCalled();
  });

  it("creates item without raster fields when neither top_svg nor top_png is sent", async () => {
    const res = await POST(
      postJson({
        name: "Meta",
        category: "Custom",
        dimensions: { width_mm: 100, depth_mm: 100, height_mm: 100 },
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.top_png_url).toBeNull();
    expect(body.top_png_checksum ?? null).toBeNull();
  });

  it("returns 403 when CSRF validation fails (mutator gate)", async () => {
    vi.mocked(validateCsrfRequest).mockResolvedValue(false);
    const res = await POST(
      postJson({
        name: "CSRF blocked",
        dimensions: { width_mm: 1000, depth_mm: 600, height_mm: 750 },
        top_svg: SAMPLE_SVG,
      }),
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("CSRF_FAILED");
    expect(persistFurnitureAssets).not.toHaveBeenCalled();
    expect(writeFurnitureItem).not.toHaveBeenCalled();
  });

  it("returns 400 when SVG is present but footprint mm is non-positive", async () => {
    const res = await POST(
      postJson({
        name: "Zero footprint",
        dimensions: { width_mm: 0, depth_mm: 600, height_mm: 750 },
        top_svg: SAMPLE_SVG,
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(String(body.detail)).toMatch(/Server PNG render|width_mm|footprint/i);
    expect(persistFurnitureAssets).not.toHaveBeenCalled();
    expect(writeFurnitureItem).not.toHaveBeenCalled();
  });

  it("does not trust client top_png bytes when top_svg is also provided", async () => {
    const clientTiny = await makePng(8, 8);
    const res = await POST(
      postJson({
        name: "Prefer SVG",
        dimensions: { width_mm: 800, depth_mm: 400, height_mm: 700 },
        top_svg: SAMPLE_SVG,
        top_png: pngDataUrl(clientTiny),
      }),
    );
    expect(res.status).toBe(201);
    const [, persistPayload] = vi.mocked(persistFurnitureAssets).mock.calls[0]!;
    const serverBytes = Buffer.from(String(persistPayload.top_png).split(",")[1]!, "base64");
    expect(serverBytes.equals(clientTiny)).toBe(false);
    const meta = await sharp(serverBytes).metadata();
    const box = planSymbolRasterBox(800, 400);
    expect(meta.width).toBe(box.rasterWidthPx);
    expect(meta.height).toBe(box.rasterHeightPx);
  });
});
