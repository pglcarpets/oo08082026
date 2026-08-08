import { describe, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { HOMEPAGE_WHY_CHOOSE_US_CONTENT } from "@/features/site/data/homepage";

// Mock phosphor icons
vi.mock("@phosphor-icons/react", () => ({
  Gauge: () => <span data-testid="gauge-icon" />,
  ShieldCheck: () => <span data-testid="shield-icon" />,
  Plant: () => <span data-testid="plant-icon" />,
  Stack: () => <span data-testid="stack-icon" />,
}));

// Mock framer-motion — strip animation props; keep DOM props.
vi.mock("framer-motion", () => ({
  useReducedMotion: () => true,
  motion: {
    div: ({
      children,
      initial: _initial,
      animate: _animate,
      variants: _variants,
      transition: _transition,
      whileInView: _whileInView,
      whileHover: _whileHover,
      viewport: _viewport,
      ...props
    }: {
      children?: ReactNode;
      initial?: unknown;
      animate?: unknown;
      variants?: unknown;
      transition?: unknown;
      whileInView?: unknown;
      whileHover?: unknown;
      viewport?: unknown;
      className?: string;
      key?: string;
    }) => <div {...props}>{children}</div>,
  },
}));

vi.mock("@/lib/helpers/motion", () => ({
  fadeUp: () => ({}),
  hoverLift: {},
  staggerContainer: {},
  staggerItem: {},
  useFadeUp: () => ({}),
  useStaggerMotion: () => ({
    container: {},
    item: {},
    initial: "hidden",
    whileInView: "show",
  }),
  useMotionSafeHover: () => ({}),
}));

describe("WhyChooseUs Component", () => {
  it("renders title and choose us features correctly", () => {
    render(<WhyChooseUs />);

    expect(
      screen.getByText(HOMEPAGE_WHY_CHOOSE_US_CONTENT.titleLead),
    ).toBeInTheDocument();
    expect(
      screen.getByText(HOMEPAGE_WHY_CHOOSE_US_CONTENT.titleAccent),
    ).toBeInTheDocument();

    expect(screen.getByText("Performance-graded")).toBeInTheDocument();
    expect(screen.getByText("Load · cycle · ergonomics")).toBeInTheDocument();
    expect(screen.getByTestId("gauge-icon")).toBeInTheDocument();

    expect(screen.getByText("Built to last")).toBeInTheDocument();
    // Product-level honesty — no universal BIFMA / 5-year warranty claim.
    expect(screen.getByText("Warranty by model")).toBeInTheDocument();
    expect(screen.queryByText(/BIFMA/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/5-year warranty/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("shield-icon")).toBeInTheDocument();

    expect(screen.getByText("Lower rework")).toBeInTheDocument();
    expect(screen.getByText("Durable materials")).toBeInTheDocument();
    expect(screen.getByTestId("plant-icon")).toBeInTheDocument();

    expect(screen.getByText("Scales cleanly")).toBeInTheDocument();
    expect(screen.getByText("Pilot to rollout")).toBeInTheDocument();
    expect(screen.getByTestId("stack-icon")).toBeInTheDocument();
  });
});
