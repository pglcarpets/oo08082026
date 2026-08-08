// @vitest-environment node
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

import {
  baseUrl,
  siteRootFrom,
  timeoutMs,
  workspaceRootFrom,
} from "../../../../scripts/lib/scriptEnv.mjs";

describe("scriptEnv (name-mirror)", () => {
  const keys = [
    "BASE_URL",
    "PLAYWRIGHT_BASE_URL",
    "PROBE_BASE_URL",
    "LAUNCH_SMOKE_BASE_URL",
    "SCRIPT_TIMEOUT_MS",
  ] as const;
  const snapshot = Object.fromEntries(keys.map((k) => [k, process.env[k]]));

  afterEach(() => {
    for (const k of keys) {
      const v = snapshot[k];
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  it("siteRootFrom / workspaceRootFrom peel one and two parents from a scripts/*.mjs url", () => {
    // Contract: callers pass import.meta.url from a file under site/scripts/.
    // Use a synthetic basename — path math only; no real tool required on disk.
    const scriptsDir = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../../../../site/scripts",
    );
    const fakeCallerUrl = pathToFileUrl(path.join(scriptsDir, "caller.mjs"));
    const site = siteRootFrom(fakeCallerUrl);
    const workspace = workspaceRootFrom(fakeCallerUrl);
    expect(path.basename(site)).toBe("site");
    expect(path.normalize(workspace)).toBe(path.normalize(path.resolve(site, "..")));
    expect(path.basename(workspace)).not.toBe("site");
  });

  it("baseUrl prefers BASE_URL and strips trailing slashes", () => {
    delete process.env.PLAYWRIGHT_BASE_URL;
    delete process.env.PROBE_BASE_URL;
    delete process.env.LAUNCH_SMOKE_BASE_URL;
    process.env.BASE_URL = "http://example.test:4000///";
    expect(baseUrl()).toBe("http://example.test:4000");
  });

  it("baseUrl falls back when no env is set", () => {
    for (const k of keys) {
      if (k !== "SCRIPT_TIMEOUT_MS") delete process.env[k];
    }
    expect(baseUrl("http://localhost:9999/")).toBe("http://localhost:9999");
  });

  it("timeoutMs uses SCRIPT_TIMEOUT_MS when positive finite", () => {
    process.env.SCRIPT_TIMEOUT_MS = "45000";
    expect(timeoutMs()).toBe(45_000);
    process.env.SCRIPT_TIMEOUT_MS = "nope";
    expect(timeoutMs(12_000)).toBe(12_000);
  });
});

function pathToFileUrl(absPath: string): string {
  const normalized = absPath.replace(/\\/g, "/");
  if (/^[A-Za-z]:/.test(normalized)) {
    return `file:///${normalized}`;
  }
  return `file://${normalized.startsWith("/") ? "" : "/"}${normalized}`;
}
