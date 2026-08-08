import "server-only";

import { Resend } from "resend";

/**
 * Staff notification for a new customer enquiry.
 *
 * Until this existed, a submitted enquiry notified nobody: the row landed in
 * `public.customer_queries` and staff only saw it by opening `/admin/customer-queries`.
 * The env surface (`RESEND_API_KEY`, `EMAIL_FROM`, `STAFF_NOTIFY_EMAIL`) was already
 * provisioned for exactly this and had no reader.
 *
 * Sending must never fail the submission. The enquiry is already durably stored by the
 * time this runs, so a mail outage may not turn a captured lead into a user-facing
 * error — every failure path here returns a result instead of throwing.
 */

export type StaffQueryNotification = {
  queryId: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  preferredContact: string;
  message: string;
  requirement?: string;
  budget?: string;
  timeline?: string;
  source: string;
  sourcePath?: string;
};

export type StaffNotifyResult =
  | { ok: true; id: string | null; recipients: string[]; sandboxRedirect?: string[] }
  | {
      ok: false;
      reason: "not_configured" | "no_recipients" | "sandbox_recipient_required" | "send_failed";
      detail?: string;
    };

/** Split on comma or semicolon — STAFF_NOTIFY_EMAIL has historically used both. */
export function parseRecipients(raw: string | undefined): string[] {
  if (!raw) {
    return [];
  }
  return raw
    .split(/[;,]/)
    .map((value) => value.trim())
    .filter((value) => value.includes("@"));
}

/** Resend sandbox `from` addresses only deliver to the account owner email. */
export function isResendSandboxFrom(from: string): boolean {
  const trimmed = from.trim();
  const angle = trimmed.match(/<([^>]+)>/);
  const address = (angle?.[1] ?? trimmed).trim().toLowerCase();
  return address.endsWith("@resend.dev");
}

/**
 * When `EMAIL_FROM` is a Resend sandbox address, restrict delivery to
 * `RESEND_TEST_RECIPIENT` (the Resend account owner). Production uses a verified domain.
 */
export function resolveStaffNotifyRecipients(
  raw: string | undefined,
  from: string,
): { recipients: string[]; intended?: string[] } {
  const intended = parseRecipients(raw);
  if (!isResendSandboxFrom(from)) {
    return { recipients: intended };
  }

  const testRecipient = process.env.RESEND_TEST_RECIPIENT?.trim();
  if (!testRecipient || !testRecipient.includes("@")) {
    return { recipients: [] };
  }

  return { recipients: [testRecipient], intended };
}

function line(label: string, value: string | undefined): string {
  return value && value.trim() ? `${label}: ${value.trim()}\n` : "";
}

export function buildStaffQueryEmail(query: StaffQueryNotification): {
  subject: string;
  text: string;
} {
  const who = query.company ? `${query.name} (${query.company})` : query.name;
  const subject = `New enquiry — ${who}`;
  const text =
    `A new enquiry was submitted on the website.\n\n` +
    line("Reference", query.queryId) +
    line("Name", query.name) +
    line("Company", query.company) +
    line("Email", query.email) +
    line("Phone", query.phone) +
    line("Preferred contact", query.preferredContact) +
    line("Requirement", query.requirement) +
    line("Budget", query.budget) +
    line("Timeline", query.timeline) +
    line("Source", query.source) +
    line("Page", query.sourcePath) +
    `\nMessage:\n${query.message}\n`;
  return { subject, text };
}

export async function sendStaffQueryNotification(
  query: StaffQueryNotification,
): Promise<StaffNotifyResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    return {
      ok: false,
      reason: "not_configured",
      detail: `Missing env: ${!apiKey ? "RESEND_API_KEY " : ""}${!from ? "EMAIL_FROM" : ""}. Enquiry saved to DB but staff were NOT notified.`,
    };
  }

  const { recipients, intended } = resolveStaffNotifyRecipients(
    process.env.STAFF_NOTIFY_EMAIL ?? process.env.ADMIN_EMAILS,
    from,
  );
  if (recipients.length === 0) {
    if (isResendSandboxFrom(from)) {
      return {
        ok: false,
        reason: "sandbox_recipient_required",
        detail:
          "Set RESEND_TEST_RECIPIENT to your Resend account email when EMAIL_FROM uses @resend.dev",
      };
    }
    return { ok: false, reason: "no_recipients" };
  }

  const { subject, text } = buildStaffQueryEmail(query);
  const sandboxNote =
    intended && intended.length > 0
      ? `\n\n[Sandbox] Intended staff recipients: ${intended.join(", ")}\n`
      : "";
  const body = sandboxNote ? text + sandboxNote : text;

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: recipients,
      subject,
      text: body,
      // Staff hit reply to answer the customer directly.
      ...(query.email ? { replyTo: query.email } : {}),
    });
    if (error) {
      return { ok: false, reason: "send_failed", detail: error.message };
    }
    return {
      ok: true,
      id: data?.id ?? null,
      recipients,
      ...(intended ? { sandboxRedirect: intended } : {}),
    };
  } catch (err) {
    return {
      ok: false,
      reason: "send_failed",
      detail: err instanceof Error ? err.message : "unknown",
    };
  }
}
