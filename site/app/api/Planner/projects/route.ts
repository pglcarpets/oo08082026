import { NextResponse } from "next/server";
import path from "node:path";
import {
  BadRequestError,
  decodeDataUrl,
  nowIso,
  PROJECTS_DIR,
  readJsonBody,
  shortId,
  slugify,
  writeBytes,
} from "@planner/server/plannerStore";
import {
  getPlannerProjectsSource,
  isPlannerDatabaseConfigured,
  listProjectRecords,
  writeProjectRecord,
} from "@planner/lib/projectsStore";
import { getPlannerPersistenceMode } from "@planner/lib/plannerPersistenceMode";
import { withAuth, type AuthContext } from "@/features/shared/api/withAuth";

export const GET = withAuth(
  async (_request, auth: AuthContext) => {
    if (!isPlannerDatabaseConfigured()) {
      return NextResponse.json(
        {
          detail:
            "Planner persistence not configured (set admin Supabase env for supabase mode, or enable disk only via DEV_AUTH_BYPASS=1 in non-production).",
          source: getPlannerProjectsSource(),
        },
        { status: 503 },
      );
    }
    // Disk mode (local bypass) has no owner column and lists all; supabase
    // filters by owner. `member` guarantees a user id in both.
    const userId = auth.user?.id;
    const projects = await listProjectRecords(
      userId && getPlannerPersistenceMode() === "supabase"
        ? { userId }
        : undefined,
    );
    return NextResponse.json(projects);
  },
  {
    role: "member",
    rateLimitScope: "planner-projects:get",
    rateLimit: 60,
  },
);

export const POST = withAuth(
  async (request, auth: AuthContext) => {
    try {
      return await createProject(request, auth);
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
    rateLimitScope: "planner-projects:post",
    rateLimit: 30,
    requireCsrf: true,
  },
);

async function createProject(request: Request, auth: AuthContext) {
  if (!isPlannerDatabaseConfigured()) {
    return NextResponse.json(
      {
        detail:
          "Planner persistence not configured (set admin Supabase env for supabase mode, or enable disk only via DEV_AUTH_BYPASS=1 in non-production).",
      },
      { status: 503 },
    );
  }

  const payload = await readJsonBody(request);
  const name = String(payload.name || "untitled");
  const mode = getPlannerPersistenceMode();
  const pid =
    mode === "disk"
      ? `p_${slugify(name)}_${shortId()}`
      : crypto.randomUUID();
  const now = nowIso();
  let thumbUrl: string | null = null;

  if (typeof payload.thumbnail_png === "string" && payload.thumbnail_png) {
    if (mode === "disk") {
      const { raw } = decodeDataUrl(payload.thumbnail_png);
      const fname = `${pid}_thumb.png`;
      await writeBytes(path.join(PROJECTS_DIR, fname), raw);
      thumbUrl = `/api/files/projects/${fname}`;
    } else {
      // Supabase mode: keep data URL in record (no dual disk write).
      thumbUrl = payload.thumbnail_png;
    }
  }

  const canvas = (payload.canvas_json as Record<string, unknown>) || {};
  const objects = Array.isArray((canvas as { objects?: unknown[] }).objects)
    ? ((canvas as { objects: unknown[] }).objects as unknown[])
    : [];

  const userId = auth.user?.id ?? null;
  const project = {
    id: pid,
    name,
    canvas_json: canvas,
    sheet: payload.sheet ?? {},
    layers: payload.layers ?? [],
    thumbnail_url: thumbUrl,
    objects_count: objects.length,
    created_at: now,
    updated_at: now,
    user_id: userId,
  };

  const saved = await writeProjectRecord(project, {
    userId,
    email: auth.user?.email ?? null,
  });
  return NextResponse.json(saved, { status: 201 });
}
