import { describe, it, expect } from "vitest";
import { CLIENT_LOGO_SRC_BY_NAME, resolveClientLogoSrc } from "@/features/site/data/clientLogos";

describe("clientLogos", () => {
  it("should have correct logo mapping", () => {
    expect(CLIENT_LOGO_SRC_BY_NAME["Ambuja Neotia"]).toBe("/assets/marketing/client-logos/AmbujaNeotia.png");
    expect(CLIENT_LOGO_SRC_BY_NAME["Titan"]).toBe("/assets/marketing/client-logos/Titan.png");
  });

  describe("resolveClientLogoSrc", () => {
    it("should return explicitSrc if provided", () => {
      expect(resolveClientLogoSrc("Ambuja Neotia", "/custom-path.png")).toBe("/custom-path.png");
    });

    it("should return mapped logo if name exists in lookup table", () => {
      expect(resolveClientLogoSrc("Titan")).toBe("/assets/marketing/client-logos/Titan.png");
    });

    it("should return undefined if name does not exist and no explicitSrc is provided", () => {
      expect(resolveClientLogoSrc("Nonexistent Client")).toBeUndefined();
    });
  });
});
