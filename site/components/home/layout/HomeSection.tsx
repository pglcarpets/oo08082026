import type { ReactNode } from "react";
import clsx from "clsx";

export type HomeSectionVariant = "white" | "soft" | "sand";
export type HomeSectionSpacing = "sm" | "md" | "lg";

const SPACING_CLASS: Record<HomeSectionSpacing, string> = {
  sm: "section-y-sm",
  md: "section-y",
  lg: "section-y-lg",
};

export interface HomeSectionProps {
  variant: HomeSectionVariant;
  spacing?: HomeSectionSpacing;
  /** When true, applies top and bottom borders (sandwiched soft sections). */
  borderY?: boolean;
  className?: string;
  children: ReactNode;
}

export function HomeSection({
  variant,
  spacing = "md",
  borderY = false,
  className,
  children,
}: HomeSectionProps) {
  const variantClass = (() => {
    switch (variant) {
      case "white":
        return "home-section--white scheme-page";
      case "soft":
        return "home-section--soft scheme-soft";
      case "sand":
        return "home-section--sand";
      default: {
        const _exhaustive: never = variant;
        return _exhaustive;
      }
    }
  })();

  return (
    <section
      data-testid="home-section"
      className={clsx(
        "home-section",
        variantClass,
        "w-full border-theme-soft",
        borderY ? "border-t border-b" : "border-t",
        SPACING_CLASS[spacing],
        className,
      )}
    >
      {children}
    </section>
  );
}
