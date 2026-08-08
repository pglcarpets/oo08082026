import "server-only";

import { adminDb } from '@/platform/drizzle/adminDb'
import { auditEvents } from '@/platform/drizzle/schema/planner'

export interface AuditEventRow {
  team_id: string
  actor_id: string
  action: string
  target_type: string | null
  target_id: string | null
  metadata: Record<string, unknown>
}

export async function insertEvent(row: AuditEventRow): Promise<void> {
  await adminDb.insert(auditEvents).values({
    teamId: row.team_id,
    actorId: row.actor_id,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    metadata: row.metadata,
  })
}
