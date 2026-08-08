"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FloppyDisk as Save,
  CloudArrowUp as UploadCloud,
  WarningCircle as AlertCircle,
  ArrowsClockwise as RefreshCw,
  CircleNotch as Loader2,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { apiPath, browserApiFetch } from "@/lib/api/browserApi";
import {
  countTokensByCategory,
  getDefaultPlannerThemePack,
  tokensForCategory,
  type PlannerTokenCategory,
} from "@/lib/theme/plannerThemePacks";

export type ThemeRow = {
  id: string;
  name: string;
  is_active: boolean;
  description?: string;
  tokens: Record<string, string>;
  tokenCount?: number;
  source?: "block_themes" | "starter";
};

type TabType = PlannerTokenCategory;

const THEME_TABS: TabType[] = ["woods", "metals", "fabrics", "lighting"];

type PublishStatus =
  | { kind: "idle" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

function isTokenRecord(value: unknown): value is Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {return false;}
  return Object.values(value).every((v) => typeof v === "string");
}

function normalizeTheme(raw: unknown): ThemeRow | null {
  if (!raw || typeof raw !== "object") {return null;}
  const row = raw as Record<string, unknown>;
  if (typeof row.id !== "string" || typeof row.name !== "string") {return null;}
  const tokens = isTokenRecord(row.tokens) ? row.tokens : {};
  return {
    id: row.id,
    name: row.name,
    is_active: Boolean(row.is_active),
    description: typeof row.description === "string" ? row.description : undefined,
    tokens,
    tokenCount:
      typeof row.tokenCount === "number"
        ? row.tokenCount
        : Object.keys(tokens).length,
    source:
      row.source === "block_themes" || row.source === "starter"
        ? row.source
        : undefined,
  };
}

