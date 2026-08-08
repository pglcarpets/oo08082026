/**
 * Floor Planner API client. Talks only to `/api/Planner/*` (plus the neutral
 * `/api/exports`) — never to a Studio route.
 */
import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

/** Catalog the Planner places on plans — listing is read-only. */
export const listFurniture = (params: Record<string, string> = {}) =>
  api.get("/Planner/catalog", { params }).then((r) => r.data);

/** Planner-side custom furniture upload. */
export const uploadFurniture = (formData: FormData) =>
  axios
    .post("/api/Planner/catalog/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);

export const listProjects = () => api.get("/Planner/projects").then((r) => r.data);
export const getProject = (id: string) =>
  api.get(`/Planner/projects/${id}`).then((r) => r.data);
export const createProject = (payload: unknown) =>
  api.post("/Planner/projects", payload).then((r) => r.data);
export const updateProject = (id: string, payload: unknown) =>
  api.patch(`/Planner/projects/${id}`, payload).then((r) => r.data);
export const deleteProject = (id: string) =>
  api.delete(`/Planner/projects/${id}`).then((r) => r.data);

export const createExport = (payload: { format?: string; data_url: string; name?: string }) =>
  api.post("/exports", payload).then((r) => r.data);

export const fileUrl = (path: string | null | undefined) => (path ? path : null);
