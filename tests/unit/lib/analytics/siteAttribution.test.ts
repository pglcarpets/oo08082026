import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { readSiteAttribution } from "@/lib/analytics/siteAttribution";

describe("siteAttribution", () => {
  beforeEach(() => {
    document.cookie = "oando_seo_source=linkedin; path=/";
    document.cookie = "oando_seo_medium=social; path=/";
    document.cookie = "oando_seo_campaign=launch; path=/";
    document.cookie = "oando_seo_landing=%2Fproducts; path=/";
  });

  afterEach(() => {
    for (const key of [
      "oando_seo_source",
      "oando_seo_medium",
      "oando_seo_campaign",
      "oando_seo_landing",
    ]) {
      document.cookie = `${key}=; Max-Age=0; path=/`;
    }
  });

  it("reads seo attribution cookies with defaults for missing values", () => {
    expect(readSiteAttribution()).toEqual({
      source: "linkedin",
      medium: "social",
      campaign: "launch",
      landing: "/products",
    });
  });

  it("falls back to direct/none when cookies are absent", () => {
    for (const key of [
      "oando_seo_source",
      "oando_seo_medium",
      "oando_seo_campaign",
      "oando_seo_landing",
    ]) {
      document.cookie = `${key}=; Max-Age=0; path=/`;
    }
    expect(readSiteAttribution()).toEqual({
      source: "direct",
      medium: "none",
      campaign: "",
      landing: "",
    });
  });
});