// @vitest-environment node
/**
 * Name-mirror: config/build/playwright.config.ts
 * Asserts exported Playwright config shape without launching browsers.
 */
import { describe, expect, it } from "vitest";
import path from "node:path";
import playwrightConfig from "../../../../config/build/playwright.config";

function reporterEntry(
  reporters: unknown,
  name: string,
): unknown {
  if (!Array.isArray(reporters)) return undefined;
  for (const entry of reporters) {
    if (Array.isArray(entry) && entry[0] === name) return entry;
    if (entry === name) return entry;
  }
  return undefined;
}

describe("config/build/playwright.config.ts", () => {
  it("exports a defined Playwright config object", () => {
    expect(playwrightConfig).toBeDefined();
    expect(typeof playwrightConfig).toBe("object");
  });

  it("points testDir and matchers at e2e specs under tests/", () => {
    expect(playwrightConfig.testDir).toBeDefined();
    expect(String(playwrightConfig.testDir)).toContain("tests");

    const match = playwrightConfig.testMatch;
    expect(match).toBeDefined();
    const matchList = Array.isArray(match) ? match : [match];
    expect(
      matchList.some(
        (pattern) =>
          typeof pattern === "string" &&
          (pattern.includes(".spec.ts") || pattern.includes("**/*")),
      ),
    ).toBe(true);

    const ignore = playwrightConfig.testIgnore;
    if (ignore !== undefined) {
      const ignoreList = Array.isArray(ignore) ? ignore : [ignore];
      expect(
        ignoreList.some(
          (pattern) => typeof pattern === "string" && pattern.includes(".test."),
        ),
      ).toBe(true);
    }
  });

  it("routes artifacts under results/ and uses list+html+json reporters", () => {
    expect(
      path.normalize(String(playwrightConfig.outputDir ?? "")),
    ).toContain(path.normalize("results/test-results"));

    expect(reporterEntry(playwrightConfig.reporter, "list")).toBeDefined();
    expect(reporterEntry(playwrightConfig.reporter, "html")).toBeDefined();
    expect(reporterEntry(playwrightConfig.reporter, "json")).toBeDefined();
  });

  it("configures chromium project and use.baseURL", () => {
    const projects = playwrightConfig.projects;
    expect(Array.isArray(projects)).toBe(true);
    expect(projects?.length).toBeGreaterThan(0);
    expect(projects?.some((p) => p.name === "chromium")).toBe(true);

    const baseURL = playwrightConfig.use?.baseURL;
    expect(typeof baseURL).toBe("string");
    expect(String(baseURL).length).toBeGreaterThan(0);
    expect(String(baseURL)).toMatch(/^https?:\/\//);
  });

  it("webServer is either undefined (user base URL) or a command/url object", () => {
    const webServer = playwrightConfig.webServer;
    if (webServer === undefined) {
      expect(webServer).toBeUndefined();
      return;
    }

    const servers = Array.isArray(webServer) ? webServer : [webServer];
    expect(servers.length).toBeGreaterThan(0);
    for (const server of servers) {
      expect(typeof server.command).toBe("string");
      expect(String(server.command).length).toBeGreaterThan(0);
      expect(typeof server.url).toBe("string");
      expect(String(server.url)).toMatch(/^https?:\/\//);
      expect(typeof server.timeout).toBe("number");
      expect(server.timeout).toBeGreaterThan(0);
    }
  });

  it("sets timeout and fullyParallel", () => {
    expect(typeof playwrightConfig.timeout).toBe("number");
    expect(playwrightConfig.timeout).toBeGreaterThan(0);
    expect(playwrightConfig.fullyParallel).toBe(true);
  });
});
