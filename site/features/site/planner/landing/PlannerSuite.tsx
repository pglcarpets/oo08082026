"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";

import { HOMEPAGE_PLANNER_SUITE_CONTENT } from "@/features/site/data/homepage";

import { PlannerLayoutGraphic } from "./PlannerLayoutGraphic";

export function PlannerSuite() {
  const { titleLead, titleAccent, description, loginHref, loginLabel, overviewHref, overviewLabel } =
    HOMEPAGE_PLANNER_SUITE_CONTENT;

  return (
    <section
      className="home-section--white border-t border-theme-soft section-y-sm"
      data-testid="home-planner-suite"
    >
      <div className="home-shell-xl">
        <div className="home-frame home-frame--standard gap-6 md:flex-row md:items-center">
          <PlannerLayoutGraphic className="sm:flex" />

          <div className="">
            <h2 className="home-heading">
              {titleLead}{" "}
              <span className="text-accent-italic">{titleAccent}</span>
            </h2>
            <p className="page-copy-sm mt-3 text-muted">{description}</p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-3">
            <Link
              href={loginHref}
              data-testid="home-planner-link-unified"
              className="btn-primary typ-cta inline-flex gap-2 px-5 py-2.5"
            >
              {loginLabel}
              <ArrowRight size={15} weight="bold" />
            </Link>
            <Link
              href={overviewHref}
              className="btn-outline typ-cta inline-flex gap-2 px-5 py-2.5"
            >
              {overviewLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
