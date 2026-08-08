import { NextResponse } from "next/server";

/** Port of FastAPI GET /api/ */
export async function GET() {
  return NextResponse.json({ service: "furniture-workspace", status: "ok" });
}
