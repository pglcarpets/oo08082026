import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ClientsPage, { metadata } from '@/app/(site)/clients/page';

vi.mock('next/image', () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock('@/components/analytics/KpiIntegrityMonitor', () => ({
  KpiIntegrityMonitor: () => <div data-testid="mock-kpi-monitor">KPI Monitor</div>,
}));

vi.mock('@/components/shared/ContactTeaser', () => ({
  ContactTeaser: () => <div data-testid="mock-contact-teaser">Contact Teaser</div>,
}));

vi.mock('@/components/shared/RouteCtaBand', () => ({
  RouteCtaBand: () => <div data-testid="mock-route-cta-band">Route CTA Band</div>,
}));

vi.mock('@/components/ui/MarketingCtaLink', () => ({
  MarketingCtaLink: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@gsap/react', () => ({
  useGSAP: () => undefined,
}));

vi.mock('gsap', () => ({
  default: {
    registerPlugin: () => {},
    context: (fn: () => void) => {
      fn();
      return { revert: () => {} };
    },
    from: () => {},
    to: () => {},
  },
}));

vi.mock('@/features/site/data/routeMetadata', () => ({
  CLIENTS_PAGE_METADATA: { title: 'Clients' },
}));

vi.mock('@/features/site/data/routeCopy', () => ({
  CLIENTS_PAGE_COPY: {
    heroTitleLead: 'Trusted',
    heroTitleAccent: 'clients.',
    heroSubtitleTemplate:
      '{clients} organisations across government, finance, energy, and manufacturing.',
    eyebrow: 'Case studies',
    emptyTitle: 'Gallery updating',
    emptyDescription: 'Photos are being prepared.',
    trustedCta: 'Trusted by',
    contactCta: 'Contact us',
    pullQuotes: [
      { quote: 'Clear scope and accountable delivery.', attribution: 'Facilities lead' },
    ],
    ctaKicker: 'Next step',
    ctaTitleLead: 'Brief the',
    ctaTitleAccent: 'planning team.',
    ctaDescription: 'Share headcount and timing.',
    planningCta: 'Request planning call',
  },
  CLIENTS_WORK: [
    {
      id: 'titan',
      folder: 'Titan',
      name: 'Titan',
      location: 'Patna, Bihar',
      summary: 'Collaborative office zones.',
    },
  ],
}));

vi.mock('@/features/site/data/clientWorkPhotos', () => ({
  buildClientWorkWithPhotos: vi.fn(async () => [
    {
      id: 'titan',
      folder: 'Titan',
      name: 'Titan',
      location: 'Patna, Bihar',
      summary: 'Collaborative office zones.',
      photos: ['/assets/marketing/projects/Titan/hero.webp'],
    },
  ]),
}));

vi.mock('@/features/crm/businessStats', () => ({
  getBusinessStats: vi.fn(async () => ({
    stats: {
      clientOrganisations: 100,
      projectsDelivered: 500,
      sectorsServed: 10,
      asOfDate: '2026-06-26',
    },
    source: 'supabase',
  })),
}));

vi.mock('@/lib/kpiFormat', () => ({
  formatKpiValuePlus: (val: number) => `${val}+`,
  formatKpiAsOf: (date: string) => `As of ${date}`,
}));

vi.mock('@/features/site/data/seo', () => ({
  buildPageJsonLd: () => ({}),
}));

vi.mock('@/lib/siteUrl', () => ({
  SITE_URL: 'https://mock-site-url.com',
}));

vi.mock('@/lib/security/sanitize', () => ({
  sanitizeJsonForScript: (value: unknown) => JSON.stringify(value),
}));

describe('ClientsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders metadata and content correctly', async () => {
    expect(metadata).toEqual({ title: 'Clients' });

    const pageElement = await ClientsPage();
    render(pageElement);

    expect(screen.getByTestId('clients-hero')).toBeInTheDocument();
    expect(screen.getByText('Case studies')).toBeInTheDocument();
    expect(screen.getByText('Trusted')).toBeInTheDocument();
    expect(screen.getByText('clients.')).toBeInTheDocument();
    expect(
      screen.getByText(
        '100+ organisations across government, finance, energy, and manufacturing.',
      ),
    ).toBeInTheDocument();

    expect(screen.getByTestId('kpi-client-organisations-clients')).toHaveTextContent('100+');
    expect(screen.getByTestId('kpi-projects-delivered-clients')).toHaveTextContent('500+');
    expect(screen.getByTestId('kpi-sectors-served-clients')).toHaveTextContent('10+');
    expect(screen.getByTestId('kpi-as-of-clients')).toHaveTextContent('As of 2026-06-26');

    expect(screen.getByRole('heading', { name: 'Titan' })).toBeInTheDocument();
    expect(screen.getByAltText(/Titan installed workplace — primary view/)).toBeInTheDocument();
    expect(screen.getByTestId('mock-route-cta-band')).toBeInTheDocument();
    expect(screen.getByTestId('mock-contact-teaser')).toBeInTheDocument();
  });
});
