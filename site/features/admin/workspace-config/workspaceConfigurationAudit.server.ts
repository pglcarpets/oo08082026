import "server-only";

import { z } from "zod";
import { WorkspaceIdSchema } from "./workspaceConfigurationEnvelope";

export const WorkspaceConfigurationAuditActionSchema = z.enum([
  "create",
  "update",
  "activate",
  "reset",
]);

export const WorkspaceConfigurationAuditRowSchema = z
  .object({
    id: z.string().uuid(),
    configId: z.string().uuid(),
    workspace: WorkspaceIdSchema,
    profileKey: z.string().regex(/^[a-z0-9-]+$/),
    revision: z.number().int().nonnegative(),
    action: WorkspaceConfigurationAuditActionSchema,
    payload: z.unknown(),
    actorId: z.string().min(1),
    createdAt: z.string().datetime(),
  })
  .strict();

export type WorkspaceConfigurationAuditAction = z.infer<
  typeof WorkspaceConfigurationAuditActionSchema
>;
export type WorkspaceConfigurationAuditRow = Readonly<
  z.infer<typeof WorkspaceConfigurationAuditRowSchema>
>;

export function parseWorkspaceConfigurationAuditRow(
  value: unknown,
): WorkspaceConfigurationAuditRow {
  return Object.freeze(WorkspaceConfigurationAuditRowSchema.parse(value));
}
