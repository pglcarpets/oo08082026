import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CareerPageView } from '@/components/career/CareerPageView';
import { CAREER_PAGE_COPY, CAREER_PAGE_JOBS } from '@/features/site/data/routeCopy';

vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock('@gsap/react', () => ({
  useGSAP: () => undefined,
}));

vi.mock('@/components/career/JobCard', () => ({
  JobCard: ({ title, department, location }: { title: string; department: string; location?: string }) => (
    <div data-testid="mock-job-card">
      <h4>{title}</h4>
      <span>{department} - {location}</span>
    </div>
  ),
}));

vi.mock('@/components/shared/RouteCtaBand', () => ({
  RouteCtaBand: () => <div data-testid="mock-route-cta-band" />,
}));

describe('CareerPageView Component', () => {
  const defaultProps = {
    heroKicker: CAREER_PAGE_COPY.heroKicker,
    heroTitleLead: CAREER_PAGE_COPY.heroTitleLead,
    heroTitleAccent: CAREER_PAGE_COPY.heroTitleAccent,
    heroSubtitle: CAREER_PAGE_COPY.heroSubtitle,
    craftQuote: CAREER_PAGE_COPY.craftQuote,
    craftAttribution: CAREER_PAGE_COPY.craftAttribution,
    introKicker: CAREER_PAGE_COPY.introKicker,
    introTitle: CAREER_PAGE_COPY.introTitle,
    introDescription: CAREER_PAGE_COPY.introDescription,
    pillars: CAREER_PAGE_COPY.pillars,
    processKicker: CAREER_PAGE_COPY.processKicker,
    processTitle: CAREER_PAGE_COPY.processTitle,
    processDescription: CAREER_PAGE_COPY.processDescription,
    processSteps: CAREER_PAGE_COPY.processSteps,
    openingsTitle: CAREER_PAGE_COPY.openingsTitle,
    openingsAvailableTemplate: CAREER_PAGE_COPY.openingsAvailableTemplate,
    jobs: CAREER_PAGE_JOBS,
    fallbackTitle: CAREER_PAGE_COPY.fallbackTitle,
    fallbackDescription: CAREER_PAGE_COPY.fallbackDescription,
    careersEmail: CAREER_PAGE_COPY.careersEmail,
    ctaKicker: CAREER_PAGE_COPY.ctaKicker,
    ctaTitleLead: CAREER_PAGE_COPY.ctaTitleLead,
    ctaTitleAccent: CAREER_PAGE_COPY.ctaTitleAccent,
    ctaDescription: CAREER_PAGE_COPY.ctaDescription,
    ctaPrimary: CAREER_PAGE_COPY.ctaPrimary,
    ctaSecondary: CAREER_PAGE_COPY.ctaSecondary,
  };

  it('renders all sections and mocked child components correctly', () => {
    render(<CareerPageView {...defaultProps} />);

    expect(screen.getByTestId('career-hero')).toBeInTheDocument();
    expect(screen.getByText(CAREER_PAGE_COPY.heroTitleLead)).toBeInTheDocument();
    expect(screen.getByText(CAREER_PAGE_COPY.craftQuote)).toBeInTheDocument();

    CAREER_PAGE_COPY.pillars.forEach((pillar) => {
      expect(screen.getByText(pillar.title)).toBeInTheDocument();
      expect(screen.getByText(pillar.detail)).toBeInTheDocument();
    });

    CAREER_PAGE_COPY.processSteps.forEach((step) => {
      expect(screen.getByText(step.title)).toBeInTheDocument();
      expect(screen.getByText(step.detail)).toBeInTheDocument();
    });

    const jobCards = screen.getAllByTestId('mock-job-card');
    expect(jobCards.length).toBeGreaterThan(0);

    const mailLink = screen.getByRole('link', { name: CAREER_PAGE_COPY.careersEmail });
    expect(mailLink).toHaveAttribute('href', `mailto:${CAREER_PAGE_COPY.careersEmail}`);

    expect(screen.getByTestId('mock-route-cta-band')).toBeInTheDocument();
  });
});
