import type { ReactNode } from "react";
import clsx from "clsx";

export interface HomeSectionInnerProps {
  children: ReactNode;
  className?: string;
}

export function HomeSectionInner({ children, className }: HomeSectionInnerProps) {
  return (
    <div data-testid="home-section-inner" className={clsx("home-shell-xl", className)}>
      {children}
    </div>
  );
}
