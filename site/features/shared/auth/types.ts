/**
 * features/shared/auth/types.ts
 *
 * Shared authentication contract used by BOTH space-planner AND configurator.
 * These types describe the minimum session shape both features require.
 * Supabase-specific types must not leak into this contract.
 */

export type PlannerRole = "owner" | "editor" | "viewer" | "guest";

export interface SharedSessionUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  role: PlannerRole;
}

export interface SharedSession {
  user: SharedSessionUser | null;
  token: string | null;
  expiresAt?: number;
  isGuest?: boolean;
}

/** Minimal user shape returned from requirePlannerUser / getOptionalPlannerUser */
export interface PlannerAuthUser {
  id: string;
  email: string | undefined;
  role?: PlannerRole;
}

export interface AuthUser {
  id: string;
  email: string;
}

export type SessionState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; user: AuthUser };
