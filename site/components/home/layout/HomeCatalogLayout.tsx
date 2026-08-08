import type { ReactNode } from "react";
import { HomeMarketingLayout } from "./HomeMarketingLayout";
import { HomeSection } from "./HomeSection";

export interface HomeCatalogLayoutProps {
  children: ReactNode;
}

/** Catalog lane — homepage outer shell + white section band with site-header offset. */
export function HomeCatalogLayout({ children }: HomeCatalogLayoutProps) {
  return (
    <HomeMarketingLayout>
      <HomeSection variant="white" spacing="sm" className="border-t-0">
        {children}
      </HomeSection>
    </HomeMarketingLayout>
  );
}
