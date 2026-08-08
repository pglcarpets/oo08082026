import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { enforcePublicApiRateLimit } from "@/app/api/_lib/public";
import { reportClientError } from "@/lib/observability/reportClientError";

const MAX_BODY_BYTES = 16 * 1024;
const MAX_MESSAGE_CHARS = 2000;
const MAX_STACK_CHARS = 6000;
const MAX_URL_CHARS = 1024;
const MAX_USER_AGENT_CHARS = 512;
const MAX_LABEL_CHARS = 120;

const errorPayloadSchema = z.object({
  message: z.string().trim().max(MAX_MESSAGE_CHARS).optional(),
  stack: z.string().trim().max(MAX_STACK_CHARS).optional(),
  componentStack: z.string().trim().max(MAX_STACK_CHARS).optional(),
  url: z.string().trim().max(MAX_URL_CHARS).optional(),
  userAgent: z.string().trim().max(MAX_USER_AGENT_CHARS).optional(),
  label: z.string().trim().max(MAX_LABEL_CHARS).optional(),
});

export async function POST(req: NextRequest) {
  const rateError = await enforcePublicApiRateLimit(req, "log-error:post", 20);
  if (rateError) {return rateError;}

  try {
    const bodyText = await req.text();
    if (new TextEncoder().encode(bodyText).length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    let payload: unknown;
    try {
      payload = JSON.parse(bodyText);
    } catch {
      return NextResponse.json(
        { error: "Invalid payload or logging failed" },
        { status: 400 },
      );
    }

    const parsed = errorPayloadSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload or logging failed" },
        { status: 400 },
      );
    }

    const {
      message = "Unknown error",
      stack = "No stack trace provided",
      componentStack = "",
      url = "Unknown URL",
      userAgent = "Unknown UserAgent",
      label = "client",
    } = parsed.data;

    reportClientError({
      label,
      url,
      userAgent,
      message,
      stack,
      componentStack,
    });

    return NextResponse.json({ success: true, logged: true });
  } catch (err) {
    console.error("[api/log-error] Failed to log client-side error:", err);
    return NextResponse.json({ error: "Invalid payload or logging failed" }, { status: 400 });
  }
}
