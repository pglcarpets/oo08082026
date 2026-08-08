import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import AdminLayout, { metadata } from "@/app/admin/layout";
import { requireAuthUser } from "@/lib/auth/session";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/admin",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ get: vi.fn() })),
  headers: vi.fn(() => new Headers()),
}));

vi.mock("next/font/google", () => ({
  Inter: () => ({ className: "inter" }),
}));

vi.mock("@/features/admin/ui/AdminLayoutShell", () => ({
  default: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="admin-layout-shell">{children}</div>
  ),
}));

vi.mock("@/lib/auth/session", () => ({
  requireAuthUser: vi.fn(),
}));

describe("app/admin/layout.tsx", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuthUser).mockResolvedValue({
      id: "admin-1",
      email: "admin@example.com",
      name: "Admin",
      role: "owner",
    });
  });

  it("exports noindex robots metadata", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("gates the admin tree with requireAuthUser('/admin', 'admin')", async () => {
    await AdminLayout({ children: <div>child</div> });
    expect(requireAuthUser).toHaveBeenCalledWith("/admin", "admin");
  });

  it("renders shell after auth resolves without ShadcnChrome", async () => {
    const resolved = await AdminLayout({
      children: <div data-testid="admin-child">ok</div>,
    });
    const html = renderToStaticMarkup(resolved);
    expect(html).toContain("admin-layout-shell");
    expect(html).toContain("admin-child");
    expect(html).toContain('id="main-content"');
    // Phase 13b: FOCSS shell only — no tooltip/sonner chrome host
    expect(html).not.toMatch(/sonner|tooltip-provider|ShadcnChrome/i);
  });

  it("fails closed when requireAuthUser rejects (unauth / non-admin path)", async () => {
    vi.mocked(requireAuthUser).mockRejectedValueOnce(
      new Error("Authentication required"),
    );

    await expect(
      AdminLayout({ children: <div data-testid="leaked">secret</div> }),
    ).rejects.toThrow("Authentication required");
  });
});
