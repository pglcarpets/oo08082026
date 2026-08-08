import { z } from "zod";

export const WorkspaceIdSchema = z.enum(["oostudio", "planner"]);

export const WorkspaceConfigurationEnvelopeSchema = z
  .object({
    id: z.string().uuid(),
    workspace: WorkspaceIdSchema,
    profileKey: z.string().regex(/^[a-z0-9-]+$/),
    schemaVersion: z.number().int().positive(),
    revision: z.number().int().nonnegative(),
    active: z.boolean(),
    payload: z.unknown(),
    updatedAt: z.string().datetime(),
    updatedBy: z.string().min(1),
  })
  .strict();

export type WorkspaceId = z.infer<typeof WorkspaceIdSchema>;
export type WorkspaceConfigurationEnvelope = z.infer<
  typeof WorkspaceConfigurationEnvelopeSchema
>;

export function parseWorkspaceConfigurationEnvelope(
  value: unknown,
): WorkspaceConfigurationEnvelope {
  return WorkspaceConfigurationEnvelopeSchema.parse(value);
}
