/** Admin-console CRM paths (canonical). Legacy `/crm/*` redirects here. */
export const CRM_ADMIN_BASE = "/admin/crm";

export const CRM_CLIENTS_PATH = `${CRM_ADMIN_BASE}/clients`;
export const CRM_PROJECTS_PATH = `${CRM_ADMIN_BASE}/projects`;
export const CRM_QUOTES_PATH = `${CRM_ADMIN_BASE}/quotes`;

export function crmProjectDetailPath(projectId: string): string {
  return `${CRM_PROJECTS_PATH}/${encodeURIComponent(projectId)}`;
}
