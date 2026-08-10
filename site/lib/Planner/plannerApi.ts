/**
 * Floor Planner API client. Talks only to `/api/Planner/*` (plus the neutral
 * `/api/exports`) — never to a Studio route.
 *
 * Member load/save must work without DEV_AUTH_BYPASS: use browserApiFetch so
 * requests send session cookies, attach CSRF on mutations, and honor
 * trailingSlash: true (POST redirect would drop the body).
 */
import { apiPath, browserApiFetch } from "@/lib/api/browserApi";
import type { FurnitureItem, PlannerProject } from "@planner/lib/plannerTypes";

async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as {
        detail?: string;
        error?: { message?: string } | string;
        message?: string;
      };
      if (typeof body.detail === "string" && body.detail) {
        detail = body.detail;
      } else if (typeof body.message === "string" && body.message) {
        detail = body.message;
      } else if (typeof body.error === "string" && body.error) {
        detail = body.error;
      } else if (
        body.error &&
        typeof body.error === "object" &&
        typeof body.error.message === "string" &&
        body.error.message
      ) {
        detail = body.error.message;
      }
    } catch {
      /* non-JSON error body */
    }
    throw new Error(detail);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

function jsonInit(method: string, payload?: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  };
}

/** Catalog the Planner places on plans — listing is read-only. */
export const listFurniture = (
  params: Record<string, string> = {},
): Promise<FurnitureItem[]> => {
  const qs = new URLSearchParams(params).toString();
  const path = qs
    ? `/api/Planner/catalog?${qs}`
    : "/api/Planner/catalog";
  return browserApiFetch(path).then((r) => readJson<FurnitureItem[]>(r));
};

/** Planner-side custom furniture upload. */
export const uploadFurniture = (formData: FormData): Promise<FurnitureItem> =>
  browserApiFetch(apiPath("/api/Planner/catalog/upload"), {
    method: "POST",
    body: formData,
  }).then((r) => readJson<FurnitureItem>(r));

export const listProjects = (): Promise<PlannerProject[]> =>
  browserApiFetch("/api/Planner/projects").then((r) =>
    readJson<PlannerProject[]>(r),
  );

export const getProject = (id: string): Promise<PlannerProject> =>
  browserApiFetch(`/api/Planner/projects/${encodeURIComponent(id)}`).then((r) =>
    readJson<PlannerProject>(r),
  );

export const createProject = (payload: unknown): Promise<PlannerProject> =>
  browserApiFetch("/api/Planner/projects", jsonInit("POST", payload)).then((r) =>
    readJson<PlannerProject>(r),
  );

export const updateProject = (
  id: string,
  payload: unknown,
): Promise<PlannerProject> =>
  browserApiFetch(
    `/api/Planner/projects/${encodeURIComponent(id)}`,
    jsonInit("PATCH", payload),
  ).then((r) => readJson<PlannerProject>(r));

export const deleteProject = (id: string): Promise<{ ok: boolean }> =>
  browserApiFetch(`/api/Planner/projects/${encodeURIComponent(id)}`, {
    method: "DELETE",
  }).then((r) => readJson<{ ok: boolean }>(r));

export const createExport = (payload: {
  format?: string;
  data_url: string;
  name?: string;
}): Promise<unknown> =>
  browserApiFetch("/api/exports", jsonInit("POST", payload)).then((r) =>
    readJson(r),
  );

export const fileUrl = (path: string | null | undefined) => (path ? path : null);
