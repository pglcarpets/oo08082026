import { NextResponse } from "next/server";

import { enforcePublicApiRateLimit } from "@/app/api/_lib/public";
import { generateCsrfToken, setCsrfTokenCookie } from "@/lib/security/csrf";

export async function GET(req: Request) {
  const rateError = await enforcePublicApiRateLimit(req, "csrf:get", 60);
  if (rateError) {return rateError;}

  const token = generateCsrfToken();
  await setCsrfTokenCookie(token);
  return NextResponse.json(
    { token },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        Pragma: "no-cache",
      },
    },
  );
}
