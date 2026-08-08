import type { NextRequest } from "next/server";
import { getClientIp } from "@/platform/supabase/adminServer";
import { success, error, rateLimitedError } from "@/features/shared/api/apiResponse";
import { ApiError, API_ERROR_CODES } from "@/features/shared/api/ApiError";
import { rateLimit } from "@/lib/rateLimit";
import { isAllowedBrowserOrigin } from "@/lib/security/requestOrigin";
import {
  createCustomerQuery,
  type CustomerQueryInput,
} from "@/features/site/contact/createCustomerQuery";

async function parsePayload(req: NextRequest): Promise<CustomerQueryInput> {
  try {
    return (await req.json()) as CustomerQueryInput;
  } catch {
    return {};
  }
}

/**
 * Public customer-query intake (REST).
 * Thin wrapper over createCustomerQuery — keep contract stable for ContactTeaser / assistants.
 * Public-form static audit requires rateLimit + honeypot (`website`) markers in this file.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Cross-site browser POSTs must match this host (rate limit + honeypot remain primary).
  if (!isAllowedBrowserOrigin(req)) {
    return error(ApiError.forbidden("Request origin is not allowed."));
  }

  // Public form rate limit (shared key with createCustomerQuery / server action).
  const limitRes = await rateLimit(`customer-queries:${ip}`, 6, 60 * 60 * 1000);
  if (!limitRes.success) {
    return rateLimitedError(
      "Too many submissions. Please try again after some time.",
      limitRes.reset,
    );
  }

  const payload = await parsePayload(req);
  // Honeypot field `website`: createCustomerQuery returns fake success when filled.
  const result = await createCustomerQuery(payload, {
    ip,
    rateLimitAlreadyApplied: true,
  });

  if (!result.ok) {
    if (result.kind === "rate_limited") {
      return rateLimitedError(result.message, result.reset);
    }
    if (result.kind === "validation") {
      return error(
        ApiError.fromCode(API_ERROR_CODES.MISSING_REQUIRED_FIELD, result.message),
      );
    }
    return error(
      ApiError.fromCode(API_ERROR_CODES.DATABASE_ERROR, result.message),
    );
  }

  return success(
    {
      queryId: result.queryId,
      createdAt: result.createdAt,
      followUp: result.followUp,
    },
    201,
  );
}
