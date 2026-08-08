/**
 * Name-mirror: features/shared/dashboard/workspaceHub
 */

import { describe, expect, it } from "vitest";
import {
  WORKSPACE_HUB_SECTIONS,
  type WorkspaceHubSection,
} from "@/features/shared/dashboard/workspaceHub";

describe("WORKSPACE_HUB_SECTIONS", () => {
  it("exposes at least one section with member workspace links", () => {
    expect(WORKSPACE_HUB_SECTIONS.length).toBeGreaterThan(0);
    const section: WorkspaceHubSection = WORKSPACE_HUB_SECTIONS[0]!;
    expect(section.title.length).toBeGreaterThan(0);
    expect(section.summary.length).toBeGreaterThan(0);
    expect(section.items.length).toBeGreaterThan(0);
  });

  it("keeps member hub free of /admin routes", () => {
    for (const section of WORKSPACE_HUB_SECTIONS) {
      for (const item of section.items) {
        expect(item.href.startsWith("/admin")).toBe(false);
        expect(item.label.length).toBeGreaterThan(0);
        expect(item.description.length).toBeGreaterThan(0);
        // Phosphor icons are forwardRef components (object or function).
        expect(item.icon).toBeDefined();
        expect(["function", "object"]).toContain(typeof item.icon);
      }
    }
  });

  it("includes planner home, canvas, and portal destinations", () => {
    const hrefs = WORKSPACE_HUB_SECTIONS.flatMap((s) =>
      s.items.map((i) => i.href),
    );
    expect(hrefs).toEqual(
      expect.arrayContaining(["/planner", "/ooplanner", "/portal"]),
    );
  });

  it("uses unique hrefs across the hub", () => {
    const hrefs = WORKSPACE_HUB_SECTIONS.flatMap((s) =>
      s.items.map((i) => i.href),
    );
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
