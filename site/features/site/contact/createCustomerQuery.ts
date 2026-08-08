import "server-only";

import { createSupabaseAuthAdminClient } from "@/platform/supabase/auth-admin";
import { rateLimit } from "@/lib/rateLimit";
import { sendStaffQueryNotification } from "@/lib/email/sendStaffQueryNotification";
import { API_ERROR_CODES } from "@/features/shared/api/ApiError";
import type { PreferredContact } from "@/features/site/contact/customerQuerySchema";

export type CustomerQueryInput = {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  preferredContact?: PreferredContact | string;
  message?: string;
  requirement?: string;
  budget?: string;
  timeline?: string;
  source?: string;
  sourcePath?: string;
  /** Honeypot field — must be empty for legitimate submissions. */
  website?: string;
};

export type CustomerQueryFollowUp = {
  email: string | null;
  whatsapp: string | null;
};

export type CreateCustomerQuerySuccess = {
  ok: true;
  queryId: string;
  createdAt: string;
  followUp: CustomerQueryFollowUp;
  /** True when honeypot tripped (fake success, no DB write). */
  honeypot: boolean;
};

export type CreateCustomerQueryFailure =
  | {
      ok: false;
      kind: "rate_limited";
      message: string;
      reset: number;
      code: typeof API_ERROR_CODES.RATE_LIMIT_EXCEEDED;
    }
  | {
      ok: false;
      kind: "validation";
      message: string;
      code: typeof API_ERROR_CODES.MISSING_REQUIRED_FIELD;
    }
  | {
      ok: false;
      kind: "database";
      message: string;
      code: typeof API_ERROR_CODES.DATABASE_ERROR;
    };

export type CreateCustomerQueryResult =
  | CreateCustomerQuerySuccess
  | CreateCustomerQueryFailure;

const preferredContactValues: PreferredContact[] = [
  "email",
  "whatsapp",
  "phone",
  "any",
];

function normalizeText(value: unknown, max = 3000): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().slice(0, max);
}

function normalizePreferredContact(value: unknown): PreferredContact {
  if (typeof value !== "string") {
    return "any";
  }
  return preferredContactValues.includes(value as PreferredContact)
    ? (value as PreferredContact)
    : "any";
}

function normalizePhoneForWhatsApp(value: string): string {
  return value.replace(/[^\d]/g, "");
}

export type CreateCustomerQueryOptions = {
  /** Client IP for rate limiting (required). */
  ip: string;
  /**
   * When true, skip rateLimit here (caller already applied the same key).
   * Used by POST /api/customer-queries so the route file keeps a static rateLimit marker.
   */
  rateLimitAlreadyApplied?: boolean;
};

/**
 * Shared customer-query create path for REST and server actions.
 * Preserves rate limit, honeypot fake success, validation, and follow-up links.
 */
export async function createCustomerQuery(
  payload: CustomerQueryInput,
  options: CreateCustomerQueryOptions,
): Promise<CreateCustomerQueryResult> {
  if (!options.rateLimitAlreadyApplied) {
    const limitRes = await rateLimit(
      `customer-queries:${options.ip}`,
      6,
      60 * 60 * 1000,
    );
    if (!limitRes.success) {
      return {
        ok: false,
        kind: "rate_limited",
        message: "Too many submissions. Please try again after some time.",
        reset: limitRes.reset,
        code: API_ERROR_CODES.RATE_LIMIT_EXCEEDED,
      };
    }
  }

  // Honeypot: bots that fill `website` get a fake success with the same
  // envelope shape as a real insert so clients (and scrapers) cannot tell.
  const honeypot = normalizeText(payload.website, 120);
  if (honeypot) {
    return {
      ok: true,
      queryId: "submitted",
      createdAt: new Date().toISOString(),
      followUp: {
        email: null,
        whatsapp: null,
      },
      honeypot: true,
    };
  }

  const name = normalizeText(payload.name, 180);
  const message = normalizeText(payload.message, 5000);
  const company = normalizeText(payload.company, 180);
  const email = normalizeText(payload.email, 180);
  const phone = normalizeText(payload.phone, 50);
  const requirement = normalizeText(payload.requirement, 300);
  const budget = normalizeText(payload.budget, 120);
  const timeline = normalizeText(payload.timeline, 120);
  const source = normalizeText(payload.source, 60) || "website";
  const sourcePath = normalizeText(payload.sourcePath, 200);
  const preferredContact = normalizePreferredContact(payload.preferredContact);

  if (!name || !message) {
    return {
      ok: false,
      kind: "validation",
      message: "Name and message are required.",
      code: API_ERROR_CODES.MISSING_REQUIRED_FIELD,
    };
  }

  if (!email && !phone) {
    return {
      ok: false,
      kind: "validation",
      message: "Please provide email or phone.",
      code: API_ERROR_CODES.MISSING_REQUIRED_FIELD,
    };
  }

  const supabaseAdmin = createSupabaseAuthAdminClient();
  const { data, error: dbError } = await supabaseAdmin
    .from("customer_queries")
    .insert({
      name,
      company: company || null,
      email: email || null,
      phone: phone || null,
      preferred_contact: preferredContact,
      message,
      requirement: requirement || null,
      budget: budget || null,
      timeline: timeline || null,
      source,
      source_path: sourcePath || null,
    })
    .select("id, created_at, email, phone")
    .single();

  if (dbError || !data) {
    console.error(
      "customer_queries insert failed:",
      dbError?.message || "unknown",
    );
    return {
      ok: false,
      kind: "database",
      message: "Unable to save query right now.",
      code: API_ERROR_CODES.DATABASE_ERROR,
    };
  }

  const queryId = data.id;

  // Notify staff. The row is already committed, so a mail failure must not turn a
  // captured lead into a user-facing error — log and carry on. Before this, a
  // submitted enquiry reached nobody until someone opened /admin/customer-queries.
  const notified = await sendStaffQueryNotification({
    queryId,
    name,
    company,
    email,
    phone,
    preferredContact,
    message,
    requirement,
    budget,
    timeline,
    source,
    sourcePath,
  });
  if (!notified.ok) {
    console.error(
      `customer_queries notification not sent (${notified.reason}) for ${queryId}:`,
      notified.detail ?? "",
    );
  }

  const whatsappPhone = data.phone
    ? normalizePhoneForWhatsApp(data.phone)
    : "";
  const queryRefText = encodeURIComponent(
    `Hello, we received your query ${queryId}.`,
  );

  return {
    ok: true,
    queryId,
    createdAt: data.created_at,
    followUp: {
      email: data.email
        ? `mailto:${data.email}?subject=Query%20${queryId}`
        : null,
      whatsapp:
        whatsappPhone.length >= 8
          ? `https://wa.me/${whatsappPhone}?text=${queryRefText}`
          : null,
    },
    honeypot: false,
  };
}
