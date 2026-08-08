"use client";

import { MarketingCtaLink } from "@/components/ui/MarketingCtaLink";
import { CAREER_PAGE_COPY } from "@/features/site/data/routeCopy";

interface JobCardProps {
  title: string;
  department: string;
  location?: string;
  onClick?: () => void;
}

export function JobCard({ title, department, location = "Patna", onClick }: JobCardProps) {
  const applyHref = `mailto:${CAREER_PAGE_COPY.careersEmail}?subject=${encodeURIComponent(`Application: ${title}`)}`;
  const detailsLabel = `Apply for ${title}`;

  return (
    <article className="career-job-row">
      <div className="career-job-row__copy">
        <h3 className="career-job-row__title">{title}</h3>
        <p className="career-job-row__meta">
          {location}
          <span aria-hidden="true"> · </span>
          {department}
        </p>
      </div>
      {onClick ? (
        <button
          type="button"
          className="btn-outline career-job-row__cta"
          onClick={onClick}
          aria-label={detailsLabel}
        >
          {CAREER_PAGE_COPY.applyCta}
        </button>
      ) : (
        <MarketingCtaLink
          href={applyHref}
          label={detailsLabel}
          surface="career-job-row"
          variant="outline"
          className="career-job-row__cta"
        >
          {CAREER_PAGE_COPY.applyCta}
        </MarketingCtaLink>
      )}
    </article>
  );
}
