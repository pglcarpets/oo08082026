/**
 * Furniture Studio API client. Talks only to `/api/Studio/*` (plus the neutral
 * `/api/exports`) — never to a Planner route.
 */
import axios from "axios";
import { apiPath, browserApiFetch } from "@/lib/api/browserApi";

export const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

export const listFurniture = (params: Record<string, string> = {}) =>
  api.get("/Studio/furniture", { params }).then((r) => r.data);

export const createFurniture = (payload: unknown) =>
  api.post("/Studio/furniture", payload).then((r) => r.data);

export const updateFurniture = (id: string, payload: unknown) =>
  api.patch(`/Studio/furniture/${id}`, payload).then((r) => r.data);

export const deleteFurniture = (id: string) =>
  api.delete(`/Studio/furniture/${id}`).then((r) => r.data);

export const uploadFurniture = (formData: FormData) =>
  axios
    .post("/api/Studio/furniture/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);

export type PublishFurnitureResult = {
  success: true;
  slug: string;
  version: number;
  lifecycle: string;
  furnitureId: string;
};

/** Publish a disk-saved furniture draft into versioned catalog descriptors. */
export async function publishFurniture(
  id: string,
  options: { goLive?: boolean; slug?: string } = {},
): Promise<PublishFurnitureResult> {
  const res = await browserApiFetch(apiPath(`/api/Studio/furniture/${id}/publish`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });
  const body = (await res.json()) as {
    success?: boolean;
    slug?: string;
    version?: number;
    lifecycle?: string;
    furnitureId?: string;
    error?: { message?: string };
    message?: string;
  };
  if (!res.ok || body.success === false) {
    throw new Error(
      body.error?.message || body.message || `Publish failed (${res.status})`,
    );
  }
  if (
    body.success !== true ||
    typeof body.slug !== "string" ||
    typeof body.version !== "number" ||
    typeof body.lifecycle !== "string" ||
    typeof body.furnitureId !== "string"
  ) {
    throw new Error(body.message || `Publish failed (${res.status})`);
  }
  return {
    success: true,
    slug: body.slug,
    version: body.version,
    lifecycle: body.lifecycle,
    furnitureId: body.furnitureId,
  };
}

export const createExport = (payload: { format?: string; data_url: string; name?: string }) =>
  api.post("/exports", payload).then((r) => r.data);

export const fileUrl = (path: string | null | undefined) => (path ? path : null);
