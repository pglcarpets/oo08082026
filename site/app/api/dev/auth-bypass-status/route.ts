import { NextResponse } from "next/server";
import { isDevAuthBypassEnabled } from "@/lib/auth/devAuthBypass";

/**
 * Dev diagnostic — reports whether server-side auth bypass is active.
 * Never returns secrets. Hidden in production (same posture as dev-tools).
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    bypassEnabled: isDevAuthBypassEnabled(),
    nodeEnv: process.env.NODE_ENV ?? null,
    flagSet: process.env.DEV_AUTH_BYPASS === "1",
  });
}
