import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/** Live chrome stylesheet for forked OO Planner shell. */
const PLANNER_CHROME_CSS = path.join(
  process.cwd(),
  "focss",
  "planner",
  "chrome.css",
);

describe("ooplanner-root viewport lock (planner/chrome.css)", () => {
  const css = fs.readFileSync(PLANNER_CHROME_CSS, "utf8");

  it("locks .ooplanner-root .app-root to viewport height without overflow", () => {
    expect(css).toMatch(
      /\.ooplanner-root\s+\.app-root\s*\{[^}]*height:\s*100vh/,
    );
    expect(css).toMatch(
      /\.ooplanner-root\s+\.app-root\s*\{[^}]*overflow:\s*hidden/,
    );
  });

  it("does not require body.planner-workspace.planner-root (legacy host)", () => {
    expect(css).not.toMatch(/body\.planner-workspace\.planner-root\s*\{/);
  });
});
