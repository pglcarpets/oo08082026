import { notFound } from "next/navigation";

import { PlannerFeaturePageView } from "@/features/site/planner/landing/PlannerFeaturePageView";
import {
  PLANNER_FEATURE_PAGES,
  PLANNER_FEATURE_BY_SLUG,
  isPlannerFeatureSlug,
} from "@/features/site/planner/landing/plannerFeaturePages";
import { SITE_URL } from "@/lib/siteUrl";
import { buildBreadcrumbJsonLd, buildPageJsonLd, buildPageMetadata } from "@/lib/helpers/seo";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return PLANNER_FEATURE_PAGES.map((feature) => ({ slug: feature.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  if (!isPlannerFeatureSlug(slug)) {
    return {};
  }
  const feature = PLANNER_FEATURE_BY_SLUG[slug];
  return buildPageMetadata(SITE_URL, {
    title: `${feature.title} — Workspace Planner`,
    description: feature.summary,
    path: `/planner/features/${slug}`,
    keywords: [feature.title, "workspace planner", "One&Only"],
  });
}

export default async function PlannerFeatureRoute({ params }: PageProps) {
  const { slug } = await params;
  if (!isPlannerFeatureSlug(slug)) {
    notFound();
  }
  const feature = PLANNER_FEATURE_BY_SLUG[slug];
  const jsonLd = buildPageJsonLd(SITE_URL, {
    path: `/planner/features/${slug}`,
    title: feature.title,
    description: feature.summary,
    pageType: "WebPage",
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(SITE_URL, [
    { name: "Planner", path: "/planner" },
    { name: "Features", path: "/planner/features" },
    { name: feature.title, path: `/planner/features/${slug}` },
  ]);

  return (
    <>
      {[jsonLd, breadcrumbJsonLd].map((item) => (
        <script
          key={item["@type"] === "BreadcrumbList" ? "breadcrumb" : "page"}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(item) }}
        />
      ))}
      <PlannerFeaturePageView slug={slug} />
    </>
  );
}
