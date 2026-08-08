"use client";
import React, { useMemo, useRef, useEffect } from "react";
import { DockviewReact, themeAbyss, themeLight } from "dockview-react";
import "dockview-react/dist/styles/dockview.css";
import "@focss/planner/dock.css";
import type { DockPanelDef, DockviewApiLike } from "@planner/lib/plannerTypes";
import { DockFloatHeaderActions } from "@planner/components/ui/PlannerDockFloatHeaderActions";

type DockviewReactProps = React.ComponentProps<typeof DockviewReact>;

type DockShellProps = {
  panels: DockPanelDef[];
  onReadyApi?: (api: DockviewApiLike) => void;
  theme?: "light" | "dark";
  storageKey?: string;
};

type SavedLayout = {
  layout: unknown;
  panels: string[];
};

const RETIRED_PANEL_IDS = ["three"];

function allowedPanelIds(panels: DockPanelDef[]): Set<string> {
  return new Set(panels.map((p) => p.id));
}

function savedLayoutMatchesPanels(saved: SavedLayout | null, allowed: Set<string>): boolean {
  if (!saved?.panels?.length) return false;
  if (saved.panels.length !== allowed.size) return false;
  return saved.panels.every((id) => allowed.has(id));
}

function pruneRetiredPanels(api: DockviewApiLike, allowed: Set<string>) {
  for (const id of RETIRED_PANEL_IDS) {
    if (!allowed.has(id)) {
      api.getPanel(id)?.api?.close();
    }
  }
  for (const panel of api.panels ?? []) {
    const id = (panel as { id?: string }).id;
    if (id && !allowed.has(id)) {
      api.getPanel(id)?.api?.close();
    }
  }
}

export const DockShell = ({ panels, onReadyApi, theme = "light", storageKey }: DockShellProps) => {
  const componentsRef = useRef<Record<string, DockPanelDef["render"]>>({});
  const apiRef = useRef<DockviewApiLike | null>(null);
  const previousIdsRef = useRef<string[]>([]);

  const components = useMemo(() => {
    const map: Record<string, DockPanelDef["render"]> = {};
    for (const p of panels) map[p.id] = p.render;
    componentsRef.current = map;
    return map;
  }, [panels]);

  const addDefaults = (api: DockviewApiLike) => {
    let lastId: string | null = null;
    panels.forEach((p) => {
      if (api.getPanel(p.id)) {
        lastId = p.id;
        return;
      }
      const opts: {
        id: string;
        component: string;
        title: string;
        position?: { direction: string; referencePanel: string };
      } = { id: p.id, component: p.id, title: p.title };
      if (lastId && p.position) {
        opts.position = { direction: p.position.direction, referencePanel: p.position.referencePanel || lastId };
      } else if (lastId) {
        opts.position = { direction: "below", referencePanel: lastId };
      }
      try {
        api.addPanel(opts);
      } catch {
        /* already exists */
      }
      lastId = p.id;
    });
  };

  const handleReady = (event: { api: DockviewApiLike }) => {
    apiRef.current = event.api;
    const allowed = allowedPanelIds(panels);
    if (event.api.panels && event.api.panels.length > 0) {
      pruneRetiredPanels(event.api, allowed);
      onReadyApi?.(event.api);
      return;
    }
    let saved: SavedLayout | null = null;
    if (storageKey) {
      try {
        saved = JSON.parse(localStorage.getItem(storageKey) || "null") as SavedLayout | null;
      } catch {
        /* noop */
      }
    }
    if (savedLayoutMatchesPanels(saved, allowed)) {
      const restored = saved as SavedLayout;
      try {
        event.api.fromJSON(restored.layout);
        addDefaults(event.api);
      } catch {
        if (storageKey) {
          try {
            localStorage.removeItem(storageKey);
          } catch {
            /* noop */
          }
        }
        addDefaults(event.api);
      }
    } else {
      if (storageKey) {
        try {
          localStorage.removeItem(storageKey);
        } catch {
          /* noop */
        }
      }
      addDefaults(event.api);
    }
    pruneRetiredPanels(event.api, allowed);
    if (storageKey) {
      event.api.onDidLayoutChange(() => {
        try {
          const layout = event.api.toJSON();
          const panelIds = panels.map((p) => p.id);
          localStorage.setItem(storageKey, JSON.stringify({ layout, panels: panelIds }));
        } catch {
          /* noop */
        }
      });
    }
    onReadyApi?.(event.api);
  };

  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    const currentIds = panels.map((p) => p.id);
    const prev = previousIdsRef.current;
    const removed = prev.filter((id) => !currentIds.includes(id));
    const added = currentIds.filter((id) => !prev.includes(id) && !api.getPanel(id));
    removed.forEach((id) => {
      const pn = api.getPanel(id);
      pn?.api?.close();
    });
    pruneRetiredPanels(api, allowedPanelIds(panels));
    if (added.length) {
      let ref = currentIds.find((id) => api.getPanel(id));
      added.forEach((id) => {
        if (api.getPanel(id)) {
          ref = id;
          return;
        }
        const p = panels.find((x) => x.id === id);
        if (!p) return;
        const opts: {
          id: string;
          component: string;
          title: string;
          position?: { direction: string; referencePanel: string };
        } = { id, component: id, title: p.title };
        if (ref) opts.position = { direction: "below", referencePanel: ref };
        try {
          api.addPanel(opts);
        } catch {
          /* ignore */
        }
        ref = id;
      });
    }
    previousIdsRef.current = currentIds;
  }, [panels]);

  // dockview 7 defaults to themeAbyss (dark) when `theme` is omitted
  const dockTheme = theme === "dark" ? themeAbyss : themeLight;
  const themeClass = dockTheme.className;

  return (
    <div className={`dock-shell ${themeClass} ff-workspace-dock`} data-testid="dock-shell">
      <DockviewReact
        components={components as DockviewReactProps["components"]}
        onReady={handleReady as DockviewReactProps["onReady"]}
        theme={dockTheme}
        disableFloatingGroups={false}
        floatingGroupBounds={{
          minimumWidthWithinViewport: 48,
          minimumHeightWithinViewport: 48,
        }}
        singleTabMode="fullwidth"
        rightHeaderActionsComponent={DockFloatHeaderActions}
      />
    </div>
  );
};

export default DockShell;
