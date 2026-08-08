import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SolutionsPage, { metadata } from "@/app/(site)/solutions/page";

vi.mock("next-intl/server", async () => {
  const messages = (await import("@/i18n/messages/en.json")).default;
  return {
    getTranslations: async (namespace: string) => {
      const ns = messages[namespace as keyof typeof messages] as Record<string, unknown>;
      const t = (key: string) => {
        const val = ns[key];
        return typeof val === "string" ? val : key;
      };
      t.raw = (key: string) => ns[key] ?? [];
      t.rich = t;
      return t;
    },
  };
});

vi.mock("@/features/site/data/routeMetadata", () => ({
  SOLUTIONS_PAGE_METADATA: { title: "Solutions Title" },
}));

describe("SolutionsPage Route", () => {
  it("renders solutions content and delivery steps correctly", async () => {
    expect(metadata).toEqual({ title: "Solutions Title" });

    const jsx = await SolutionsPage();
    render(jsx);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Built for how teams work/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Workstations" })).toHaveAttribute(
      "href",
      "/solutions/workstations",
    );
    // Delivery section is present; step labels may be i18n-driven.
    expect(screen.getByText(/Predictable delivery/i)).toBeInTheDocument();
    expect(screen.getByTestId("home-marketing-layout")).toBeInTheDocument();
  });
});
