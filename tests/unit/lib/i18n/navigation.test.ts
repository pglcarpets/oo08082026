import { describe, it, expect, vi } from "vitest";
import { routing } from "@/i18n/routing";

vi.mock("next-intl/navigation", () => {
  return {
    createNavigation: vi.fn((_r) => ({
      Link: "MockLink",
      redirect: vi.fn(),
      usePathname: vi.fn(),
      useRouter: vi.fn(),
    })),
  };
});

vi.mock("@/i18n/routing", () => ({
  routing: {
    locales: ["en", "hi"],
    defaultLocale: "en",
  },
}));

import { Link, redirect, usePathname, useRouter } from "@/lib/i18n/navigation";
import { createNavigation } from "next-intl/navigation";

describe("i18n navigation helper", () => {
  it("should create navigation using next-intl createNavigation and routing config", () => {
    expect(createNavigation).toHaveBeenCalledWith(routing);
    expect(Link).toBe("MockLink");
    expect(typeof redirect).toBe("function");
    expect(typeof usePathname).toBe("function");
    expect(typeof useRouter).toBe("function");
  });
});
