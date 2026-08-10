import { getTranslations } from "next-intl/server";
import { CareerPageView } from "@/components/career/CareerPageView";
import { HomeMarketingLayout } from "@/components/home/layout";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { CAREER_PAGE_JOBS } from "@/features/site/data/routeCopy";
import { CAREER_PAGE_METADATA } from "@/features/site/data/routeMetadata";
import {
  buildBreadcrumbJsonLd,
  buildCareerJobsJsonLd,
  buildPageJsonLd,
} from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

export const metadata = CAREER_PAGE_METADATA;

type CareerPillar = { title: string; detail: string; icon: string };
type CareerProcessStep = { title: string; detail: string };

export default async function CareerPage() {
  const t = await getTranslations("career");
  const pillars = t.raw("pillars") as CareerPillar[];
  const processSteps = t.raw("processSteps") as CareerProcessStep[];

  const careerPageJsonLd = buildPageJsonLd(SITE_URL, {
    path: "/career",
    title: "Careers | Office furniture jobs India | One&Only",
    description: t("heroSubtitle"),
    pageType: "WebPage",
  });
  const careerJobsJsonLd = buildCareerJobsJsonLd(SITE_URL, CAREER_PAGE_JOBS);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(SITE_URL, [
    { name: "Home", path: "/" },
    { name: "Careers", path: "/career" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: sanitizeJsonForScript(careerPageJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: sanitizeJsonForScript(careerJobsJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(breadcrumbJsonLd) }}
      />
      <HomeMarketingLayout>
        <CareerPageView
          heroKicker={t("heroKicker")}
          heroTitleLead={t("heroTitleLead")}
          heroTitleAccent={t("heroTitleAccent")}
          heroSubtitle={t("heroSubtitle")}
          craftQuote={t("craftQuote")}
          craftAttribution={t("craftAttribution")}
          introKicker={t("introKicker")}
          introTitle={t("introTitle")}
          introDescription={t("introDescription")}
          pillars={pillars}
          processKicker={t("processKicker")}
          processTitle={t("processTitle")}
          processDescription={t("processDescription")}
          processSteps={processSteps}
          openingsTitle={t("openingsTitle")}
          openingsAvailableTemplate={t.raw("openingsAvailableTemplate") as string}
          jobs={CAREER_PAGE_JOBS}
          fallbackTitle={t("fallbackTitle")}
          fallbackDescription={t("fallbackDescription")}
          careersEmail={t("careersEmail")}
          ctaKicker={t("ctaKicker")}
          ctaTitleLead={t("ctaTitleLead")}
          ctaTitleAccent={t("ctaTitleAccent")}
          ctaDescription={t("ctaDescription")}
          ctaPrimary={t("ctaPrimary")}
          ctaSecondary={t("ctaSecondary")}
        />
        <ContactTeaser />
      </HomeMarketingLayout>
    </>
  );
}
