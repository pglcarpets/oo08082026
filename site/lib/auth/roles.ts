/**
 * Server-side role resolution from Supabase JWT app_metadata only.
 * user_metadata is user-writable and must not grant admin or elevated access.
 */

export type AuthMetadataUser = {
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

export function readAppRole(user: AuthMetadataUser): string {
  const role = user.app_metadata?.role;
  if (typeof role === "string" && role.trim().length > 0) {
    return role.trim();
  }

  const roles = user.app_metadata?.roles;
  if (Array.isArray(roles) && roles.includes("admin")) {
    return "admin";
  }

  return "member";
}

export function isAppAdmin(user: AuthMetadataUser): boolean {
  return readAppRole(user) === "admin";
}
