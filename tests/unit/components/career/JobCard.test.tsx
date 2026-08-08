import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JobCard } from '@/components/career/JobCard';
import { CAREER_PAGE_COPY } from '@/features/site/data/routeCopy';

vi.mock('@/components/ui/MarketingCtaLink', () => ({
  MarketingCtaLink: ({
    children,
    href,
    label,
  }: {
    children?: React.ReactNode;
    href: string;
    label: string;
  }) => (
    <a href={href} aria-label={label}>
      {children}
    </a>
  ),
}));

describe('JobCard Component', () => {
  it('renders title, department and default location correctly', () => {
    render(<JobCard title="Software Engineer" department="Engineering" />);

    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText(/Engineering/)).toBeInTheDocument();
    expect(screen.getByText(/Patna/)).toBeInTheDocument();
  });

  it('renders custom location if provided', () => {
    render(<JobCard title="Software Engineer" department="Engineering" location="New Delhi" />);
    expect(screen.getByText(/New Delhi/)).toBeInTheDocument();
  });

  it('defaults Apply to a careers mailto link when onClick is omitted', () => {
    render(<JobCard title="UX Designer" department="Design" />);

    const link = screen.getByRole('link', { name: 'Apply for UX Designer' });
    expect(link).toHaveAttribute(
      'href',
      `mailto:${CAREER_PAGE_COPY.careersEmail}?subject=${encodeURIComponent('Application: UX Designer')}`,
    );
  });

  it('triggers onClick callback when button is clicked', () => {
    const handleClick = vi.fn();
    render(<JobCard title="UX Designer" department="Design" onClick={handleClick} />);

    const button = screen.getByRole('button', { name: 'Apply for UX Designer' });
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
