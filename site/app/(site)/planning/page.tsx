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

export const metadata: Metadata = PLANNING_PAGE_METADATA;

export default function PlanningPage() {
  return (
    <HomeMarketingLayout>
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
