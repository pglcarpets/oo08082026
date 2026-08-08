import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ShowroomsPage, { metadata } from "@/app/(site)/showrooms/page";
import { SHOWROOMS_HIGHLIGHTS, SHOWROOMS_PAGE_COPY } from "@/features/site/data/routeCopy";

vi.mock("@/features/site/data/routeMetadata", () => ({
  SHOWROOMS_PAGE_METADATA: { title: "Showrooms Title" },
}));

vi.mock("@gsap/react", () => ({
  useGSAP: () => undefined,
}));

vi.mock("gsap", () => ({
  default: {
    registerPlugin: () => {},
    context: (fn: () => void) => {
      fn();
      return { revert: () => {} };
    },
    from: () => {},
    to: () => {},
  },
}));

describe("ShowroomsPage Route", () => {
  it("renders standard marketing hero and visit details", () => {
    expect(metadata).toEqual({ title: "Showrooms Title" });

    render(<ShowroomsPage />);

    expect(screen.getByText(SHOWROOMS_PAGE_COPY.heroSubtitle)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: SHOWROOMS_PAGE_COPY.visitTitle }),
    ).toBeInTheDocument();
    SHOWROOMS_HIGHLIGHTS.forEach((highlight) => {
      expect(screen.getByText(highlight.title)).toBeInTheDocument();
    });
    SHOWROOMS_PAGE_COPY.visitRows.forEach((row) => {
      expect(screen.getByText(row.title)).toBeInTheDocument();
    });
    expect(
      screen.getAllByRole("link", { name: SHOWROOMS_PAGE_COPY.visitCta })[0],
    ).toHaveAttribute("href", "/contact");
    expect(screen.getByTestId("home-marketing-layout")).toBeInTheDocument();
  });
});
