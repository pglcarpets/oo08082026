/**
 * Name-mirror coverage for lib/z-index.
 */
import { describe, expect, it } from "vitest";
import { Z } from "@/lib/z-index";

describe("Z stacking map", () => {
  it("exports ascending layers from canvas to tooltip", () => {
    expect(Z.canvas).toBe(0);
    expect(Z.canvasOverlay).toBe(10);
    expect(Z.toolbar).toBe(50);
    expect(Z.sidebar).toBe(60);
    expect(Z.panel).toBe(70);
    expect(Z.modal).toBe(80);
    expect(Z.toast).toBe(90);
    expect(Z.tooltip).toBe(100);
  });

  it("keeps layers strictly ordered so overlays never invert", () => {
    const ordered = [
      Z.canvas,
      Z.canvasOverlay,
      Z.toolbar,
      Z.sidebar,
      Z.panel,
      Z.modal,
      Z.toast,
      Z.tooltip,
    ];
    for (let i = 1; i < ordered.length; i += 1) {
      expect(ordered[i]).toBeGreaterThan(ordered[i - 1]);
    }
  });
});
