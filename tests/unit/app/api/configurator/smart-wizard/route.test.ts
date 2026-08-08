import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/configurator/smart-wizard/route";
import { rateLimit } from "@/lib/rateLimit";
import { resolveAdvisorModelChain, requestAdvisorMessages } from "@/lib/ai/mastra";
import {
  buildFallbackWizardPlan,
  getWizardCatalog,
  parseWizardPlan,
} from "@/lib/configurator/smartWizard";

vi.mock("@/lib/rateLimit", () => ({
  rateLimit: vi.fn(),
}));

vi.mock("@/lib/security/csrf", () => ({
  validateCsrfRequest: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/platform/supabase/server", () => ({
  createAuthServerClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({
            data: {
              user: {
                id: "user-1",
                email: "test@example.com",
                app_metadata: { role: "member" },
              },
            },
            error: null,
          }),
        ),
      },
    }),
  ),
}));

vi.mock("@/lib/ai/mastra", () => ({
  resolveAdvisorModelChain: vi.fn(),
  requestAdvisorMessages: vi.fn(),
}));

vi.mock("@/lib/configurator/smartWizard", () => ({
  buildFallbackWizardPlan: vi.fn(() => ({
    summary: "Fallback layout",
    warnings: [],
    placements: [],
  })),
  buildWizardSystemPrompt: vi.fn(() => "system"),
  clampPlacementToBounds: vi.fn((placement) => placement),
  computeWizardPalette: vi.fn(() => []),
  findWizardCatalogItem: vi.fn(() => ({ id: "desk-1", width: 10, height: 10 })),
  getWizardCatalog: vi.fn(() => [{ id: "desk-1", width: 10, height: 10 }]),
  parseWizardPlan: vi.fn(),
  roomMmToCanvasUnits: vi.fn((mm: number) => mm / 100),
}));

describe("app/api/configurator/smart-wizard/route.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 12,
      remaining: 11,
      reset: 1,
    });
    vi.mocked(resolveAdvisorModelChain).mockReturnValue([]);
  });

  const createReq = (body: unknown) =>
    new NextRequest("http://localhost/api/configurator/smart-wizard", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

  it("returns 429 when rate limited", async () => {
    vi.mocked(rateLimit).mockResolvedValue({
      success: false,
      limit: 12,
      remaining: 0,
      reset: 30,
    });
    const res = await POST(createReq({}), {});
    expect(res.status).toBe(429);
  });

  it("returns 400 for invalid wizard request", async () => {
    const res = await POST(createReq({ templateId: "blank" }), {});
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid wizard request");
  });

  it("returns fallback plan when no providers are configured", async () => {
    const res = await POST(
      createReq({
        templateId: "blank",
        roomType: "open-plan",
        roomWidthMm: 12000,
        roomLengthMm: 8000,
        style: "Modern",
      }),
      {},
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.summary).toBe("Fallback layout");
    expect(buildFallbackWizardPlan).toHaveBeenCalled();
    expect(getWizardCatalog).toHaveBeenCalled();
    expect(parseWizardPlan).not.toHaveBeenCalled();
    expect(requestAdvisorMessages).not.toHaveBeenCalled();
  });

  it("returns sanitized AI plan when provider and parser succeed", async () => {
    vi.mocked(resolveAdvisorModelChain).mockReturnValue([
      { provider: "openrouter", label: "openrouter", id: "openrouter/auto" } as never,
    ]);
    vi.mocked(requestAdvisorMessages).mockResolvedValue('{"summary":"AI layout","warnings":[],"placements":[]}');
    vi.mocked(parseWizardPlan).mockReturnValue({
      summary: "AI layout",
      warnings: [],
      placements: [{ productId: "desk-1", x: 1, y: 2, rotation: 0 }],
    });

    const res = await POST(
      createReq({
        templateId: "blank",
        roomType: "open-plan",
        roomWidthMm: 12000,
        roomLengthMm: 8000,
        style: "Modern",
      }),
      {},
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.summary).toBe("AI layout");
    expect(requestAdvisorMessages).toHaveBeenCalled();
    expect(parseWizardPlan).toHaveBeenCalled();
    expect(buildFallbackWizardPlan).not.toHaveBeenCalled();
    expect(body.placements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ productId: "desk-1" }),
      ]),
    );
  });
});
