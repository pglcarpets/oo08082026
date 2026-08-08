import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { normalizeClientIp } from "@/lib/clientIp";
import { rateLimit } from "@/lib/rateLimit";

export function getPublicApiIp(req: Request | NextRequest): string {
  const raw =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip")?.trim() ??
    "127.0.0.1";
  return normalizeClientIp(raw);
}

export async function enforcePublicApiRateLimit(
  req: Request | NextRequest,
  scope: string,
  limit = 60,
  windowMs = 60 * 1000,
): Promise<NextResponse | null> {
  const ip = getPublicApiIp(req);

  let limitRes: Awaited<ReturnType<typeof rateLimit>>;
  try {
    limitRes = await rateLimit(`public:${scope}:${ip}`, limit, windowMs);
  } catch {
    // Rate limiting is a protective add-on, not core functionality — a
    // failure here must never turn into a 500 for the underlying route.
    return null;
  }

  if (limitRes.success) {return null;}

  return NextResponse.json(
    { error: "Too many requests" },
    {
      status: 429,
      headers: { "X-RateLimit-Reset": limitRes.reset.toString() },
    },
  );
}
