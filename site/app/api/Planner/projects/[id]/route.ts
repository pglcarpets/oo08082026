import { NextResponse, type NextRequest } from "next/server";
import path from "node:path";
import {
  BadRequestError,
  decodeDataUrl,
  nowIso,
  PROJECTS_DIR,
  readJsonBody,
  writeBytes,
} from "@planner/server/plannerStore";
import {
  deleteProjectRecord,
  isPlannerDatabaseConfigured,
  loadProjectRecord,
  writeProjectRecord,
} from "@planner/lib/projectsStore";
import { getPlannerPersistenceMode } from "@planner/lib/plannerPersistenceMode";
import { withAuth, type AuthContext } from "@/features/shared/api/withAuth";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withAuth(
  async (_request: NextRequest, auth: AuthContext, context: Ctx) => {
    if (!isPlannerDatabaseConfigured()) {
      return NextResponse.json(
        { detail: "Planner persistence not configured" },
        { status: 503 },
      );
    }
    const { id } = await context.params;
    const project = await loadProjectRecord(id);
    if (!project) {
      return NextResponse.json({ detail: "Project not found" }, { status: 404 });
    }
    const userId = auth.user?.id;
    if (
      getPlannerPersistenceMode() === "supabase" &&
      userId &&
      project.user_id &&
      project.user_id !== userId &&
      !auth.isAdmin
    ) {
      return NextResponse.json({ detail: "Project not found" }, { status: 404 });
    }
    return NextResponse.json(project);
  },
  {
    role: "member",
    rateLimitScope: "planner-projects-id:get",
    rateLimit: 60,
  },
);

export const PATCH = withAuth(
  async (request: NextRequest, auth: AuthContext, context: Ctx) => {
    try {
      return await patchProject(request, auth, context);
    } catch (e) {
      if (e instanceof BadRequestError) {
        return NextResponse.json({ detail: e.message }, { status: 400 });
      }
      const msg = e instanceof Error ? e.message : String(e);
      if (/requires a signed-in user|not configured|Supabase/i.test(msg)) {
        return NextResponse.json({ detail: msg }, { status: 503 });
      }
      throw e;
    }
  },
  {
    role: "member",
    rateLimitScope: "planner-projects-id:patch",
    rateLimit: 30,
    requireCsrf: true,
  },
);

async function patchProject(
  request: Request,
  auth: AuthContext,
  context: Ctx,
) {
  if (!isPlannerDatabaseConfigured()) {
    return NextResponse.json(
      { detail: "Planner persistence not configured" },
      { status: 503 },
    );
  }
  const { id } = await context.params;
  const project = await loadProjectRecord(id);
  if (!project) {
    return NextResponse.json({ detail: "Project not found" }, { status: 404 });
  }
  const userId = auth.user?.id;
  if (
    getPlannerPersistenceMode() === "supabase" &&
    userId &&
    project.user_id &&
    project.user_id !== userId &&
    !auth.isAdmin
  ) {
    return NextResponse.json({ detail: "Project not found" }, { status: 404 });
  }

  const updates = await readJsonBody(request);
  if (typeof updates.name === "string") project.name = updates.name;
  if (updates.canvas_json !== undefined) {
    project.canvas_json = updates.canvas_json;
    const canvas = updates.canvas_json as { objects?: unknown[] };
    project.objects_count = Array.isArray(canvas?.objects)
      ? canvas.objects.length
      : 0;
  }
  if (updates.sheet !== undefined) project.sheet = updates.sheet;
  if (updates.layers !== undefined) project.layers = updates.layers;
  if (typeof updates.thumbnail_png === "string" && updates.thumbnail_png) {
    if (getPlannerPersistenceMode() === "disk") {
      const { raw } = decodeDataUrl(updates.thumbnail_png);
      const fname = `${id}_thumb.png`;
      await writeBytes(path.join(PROJECTS_DIR, fname), raw);
      project.thumbnail_url = `/api/files/projects/${fname}`;
    } else {
      project.thumbnail_url = updates.thumbnail_png;
    }
  }
  project.updated_at = nowIso();

  const saved = await writeProjectRecord(project, {
    userId:
      (typeof project.user_id === "string" && project.user_id) ||
      userId ||
      null,
    email: auth.user?.email ?? null,
  });
  return NextResponse.json(saved);
}

export const DELETE = withAuth(
  async (_request: NextRequest, auth: AuthContext, context: Ctx) => {
    if (!isPlannerDatabaseConfigured()) {
      return NextResponse.json(
        { detail: "Planner persistence not configured" },
        { status: 503 },
      );
    }
    const { id } = await context.params;
    const project = await loadProjectRecord(id);
    if (!project) {
      return NextResponse.json({ detail: "Project not found" }, { status: 404 });
    }
    const userId = auth.user?.id;
    if (
      getPlannerPersistenceMode() === "supabase" &&
      userId &&
      project.user_id &&
      project.user_id !== userId &&
      !auth.isAdmin
    ) {
      return NextResponse.json({ detail: "Project not found" }, { status: 404 });
    }
    const ok = await deleteProjectRecord(id);
    if (!ok) {
      return NextResponse.json({ detail: "Project not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  },
  {
    role: "member",
    rateLimitScope: "planner-projects-id:delete",
    rateLimit: 20,
    requireCsrf: true,
  },
);
