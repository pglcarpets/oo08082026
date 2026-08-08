"use client";

import { useTranslations } from "next-intl";
import { PlannerToolsShowcase } from "@/components/home/PlannerToolsShowcase";
import { HOMEPAGE_PLANNER_SUITE_CONTENT } from "@/features/site/data/homepage";

export function InteractiveTools() {
  const t = useTranslations("home");

  return (
    <PlannerToolsShowcase
      testId="home-tools"
      headingLevel="h2"
      kicker={t("tools.kicker")}
      title={{ lead: t("tools.titleLead"), accent: t("tools.titleAccent") }}
      description={t("tools.description")}
      primaryCta={{
        label: HOMEPAGE_PLANNER_SUITE_CONTENT.launchLabel,
        href: HOMEPAGE_PLANNER_SUITE_CONTENT.launchHref,
      }}
      demoHref="/ooplanner"
      demoAriaLabel={t("tools.demoAriaLabel")}
      demoCaption={t("tools.demoCaption")}
      demoTestId="home-tools-floorplan"
      variant="homepage"
      reveal="inView"
    />
  );
}
