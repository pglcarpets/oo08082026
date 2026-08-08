import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { GET as getActive } from "@/app/api/theme/active/route";
import { GET as getManage, POST as postManage } from "@/app/api/theme/manage/route";
import { enforcePublicApiRateLimit } from "@/app/api/_lib/public";
import { enforceAdminRateLimit, requireAdminSession } from "@/app/api/admin/_lib/server";
import { validateCsrfRequest } from "@/lib/security/csrf";
import { getDefaultPreset, getPresetById, type ThemePreset } from "@/lib/theme/presets";

type ThemeGlobal = typeof globalThis & { __oandoActiveThemeId?: string };

const LIGHT: ThemePreset = {
  id: "premium-light",
  name: "Premium Light",
  description: "Light theme",
  tokens: {
    "--bg": "var(--color-white-50)",
    "--block-seat": "catalog-only",
  },
};

const DARK: ThemePreset = {
  id: "premium-dark",
  name: "Premium Dark",
  description: "Dark theme",
  tokens: {
    "--bg": "var(--color-black)",
    "--fg": "var(--color-white-50)",
  },
};

vi.mock("@/lib/theme/presets", () => ({
  THEME_PRESETS: [
    {
      id: "premium-light",
      name: "Premium Light",
      description: "Light theme",
      tokens: { "--bg": "var(--color-white-50)", "--block-seat": "catalog-only" },
    },
    {
      id: "premium-dark",
      name: "Premium Dark",
      description: "Dark theme",
      tokens: { "--bg": "var(--color-black)", "--fg": "var(--color-white-50)" },
    },
  ],
  getPresetById: vi.fn(),
  getDefaultPreset: vi.fn(() => ({
    id: "default-preset",
    name: "Default",
    description: "Fallback",
    tokens: { "--bg": "var(--color-white-50)", "--block-seat": "catalog-only" },
  })),
}));

vi.mock("@/app/api/admin/_lib/server", () => ({
  enforceAdminRateLimit: vi.fn(),
  requireAdminSession: vi.fn(),
}));

vi.mock("@/lib/security/csrf", () => ({
  validateCsrfRequest: vi.fn(),
}));

vi.mock("@/app/api/_lib/public", () => ({
  enforcePublicApiRateLimit: vi.fn(),
}));

