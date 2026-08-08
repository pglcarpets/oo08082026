"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Hash, MagnifyingGlass as Search } from "@phosphor-icons/react";

import {
  HomeMarketingLayout,
  HomeSection,
  HomeSectionInner,
} from "@/components/home/layout";
import { RouteCtaBand } from "@/components/shared/RouteCtaBand";
import { PlannerBreadcrumbs } from "@/features/site/planner/landing/PlannerBreadcrumbs";
import { isPlannerFeatureSlug } from "@/features/site/planner/landing/plannerFeaturePages";
import { PLANNER_HELP_SECTIONS } from "./helpSections";

export function PlannerHelpPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PLANNER_HELP_SECTIONS;
    return PLANNER_HELP_SECTIONS.filter(
      (section) =>
        section.title.toLowerCase().includes(q) ||
        section.summary.toLowerCase().includes(q) ||
        section.keywords.some((kw) => kw.includes(q)),
    );
  }, [query]);

  return (
    <HomeMarketingLayout>
      <HomeSection variant="white" spacing="sm" className="border-t-0 pt-24 md:pt-28">
        <HomeSectionInner>
          <PlannerBreadcrumbs
            items={[{ label: "Planner", href: "/planner/" }, { label: "Help" }]}
          />

          <div className="mb-10 flex flex-col gap-6 border-b border-theme-soft pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="typ-eyebrow text-bronze">Help center</p>
              <h1 className="home-heading mt-3">
                Workspace planner <span className="text-accent-italic">guide</span>
              </h1>
              <p className="page-copy-sm text-muted">
                Everything you need to draw, furnish, measure, and export a client-ready floor plan.
              </p>
            </div>
            <div className="max-w-md">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search help…"
                  aria-label="Search help topics"
                  className="typ-body-sm w-full min-h-11 rounded-full border border-soft bg-panel py-3 pl-11 pr-4 text-strong outline-none focus-ring-theme"
                />
              </div>
              <p aria-live="polite" className="typ-micro mt-2 pl-4 text-subtle">
                {filtered.length} of {PLANNER_HELP_SECTIONS.length} topics
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((section) => (
              <article key={section.id} id={section.id} className="pfp-card scroll-mt-24">
                <div className="flex items-start gap-2">
                  <h2 className="typ-h3 text-strong">{section.title}</h2>
                  <a
                    href={`#${section.id}`}
                    className="pfp-anchor mt-1"
                    aria-label={`Link to ${section.title}`}
                  >
                    <Hash className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
                <p className="page-copy-sm text-muted">{section.summary}</p>
                <div className="pfp-card-links typ-label">
                  <Link href="/ooplanner/" className="pfp-card-link">
                    Open the canvas
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                  {section.featureSlug && isPlannerFeatureSlug(section.featureSlug) && (
                    <Link href={`/planner/features/${section.featureSlug}/`} className="pfp-card-link">
                      Feature page
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="page-copy-sm py-12 text-center text-muted">
              No topics match your search.{" "}
              <button
                type="button"
                onClick={() => setQuery("")}
                className="focus-ring-theme rounded font-semibold text-primary underline-offset-2 hover:underline"
              >
                Clear search
              </button>
            </p>
          )}

          <RouteCtaBand
            title="Ready to plan?"
            description="Open the canvas and place your first desk in under a minute."
            actions={[
              { href: "/ooplanner/", label: "Try free", variant: "primary" },
              { href: "/ooplanner/", label: "Open planner", variant: "outline-light" },
            ]}
            className="mt-16"
          />
        </HomeSectionInner>
      </HomeSection>
    </HomeMarketingLayout>
  );
}
