import { PlannerHelpPage } from "@/features/site/planner/help/PlannerHelpPage";
import { PLANNER_HELP_FAQ_ITEMS } from "@/features/site/planner/help/helpSections";
import { PLANNER_HELP_PAGE_METADATA } from "@/features/site/data/routeMetadata";
import { buildBreadcrumbJsonLd, buildFAQJsonLd, buildPageJsonLd } from "@/lib/helpers/seo";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

export const metadata = PLANNER_HELP_PAGE_METADATA;

const PAGE_JSON_LD = buildPageJsonLd(SITE_URL, {
  path: "/planner/help",
  title: "Planner Help — Workspace Layout Guide",
  description: "Help center for the One&Only workspace planner.",
  pageType: "WebPage",
});

const BREADCRUMB_JSON_LD = buildBreadcrumbJsonLd(SITE_URL, [
  { name: "Planner", path: "/planner" },
  { name: "Help", path: "/planner/help" },
]);

const FAQ_JSON_LD = buildFAQJsonLd(PLANNER_HELP_FAQ_ITEMS);

export default function PlannerHelpRoute() {
  return (
    <>
      {[PAGE_JSON_LD, BREADCRUMB_JSON_LD, FAQ_JSON_LD].map((jsonLd) => (
        <script
          key={jsonLd["@type"] === "FAQPage" ? "faq" : jsonLd["@type"] === "BreadcrumbList" ? "breadcrumb" : "page"}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(jsonLd) }}
        />
      ))}
      <PlannerHelpPage />
    </>
  );
}
