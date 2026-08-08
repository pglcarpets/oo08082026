/**
 * Name-mirror coverage for lib/i18n/htmlLang.
 */
import { describe, expect, it } from "vitest";
import { getHtmlLang } from "@/lib/i18n/htmlLang";

describe("getHtmlLang", () => {
  it("maps product locales to BCP 47 regional tags", () => {
    expect(getHtmlLang("en")).toBe("en-IN");
    expect(getHtmlLang("hi")).toBe("hi-IN");
    expect(getHtmlLang("fr")).toBe("fr-IN");
    expect(getHtmlLang("de")).toBe("de-IN");
    expect(getHtmlLang("es")).toBe("es-IN");
  });

  it("defaults to en-IN for unknown or missing locale", () => {
    expect(getHtmlLang()).toBe("en-IN");
    expect(getHtmlLang("zz")).toBe("en-IN");
    expect(getHtmlLang("en-US")).toBe("en-IN");
  });
});
