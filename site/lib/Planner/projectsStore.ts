/**
 * Planner projects adapter — exclusive persistence mode (no dual-write).
 *
 * - DEV_AUTH_BYPASS=1 (non-prod) → disk only (`@planner/server/plannerStore`)
 * - else → admin Supabase only (`public.oando_plans`)
 *
 * Used by portal /api/plans, admin /api/admin/plans, and /api/Planner/projects.
 */

import {
  deleteProjectFiles,
  listProjectsFromDisk,
  loadProject,
  writeProject,
  nowIso,
} from "@planner/server/plannerStore";
import {
  getPlannerPersistenceMode,
  isPlannerPersistenceConfigured,
} from "@planner/lib/plannerPersistenceMode";
import {
  assertPlannerDocument,
  type PlannerDocument,
  type PlannerDocumentStatus,
} from "@planner/lib/plannerDocument";

export type PlannerSaveSummary = {
  id: string;
  name: string;
  item_count: number;
  updated_at: string;
  status?: PlannerDocumentStatus;
  thumbnail_url?: string | null;
};

export type AdminPlanSummary = {
  id: string;
  title: string;
  project_name: string | null;
  client_name: string | null;
  prepared_by: string | null;
  room_width_mm: number;
  room_depth_mm: number;
  seat_target: number;
  unit_system: string;
  item_count: number;
  thumbnail_url: string | null;
  status: PlannerDocumentStatus;
  created_at: string;
  updated_at: string;
};

export type AdminPlanDetail = AdminPlanSummary & {
  scene_json: unknown;
  review_status: "pending" | "approved";
};

export type PlannerAnalyticsRow = {
  id: string;
  item_count: number | null;
  room_width_mm: number | null;
  room_depth_mm: number | null;
  created_at: string;
  updated_at: string;
};

/** Active store is ready (disk always; Supabase when admin env set). */
export function isPlannerDatabaseConfigured(): boolean {
  return isPlannerPersistenceConfigured();
}

export function getPlannerProjectsSource():
  | "disk_planner_projects"
  | "supabase_oando_plans" {
  return getPlannerPersistenceMode() === "disk"
    ? "disk_planner_projects"
    : "supabase_oando_plans";
}

export function isMissingOandoPlansTableError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return /oando_plans|relation .* does not exist|42P01/i.test(msg);
}

function objectsCount(project: Record<string, unknown>): number {
  if (typeof project.objects_count === "number") return project.objects_count;
  const canvas = project.canvas_json as { objects?: unknown[] } | undefined;
  return Array.isArray(canvas?.objects) ? canvas.objects.length : 0;
}

function projectToSummary(project: Record<string, unknown>): PlannerSaveSummary {
  return {
    id: String(project.id ?? ""),
    name: String(project.name ?? "Untitled"),
    item_count: objectsCount(project),
    updated_at: String(project.updated_at ?? project.created_at ?? nowIso()),
    status: (project.status as PlannerDocumentStatus | undefined) ?? "active",
    thumbnail_url:
      typeof project.thumbnail_url === "string" ? project.thumbnail_url : null,
  };
}

function projectToDocument(project: Record<string, unknown>): PlannerDocument {
  return assertPlannerDocument({
    id: project.id,
    name: project.name,
    status: project.status ?? "active",
    projectName: project.project_name ?? project.name,
    clientName: project.client_name ?? null,
    preparedBy: project.prepared_by ?? null,
    roomWidthMm: project.room_width_mm ?? 0,
    roomDepthMm: project.room_depth_mm ?? 0,
    seatTarget: project.seat_target ?? 0,
    unitSystem: project.unit_system ?? "mm",
    itemCount: objectsCount(project),
    thumbnailUrl: project.thumbnail_url ?? null,
    scene: project.canvas_json ?? project.scene_json ?? project.payload ?? {},
    payload: project.payload ?? project.canvas_json ?? {},
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  });
}

function projectToAdminSummary(project: Record<string, unknown>): AdminPlanSummary {
  const status = (project.status as PlannerDocumentStatus | undefined) ?? "active";
  return {
    id: String(project.id ?? ""),
    title: String(project.name ?? "Untitled"),
    project_name:
      typeof project.project_name === "string"
        ? project.project_name
        : String(project.name ?? "Untitled"),
    client_name: typeof project.client_name === "string" ? project.client_name : null,
    prepared_by: typeof project.prepared_by === "string" ? project.prepared_by : null,
    room_width_mm: Number(project.room_width_mm) || 0,
    room_depth_mm: Number(project.room_depth_mm) || 0,
    seat_target: Number(project.seat_target) || 0,
    unit_system: typeof project.unit_system === "string" ? project.unit_system : "mm",
    item_count: objectsCount(project),
    thumbnail_url:
      typeof project.thumbnail_url === "string" ? project.thumbnail_url : null,
    status,
    created_at: String(project.created_at ?? nowIso()),
    updated_at: String(project.updated_at ?? nowIso()),
  };
}

export function planRowToAdminSummary(row: Record<string, unknown>): AdminPlanSummary {
  return projectToAdminSummary(row);
}

