/**
 * Residual planner document types + light validation for portal /api/plans.
 * Live interactive app persistence is disk projects under `@planner/server/plannerStore`.
 */

export type PlannerJsonValue =
  | null
  | boolean
  | number
  | string
  | PlannerJsonValue[]
  | { [key: string]: PlannerJsonValue };

export type PlannerDocumentStatus = "draft" | "active" | "archived";

export type PlannerDocument = {
  id: string;
  name: string;
  status: PlannerDocumentStatus;
  projectName?: string | null;
  clientName?: string | null;
  preparedBy?: string | null;
  roomWidthMm?: number;
  roomDepthMm?: number;
  seatTarget?: number;
  unitSystem?: string;
  itemCount?: number;
  thumbnailUrl?: string | null;
  scene?: PlannerJsonValue;
  payload?: PlannerJsonValue;
  updatedAt?: string;
  createdAt?: string;
};

export type PlannerSceneEnvelope = {
  items: unknown[];
  room: { widthMm: number; depthMm: number };
  fabricSnapshot?: unknown;
};

export function assertPlannerDocument(input: unknown): PlannerDocument {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Invalid planner document");
  }
  const r = input as Record<string, unknown>;
  const id = typeof r.id === "string" ? r.id.trim() : "";
  if (!id) throw new Error("Planner document id is required");
  const name =
    (typeof r.name === "string" && r.name.trim()) ||
    (typeof r.projectName === "string" && r.projectName.trim()) ||
    "Untitled plan";
  const statusRaw = typeof r.status === "string" ? r.status : "draft";
  const status: PlannerDocumentStatus =
    statusRaw === "active" || statusRaw === "archived" ? statusRaw : "draft";
  return {
    id,
    name,
    status,
    projectName: typeof r.projectName === "string" ? r.projectName : null,
    clientName: typeof r.clientName === "string" ? r.clientName : null,
    preparedBy: typeof r.preparedBy === "string" ? r.preparedBy : null,
    roomWidthMm: numberOr(r.roomWidthMm ?? r.room_width_mm, 0),
    roomDepthMm: numberOr(r.roomDepthMm ?? r.room_depth_mm, 0),
    seatTarget: numberOr(r.seatTarget ?? r.seat_target, 0),
    unitSystem: typeof r.unitSystem === "string" ? r.unitSystem : "mm",
    itemCount: numberOr(r.itemCount ?? r.item_count, 0),
    thumbnailUrl:
      typeof r.thumbnailUrl === "string"
        ? r.thumbnailUrl
        : typeof r.thumbnail_url === "string"
          ? r.thumbnail_url
          : null,
    scene: (r.scene ?? r.scene_json ?? r.payload ?? null) as PlannerJsonValue,
    payload: (r.payload ?? null) as PlannerJsonValue,
    createdAt: stringOr(r.createdAt ?? r.created_at),
    updatedAt: stringOr(r.updatedAt ?? r.updated_at),
  };
}

export function getPlannerSceneEnvelope(
  value: PlannerJsonValue | unknown,
): PlannerSceneEnvelope | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const r = value as Record<string, unknown>;
  const roomRaw = (r.room ?? r.roomSize ?? {}) as Record<string, unknown>;
  const widthMm = numberOr(roomRaw.widthMm ?? roomRaw.width_mm ?? r.room_width_mm, 0);
  const depthMm = numberOr(roomRaw.depthMm ?? roomRaw.depth_mm ?? r.room_depth_mm, 0);
  const items = Array.isArray(r.items)
    ? r.items
    : Array.isArray(r.furniture)
      ? r.furniture
      : Array.isArray((r.canvas_json as { objects?: unknown[] } | undefined)?.objects)
        ? ((r.canvas_json as { objects: unknown[] }).objects)
        : [];
  return {
    items,
    room: { widthMm, depthMm },
    fabricSnapshot: r.fabricSnapshot ?? r.canvas_json ?? undefined,
  };
}

function numberOr(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function stringOr(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
