import { NextResponse } from "next/server";

/**
 * Minimal liveness probe for deploy/load balancers.
 * No secrets, no dependency checks — process is up and routing works.
 */
export async function GET() {
  return NextResponse.json(
    { ok: true },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
