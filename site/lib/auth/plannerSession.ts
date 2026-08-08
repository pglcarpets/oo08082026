/**
 * Thin planner-auth server helpers used by route entrypoints and planner surfaces.
 * If this grows beyond auth gating and redirect wiring, keep feature-owned logic under @planner/* (not features/planner — Windows case collision).
 */
import "server-only";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getOptionalUser } from "@/lib/auth/session";
import { buildAccessRedirect } from "@/lib/auth/plannerRedirect";
import { PLANNER_GUEST_COOKIE } from "@/lib/auth/constants";
import { hasAuthSupabaseEnv } from "@/platform/supabase/env";

export async function getOptionalPlannerUser() {
  return await getOptionalUser();
}

const ANONYMOUS_USER = {
  id: "anonymous",
  email: "anonymous@example.com",
  name: "Anonymous User",
  role: "anonymous",
} as const;

function isGuestAllowedPath(nextPath: string): boolean {
  const normalized = nextPath.replace(/\/$/, "") || "/";
  return (
    // Live fork surface
    normalized === "/ooplanner" ||
    normalized.startsWith("/ooplanner/") ||
    // Legacy /planner/* (config 301 → /ooplanner) still accepted if session helpers see old paths
    normalized === "/planner/guest" ||
    normalized.startsWith("/planner/guest/") ||
    normalized === "/planner/canvas" ||
    normalized.startsWith("/planner/canvas/") ||
    normalized === "/planner" ||
    normalized.startsWith("/planner/help") ||
    normalized.startsWith("/planner/features") ||
    // Legacy oando-planner bookmarks
    normalized === "/oando-planner" ||
    normalized.startsWith("/oando-planner/guest") ||
    normalized.startsWith("/oando-planner/canvas") ||
    normalized.startsWith("/oando-planner/onboarding")
  );
}

/**
 * Next.js control-flow errors must never be swallowed into an anonymous session.
 * `redirect()` throws with digest NEXT_REDIRECT*; static probing throws DYNAMIC_SERVER_USAGE.
 */
function isNextControlFlowError(error: unknown): boolean {
  const errorRecord =
    error && typeof error === "object" ? (error as Record<string, unknown>) : null;
  const digest = typeof errorRecord?.digest === "string" ? errorRecord.digest : "";
  if (digest === "DYNAMIC_SERVER_USAGE" || digest.startsWith("NEXT_REDIRECT")) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error);
  return message === "NEXT_REDIRECT" || message.startsWith("NEXT_REDIRECT;");
}

function redirectToAccess(nextPath: string): never {
  // next/navigation `redirect` throws (never returns). Keep an explicit throw so
  // mocked redirects in unit tests cannot fall through to an anonymous session.
  redirect(buildAccessRedirect(nextPath));
  throw new Error("Authentication required");
}

export async function requirePlannerUser(nextPath = "/dashboard") {
  const cookieStore = await cookies();
  const isGuest = cookieStore.has(PLANNER_GUEST_COOKIE);

  // Guest pass + guest-allowed path → return guest user
  if (isGuest && isGuestAllowedPath(nextPath)) {
    return {
      id: "guest",
      email: "guest@example.com",
      name: "Guest User",
    };
  }

  // If Supabase is not configured, return an anonymous user
  // This allows the planner to render in fallback mode without env vars
  if (!hasAuthSupabaseEnv()) {
    console.warn(
      "Supabase not configured. Rendering planner in anonymous mode.",
    );
    return ANONYMOUS_USER;
  }

  // Keep redirect outside the auth try/catch so intentional access redirects
  // are never mistaken for auth lookup failures (and double-fired).
  let user: Awaited<ReturnType<typeof getOptionalPlannerUser>> = null;
  try {
    user = await getOptionalPlannerUser();
  } catch (error) {
    if (isNextControlFlowError(error)) {
      throw error;
    }

    // Guest-allowed surfaces fail open (read-only anonymous). Protected paths fail closed.
    if (isGuestAllowedPath(nextPath)) {
      console.warn(
        "Failed to get planner user, falling back to anonymous:",
        error,
      );
      return ANONYMOUS_USER;
    }

    console.warn(
      "Failed to get planner user on protected path; redirecting to access:",
      error,
    );
    return redirectToAccess(nextPath);
  }

  if (!user) {
    // On guest-allowed paths, never redirect — fall back to anonymous
    // so the planner canvas still renders in read-only/guest mode.
    if (isGuestAllowedPath(nextPath)) {
      return ANONYMOUS_USER;
    }
    return redirectToAccess(nextPath);
  }

  return user;
}
