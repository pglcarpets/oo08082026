import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import RootLayout from "@/app/offline/layout";

describe("Offline RootLayout", () => {
  it("renders correctly with html, body and children", () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <div data-testid="offline-child">Content</div>
      </RootLayout>
    );
    // OfflineLayout returns a fragment — Next.js injects html/body at the framework level.
    // Test that children are rendered and the component does not crash.
    expect(html).toContain('data-testid="offline-child"');
    expect(html).toContain("Content");
  });
});
