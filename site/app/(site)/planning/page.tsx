import type { Metadata } from "next";

import { HomeMarketingLayout } from "@/components/home/layout";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { PlanningPageView } from "@/components/planning/PlanningPageView";
import {
  PLANNING_PAGE_COPY,
  PLANNING_PAGE_DELIVERABLES,
  PLANNING_PAGE_STEPS,
} from "@/features/site/data/routeCopy";
import { PLANNING_PAGE_METADATA } from "@/features/site/data/routeMetadata";
import { buildBreadcrumbJsonLd, buildPageJsonLd } from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

export const metadata: Metadata = PLANNING_PAGE_METADATA;

export default function PlanningPage() {
  const planningJsonLd = buildPageJsonLd(SITE_URL, {
    path: "/planning",
    title: `${PLANNING_PAGE_COPY.heroTitle} | One&Only`,
    description: PLANNING_PAGE_COPY.heroSubtitle,
    pageType: "WebPage",
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(SITE_URL, [
    { name: "Home", path: "/" },
    { name: "Planning", path: "/planning" },
  ]);

  return (
    <HomeMarketingLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(planningJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(breadcrumbJsonLd) }}
      />
      <PlanningPageView
        heroKicker={PLANNING_PAGE_COPY.heroKicker}
        heroTitleLead={PLANNING_PAGE_COPY.heroTitleLead}
        heroTitleAccent={PLANNING_PAGE_COPY.heroTitleAccent}
        heroSubtitle={PLANNING_PAGE_COPY.heroSubtitle}
        craftQuote={PLANNING_PAGE_COPY.craftQuote}
        craftAttribution={PLANNING_PAGE_COPY.craftAttribution}
        primaryCta={PLANNING_PAGE_COPY.primaryCta}
        plannerCta={PLANNING_PAGE_COPY.plannerCta}
        tertiaryCta={PLANNING_PAGE_COPY.tertiaryCta}
        workflowKicker={PLANNING_PAGE_COPY.workflowKicker}
        workflowTitle={PLANNING_PAGE_COPY.workflowTitle}
        steps={PLANNING_PAGE_STEPS}
        deliverablesKicker={PLANNING_PAGE_COPY.deliverablesKicker}
        deliverablesTitle={PLANNING_PAGE_COPY.deliverablesTitle}
        deliverables={PLANNING_PAGE_DELIVERABLES}
        bestForKicker={PLANNING_PAGE_COPY.bestForKicker}
        bestForDescription={PLANNING_PAGE_COPY.bestForDescription}
        deskKicker={PLANNING_PAGE_COPY.deskKicker}
        deskTitle={PLANNING_PAGE_COPY.deskTitle}
        deskDescription={PLANNING_PAGE_COPY.deskDescription}
      />
      <ContactTeaser />
    </HomeMarketingLayout>
  );
}
