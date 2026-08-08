import "server-only";

import { and, eq } from "drizzle-orm";

import { getAdminDb } from "@/platform/drizzle/adminDb";
import { teamMembers } from "@/platform/drizzle/schema/planner";
import { isPlannerDatabaseUrlConfigured } from "@/platform/drizzle/databaseUrls";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isAuditTeamId(value: string): boolean {
  return UUID_RE.test(value);
}

export async function userBelongsToTeam(userId: string, teamId: string): Promise<boolean> {
  if (!isAuditTeamId(teamId) || !isPlannerDatabaseUrlConfigured()) {
    return false;
  }

  try {
    const db = getAdminDb();
    const rows = await db
      .select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
      .limit(1);

    return rows.length > 0;
  } catch (error) {
    console.error("[audit] team membership lookup failed:", error);
    return false;
  }
}
