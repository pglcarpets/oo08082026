import type { DockPanelDef, DockviewApiLike } from "@studio/lib/studioTypes";

/**
 * Ensure a dock panel exists (re-add after tab × close) and activate it.
 * Returns true when the panel is present after the call.
 */
export function ensureAndActivateDockPanel(
  api: DockviewApiLike | null | undefined,
  panels: DockPanelDef[],
  panelId: string,
): boolean {
  if (!api) return false;
  const def = panels.find((p) => p.id === panelId);
  if (!def) return false;

  let panel = api.getPanel(panelId);
  if (!panel) {
    const referencePanel = panels
      .map((p) => p.id)
      .find((id) => id !== panelId && !!api.getPanel(id));

    const opts: {
      id: string;
      component: string;
      title: string;
      position?: { direction: string; referencePanel: string };
    } = { id: panelId, component: panelId, title: def.title };

    if (referencePanel) {
      if (def.position?.direction) {
        opts.position = {
          direction: def.position.direction,
          referencePanel: def.position.referencePanel || referencePanel,
        };
      } else {
        // First panel in the list was closed — put it back above the remaining one.
        opts.position = { direction: "above", referencePanel };
      }
    }

    try {
      api.addPanel(opts);
    } catch {
      /* already exists / race */
    }
    panel = api.getPanel(panelId);
  }

  panel?.api?.setActive?.();
  return !!api.getPanel(panelId);
}
