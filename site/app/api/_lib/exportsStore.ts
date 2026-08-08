import { promises as fs } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

/**
 * Export upload storage. Deliberately neutral infrastructure: imported by the
 * `/api/exports` and `/api/files/exports` handlers only, never by an app tree,
 * so it creates no Planner/Studio coupling.
 */

export const EXPORTS_DIR = path.join(
  process.cwd(),
  "site",
  "platform",
  "shared",
  "data",
  "exports",
);

export async function ensureExportsDir(): Promise<void> {
  await fs.mkdir(EXPORTS_DIR, { recursive: true });
}

export function shortId(): string {
  return randomBytes(3).toString("hex");
}

export function slugify(text: string): string {
  const cleaned = (text || "")
    .replace(/[^a-zA-Z0-9\-\s]/g, "")
    .trim()
    .toLowerCase();
  return cleaned.replace(/[\s-]+/g, "-") || "item";
}

/**
 * Bad client input. The `/api/exports` handler translates this into a 400 so a
 * malformed request body can never surface as an unhandled 500.
 */
export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
  }
}

/** Parse a JSON request body, rejecting non-objects and malformed payloads. */
export async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    throw new BadRequestError("Malformed JSON body");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new BadRequestError("Expected a JSON object body");
  }
  return parsed as Record<string, unknown>;
}

export function decodeDataUrl(dataUrl: string): { raw: Buffer; mime: string } {
  if (!dataUrl.startsWith("data:")) {
    throw new BadRequestError("Expected a data: URL");
  }
  const comma = dataUrl.indexOf(",");
  const header = dataUrl.slice(0, comma);
  const encoded = dataUrl.slice(comma + 1);
  const mime = header.split(":")[1]?.split(";")[0] || "application/octet-stream";
  if (header.includes(";base64")) {
    return { raw: Buffer.from(encoded, "base64"), mime };
  }
  return { raw: Buffer.from(decodeURIComponent(encoded), "utf8"), mime };
}

export async function writeBytes(filePath: string, data: Buffer): Promise<void> {
  await fs.writeFile(filePath, data);
}

export function safeFilename(name: string): string | null {
  if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) return null;
  return name;
}