export async function planRowToAdminDetail(
  row: Record<string, unknown>,
): Promise<AdminPlanDetail> {
  const summary = projectToAdminSummary(row);
  return {
    ...summary,
    scene_json: row.canvas_json ?? row.scene_json ?? row.payload ?? {},
    review_status: summary.status === "active" ? "approved" : "pending",
  };
}

function ownsProject(
  project: Record<string, unknown> | null | undefined,
  userId?: string | null,
): boolean {
  if (userId === undefined || userId === null) return true;
  if (!project) return false;
  const owner = project.user_id;
  return typeof owner === "string" && owner.length > 0 && owner === userId;
}

async function assertSupabaseReady(): Promise<void> {
  if (!isPlannerPersistenceConfigured()) {
    throw new Error(
      "Planner Supabase mode requires NEXT_ADMIN_SUPABASE_URL and SUPABASE_ADMIN_SERVICE_ROLE_KEY (or DEV_AUTH_BYPASS=1 for disk).",
    );
  }
}

/** Raw project records (disk shape) for both modes. */
export async function listProjectRecords(opts?: {
  userId?: string | null;
}): Promise<Record<string, unknown>[]> {
  if (getPlannerPersistenceMode() === "disk") {
    let projects = await listProjectsFromDisk();
    if (opts?.userId) {
      projects = projects.filter((p) => ownsProject(p, opts.userId));
    }
    return projects;
  }
  await assertSupabaseReady();
  const { listProjectsFromSupabase } = await import(
    "@planner/lib/projectsStore.supabase"
  );
  return listProjectsFromSupabase({ userId: opts?.userId });
}

export async function loadProjectRecord(
  id: string,
): Promise<Record<string, unknown> | null> {
  if (getPlannerPersistenceMode() === "disk") {
    return loadProject(id);
  }
  await assertSupabaseReady();
  const { loadProjectFromSupabase } = await import(
    "@planner/lib/projectsStore.supabase"
  );
  return loadProjectFromSupabase(id);
}

export async function writeProjectRecord(
  project: Record<string, unknown>,
  opts?: { userId?: string | null; email?: string | null },
): Promise<Record<string, unknown>> {
  if (getPlannerPersistenceMode() === "disk") {
    const next = {
      ...project,
      user_id: opts?.userId ?? project.user_id ?? null,
    };
    await writeProject(next);
    return next;
  }
  await assertSupabaseReady();
  const { writeProjectToSupabase } = await import(
    "@planner/lib/projectsStore.supabase"
  );
  return writeProjectToSupabase(project, opts);
}

export async function deleteProjectRecord(id: string): Promise<boolean> {
  if (getPlannerPersistenceMode() === "disk") {
    return deleteProjectFiles(id);
  }
  await assertSupabaseReady();
  const { deleteProjectFromSupabase } = await import(
    "@planner/lib/projectsStore.supabase"
  );
  return deleteProjectFromSupabase(id);
}

export async function listPlannerDocumentsFromStore(opts?: {
  userId?: string | null;
}): Promise<PlannerSaveSummary[]> {
  const projects = await listProjectRecords(opts);
  return projects.map(projectToSummary).filter((p) => p.id);
}

export async function loadPlannerDocumentFromStore(
  id: string,
  userId?: string,
): Promise<PlannerDocument | null> {
  const project = await loadProjectRecord(id);
  if (!project) return null;
  if (!ownsProject(project, userId)) return null;
  return projectToDocument(project);
}

export async function savePlannerDocumentToStore(
  document: PlannerDocument,
  opts?: { userId?: string; saveId?: string; email?: string | null },
): Promise<PlannerDocument> {
  const id = opts?.saveId?.trim() || document.id;
  const existingRaw = id ? await loadProjectRecord(id) : null;
  const existing = existingRaw ?? {};
  if (existingRaw && opts?.userId && !ownsProject(existingRaw, opts.userId)) {
    throw new Error("FORBIDDEN: plan ownership mismatch");
  }
  const now = nowIso();
  const next: Record<string, unknown> = {
    ...existing,
    id: id || existing.id,
    name: document.name || document.projectName || "Untitled",
    status: document.status,
    project_name: document.projectName ?? document.name,
    client_name: document.clientName ?? null,
    prepared_by: document.preparedBy ?? null,
    room_width_mm: document.roomWidthMm ?? 0,
    room_depth_mm: document.roomDepthMm ?? 0,
    seat_target: document.seatTarget ?? 0,
    unit_system: document.unitSystem ?? "mm",
    objects_count: document.itemCount ?? 0,
    thumbnail_url: document.thumbnailUrl ?? null,
    canvas_json: document.scene ?? document.payload ?? existing.canvas_json ?? {},
    payload: document.payload ?? document.scene ?? {},
    created_at: existing.created_at ?? document.createdAt ?? now,
    updated_at: now,
    user_id: opts?.userId ?? existing.user_id ?? null,
  };
  const saved = await writeProjectRecord(next, {
    userId: opts?.userId ?? (next.user_id as string | null),
    email: opts?.email,
  });
  return projectToDocument(saved);
}

