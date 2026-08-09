import "server-only";

import { createClient } from "@supabase/supabase-js";
import type {
  FeatureFlagName,
  FeatureFlags,
} from "@/lib/featureFlags";
import {
  getAllFlagNames,
  getFeatureFlags,
  setFeatureFlags,
} from "@/lib/featureFlags";

type FeatureFlagRow = {
  key: string;
  enabled: boolean | null;
};

export type FeatureFlagsUpdateInput = {
  key?: string;
  enabled?: boolean;
  updates?: Record<string, boolean>;
};

export type UpdateFeatureFlagsSuccess = {
  ok: true;
  source: "local" | "supabase";
};

export type UpdateFeatureFlagsFailure =
  | {
      ok: false;
      kind: "validation";
      message: string;
      invalidKeys?: string[];
    }
  | {
      ok: false;
      kind: "database";
      message: string;
    };

export type UpdateFeatureFlagsResult =
  | UpdateFeatureFlagsSuccess
  | UpdateFeatureFlagsFailure;

export type ListFeatureFlagsResult = {
  flags: FeatureFlags;
  source: "local" | "supabase+local";
};

/**
 * Admin `feature_flags` table lives on the **Admin** project
 * (`NEXT_ADMIN_SUPABASE_URL` + `SUPABASE_ADMIN_SERVICE_ROLE_KEY`).
 * Using Products URL/key hits the wrong DB (or lacks grants) →
 * "permission denied for table feature_flags".
 */
function createFeatureFlagsAdminClient() {
  const supabaseUrl =
    process.env.NEXT_ADMIN_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_AUTH_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey =
    process.env.SUPABASE_ADMIN_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

/**
 * Normalize PATCH / action body into a key→enabled map.
 * Returns null when no updates were provided.
 */
export function normalizeFeatureFlagUpdates(
  input: FeatureFlagsUpdateInput,
): Record<string, boolean> | null {
  if (input.updates && Object.keys(input.updates).length > 0) {
    return input.updates;
  }
  if (input.key) {
    return { [input.key]: Boolean(input.enabled) };
  }
  return null;
}

/**
 * Persist feature-flag updates (admin). Supabase when configured; else local cache.
 */
export async function updateFeatureFlagsAdmin(
  rawUpdates: Record<string, boolean>,
): Promise<UpdateFeatureFlagsResult> {
  const allowedKeys = new Set<string>(getAllFlagNames());
  const invalidKeys = Object.keys(rawUpdates).filter((k) => !allowedKeys.has(k));
  if (invalidKeys.length > 0) {
    return {
      ok: false,
      kind: "validation",
      message: `Unknown flag keys: ${invalidKeys.join(", ")}`,
      invalidKeys,
    };
  }

  const updatesTyped = rawUpdates as Partial<Record<FeatureFlagName, boolean>>;

  const supabase = createFeatureFlagsAdminClient();
  if (!supabase) {
    setFeatureFlags(updatesTyped);
    return { ok: true, source: "local" };
  }

  const rows = Object.entries(updatesTyped).map(([flagKey, flagEnabled]) => ({
    key: flagKey,
    enabled: Boolean(flagEnabled),
    rollout_percentage: 100,
    updated_at: new Date().toISOString(),
  }));

  const { error: dbError } = await supabase.from("feature_flags").upsert(rows);
  if (dbError) {
    console.error("[admin/features] update error:", dbError.message);
    return {
      ok: false,
      kind: "database",
      message: dbError.message,
    };
  }

  setFeatureFlags(updatesTyped);
  return { ok: true, source: "supabase" };
}

/**
 * List feature flags (merged Supabase + local defaults when available).
 */
export async function listFeatureFlagsAdmin(): Promise<ListFeatureFlagsResult> {
  try {
    const supabase = createFeatureFlagsAdminClient();
    if (!supabase) {
      return { flags: getFeatureFlags(), source: "local" };
    }

    const { data, error: dbError } = await supabase
      .from("feature_flags")
      .select("key, enabled");

    if (dbError) {
      console.error("[admin/features] list error:", dbError.message);
      return { flags: getFeatureFlags(), source: "local" };
    }

    const remoteFlags = (data || []).reduce<Record<string, boolean>>(
      (acc, row) => {
        const typedRow = row as FeatureFlagRow;
        if (typedRow.key) {
          acc[typedRow.key] = Boolean(typedRow.enabled);
        }
        return acc;
      },
      {},
    );

    const mergedFlags: FeatureFlags = {
      ...getFeatureFlags(),
      ...remoteFlags,
    };
    setFeatureFlags(mergedFlags);

    return { flags: mergedFlags, source: "supabase+local" };
  } catch (err) {
    console.error("[admin/features] list failed:", err);
    return { flags: getFeatureFlags(), source: "local" };
  }
}
