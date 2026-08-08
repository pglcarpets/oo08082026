import { apiPath, browserApiFetch } from "@/lib/api/browserApi";

export type AdminCatalogType = "standard" | "configurator";

export type StandardCatalogItem = {
  id: string;
  name: string;
  category: string;
  subcategory?: string | null;
  width_mm?: number;
  depth_mm?: number;
  height_mm?: number;
  price?: number | null;
  image_url?: string | null;
  mesh_type?: string;
  visible?: boolean;
  active?: boolean;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ConfiguratorCatalogItem = {
  id?: string;
  slug: string;
  name: string;
  category: string;
  family?: string | null;
  brand_name?: string | null;
  sizing_type: "parametric" | "discrete" | "fixed";
  workstation?: unknown;
  size_options?: unknown;
  default_footprint?: unknown;
  derived_rules?: unknown;
  materials?: string[];
  thumbnail_url?: string | null;
  model_3d_url?: string | null;
  description?: string | null;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CatalogListResponse = {
  success?: boolean;
  items?: StandardCatalogItem[] | ConfiguratorCatalogItem[];
  catalog_items?: StandardCatalogItem[];
  pagination?: { page: number; limit: number; total: number; pages: number };
  total?: number;
  source?: string;
  error?: { message?: string } | string;
};

export type CatalogItemResponse = {
  success?: boolean;
  item?: StandardCatalogItem | ConfiguratorCatalogItem;
  source?: string;
  error?: { message?: string } | string;
};

function resolveType(type: AdminCatalogType): "standard" | "configurator" {
  return type === "standard" ? "standard" : "configurator";
}

function parseError(body: CatalogListResponse | CatalogItemResponse, status: number): string {
  if (typeof body.error === "string") {return body.error;}
  if (body.error?.message) {return body.error.message;}
  return `Request failed (${status})`;
}

export async function fetchAdminCatalog(
  type: AdminCatalogType,
  query: Record<string, string | number | undefined> = {},
): Promise<CatalogListResponse> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {params.set(key, String(value));}
  }
  const qs = params.toString();
  const response = await browserApiFetch(
    apiPath(`/api/admin/catalogs/${resolveType(type)}${qs ? `?${qs}` : ""}`),
  );
  const body = (await response.json().catch(() => ({}))) as CatalogListResponse;
  if (!response.ok) {throw new Error(parseError(body, response.status));}
  return body;
}

export async function createAdminCatalogItem(
  type: AdminCatalogType,
  payload: Record<string, unknown>,
): Promise<CatalogItemResponse> {
  const response = await browserApiFetch(apiPath(`/api/admin/catalogs/${resolveType(type)}`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = (await response.json().catch(() => ({}))) as CatalogItemResponse;
  if (!response.ok) {throw new Error(parseError(body, response.status));}
  return body;
}

export async function patchAdminCatalogItem(
  type: AdminCatalogType,
  id: string,
  payload: Record<string, unknown>,
): Promise<CatalogItemResponse> {
  const response = await browserApiFetch(apiPath(`/api/admin/catalogs/${resolveType(type)}/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = (await response.json().catch(() => ({}))) as CatalogItemResponse;
  if (!response.ok) {throw new Error(parseError(body, response.status));}
  return body;
}

export async function deleteAdminCatalogItem(
  type: AdminCatalogType,
  id: string,
): Promise<void> {
  const response = await browserApiFetch(apiPath(`/api/admin/catalogs/${resolveType(type)}/${id}`), {
    method: "DELETE",
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as CatalogItemResponse;
    throw new Error(parseError(body, response.status));
  }
}
