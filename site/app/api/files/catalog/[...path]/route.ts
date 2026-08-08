import { NextResponse } from "next/server";
import { readCatalogAssetBytes } from "@/lib/storage/r2Catalog";

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(_request: Request, context: Ctx) {
  const { path } = await context.params;
  const segments = (path ?? []).map((part) => part.trim()).filter(Boolean);
  if (segments.length === 0) {
    return NextResponse.json({ detail: "Bad path" }, { status: 400 });
  }

  const webPath = `/assets/catalog/${segments.join("/")}`;
  const asset = await readCatalogAssetBytes(webPath);
  if (!asset) {
    return NextResponse.json({ detail: "Not found" }, { status: 404 });
  }

  return new NextResponse(Buffer.from(asset.body), {
    headers: {
      "Content-Type": asset.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "x-oando-asset-source": "r2",
    },
  });
}