export function ThemeEditor() {
  const [themes, setThemes] = useState<ThemeRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listSource, setListSource] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("woods");
  const [loading, setLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [publishStatus, setPublishStatus] = useState<PublishStatus>({
    kind: "idle",
  });

  const loadThemes = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await browserApiFetch(apiPath("/api/admin/themes"));
      if (res.ok === false) {
        throw new Error(`Failed to load themes (${res.status})`);
      }
      const data = (await res.json()) as {
        success?: boolean;
        themes?: unknown[];
        source?: string;
      };
      if (data.success === false) {
        throw new Error("Failed to load themes");
      }
      const next = Array.isArray(data.themes)
        ? data.themes
            .map(normalizeTheme)
            .filter((t): t is ThemeRow => t !== null)
        : [];
      setThemes(next);
      setListSource(typeof data.source === "string" ? data.source : null);
      setSelectedId((current) => {
        if (current && next.some((t) => t.id === current)) {return current;}
        const active = next.find((t) => t.is_active);
        return active?.id ?? next[0]?.id ?? null;
      });
    } catch (error) {
      setThemes([]);
      setSelectedId(null);
      setListSource(null);
      setLoadError(
        error instanceof Error ? error.message : "Failed to load themes",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadThemes();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadThemes]);

  const selected = useMemo(
    () => themes.find((t) => t.id === selectedId) ?? null,
    [themes, selectedId],
  );

  const categoryCounts = useMemo(
    () => (selected ? countTokensByCategory(selected.tokens) : null),
    [selected],
  );

  const visibleTokens = useMemo(
    () =>
      selected ? tokensForCategory(selected.tokens, activeTab) : [],
    [selected, activeTab],
  );

  const handlePublish = async (theme: ThemeRow | null) => {
    const pack = theme ?? {
      id: getDefaultPlannerThemePack().id,
      name: getDefaultPlannerThemePack().name,
      is_active: true,
      tokens: getDefaultPlannerThemePack().tokens,
      description: getDefaultPlannerThemePack().description,
      source: "starter" as const,
    };

    setIsPublishing(true);
    setPublishStatus({ kind: "idle" });
    try {
      const res = await browserApiFetch(apiPath("/api/admin/themes/publish"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          themeName: pack.name,
          tokens: pack.tokens,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
        url?: string;
        message?: string;
      };

      if (res.ok === false || data.success === false) {
        throw new Error(
          data.error ?? `Publish failed (${res.status})`,
        );
      }

      const url = data.url ?? `themes/${pack.name}.json`;
      setPublishStatus({
        kind: "success",
        message: `Published “${pack.name}” to planner CDN: ${url}`,
      });

      setThemes((prev) => {
        if (prev.some((t) => t.id === pack.id || t.name === pack.name)) {
          return prev.map((t) =>
            t.id === pack.id || t.name === pack.name
              ? { ...t, tokens: pack.tokens, is_active: true }
              : { ...t, is_active: false },
          );
        }
        return [
          {
            ...pack,
            is_active: true,
            tokenCount: Object.keys(pack.tokens).length,
          },
          ...prev.map((t) => ({ ...t, is_active: false })),
        ];
      });
      setSelectedId(pack.id);
    } catch (error) {
      setPublishStatus({
        kind: "error",
        message:
          error instanceof Error ? error.message : "Publish network error",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  if (loading && themes.length === 0 && !loadError) {
    return (
      <div
        className="admin-panel h-96 animate-pulse bg-subtle"
        role="status"
        aria-live="polite"
      >
        <span className="sr-only">Loading themes…</span>
      </div>
    );
  }

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="space-y-4">
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => void loadThemes()}
            disabled={loading}
          >
            {loading ? (
              <Loader2 size={16} className="admin-icon-spin" aria-hidden />
            ) : (
              <RefreshCw size={16} className="admin-icon-static" aria-hidden />
            )}
            Refresh
          </Button>
          {listSource ? (
            <p className="admin-page__meta m-0">Source: {listSource}</p>
          ) : null}
        </div>

        <div className="admin-panel overflow-hidden">
          {loadError ? (
            <div className="space-y-3 p-4" role="alert">
              <div className="admin-alert admin-alert--error m-0">
                <strong>Could not load themes</strong>
                <p className="m-0 mt-1">{loadError}</p>
              </div>
              <div className="admin-empty__actions">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => void loadThemes()}
                  disabled={loading}
                >
                  {loading ? "Retrying…" : "Retry"}
                </Button>
              </div>
            </div>
          ) : themes.length === 0 ? (
            <div className="admin-empty" role="status">
              <h3 className="admin-empty__title">No planner theme packs yet</h3>
              <p className="admin-empty__copy">
                Publish the premium-light starter pack to seed woods, metals,
                fabrics, and lighting tokens for planner 2D/3D materials.
              </p>
              <div className="admin-empty__actions">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => void handlePublish(null)}
                  disabled={isPublishing}
                >
                  <UploadCloud size={16} aria-hidden />
                  {isPublishing ? "Publishing…" : "Publish starter pack"}
                </Button>
              </div>
            </div>
          ) : (
            <ul className="m-0 list-none p-0">
              {themes.map((t) => {
                const selectedTheme = t.id === selectedId;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(t.id)}
                      aria-pressed={selectedTheme}
                      className={`flex w-full items-center justify-between gap-2 border-b border-soft p-3 text-left last:border-b-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                        selectedTheme ? "bg-subtle" : "bg-transparent"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-strong">
                          {t.name}
                        </span>
                        {t.description ? (
                          <span className="mt-0.5 block truncate text-xs text-muted">
                            {t.description}
                          </span>
                        ) : (
                          <span className="mt-0.5 block text-xs text-muted">
                            {t.tokenCount ?? Object.keys(t.tokens).length} tokens
                          </span>
                        )}
                      </span>
                      {t.is_active ? (
                        <span className="admin-badge admin-badge--active shrink-0">
                          Live
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <section className="admin-panel overflow-hidden">
        <div className="admin-panel__header flex flex-wrap items-center justify-between gap-3 !py-4">
          <div className="min-w-0">
            <h2 className="m-0 text-lg font-semibold text-strong">
              {selected ? selected.name : "Edit Theme Tokens"}
            </h2>
            {selected?.description ? (
              <p className="admin-page__meta m-0 mt-1">{selected.description}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled
              aria-describedby="theme-save-unavailable"
            >
              <Save size={16} aria-hidden />
              Save Draft
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => void handlePublish(selected)}
              disabled={isPublishing || (!selected && themes.length > 0)}
            >
              <UploadCloud size={16} aria-hidden />
              {isPublishing ? "Publishing…" : "Publish to Planners"}
            </Button>
          </div>
          <p id="theme-save-unavailable" className="admin-page__meta basis-full">
            Draft editing is read-only for now. Publish pushes the selected
            planner material pack to the CDN.
          </p>
        </div>

        {publishStatus.kind === "success" ? (
          <div className="admin-alert admin-alert--success mx-4 mt-4" role="status">
            {publishStatus.message}
          </div>
        ) : null}
        {publishStatus.kind === "error" ? (
          <div className="admin-alert admin-alert--error mx-4 mt-4" role="alert">
            <strong>Publish failed</strong>
            <p className="m-0 mt-1">{publishStatus.message}</p>
            <div className="admin-empty__actions mt-3">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => void handlePublish(selected)}
                disabled={isPublishing}
              >
                Retry publish
              </Button>
            </div>
          </div>
        ) : null}

        <div
          className="flex overflow-x-auto border-b border-soft"
          role="tablist"
          aria-label="Material categories"
        >
          {THEME_TABS.map((tab) => {
            const isSelected = activeTab === tab;
            const count = categoryCounts?.[tab] ?? 0;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                id={`theme-tab-${tab}`}
                aria-controls="theme-token-panel"
                aria-selected={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setActiveTab(tab)}
                onKeyDown={(event) => {
                  if (
                    !["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                      event.key,
                    )
                  ) {
                    return;
                  }
                  event.preventDefault();
                  const currentIndex = THEME_TABS.indexOf(tab);
                  const nextIndex =
                    event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? THEME_TABS.length - 1
                        : (currentIndex +
                            (event.key === "ArrowRight" ? 1 : -1) +
                            THEME_TABS.length) %
                          THEME_TABS.length;
                  const nextTab = THEME_TABS[nextIndex];
                  setActiveTab(nextTab);
                  document.getElementById(`theme-tab-${nextTab}`)?.focus();
                }}
                className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium capitalize focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  isSelected
                    ? "border-primary bg-subtle text-strong"
                    : "border-transparent text-muted"
                }`}
              >
                {tab}
                {selected ? (
                  <span className="ml-1.5 text-xs text-muted">({count})</span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div
          id="theme-token-panel"
          role="tabpanel"
          aria-labelledby={`theme-tab-${activeTab}`}
          className="min-h-[31.25rem] p-4 sm:p-6"
        >
          <div className="admin-alert admin-alert--info mb-6 flex gap-3">
            <AlertCircle size={20} className="shrink-0" aria-hidden />
            <p className="m-0 text-sm">
              <strong>Planner tokens only.</strong> These dictionaries drive
              2D/3D materials in the planner — not the admin shell or public
              marketing theme.
            </p>
          </div>

          {loadError ? (
            <div className="admin-empty min-h-64" role="status">
              <h3 className="admin-empty__title">Themes unavailable</h3>
              <p className="admin-empty__copy">
                Fix the load error on the left, then retry.
              </p>
              <div className="admin-empty__actions">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => void loadThemes()}
                  disabled={loading}
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : !selected ? (
            <div className="admin-empty min-h-64" role="status">
              <h3 className="admin-empty__title">No theme selected</h3>
              <p className="admin-empty__copy">
                Select a theme pack on the left, or publish the premium-light
                starter pack to seed woods / metals / fabrics / lighting.
              </p>
              <div className="admin-empty__actions">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => void handlePublish(null)}
                  disabled={isPublishing}
                >
                  <UploadCloud size={16} aria-hidden />
                  {isPublishing ? "Publishing…" : "Publish starter pack"}
                </Button>
              </div>
            </div>
          ) : visibleTokens.length === 0 ? (
            <div className="admin-empty min-h-64" role="status">
              <h3 className="admin-empty__title">
                No {activeTab} tokens in this pack
              </h3>
              <p className="admin-empty__copy">
                This pack has no keys under the {activeTab} category. Try
                another tab or publish a starter pack with full material maps.
              </p>
              <div className="admin-empty__actions">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => void handlePublish(selected)}
                  disabled={isPublishing}
                >
                  <UploadCloud size={16} aria-hidden />
                  {isPublishing ? "Publishing…" : "Publish this pack"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table min-w-[28rem]">
                <caption className="sr-only">
                  {activeTab} tokens for {selected.name}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Token</th>
                    <th scope="col">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTokens.map((row) => (
                    <tr key={row.key}>
                      <td>
                        <code className="text-sm text-strong">--{row.key}</code>
                      </td>
                      <td className="admin-table__secondary">
                        <code className="break-all text-sm">{row.value}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
