import type { ReactNode } from "react";
import { ContactTeaser } from "@/components/shared/ContactTeaser";

export interface HomeMarketingLayoutProps {
  children: ReactNode;
  /** When true, appends the shared footer ContactTeaser block (default false — most pages place it explicitly). */
  contactTeaser?: boolean;
}

export function HomeMarketingLayout({
  children,
  contactTeaser = false,
}: HomeMarketingLayoutProps) {
  return (
    <div
      data-testid="home-marketing-layout"
      className="home-marketing-layout min-h-screen overflow-x-clip overflow-y-visible"
    >
      {children}
      {contactTeaser ? <ContactTeaser /> : null}
    </div>
  );
}
