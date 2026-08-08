export type AdminPlanStatus = "draft" | "active" | "archived";

export type AdminPlansListFilters = {
  limit?: number;
  page?: number;
  status?: "all" | AdminPlanStatus;
  search?: string;
  sortBy?: "updated_at" | "created_at";
  sortOrder?: "asc" | "desc";
};

/** Opens the plan in the authenticated planner canvas workspace. */
export function buildPlannerCanvasHref(planId: string): string {
  const id = planId.trim();
  if (!id) {return "/ooplanner";}
  return `/ooplanner?id=${encodeURIComponent(id)}`;
}

export function buildAdminPlansListQuery(filters: AdminPlansListFilters): string {
  const params = new URLSearchParams();
  params.set("limit", String(filters.limit ?? 50));
  if (filters.page && filters.page > 1) {
    params.set("page", String(filters.page));
  }
  params.set("sortBy", filters.sortBy ?? "updated_at");
  params.set("sortOrder", filters.sortOrder ?? "desc");
  if (filters.status && filters.status !== "all") {
    params.set("status", filters.status);
  }
  const search = filters.search?.trim();
  if (search) {
    params.set("search", search);
  }
  return `/api/admin/plans?${params.toString()}`;
}
