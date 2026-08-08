import "../../../../helpers/nextIntlServerEnMock";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import RefundAndReturnPolicyPage, { metadata } from "@/app/(site)/refund-and-return-policy/page";

vi.mock("@/components/legal/LegalRouteHero", () => ({
  LegalRouteHero: ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div data-testid="mock-hero">
      <h1>{title}</h1>
      <h2>{subtitle}</h2>
    </div>
  ),
}));

vi.mock("@/components/shared/ContactTeaser", () => ({
  ContactTeaser: () => <div data-testid="mock-contact-teaser">Contact Teaser</div>,
}));

vi.mock("@/features/site/data/routeMetadata", () => ({
  REFUND_POLICY_PAGE_METADATA: { title: "Refund Policy" },
}));

describe("RefundAndReturnPolicyPage Component", () => {
  it("renders content correctly", async () => {
    expect(metadata).toEqual({ title: "Refund Policy" });

    const page = await RefundAndReturnPolicyPage();
    render(page);

    expect(screen.getByTestId("mock-hero")).toBeInTheDocument();
    expect(screen.getByText("Refund and return policy")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Clear guidance for damaged goods, cancellation windows, and refund eligibility.",
      ),
    ).toBeInTheDocument();

    expect(screen.getByText("Damaged or defective products")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Report damage within 24 hours of delivery by email with product photos.",
      ),
    ).toBeInTheDocument();

    expect(screen.getByText("Email: sales@oando.co.in")).toBeInTheDocument();
    expect(screen.getByTestId("mock-contact-teaser")).toBeInTheDocument();
  });
});
