import { timingSafeEqual } from "crypto";
import type { NextRequest} from "next/server";
import { createSupabaseAuthAdminClient } from '@/platform/supabase/auth-admin';
import { getClientIp } from "@/platform/supabase/adminServer";
import { createAuthServerClient } from "@/platform/supabase/server";
import { rateLimit } from "@/lib/rateLimit";
import { validateCsrfRequest } from "@/lib/security/csrf";
import { CSRF_REJECTION_HEADER_NAME } from "@/lib/security/csrfConstants";
import { isAppAdmin } from "@/lib/auth/roles";
import { success, error, rateLimitedError } from "@/features/shared/api/apiResponse";
import { ApiError, API_ERROR_CODES } from "@/features/shared/api/ApiError";

type QueryStatus = "new" | "in_progress" | "closed" | "spam";
type FollowUpChannel = "email" | "whatsapp" | "phone" | "none";

type PatchPayload = {
  id?: string;
  status?: QueryStatus;
  followUpChannel?: FollowUpChannel;
  followUpTarget?: string;
  followUpNotes?: string;
};

const allowedStatuses: QueryStatus[] = ["new", "in_progress", "closed", "spam"];
const allowedFollowUpChannels: FollowUpChannel[] = [
  "email",
  "whatsapp",
  "phone",
  "none",
];

function normalizeText(value: unknown, max = 5000): string {
  if (typeof value !== "string") {return "";}
  return value.trim().slice(0, max);
}

function safeTokenEquals(provided: string, required: string): boolean {
  const providedBytes = Buffer.from(provided);
  const requiredBytes = Buffer.from(required);
  if (providedBytes.length !== requiredBytes.length) {return false;}
  return timingSafeEqual(providedBytes, requiredBytes);
}

async function hasAdminSession(): Promise<boolean> {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {return false;}

    return isAppAdmin(user);
  } catch {
    return false;
  }
}

async function isAuthorized(req: NextRequest): Promise<boolean> {
  if (await hasAdminSession()) {return true;}

  const required = process.env.CUSTOMER_QUERIES_ADMIN_TOKEN?.trim();
  if (!required) {return false;}

  const provided = req.headers.get("x-admin-token")?.trim() || "";
  return provided.length > 0 && safeTokenEquals(provided, required);
}

async function ensureAuthorized(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return error(
      ApiError.fromCode(API_ERROR_CODES.AUTH_REQUIRED, "Unauthorized"),
    );
  }
  return null;
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const limitRes = await rateLimit(`customer-queries-manage:get:${ip}`, 30, 60 * 1000);
  if (!limitRes.success) {
    return rateLimitedError("Too many requests", limitRes.reset);
  }

  const unauthorized = await ensureAuthorized(req);
  if (unauthorized) {return unauthorized;}

  const statusFilter = normalizeText(req.nextUrl.searchParams.get("status"), 20);
  const limitRaw = Number(req.nextUrl.searchParams.get("limit") || "100");
  const limit = Number.isFinite(limitRaw)
    ? Math.max(1, Math.min(limitRaw, 200))
    : 100;

  try {
    const supabaseAdmin = createSupabaseAuthAdminClient();
    let query = supabaseAdmin
      .from("customer_queries")
      .select(
        "id, created_at, updated_at, source, source_path, name, company, email, phone, preferred_contact, message, requirement, budget, timeline, status, followup_channel, followup_target, followup_notes",
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (allowedStatuses.includes(statusFilter as QueryStatus)) {
      query = query.eq("status", statusFilter);
    }

    const { data, error: dbError } = await query;
    if (dbError) {
      console.error("customer_queries list failed:", dbError.message);
      return error(
        ApiError.fromCode(
          API_ERROR_CODES.DATABASE_ERROR,
          "Unable to load queries.",
        ),
      );
    }

    return success({ items: data ?? [] });
  } catch (err) {
    console.error("customer_queries list exception:", err);
    return error(
      ApiError.fromCode(
        API_ERROR_CODES.DATABASE_ERROR,
        "Unable to load queries.",
      ),
    );
  }
}

export async function PATCH(req: NextRequest) {
  const ip = getClientIp(req);
  const limitRes = await rateLimit(`customer-queries-manage:patch:${ip}`, 20, 60 * 1000);
  if (!limitRes.success) {
    return rateLimitedError("Too many requests", limitRes.reset);
  }

  const unauthorized = await ensureAuthorized(req);
  if (unauthorized) {return unauthorized;}

  const isCsrfValid = await validateCsrfRequest(req);
  if (!isCsrfValid) {
    return error(
      ApiError.fromCode(
        API_ERROR_CODES.CSRF_FAILED,
        "Invalid or missing CSRF token",
      ),
      { headers: { [CSRF_REJECTION_HEADER_NAME]: "1" } },
    );
  }

  let payload: PatchPayload = {};
  try {
    payload = (await req.json()) as PatchPayload;
  } catch {
    payload = {};
  }

  const id = normalizeText(payload.id, 80);
  const status = normalizeText(payload.status, 20) as QueryStatus;
  const followUpChannel = normalizeText(
    payload.followUpChannel,
    20,
  ) as FollowUpChannel;
  const followUpTarget = normalizeText(payload.followUpTarget, 250);
  const followUpNotes = normalizeText(payload.followUpNotes, 2000);

  if (!id) {
    return error(
      ApiError.fromCode(API_ERROR_CODES.MISSING_REQUIRED_FIELD, "Missing query id."),
    );
  }

  if (!allowedStatuses.includes(status)) {
    return error(
      ApiError.fromCode(API_ERROR_CODES.VALIDATION_ERROR, "Invalid status."),
    );
  }

  if (!allowedFollowUpChannels.includes(followUpChannel)) {
    return error(
      ApiError.fromCode(
        API_ERROR_CODES.VALIDATION_ERROR,
        "Invalid follow-up channel.",
      ),
    );
  }

  try {
    const supabaseAdmin = createSupabaseAuthAdminClient();
    const { data, error: dbError } = await supabaseAdmin
      .from("customer_queries")
      .update({
        status,
        followup_channel: followUpChannel,
        followup_target: followUpTarget || null,
        followup_notes: followUpNotes || null,
      })
      .eq("id", id)
      .select(
        "id, created_at, updated_at, source, source_path, name, company, email, phone, preferred_contact, message, requirement, budget, timeline, status, followup_channel, followup_target, followup_notes",
      )
      .single();

    if (dbError) {
      console.error("customer_queries update failed:", dbError.message);
      return error(
        ApiError.fromCode(
          API_ERROR_CODES.DATABASE_ERROR,
          "Unable to update query.",
        ),
      );
    }

    return success({ item: data });
  } catch (err) {
    console.error("customer_queries update exception:", err);
    return error(
      ApiError.fromCode(
        API_ERROR_CODES.DATABASE_ERROR,
        "Unable to update query.",
      ),
    );
  }
}