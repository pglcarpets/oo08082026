/**
 * Planner projects — Supabase-only (`public.oando_plans`).
 * Call only when persistence mode is `supabase`. No dual-write.
 */

import "server-only";

import type { Json } from "@/platform/supabase/types";
import { createSupabaseAuthAdminClient } from "@/platform/supabase/auth-admin";

type OandoPlanRow = {
  id: string;
  user_id: string;
  name: string;
  engine: string;
  payload: Record<string, unknown> | null;
  thumbnail_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

function plansTable(client: ReturnType<typeof createSupabaseAuthAdminClient>) {
  return client.from("oando_plans");
}

function profilesTable(client: ReturnType<typeof createSupabaseAuthAdminClient>) {
  return client.from("profiles");
}

/**
 * `oando_plans.user_id` has an FK to `profiles.id`, so the profile row must
 * exist before a plan can be written.
 *
 * `public.profiles` holds `id / display_name / avatar_url / created_at` — it has
 * no `email` or `role` column. Sending those returns PGRST204 and, because the
 * caller rethrows, failed every plan save in supabase mode. Keep this insert in
 * step with the generated `Database` type; do not widen it back to `any`.
 */
export async function ensurePlannerProfile(
  userId: string,
  email?: string | null,
): Promise<void> {
  const c = createSupabaseAuthAdminClient();
  const displayName = (email && email.trim()) || userId.slice(0, 8);
  const { error } = await profilesTable(c).upsert(
    { id: userId, display_name: displayName },
    { onConflict: "id" },
  );
  if (error) {
    throw new Error(`profiles upsert failed: ${error.message}`);
  }
}

function rowToProject(row: OandoPlanRow): Record<string, unknown> {
  const payload =
    row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
      ? { ...row.payload }
      : {};
  return {
    ...payload,
    id: row.id,
    name: row.name,
    user_id: row.user_id,
    status: row.status || "active",
    thumbnail_url: row.thumbnail_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
    canvas_json:
      (payload.canvas_json as Record<string, unknown> | undefined) ??
      (payload.scene as Record<string, unknown> | undefined) ??
      {},
    engine: row.engine || "ooplanner",
  };
}

function projectToUpsert(
  project: Record<string, unknown>,
  userId: string,
): {
  id: string;
  user_id: string;
  name: string;
  engine: string;
  payload: Json;
  thumbnail_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
} {
  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  let id = typeof project.id === "string" ? project.id : "";
  if (!id || !UUID_RE.test(id)) {
    id = crypto.randomUUID();
  }
  const now = new Date().toISOString();
  const updated_at =
    typeof project.updated_at === "string" ? project.updated_at : now;
  const created_at =
    typeof project.created_at === "string" ? project.created_at : updated_at;
  const name = String(project.name ?? "Untitled");
  const status = String(project.status ?? "active");
  const thumbnail_url =
    typeof project.thumbnail_url === "string" ? project.thumbnail_url : null;
  const payload = {
    ...project,
    id,
    user_id: userId,
    name,
    status,
    thumbnail_url,
    created_at,
    updated_at,
  } as unknown as Json;

  return {
    id,
    user_id: userId,
    name,
    engine: "ooplanner",
    payload,
    thumbnail_url,
    status,
    created_at,
    updated_at,
  };
}

export async function listProjectsFromSupabase(opts?: {
  userId?: string | null;
}): Promise<Record<string, unknown>[]> {
  const c = createSupabaseAuthAdminClient();
  let q = plansTable(c).select("*").order("updated_at", { ascending: false });
  if (opts?.userId) {
    q = q.eq("user_id", opts.userId);
  }
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return ((data as OandoPlanRow[] | null) ?? []).map(rowToProject);
}

export async function loadProjectFromSupabase(
  id: string,
): Promise<Record<string, unknown> | null> {
  const c = createSupabaseAuthAdminClient();
  const { data, error } = await plansTable(c)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return rowToProject(data as OandoPlanRow);
}

export async function writeProjectToSupabase(
  project: Record<string, unknown>,
  opts?: { userId?: string | null; email?: string | null },
): Promise<Record<string, unknown>> {
  const userId =
    (typeof opts?.userId === "string" && opts.userId) ||
    (typeof project.user_id === "string" && project.user_id) ||
    "";
  if (!userId) {
    throw new Error(
      "Supabase planner mode requires a signed-in user id (session cookies via withAuth member role).",
    );
  }
  await ensurePlannerProfile(userId, opts?.email);
  const row = projectToUpsert(project, userId);
  const c = createSupabaseAuthAdminClient();
  const { data, error } = await plansTable(c)
    .upsert(row, { onConflict: "id" })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return rowToProject(data as OandoPlanRow);
}

export async function deleteProjectFromSupabase(id: string): Promise<boolean> {
  const c = createSupabaseAuthAdminClient();
  const { data, error } = await plansTable(c).delete().eq("id", id).select("id");
  if (error) throw new Error(error.message);
  return Array.isArray(data) && data.length > 0;
}
