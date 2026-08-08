import { HomeMarketingLayout } from "@/components/home/layout";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { ShowroomsPageView } from "@/components/showrooms/ShowroomsPageView";
import {
  SHOWROOMS_HIGHLIGHTS,
  SHOWROOMS_PAGE_COPY,
} from "@/features/site/data/routeCopy";
import { SHOWROOMS_PAGE_METADATA } from "@/features/site/data/routeMetadata";

export const metadata = SHOWROOMS_PAGE_METADATA;

export default function ShowroomsPage() {
  return (
    <HomeMarketingLayout>
      <ShowroomsPageView
        heroKicker={SHOWROOMS_PAGE_COPY.heroKicker}
        heroTitleLead={SHOWROOMS_PAGE_COPY.heroTitleLead}
        heroTitleAccent={SHOWROOMS_PAGE_COPY.heroTitleAccent}
        heroSubtitle={SHOWROOMS_PAGE_COPY.heroSubtitle}
        craftQuote={SHOWROOMS_PAGE_COPY.craftQuote}
        craftAttribution={SHOWROOMS_PAGE_COPY.craftAttribution}
        visitKicker={SHOWROOMS_PAGE_COPY.visitKicker}
        visitTitle={SHOWROOMS_PAGE_COPY.visitTitle}
        visitCta={SHOWROOMS_PAGE_COPY.visitCta}
        visitRows={SHOWROOMS_PAGE_COPY.visitRows}
        highlightsKicker={SHOWROOMS_PAGE_COPY.highlightsKicker}
        highlightsTitle={SHOWROOMS_PAGE_COPY.highlightsTitle}
        highlights={SHOWROOMS_HIGHLIGHTS}
        ctaKicker={SHOWROOMS_PAGE_COPY.ctaKicker}
        ctaTitleLead={SHOWROOMS_PAGE_COPY.ctaTitleLead}
        ctaTitleAccent={SHOWROOMS_PAGE_COPY.ctaTitleAccent}
        ctaDescription={SHOWROOMS_PAGE_COPY.ctaDescription}
        ctaPrimary={SHOWROOMS_PAGE_COPY.ctaPrimary}
        ctaSecondary={SHOWROOMS_PAGE_COPY.ctaSecondary}
      />
      <ContactTeaser />
    </HomeMarketingLayout>
  );
}
