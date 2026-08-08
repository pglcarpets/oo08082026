import { NextResponse } from "next/server";
import path from "node:path";
import {
  BadRequestError,
  EXPORTS_DIR,
  decodeDataUrl,
  ensureExportsDir,
  readJsonBody,
  shortId,
  slugify,
  writeBytes,
} from "../_lib/exportsStore";

/** Port of FastAPI POST /api/exports */
export async function POST(request: Request) {
  try {
    return await createExport(request);
  } catch (e) {
    if (e instanceof BadRequestError) {
      return NextResponse.json({ detail: e.message }, { status: 400 });
    }
    throw e;
  }
}

async function createExport(request: Request) {
  const payload = (await readJsonBody(request)) as {
    format?: string;
    data_url?: string;
    name?: string;
  };
  const fmt = (payload.format || "png").replace(/[^a-z0-9]/gi, "") || "png";
  const dataUrl = payload.data_url;
  const name = slugify(payload.name || "export");
  if (!dataUrl) {
    return NextResponse.json({ detail: "data_url required" }, { status: 400 });
  }
  await ensureExportsDir();
  const { raw } = decodeDataUrl(dataUrl);
  const exportId = `e_${name}_${shortId()}.${fmt}`;
  await writeBytes(path.join(EXPORTS_DIR, exportId), raw);
  return NextResponse.json({ id: exportId, url: `/api/files/exports/${exportId}` });
}
