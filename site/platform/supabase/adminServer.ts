import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/platform/supabase/types";

function readOptionalServiceEnv() {
  const url =
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

  if (!url || !serviceRoleKey) {
    return null;
  }

  return { url, serviceRoleKey };
}

export function createAdminServiceClient() {
  const env = readOptionalServiceEnv();
  if (!env) return null;

  return createClient<Database>(env.url, env.serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1"
  );
}

export function isMissingTableError(message: string | undefined): boolean {
  const normalized = (message || "").toLowerCase();
  return (
    normalized.includes("does not exist") ||
    normalized.includes("could not find the table") ||
    normalized.includes("permission denied")
  );
}