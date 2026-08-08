import { NextResponse } from "next/server";
import path from "node:path";
import { promises as fs } from "node:fs";
import { FURNITURE_DIR, ensureStorageDirs, safeFilename } from "@studio/server/studioStore";

type Ctx = { params: Promise<{ filename: string }> };

export async function GET(_request: Request, context: Ctx) {
  const { filename } = await context.params;
  const safe = safeFilename(filename);
  if (!safe) return NextResponse.json({ detail: "Bad filename" }, { status: 400 });
  await ensureStorageDirs();
  try {
    const data = await fs.readFile(path.join(FURNITURE_DIR, safe));
    const ext = path.extname(safe).toLowerCase();
    const type =
      ext === ".svg" ? "image/svg+xml" : ext === ".png" ? "image/png" : "application/octet-stream";
    return new NextResponse(data, {
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=60" },
    });
  } catch {
    return NextResponse.json({ detail: "Not found" }, { status: 404 });
  }
}
