import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseWorkspaceConfigurationAuditRow } from "@/features/admin/workspace-config/workspaceConfigurationAudit.server";

const migrationPath =
  "platform/supabase/migrations.admin/20260727020000_workspace_editor_configs.sql";

describe("workspace configuration storage contract", () => {
  it("enforces one active profile, service-role writes, atomic mutation and immutable audits", () => {
    const sql = readFileSync(migrationPath, "utf8");
    expect(sql).toContain("workspace_editor_configs_one_active");
    expect(sql).toMatch(/where active/i);
    expect(sql).toContain("revoke all on public.workspace_editor_configs from anon, authenticated");
    expect(sql).toContain("workspace_editor_config_audit_immutable");
    expect(sql).toContain("mutate_workspace_editor_configuration");
    expect(sql).toMatch(/insert into public\.workspace_editor_config_audit/);
  });

  it("returns frozen, strictly parsed audit rows", () => {
    const row = parseWorkspaceConfigurationAuditRow({
      id: "d9c79c97-71a7-4678-a8f4-e9b58ee1ab53",
      configId: "2923ea4d-a844-401d-bb85-734bbd5d1652",
      workspace: "oostudio",
      profileKey: "standard",
      revision: 1,
      action: "create",
      payload: { version: 1 },
      actorId: "admin-1",
      createdAt: "2026-07-27T02:00:00.000Z",
    });
    expect(Object.isFrozen(row)).toBe(true);
    expect(() => parseWorkspaceConfigurationAuditRow({ ...row, extra: true })).toThrow();
  });
});
