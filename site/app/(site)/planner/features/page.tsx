import { PlannerFeaturesHubPage } from "@/features/site/planner/landing/PlannerFeaturesHubPage";
import { PLANNER_FEATURES_PAGE_METADATA } from "@/features/site/data/routeMetadata";
import { buildBreadcrumbJsonLd, buildPageJsonLd } from "@/lib/helpers/seo";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

export const metadata = PLANNER_FEATURES_PAGE_METADATA;

const PAGE_JSON_LD = buildPageJsonLd(SITE_URL, {
  path: "/planner/features",
  title: "Planner Features",
  description: "Capability overview for the One&Only workspace planner.",
  pageType: "CollectionPage",
});

const BREADCRUMB_JSON_LD = buildBreadcrumbJsonLd(SITE_URL, [
  { name: "Planner", path: "/planner" },
  { name: "Features", path: "/planner/features" },
]);

export default function PlannerFeaturesHubRoute() {
  return (
    <>
      {[PAGE_JSON_LD, BREADCRUMB_JSON_LD].map((jsonLd) => (
        <script
          key={jsonLd["@type"] === "BreadcrumbList" ? "breadcrumb" : "page"}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(jsonLd) }}
        />
      ))}
      <PlannerFeaturesHubPage />
    </>
  );
}
