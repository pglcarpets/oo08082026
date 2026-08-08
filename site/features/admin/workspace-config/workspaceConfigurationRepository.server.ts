import "server-only";

import { createClient } from "@supabase/supabase-js";
import {
  parseWorkspaceConfigurationEnvelope,
  type WorkspaceConfigurationEnvelope,
  type WorkspaceId,
} from "./workspaceConfigurationEnvelope";

export type WorkspaceConfigurationInput = {
  readonly workspace: WorkspaceId;
  readonly profileKey: string;
  readonly schemaVersion: number;
  readonly payload: unknown;
  readonly active?: boolean;
};

export type WorkspaceConfigurationWriteResult =
  | { readonly ok: true; readonly configuration: WorkspaceConfigurationEnvelope }
  | { readonly ok: false; readonly code: "conflict"; readonly remoteRevision: number }
  | { readonly ok: false; readonly code: "storage"; readonly message: string };

type WorkspaceConfigurationRow = {
  readonly id: string;
  readonly workspace: WorkspaceId;
  readonly profile_key: string;
  readonly schema_version: number;
  readonly revision: number;
  readonly active: boolean;
  readonly payload: unknown;
  readonly updated_at: string;
  readonly updated_by: string;
};

function fromRow(row: WorkspaceConfigurationRow): WorkspaceConfigurationEnvelope {
  return parseWorkspaceConfigurationEnvelope({
    id: row.id,
    workspace: row.workspace,
    profileKey: row.profile_key,
    schemaVersion: row.schema_version,
    revision: row.revision,
    active: row.active,
    payload: row.payload,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  });
}

function serviceClient() {
  const url =
    process.env.SUPABASE_URL?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return url && key
    ? createClient(url, key, { auth: { persistSession: false } })
    : null;
}

export async function getActiveWorkspaceConfiguration(
  workspace: WorkspaceId,
): Promise<WorkspaceConfigurationEnvelope | null> {
  const client = serviceClient();
  if (!client) return null;
  const { data, error } = await client
    .from("workspace_editor_configs")
    .select("*")
    .eq("workspace", workspace)
    .eq("active", true)
    .maybeSingle();
  return error || !data ? null : fromRow(data as WorkspaceConfigurationRow);
}

export async function listWorkspaceConfigurations(
  workspace: WorkspaceId,
): Promise<readonly WorkspaceConfigurationEnvelope[]> {
  const client = serviceClient();
  if (!client) return [];
  const { data, error } = await client
    .from("workspace_editor_configs")
    .select("*")
    .eq("workspace", workspace)
    .order("profile_key");
  return error || !data
    ? []
    : (data as WorkspaceConfigurationRow[]).map(fromRow);
}

async function mutate(
  action: "upsert" | "activate" | "reset",
  input: {
    readonly workspace: WorkspaceId;
    readonly profileKey: string;
    readonly expectedRevision: number;
    readonly actorId: string;
    readonly schemaVersion?: number;
    readonly payload?: unknown;
    readonly active?: boolean;
  },
): Promise<WorkspaceConfigurationWriteResult> {
  const client = serviceClient();
  if (!client) {
    return { ok: false, code: "storage", message: "Workspace configuration storage is not configured" };
  }
  const { data, error } = await client.rpc("mutate_workspace_editor_configuration", {
    p_action: action,
    p_workspace: input.workspace,
    p_profile_key: input.profileKey,
    p_expected_revision: input.expectedRevision,
    p_actor_id: input.actorId,
    p_schema_version: input.schemaVersion ?? null,
    p_payload: input.payload ?? null,
    p_active: input.active ?? null,
  });
  if (error) return { ok: false, code: "storage", message: "Unable to write workspace configuration" };
  const result = Array.isArray(data) ? data[0] : data;
  if (!result || typeof result !== "object") {
    return { ok: false, code: "storage", message: "Workspace configuration storage returned an invalid result" };
  }
  const row = result as {
    ok?: boolean;
    remote_revision?: number;
    configuration?: WorkspaceConfigurationRow;
  };
  if (row.ok && row.configuration) {
    return { ok: true, configuration: fromRow(row.configuration) };
  }
  if (typeof row.remote_revision === "number") {
    return { ok: false, code: "conflict", remoteRevision: row.remote_revision };
  }
  return { ok: false, code: "storage", message: "Workspace configuration write was rejected" };
}

export function upsertWorkspaceConfiguration(
  input: WorkspaceConfigurationInput,
  expectedRevision: number,
  actorId: string,
) {
  return mutate("upsert", { ...input, expectedRevision, actorId });
}

export function activateWorkspaceConfiguration(
  workspace: WorkspaceId,
  profileKey: string,
  expectedRevision: number,
  actorId: string,
) {
  return mutate("activate", { workspace, profileKey, expectedRevision, actorId });
}

export function resetWorkspaceConfiguration(
  workspace: WorkspaceId,
  profileKey: string,
  expectedRevision: number,
  actorId: string,
) {
  return mutate("reset", { workspace, profileKey, expectedRevision, actorId });
}
