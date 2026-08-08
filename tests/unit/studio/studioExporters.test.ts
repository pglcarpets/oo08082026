import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  canvasJsonToDataUrl,
  canvasJsonToDownloadText,
  contentBounds,
  downloadDataUrl,
  downloadText,
  exportJPEG,
  exportJPG,
  exportPNG,
  exportRaster,
  exportSVG,
  exportCanvasJson,
  exportTightJPEG,
  exportTightPNG,
  exportTightRaster,
  TIGHT_EXPORT_PAD,
} from "@/lib/Studio/studioExporters";

function mockCanvas(overrides: Record<string, unknown> = {}) {
  const vpt: [number, number, number, number, number, number] = [1, 0, 0, 1, 400, 300];
  return {
    toDataURL: vi.fn((opts: { format?: string }) => `data:image/${opts.format || "png"};base64,xx`),
    toSVG: vi.fn(() => "<svg xmlns='http://www.w3.org/2000/svg'></svg>"),
    toObject: vi.fn(() => ({ version: "6", objects: [{ type: "rect", data: { kind: "shape" } }] })),
    getWidth: vi.fn(() => 800),
    getHeight: vi.fn(() => 600),
    viewportTransform: vpt.slice() as [number, number, number, number, number, number],
    setViewportTransform: vi.fn(function setViewportTransform(
      this: { viewportTransform: number[] },
      next: number[],
    ) {
      this.viewportTransform = next.slice();
    }),
    getObjects: vi.fn(() => [
      {
        getBoundingRect: () => ({ left: 10, top: 10, width: 40, height: 30 }),
        data: {},
        excludeFromExport: false,
      },
    ]),
    ...overrides,
  };
}

