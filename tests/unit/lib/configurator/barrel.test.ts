import { describe, expect, it } from "vitest";
import * as smartWizard from "@/lib/configurator/smartWizard";

describe("smartWizard barrel exports", () => {
  it("re-exports planner helpers from the implementation module", () => {
    expect(typeof smartWizard.roomMmToCanvasUnits).toBe("function");
    expect(typeof smartWizard.parseWizardPlan).toBe("function");
    expect(typeof smartWizard.buildFallbackWizardPlan).toBe("function");
    expect(typeof smartWizard.buildWizardSystemPrompt).toBe("function");
    expect(typeof smartWizard.clampPlacementToBounds).toBe("function");
    expect(typeof smartWizard.computeWizardPalette).toBe("function");
    expect(typeof smartWizard.findWizardCatalogItem).toBe("function");
    expect(typeof smartWizard.getWizardCatalog).toBe("function");
    expect(smartWizard.roomMmToCanvasUnits(1000)).toBe(100);
  });
});