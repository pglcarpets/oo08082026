/**
 * Shared server auth helpers used across all product surfaces (Planner, Configurator, CRM).
 * Wraps Supabase auth and provides guest access functionality.
 */
import "server-only";

import { redirect } from "next/navigation";
import { createAuthServerClient } from "@/platform/supabase/server";
import { hasAuthSupabaseEnv } from "@/platform/supabase/env";
import type { SharedSessionUser, PlannerRole } from "@/features/shared/auth/types";
import { buildAccessRedirect } from "@/lib/auth/plannerRedirect";
import { isAppAdmin } from "@/lib/auth/roles";
import {
  DEV_BYPASS_USER,
  isDevAuthBypassEnabled,
} from "@/lib/auth/devAuthBypass";

function isNextDynamicServerUsageError(error: unknown): boolean {
  const errorRecord =
    error && typeof error === "object" ? (error as Record<string, unknown>) : null;
  const digest = typeof errorRecord?.digest === "string" ? errorRecord.digest : "";
  if (digest === "DYNAMIC_SERVER_USAGE") {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Dynamic server usage") &&
    message.includes("couldn't be rendered statically")
  );
}

export async function getOptionalUser(): Promise<SharedSessionUser | null> {
  if (isDevAuthBypassEnabled()) {
    return {
      id: DEV_BYPASS_USER.id,
      email: DEV_BYPASS_USER.email,
      name: "Dev Bypass Admin",
      role: "owner",
    };
  }

  // If Supabase env vars are not configured, there is no auth surface to query.
  if (!hasAuthSupabaseEnv()) {
    return null;
  }

  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const isAdmin = isAppAdmin(user);

    return {
      id: user.id,
      email: user.email || "",
      name:
        (user.user_metadata?.name as string | undefined) ??
        (user.email ? user.email.split("@")[0] : undefined),
      avatarUrl: user.user_metadata?.avatarUrl as string | undefined,
      role: (isAdmin ? "owner" : "member") as PlannerRole,
    };
  } catch (error) {
    if (isNextDynamicServerUsageError(error)) {
      throw error;
    }

    // Session is invalid or expired.
    console.error("getOptionalUser error:", error);
    return null;
  }
}

export async function requireAuthUser(
  nextPath: string,
  surface: "planner" | "configurator" | "crm" | "ops" | "admin" = "planner"
): Promise<SharedSessionUser> {
  if (isDevAuthBypassEnabled()) {
    return {
      id: DEV_BYPASS_USER.id,
      email: DEV_BYPASS_USER.email,
      name: "Dev Bypass Admin",
      role: "owner",
    };
  }

  const user = await getOptionalUser();

  if (!user) {
    const fallback = surface === "admin" ? "/admin" : undefined;
    // next/navigation `redirect` throws (never returns). Keep an explicit
    // throw so mocked redirects in unit tests cannot fall through to null user.
    redirect(buildAccessRedirect(nextPath, fallback));
    throw new Error("Authentication required");
  }

  if ((surface === "crm" || surface === "ops") && (user.role === "guest" || user.role === "viewer")) {
    redirect("/dashboard?error=unauthorized_access");
    throw new Error("Unauthorized access");
  }

  if (surface === "admin" && user.role !== "owner") {
    redirect("/dashboard?error=unauthorized_admin_access");
    throw new Error("Unauthorized admin access");
  }

  return user;
}