describe("studioExporters", () => {
  beforeEach(() => {
    vi.stubGlobal("document", {
      createElement: vi.fn(() => {
        const a = { href: "", download: "", click: vi.fn() };
        return a;
      }),
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("exportPNG uses png format", () => {
    const c = mockCanvas();
    const url = exportPNG(c as never, { multiplier: 2 });
    expect(url).toContain("image/png");
    expect(c.toDataURL).toHaveBeenCalledWith(
      expect.objectContaining({ format: "png", multiplier: 2 }),
    );
  });

  it("exportJPEG/exportJPG use jpeg format", () => {
    const c = mockCanvas();
    exportJPEG(c as never);
    expect(c.toDataURL).toHaveBeenCalledWith(
      expect.objectContaining({ format: "jpeg" }),
    );
    exportJPG(c as never);
    expect(c.toDataURL).toHaveBeenLastCalledWith(
      expect.objectContaining({ format: "jpeg" }),
    );
  });

  it("exportRaster honours format option", () => {
    const c = mockCanvas();
    exportRaster(c as never, { format: "webp" });
    expect(c.toDataURL).toHaveBeenCalledWith(
      expect.objectContaining({ format: "webp" }),
    );
  });

  it("exportSVG returns markup and data url", () => {
    const c = mockCanvas();
    const { svg, dataUrl } = exportSVG(c as never);
    expect(svg).toContain("<svg");
    expect(dataUrl.startsWith("data:image/svg+xml")).toBe(true);
  });

  it("exportCanvasJson includes fabric objects", () => {
    const c = mockCanvas();
    const json = exportCanvasJson(c as never);
    expect(json.version).toBe("6");
    expect(Array.isArray(json.objects)).toBe(true);
    expect(c.toObject).toHaveBeenCalledWith(["data"]);
  });

  it("canvasJsonToDownloadText and data url are valid", () => {
    const text = canvasJsonToDownloadText({ version: "6", objects: [] });
    expect(text).toContain('"version"');
    const url = canvasJsonToDataUrl({ version: "6", objects: [] });
    expect(url.startsWith("data:application/json")).toBe(true);
  });

  it("exportTightPNG/JPEG use content bounds", () => {
    const c = mockCanvas();
    expect(exportTightPNG(c as never, 3)).toContain("image/png");
    expect(exportTightJPEG(c as never, 2)).toContain("image/jpeg");
    expect(exportTightRaster(c as never, { format: "png" })).toBeTruthy();
  });

  it("exportTight returns null when no drawable objects", () => {
    const c = mockCanvas({ getObjects: vi.fn(() => []) });
    expect(exportTightPNG(c as never)).toBeNull();
  });

  it("contentBounds keeps negative scene coords (no clamp to 0)", () => {
    // Studio world origin is viewport-centred — furniture often spans negative X/Y.
    const c = mockCanvas({
      getObjects: vi.fn(() => [
        {
          getBoundingRect: () => ({ left: -80, top: -40, width: 120, height: 90 }),
          data: {},
          excludeFromExport: false,
        },
      ]),
    });
    const bounds = contentBounds(c as never);
    expect(bounds).not.toBeNull();
    expect(bounds!.left).toBe(-80 - TIGHT_EXPORT_PAD);
    expect(bounds!.top).toBe(-40 - TIGHT_EXPORT_PAD);
    expect(bounds!.width).toBe(120 + TIGHT_EXPORT_PAD * 2);
    expect(bounds!.height).toBe(90 + TIGHT_EXPORT_PAD * 2);
    // Regression: old code used Math.max(0, min - pad) and clipped left half.
    expect(bounds!.left).toBeLessThan(0);
    expect(bounds!.top).toBeLessThan(0);
  });

  it("exportTightPNG crop fully contains content box with padding under centred viewport", () => {
    const content = { left: -60, top: -30, width: 100, height: 80 };
    const c = mockCanvas({
      getObjects: vi.fn(() => [
        {
          getBoundingRect: () => ({ ...content }),
          data: {},
          excludeFromExport: false,
        },
      ]),
    });

    exportTightPNG(c as never, 3);

    // Viewport reset to identity for export, then restored to centred pan.
    expect(c.setViewportTransform).toHaveBeenCalled();
    const vptCalls = (c.setViewportTransform as ReturnType<typeof vi.fn>).mock.calls.map(
      (args) => args[0] as number[],
    );
    expect(vptCalls[0]).toEqual([1, 0, 0, 1, 0, 0]);
    expect(vptCalls[vptCalls.length - 1]).toEqual([1, 0, 0, 1, 400, 300]);

    expect(c.toDataURL).toHaveBeenCalledWith(
      expect.objectContaining({
        format: "png",
        multiplier: 3,
        left: content.left - TIGHT_EXPORT_PAD,
        top: content.top - TIGHT_EXPORT_PAD,
        width: content.width + TIGHT_EXPORT_PAD * 2,
        height: content.height + TIGHT_EXPORT_PAD * 2,
      }),
    );

    const crop = (c.toDataURL as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
      left: number;
      top: number;
      width: number;
      height: number;
    };
    // Content AABB must sit fully inside export crop (with pad margin).
    expect(crop.left).toBeLessThanOrEqual(content.left);
    expect(crop.top).toBeLessThanOrEqual(content.top);
    expect(crop.left + crop.width).toBeGreaterThanOrEqual(content.left + content.width);
    expect(crop.top + crop.height).toBeGreaterThanOrEqual(content.top + content.height);
  });

  it("exportTight restores viewport even when there is nothing to export", () => {
    const c = mockCanvas({ getObjects: vi.fn(() => []) });
    expect(exportTightPNG(c as never)).toBeNull();
    const last = (c.setViewportTransform as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0];
    expect(last).toEqual([1, 0, 0, 1, 400, 300]);
  });

  it("downloadDataUrl and downloadText create anchor clicks", () => {
    const createElement = document.createElement as ReturnType<typeof vi.fn>;
    downloadDataUrl("data:text/plain,hi", "a.txt");
    expect(createElement).toHaveBeenCalledWith("a");
    downloadText('{"a":1}', "a.json");
    expect(createElement).toHaveBeenCalled();
  });
});
