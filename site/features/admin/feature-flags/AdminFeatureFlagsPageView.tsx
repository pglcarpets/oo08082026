"use client";

import { useCallback, useEffect, useState } from "react";
import { CircleNotch as Loader2, ArrowsClockwise as RefreshCw } from "@phosphor-icons/react";
import { useAction } from "next-safe-action/hooks";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/switch";
import { apiPath, browserApiFetch } from "@/lib/api/browserApi";
import {
  getAllFlagsGrouped,
  type FeatureFlagName,
  type FeatureFlags,
} from "@/lib/featureFlags";
import { updateFeatureFlagsAction } from "@/features/admin/feature-flags/updateFeatureFlagsAction";
import { AdminAlert } from "@/features/admin/ui/AdminAlert";
import { AdminLoadingPanel } from "@/features/admin/ui/AdminLoadingPanel";

type FlagsResponse = {
  success?: boolean;
  flags: FeatureFlags;
  source?: string;
};

export default function AdminFeatureFlagsPageView() {
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<FeatureFlagName | null>(null);

  const { executeAsync } = useAction(updateFeatureFlagsAction);

  const loadFlags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await browserApiFetch(apiPath("/api/admin/features"));
      if (!response.ok) {
        throw new Error(`Failed to load feature flags (${response.status})`);
      }
      const payload = (await response.json()) as FlagsResponse;
      setFlags(payload.flags);
      setSource(payload.source ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load feature flags");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadFlags();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadFlags]);

  const toggleFlag = useCallback(
    async (key: FeatureFlagName, enabled: boolean) => {
      setPendingKey(key);
      setError(null);
      try {
        const result = await executeAsync({ updates: { [key]: enabled } });
        if (result?.serverError) {
          setError(result.serverError);
          return;
        }
        if (result?.validationErrors) {
          setError("Invalid feature-flag update");
          return;
        }
        if (!result?.data) {
          setError("Failed to update feature flag");
          return;
        }
        setFlags((current) => (current ? { ...current, [key]: enabled } : current));
        if (result.data.source) {
          setSource(result.data.source);
        }
      } catch (updateError) {
        setError(
          updateError instanceof Error
            ? updateError.message
            : "Failed to update feature flag",
        );
      } finally {
        setPendingKey(null);
      }
    },
    [executeAsync],
  );

  const grouped = getAllFlagsGrouped();

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div>
          <p className="admin-page__eyebrow">Modules &amp; ports</p>
          <h1 className="admin-page__title">Feature flags</h1>
          <p className="admin-page__copy">
            Enable or disable admin console modules, Port 01–03 planner/studio capabilities,
            exports, AI, and sync. Changes apply after refresh (Planner/Studio read{" "}
            <code className="admin-type-code">/api/features</code>).
          </p>
          {source ? <p className="admin-page__meta">Source: {source}</p> : null}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void loadFlags()}
          disabled={loading}
        >
          {loading ? <Loader2 size={14} className="admin-icon-spin" aria-hidden /> : <RefreshCw size={14} className="admin-icon-static" aria-hidden />}
          Refresh
        </Button>
      </header>

      {error ? <AdminAlert variant="error">{error}</AdminAlert> : null}

      {loading && !flags ? (
        <AdminLoadingPanel compact title="Syncing live flag overrides…" />
      ) : null}

      <div className="admin-stack--loose" aria-busy={Boolean(loading && !flags)}>
        {grouped.map((group) => (
          <section key={group.group} className="admin-panel">
            <header className="admin-panel__header">
              <h2 className="admin-type-section">{group.group}</h2>
            </header>
            <ul className="admin-list-divide">
              {group.flags.map((flag) => {
                const enabled = flags?.[flag.name] ?? flag.defaultValue;
                const busy = pendingKey === flag.name;
                return (
                  <li key={flag.name} className="admin-list-block admin-list-row admin-list-row--center">
                    <div className="admin-list-row__main">
                      <p className="admin-type-subsection">{flag.description}</p>
                      <p className="admin-list-row__meta">{flag.name}</p>
                    </div>
                    <Switch
                      checked={enabled}
                      aria-label={flag.description}
                      disabled={busy || !flags}
                      onCheckedChange={(next) => void toggleFlag(flag.name, next)}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
