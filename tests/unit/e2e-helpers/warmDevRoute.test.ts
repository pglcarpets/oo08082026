import { describe, expect, it } from "vitest";

import { isColdChunkError } from "../../e2e/helpers/warmDevRoute";

describe("isColdChunkError", () => {
  it("classifies cold-chunk vs unrelated errors (case-insensitive)", () => {
    expect(isColdChunkError("Error: Manifest file is empty")).toBe(true);
    expect(isColdChunkError("SyntaxError: Unexpected end of JSON input")).toBe(true);
    expect(isColdChunkError("SyntaxError: Invalid or unexpected token")).toBe(true);
    expect(isColdChunkError("manifest file is empty")).toBe(true);
    expect(isColdChunkError("ChunkLoadError: Loading chunk 42 failed")).toBe(true);
    expect(
      isColdChunkError(
        "TypeError: Failed to fetch dynamically imported module: http://localhost:3000/_next/static/chunks/app.js",
      ),
    ).toBe(true);
    expect(isColdChunkError("Cannot find module './missing-chunk.js'")).toBe(true);
    expect(isColdChunkError("TypeError: cannot read properties of undefined")).toBe(
      false,
    );
    expect(isColdChunkError("")).toBe(false);
  });
});
