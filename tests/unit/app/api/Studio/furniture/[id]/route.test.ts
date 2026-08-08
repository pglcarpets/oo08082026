/**
 * Contract tests for Studio furniture item API — catalog PNG authority on PATCH.
 * PATCH /api/Studio/furniture/[id] must server-render top_png from top_svg,
 * quality-gate client PNG, store top_png_checksum, and never trust tiny client stubs.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import sharp from "sharp";

import { planSymbolRasterBox } from "@/lib/catalog/planSymbolPngContract";
import { rateLimit } from "@/lib/rateLimit";
import { validateCsrfRequest } from "@/lib/security/csrf";
import { rateLimitResult } from "@/tests/helpers/rateLimitResult";
import {
  loadFurnitureItem,
  persistFurnitureAssets,
  writeFurnitureItem,
  nowIso,
} from "@studio/server/studioStore";
import { GET, PATCH } from "@/app/api/Studio/furniture/[id]/route";

vi.mock("@studio/server/studioStore", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@studio/server/studioStore")>();
  return {
    ...actual,
    loadFurnitureItem: vi.fn(),
    persistFurnitureAssets: vi.fn(),
    writeFurnitureItem: vi.fn(),
    deleteFurnitureItem: vi.fn(),
    nowIso: vi.fn(() => "2026-07-31T15:00:00.000Z"),
  };
});

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

const EXISTING = {
  id: "f_existing_abc",
  name: "Existing Desk",
  category: "Desks",
  dimensions: { width_mm: 1000, depth_mm: 600, height_mm: 750 },
  top_png_url: null as string | null,
  top_svg_url: null as string | null,
  top_png_checksum: null as string | null,
  is_custom: true,
  created_at: "2026-07-30T00:00:00.000Z",
  updated_at: "2026-07-30T00:00:00.000Z",
};

describe("app/api/Studio/furniture/[id]/route.ts — catalog PNG authority", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(nowIso).mockReturnValue("2026-07-31T15:00:00.000Z");
    vi.mocked(writeFurnitureItem).mockResolvedValue(undefined);
    vi.mocked(loadFurnitureItem).mockResolvedValue({ ...EXISTING });
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

  const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

  const patchJson = (id: string, body: unknown) =>
    new NextRequest(`http://localhost/api/Studio/furniture/${id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": "test-token",
      },
      body: JSON.stringify(body),
    });

  it("GET returns 404 when furniture is missing", async () => {
    vi.mocked(loadFurnitureItem).mockResolvedValueOnce(null);
    const res = await GET(
      new NextRequest("http://localhost/api/Studio/furniture/f_missing"),
      ctx("f_missing"),
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(String(body.detail)).toMatch(/not found/i);
  });

  it("PATCH returns 404 when furniture is missing", async () => {
    vi.mocked(loadFurnitureItem).mockResolvedValueOnce(null);
    const res = await PATCH(patchJson("f_missing", { name: "x" }), ctx("f_missing"));
    expect(res.status).toBe(404);
    expect(persistFurnitureAssets).not.toHaveBeenCalled();
    expect(writeFurnitureItem).not.toHaveBeenCalled();
  });

  it("PATCH returns 403 when CSRF validation fails", async () => {
    vi.mocked(validateCsrfRequest).mockResolvedValue(false);
    const res = await PATCH(
      patchJson("f_existing_abc", { top_svg: SAMPLE_SVG }),
      ctx("f_existing_abc"),
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("CSRF_FAILED");
    expect(persistFurnitureAssets).not.toHaveBeenCalled();
  });

  it("PATCH server-renders top_png from top_svg and stores checksum on item", async () => {
    const res = await PATCH(
      patchJson("f_existing_abc", {
        top_svg: SAMPLE_SVG,
        top_png: pngDataUrl(await makePng(8, 8)),
        dimensions: { width_mm: 1000, depth_mm: 600, height_mm: 750 },
      }),
      ctx("f_existing_abc"),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.top_png_url).toBe("/api/files/furniture/f_existing_abc_top.png");
    expect(body.top_svg_url).toBe("/api/files/furniture/f_existing_abc_top.svg");
    expect(body.top_png_checksum).toMatch(/^[a-f0-9]{64}$/);

    expect(persistFurnitureAssets).toHaveBeenCalledOnce();
    const [, persistPayload] = vi.mocked(persistFurnitureAssets).mock.calls[0]!;
    const bytes = Buffer.from(String(persistPayload.top_png).split(",")[1]!, "base64");
    const meta = await sharp(bytes).metadata();
    const box = planSymbolRasterBox(1000, 600);
    expect(meta.width).toBe(box.rasterWidthPx);
    expect(meta.height).toBe(box.rasterHeightPx);

    expect(writeFurnitureItem).toHaveBeenCalledOnce();
    const written = vi.mocked(writeFurnitureItem).mock.calls[0]![0];
    expect(written.top_png_checksum).toBe(body.top_png_checksum);
    expect(written.updated_at).toBe("2026-07-31T15:00:00.000Z");
  });

  it("PATCH returns 400 when client-only top_png fails quality gate", async () => {
    const res = await PATCH(
      patchJson("f_existing_abc", {
        top_png: pngDataUrl(await makePng(24, 24)),
        dimensions: { width_mm: 1000, depth_mm: 600, height_mm: 750 },
      }),
      ctx("f_existing_abc"),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(String(body.detail)).toMatch(/Substandard|dimensions mismatch|rejected/i);
    expect(persistFurnitureAssets).not.toHaveBeenCalled();
    expect(writeFurnitureItem).not.toHaveBeenCalled();
  });

  it("PATCH retains prior checksum when no raster assets are sent", async () => {
    vi.mocked(loadFurnitureItem).mockResolvedValueOnce({
      ...EXISTING,
      top_png_checksum: "a".repeat(64),
      top_png_url: "/api/files/furniture/f_existing_abc_top.png",
    });

    const res = await PATCH(
      patchJson("f_existing_abc", { name: "Renamed only" }),
      ctx("f_existing_abc"),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("Renamed only");
    expect(body.top_png_checksum).toBe("a".repeat(64));
    expect(writeFurnitureItem).toHaveBeenCalledOnce();
    const written = vi.mocked(writeFurnitureItem).mock.calls[0]![0];
    expect(written.top_png_checksum).toBe("a".repeat(64));
  });
});
