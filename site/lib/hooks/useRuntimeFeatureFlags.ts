"use client";

import { useCallback, useEffect, useState } from "react";
import { apiPath, browserApiFetch } from "@/lib/api/browserApi";
import {
  DEFAULT_FLAGS,
  getFeatureFlags,
  setFeatureFlags,
  type FeatureFlagName,
  type FeatureFlags,
} from "@/lib/featureFlags";

type FlagsResponse = {
  success?: boolean;
  flags?: FeatureFlags;
  source?: string;
};

/**
 * Load resolved feature flags for client surfaces (Planner, Studio, admin shell).
 * Falls back to in-memory / defaults when the network call fails.
 */
export function useRuntimeFeatureFlags(): {
  flags: FeatureFlags;
  source: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  enabled: (name: FeatureFlagName) => boolean;
} {
  const [flags, setFlags] = useState<FeatureFlags>(() => getFeatureFlags());
  const [source, setSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await browserApiFetch(apiPath("/api/features"));
      if (!response.ok) {
        throw new Error(`Failed to load feature flags (${response.status})`);
      }
      const payload = (await response.json()) as FlagsResponse;
      const next = { ...DEFAULT_FLAGS, ...payload.flags } as FeatureFlags;
      setFeatureFlags(next);
      setFlags(next);
      setSource(payload.source ?? "remote");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load feature flags");
      const fallback = getFeatureFlags();
      setFlags(fallback);
      setSource("local-fallback");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(id);
  }, [refresh]);

  return {
    flags,
    source,
    loading,
    error,
    refresh,
    enabled: (name) => Boolean(flags[name]),
  };
}
