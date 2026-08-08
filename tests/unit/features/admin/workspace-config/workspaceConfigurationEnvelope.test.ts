import { describe, expect, it } from "vitest";
import { WorkspaceConfigurationEnvelopeSchema } from "@/features/admin/workspace-config/workspaceConfigurationEnvelope";

const validEnvelope = {
  id: "d9c79c97-71a7-4678-a8f4-e9b58ee1ab53",
  workspace: "oostudio",
  profileKey: "standard",
  schemaVersion: 1,
  revision: 0,
  active: true,
  payload: { version: 1 },
  updatedAt: "2026-07-27T02:00:00.000Z",
  updatedBy: "admin-1",
};

describe("WorkspaceConfigurationEnvelopeSchema", () => {
  it("strictly parses the shared envelope", () => {
    expect(WorkspaceConfigurationEnvelopeSchema.parse(validEnvelope)).toEqual(validEnvelope);
    expect(() =>
      WorkspaceConfigurationEnvelopeSchema.parse({ ...validEnvelope, unexpected: true }),
    ).toThrow();
  });

  it("rejects unknown workspaces and invalid profile keys", () => {
    expect(WorkspaceConfigurationEnvelopeSchema.safeParse({ ...validEnvelope, workspace: "other" }).success).toBe(false);
    expect(WorkspaceConfigurationEnvelopeSchema.safeParse({ ...validEnvelope, profileKey: "Bad Key" }).success).toBe(false);
  });
});
