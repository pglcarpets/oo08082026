import { describe, expect, it, vi } from "vitest";
import { ensureAndActivateDockPanel } from "@studio/lib/studioEnsureDockPanel";
import type { DockPanelDef, DockviewApiLike } from "@studio/lib/studioTypes";

const panels: DockPanelDef[] = [
  { id: "color", title: "Color", render: (() => null) as DockPanelDef["render"] },
  {
    id: "layers",
    title: "Layers",
    render: (() => null) as DockPanelDef["render"],
    position: { direction: "below" },
  },
];

function makeApi(openIds: string[]) {
  const map = new Map(
    openIds.map((id) => [
      id,
      { api: { setActive: vi.fn(), close: vi.fn() } },
    ]),
  );
  const api: DockviewApiLike = {
    getPanel: (id) => map.get(id),
    addPanel: vi.fn((opts: { id: string }) => {
      map.set(opts.id, { api: { setActive: vi.fn(), close: vi.fn() } });
    }),
    fromJSON: vi.fn(),
    toJSON: vi.fn(),
    onDidLayoutChange: vi.fn(),
  };
  return { api, map };
}

describe("ensureAndActivateDockPanel", () => {
  it("activates an already-open panel without re-adding", () => {
    const { api, map } = makeApi(["color", "layers"]);
    expect(ensureAndActivateDockPanel(api, panels, "layers")).toBe(true);
    expect(api.addPanel).not.toHaveBeenCalled();
    expect(map.get("layers")?.api?.setActive).toHaveBeenCalled();
  });

  it("re-adds a closed panel above the remaining sibling, then activates", () => {
    const { api } = makeApi(["layers"]);
    expect(ensureAndActivateDockPanel(api, panels, "color")).toBe(true);
    expect(api.addPanel).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "color",
        title: "Color",
        position: { direction: "above", referencePanel: "layers" },
      }),
    );
    expect(api.getPanel("color")?.api?.setActive).toHaveBeenCalled();
  });

  it("re-adds layers below color using its configured position", () => {
    const { api } = makeApi(["color"]);
    expect(ensureAndActivateDockPanel(api, panels, "layers")).toBe(true);
    expect(api.addPanel).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "layers",
        position: { direction: "below", referencePanel: "color" },
      }),
    );
  });

  it("returns false when api is missing", () => {
    expect(ensureAndActivateDockPanel(null, panels, "color")).toBe(false);
  });
});
