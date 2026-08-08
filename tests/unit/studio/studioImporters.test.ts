import { describe, it, expect } from "vitest";
import {
  STUDIO_IMPORT_ACCEPT,
  detectStudioImportKind,
  extensionOf,
  isSvgMarkup,
  parseStudioCanvasJson,
} from "@/lib/Studio/studioImporters";

describe("studioImporters", () => {
  it("lists all supported import accept tokens", () => {
    expect(STUDIO_IMPORT_ACCEPT).toContain(".svg");
    expect(STUDIO_IMPORT_ACCEPT).toContain(".json");
    expect(STUDIO_IMPORT_ACCEPT).toContain(".png");
    expect(STUDIO_IMPORT_ACCEPT).toContain(".jpg");
    expect(STUDIO_IMPORT_ACCEPT).toContain(".jpeg");
    expect(STUDIO_IMPORT_ACCEPT).toContain(".webp");
    expect(STUDIO_IMPORT_ACCEPT).toContain(".gif");
    expect(STUDIO_IMPORT_ACCEPT).toContain(".bmp");
    expect(STUDIO_IMPORT_ACCEPT).toContain(".avif");
    expect(STUDIO_IMPORT_ACCEPT).toContain("image/*");
  });

  it("extensionOf parses filenames", () => {
    expect(extensionOf("foo.PNG")).toBe("png");
    expect(extensionOf("path/to/x.svg")).toBe("svg");
    expect(extensionOf("noext")).toBe("");
  });

  it("detects svg/json/image kinds", () => {
    expect(detectStudioImportKind({ name: "a.svg", type: "" })).toBe("svg");
    expect(detectStudioImportKind({ name: "a.json", type: "application/json" })).toBe("json");
    expect(detectStudioImportKind({ name: "a.png", type: "image/png" })).toBe("image");
    expect(detectStudioImportKind({ name: "a.jpg", type: "" })).toBe("image");
    expect(detectStudioImportKind({ name: "a.jpeg", type: "image/jpeg" })).toBe("image");
    expect(detectStudioImportKind({ name: "a.webp", type: "" })).toBe("image");
    expect(detectStudioImportKind({ name: "a.gif", type: "" })).toBe("image");
    expect(detectStudioImportKind({ name: "a.bmp", type: "" })).toBe("image");
    expect(detectStudioImportKind({ name: "a.avif", type: "" })).toBe("image");
    expect(detectStudioImportKind({ name: "a.tiff", type: "" })).toBe("image");
    expect(detectStudioImportKind({ name: "a.txt", type: "text/plain" })).toBe("unknown");
  });

  it("parses fabric canvas json", () => {
    const ok = parseStudioCanvasJson(JSON.stringify({ version: "6", objects: [] }));
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.json.version).toBe("6");

    expect(parseStudioCanvasJson("").ok).toBe(false);
    expect(parseStudioCanvasJson("not-json").ok).toBe(false);
    expect(parseStudioCanvasJson("[]").ok).toBe(false);
    expect(parseStudioCanvasJson(JSON.stringify({ foo: 1 })).ok).toBe(false);
  });

  it("detects svg markup", () => {
    expect(isSvgMarkup("<svg viewBox='0 0 1 1'></svg>")).toBe(true);
    expect(isSvgMarkup("<?xml version='1.0'?><svg></svg>")).toBe(true);
    expect(isSvgMarkup("{ }")).toBe(false);
  });
});