function manageReq(method: string, body?: { presetId?: string }) {
  return new NextRequest("http://localhost/api/theme/manage", {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function allowAdmin() {
  vi.mocked(enforceAdminRateLimit).mockResolvedValue(null);
  vi.mocked(requireAdminSession).mockResolvedValue(null);
}

describe("theme API routes", () => {
  const themeGlobal = globalThis as ThemeGlobal;

  beforeEach(() => {
    vi.clearAllMocks();
    delete themeGlobal.__oandoActiveThemeId;
    vi.mocked(enforcePublicApiRateLimit).mockResolvedValue(null);
    vi.mocked(validateCsrfRequest).mockResolvedValue(true);
    vi.mocked(getPresetById).mockImplementation((id) =>
      id === LIGHT.id ? LIGHT : id === DARK.id ? DARK : undefined,
    );
  });

  describe("GET /api/theme/active", () => {
    it("returns 429 when the public rate limit is exceeded", async () => {
      vi.mocked(enforcePublicApiRateLimit).mockResolvedValue(
        NextResponse.json({ error: "Too many requests" }, { status: 429 }),
      );

      const res = await getActive(new Request("http://localhost/api/theme/active"));
      expect(res.status).toBe(429);
      await expect(res.json()).resolves.toEqual({ error: "Too many requests" });
    });

    it("returns the active preset with catalog tokens stripped", async () => {
      const res = await getActive(new Request("http://localhost/api/theme/active"));
      expect(res.status).toBe(200);
      const data = await res.json() as {
        name: string;
        payload_jsonb: Record<string, string>;
        is_active: boolean;
      };
      expect(data.name).toBe("premium-light");
      expect(data.is_active).toBe(true);
      expect(data.payload_jsonb).toEqual({ "--bg": "var(--color-white-50)" });
      expect(data.payload_jsonb["--block-seat"]).toBeUndefined();
    });

    it("falls back to the default preset when the active id is unknown", async () => {
      vi.mocked(getPresetById).mockReturnValue(undefined);

      const res = await getActive(new Request("http://localhost/api/theme/active"));
      expect(res.status).toBe(200);
      const data = await res.json() as {
        name: string;
        payload_jsonb: Record<string, string>;
      };
      expect(data.name).toBe("default-preset");
      expect(data.payload_jsonb).toEqual({ "--bg": "var(--color-white-50)" });
      expect(getDefaultPreset).toHaveBeenCalled();
    });
  });

  describe("/api/theme/manage", () => {
    it("GET returns 429 / 401 before listing presets", async () => {
      vi.mocked(enforceAdminRateLimit).mockResolvedValue(
        NextResponse.json({ error: "Too many requests" }, { status: 429 }),
      );
      expect((await getManage(manageReq("GET"))).status).toBe(429);

      await allowAdmin();
      vi.mocked(requireAdminSession).mockResolvedValue(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      );
      expect((await getManage(manageReq("GET"))).status).toBe(401);
    });

    it("GET lists presets with active flags", async () => {
      await allowAdmin();

      const res = await getManage(manageReq("GET"));
      expect(res.status).toBe(200);
      const data = await res.json() as {
        activeThemeId: string;
        presets: Array<{ id: string; isActive: boolean; tokenCount: number }>;
      };
      expect(data.activeThemeId).toBe("premium-light");
      expect(data.presets).toHaveLength(2);
      expect(data.presets[0]).toMatchObject({
        id: "premium-light",
        tokenCount: 2,
        isActive: true,
      });
      expect(data.presets[1]?.isActive).toBe(false);
    });

    it("POST rejects CSRF failures and missing / unknown preset ids", async () => {
      await allowAdmin();
      vi.mocked(validateCsrfRequest).mockResolvedValue(false);

      const csrfRes = await postManage(manageReq("POST", { presetId: "premium-dark" }));
      expect(csrfRes.status).toBe(403);
      expect(csrfRes.headers.get("x-csrf-rejected")).toBe("1");
      const csrfBody = await csrfRes.json() as {
        success: boolean;
        error: { code: string };
      };
      expect(csrfBody.success).toBe(false);
      expect(csrfBody.error.code).toBe("CSRF_FAILED");

      vi.mocked(validateCsrfRequest).mockResolvedValue(true);
      const missing = await postManage(manageReq("POST", {}));
      expect(missing.status).toBe(400);
      await expect(missing.json()).resolves.toEqual({
        error: "Missing required field: presetId",
      });

      const unknown = await postManage(manageReq("POST", { presetId: "nope" }));
      expect(unknown.status).toBe(404);
      const unknownBody = await unknown.json() as { error: string };
      expect(unknownBody.error).toBe("Unknown preset: nope");
    });

    it("POST activates a preset and public GET reflects the change", async () => {
      await allowAdmin();

      const activate = await postManage(manageReq("POST", { presetId: "premium-dark" }));
      expect(activate.status).toBe(200);
      const activated = await activate.json() as {
        success: boolean;
        activated: { id: string };
      };
      expect(activated.success).toBe(true);
      expect(activated.activated.id).toBe("premium-dark");

      const manageList = await getManage(manageReq("GET"));
      const manageData = await manageList.json() as { activeThemeId: string };
      expect(manageData.activeThemeId).toBe("premium-dark");

      const publicRes = await getActive(new Request("http://localhost/api/theme/active"));
      expect(publicRes.status).toBe(200);
      const publicData = await publicRes.json() as {
        name: string;
        payload_jsonb: Record<string, string>;
      };
      expect(publicData.name).toBe("premium-dark");
      expect(publicData.payload_jsonb).toEqual({
        "--bg": "var(--color-black)",
        "--fg": "var(--color-white-50)",
      });
    });

    it("POST returns 400 for malformed JSON", async () => {
      await allowAdmin();
      const res = await postManage(
        new NextRequest("http://localhost/api/theme/manage", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{not-json",
        }),
      );
      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toEqual({ error: "Invalid request body" });
    });
  });
});
