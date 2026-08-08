/**
 * Studio file import helpers — detect kind + pure parsers.
 * Canvas mutation stays in the Studio component; this module is unit-testable.
 */

export type StudioImportKind = "svg" | "json" | "image" | "unknown";

/** Accept attribute for the Studio import file input. */
export const STUDIO_IMPORT_ACCEPT =
  [
    ".svg",
    ".json",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".gif",
    ".bmp",
    ".avif",
    ".tif",
    ".tiff",
    "image/*",
    "image/svg+xml",
    "application/json",
  ].join(",");

const IMAGE_EXT = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "bmp",
  "avif",
  "tif",
  "tiff",
]);

export function extensionOf(filename: string): string {
  const base = filename.trim().split(/[/\\]/).pop() || filename;
  const dot = base.lastIndexOf(".");
  if (dot < 0) return "";
  return base.slice(dot + 1).toLowerCase();
}

/**
 * Classify an import file by MIME type and/or filename extension.
 */
export function detectStudioImportKind(
  file: Pick<File, "name" | "type">,
): StudioImportKind {
  const mime = (file.type || "").toLowerCase().trim();
  const ext = extensionOf(file.name);

  if (mime === "image/svg+xml" || ext === "svg") return "svg";
  if (
    mime === "application/json" ||
    mime === "text/json" ||
    ext === "json"
  ) {
    return "json";
  }
  if (mime.startsWith("image/") || IMAGE_EXT.has(ext)) return "image";
  return "unknown";
}

export type ParsedCanvasJson =
  | { ok: true; json: Record<string, unknown> }
  | { ok: false; error: string };

/** Parse Fabric canvas JSON text. */
export function parseStudioCanvasJson(text: string): ParsedCanvasJson {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "Empty JSON" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed) as unknown;
  } catch {
    return { ok: false, error: "Invalid JSON" };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "JSON root must be an object" };
  }
  const obj = parsed as Record<string, unknown>;
  // Fabric canvas dumps usually include `objects` or `version`
  if (!("objects" in obj) && !("version" in obj) && !("background" in obj)) {
    return {
      ok: false,
      error: "Not a Fabric canvas JSON (missing objects/version)",
    };
  }
  return { ok: true, json: obj };
}

export function isSvgMarkup(text: string): boolean {
  const t = text.trim().toLowerCase();
  return t.startsWith("<?xml") || t.startsWith("<svg") || t.includes("<svg");
}

/** Read a File as text (for svg/json). */
export function readFileAsText(file: Blob): Promise<string> {
  return file.text();
}

/** Read a File as a data URL (for raster images). */
export function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Failed to read image as data URL"));
    };
    reader.onerror = () => reject(reader.error || new Error("FileReader failed"));
    reader.readAsDataURL(file);
  });
}