export async function deletePlannerDocumentFromStore(
  id: string,
  userId?: string,
): Promise<boolean> {
  if (userId !== undefined && userId !== null) {
    const project = await loadProjectRecord(id);
    if (!ownsProject(project, userId)) return false;
  }
  return deleteProjectRecord(id);
}

export async function deletePlannerDocument(id: string): Promise<{ success: boolean }> {
  const ok = await deleteProjectRecord(id);
  return { success: ok };
}

export async function listPlannerDocumentsAdmin(opts: {
  page: number;
  limit: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<{ success: true; plans: AdminPlanSummary[]; total: number } | { success: false }> {
  try {
    let projects = await listProjectRecords();
    if (opts.status) {
      projects = projects.filter(
        (p) => String(p.status ?? "active") === opts.status,
      );
    }
    if (opts.search) {
      const q = opts.search.toLowerCase();
      projects = projects.filter((p) =>
        String(p.name ?? "")
          .toLowerCase()
          .includes(q),
      );
    }
    const sortBy = opts.sortBy || "updated_at";
    const dir = opts.sortOrder === "asc" ? 1 : -1;
    projects.sort((a, b) => {
      const av = String(a[sortBy] ?? a.updated_at ?? "");
      const bv = String(b[sortBy] ?? b.updated_at ?? "");
      return av < bv ? -dir : av > bv ? dir : 0;
    });
    const total = projects.length;
    const start = (opts.page - 1) * opts.limit;
    const slice = projects.slice(start, start + opts.limit);
    return {
      success: true,
      plans: slice.map(projectToAdminSummary),
      total,
    };
  } catch {
    return { success: false };
  }
}

export async function loadPlannerDocumentAdmin(
  id: string,
): Promise<
  | { success: true; row: Record<string, unknown> }
  | { success: false; error: { code: string; message: string } }
> {
  try {
    const project = await loadProjectRecord(id);
    if (!project) {
      return { success: false, error: { code: "NOT_FOUND", message: "Plan not found" } };
    }
    return { success: true, row: project };
  } catch (e) {
    return {
      success: false,
      error: {
        code: "STORE_ERROR",
        message: e instanceof Error ? e.message : String(e),
      },
    };
  }
}

export async function patchPlannerDocumentAdmin(
  id: string,
  patch: {
    status?: PlannerDocumentStatus;
    title?: string;
    projectName?: string | null;
    clientName?: string | null;
    preparedBy?: string | null;
  },
): Promise<
  | { success: true; row: Record<string, unknown> }
  | { success: false; error: { code: string; message: string } }
> {
  try {
    const existing = await loadProjectRecord(id);
    if (!existing) {
      return { success: false, error: { code: "NOT_FOUND", message: "Plan not found" } };
    }
    const next: Record<string, unknown> = {
      ...existing,
      updated_at: nowIso(),
    };
    if (patch.status) next.status = patch.status;
    if (typeof patch.title === "string") next.name = patch.title;
    if (patch.projectName !== undefined) next.project_name = patch.projectName;
    if (patch.clientName !== undefined) next.client_name = patch.clientName;
    if (patch.preparedBy !== undefined) next.prepared_by = patch.preparedBy;
    const row = await writeProjectRecord(next, {
      userId: typeof next.user_id === "string" ? next.user_id : null,
    });
    return { success: true, row };
  } catch (e) {
    return {
      success: false,
      error: {
        code: "STORE_ERROR",
        message: e instanceof Error ? e.message : String(e),
      },
    };
  }
}

export async function listPlannerAnalyticsRows(
  days: number,
): Promise<
  | { success: true; rows: PlannerAnalyticsRow[] }
  | { success: false; error: { message: string } }
> {
  try {
    const projects = await listProjectRecords();
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const rows: PlannerAnalyticsRow[] = projects
      .map((p) => {
        const created = String(p.created_at ?? p.updated_at ?? nowIso());
        return {
          id: String(p.id ?? ""),
          item_count: objectsCount(p),
          room_width_mm: Number(p.room_width_mm) || null,
          room_depth_mm: Number(p.room_depth_mm) || null,
          created_at: created,
          updated_at: String(p.updated_at ?? created),
        };
      })
      .filter((r) => r.id && Date.parse(r.created_at) >= cutoff);
    return { success: true, rows };
  } catch (err) {
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : String(err) },
    };
  }
}

export type PlannerPortalPublishData = {
  projectName: string;
  walls: unknown[];
  rooms: unknown[];
  furniture: unknown[];
  doors: unknown[];
  windows: unknown[];
  measurements: unknown[];
  zones: unknown[];
  textLabels: unknown[];
  structuralElements: unknown[];
  backgroundImage: unknown;
};

export function buildPlannerDocumentFromPortalPublishData(
  data: PlannerPortalPublishData,
  opts?: { status?: PlannerDocumentStatus },
): PlannerDocument {
  return {
    id: "",
    name: data.projectName,
    status: opts?.status ?? "active",
    projectName: data.projectName,
    itemCount: Array.isArray(data.furniture) ? data.furniture.length : 0,
    scene: data as unknown as PlannerDocument["scene"],
    payload: data as unknown as PlannerDocument["payload"],
  };
}
