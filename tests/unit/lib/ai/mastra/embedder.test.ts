import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/env.server", () => ({
  env: {
    GEMINI_API_KEY: "test-gemini",
    OPENROUTER_API_KEY_PRIMARY: undefined,
    OPENROUTER_API_KEY_BACKUP: undefined,
  },
}));

describe("mastra embedder", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("prefers Gemini when GEMINI_API_KEY is set", async () => {
    const { resolveEmbedderModel } = await import("@/lib/ai/mastra/embedder");
    expect(resolveEmbedderModel()).toBe("google/gemini-embedding-001");
  });
});
