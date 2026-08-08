import "@/tests/helpers/nextIntlServerEnMock";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PrivacyPage from "@/app/(site)/privacy/page";

vi.mock("@/components/legal/LegalRouteHero", () => ({
  LegalRouteHero: () => <div data-testid="hero" />,
}));
vi.mock("@/components/shared/ContactTeaser", () => ({
  ContactTeaser: () => <div data-testid="contact-teaser" />,
}));

describe("PrivacyPage", () => {
  it("renders the privacy page correctly", async () => {
    const page = await PrivacyPage();
    render(page);

    expect(screen.getByTestId("hero")).toBeInTheDocument();
    expect(screen.getByTestId("contact-teaser")).toBeInTheDocument();
    expect(
      screen.getByText("A practical privacy policy for active workspace enquiries."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "What information we collect when you browse, enquire, or request support.",
      ),
    ).toBeInTheDocument();
  });
});
