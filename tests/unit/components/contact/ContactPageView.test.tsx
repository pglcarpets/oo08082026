import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContactPageView } from '@/components/contact/ContactPageView';
import enMessages from '@/i18n/messages/en.json';
import { SITE_CONTACT } from '@/features/site/data/contact';

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

vi.mock('@/components/site/EditorialHeroMedia', () => ({
  EditorialHeroMedia: () => <div data-testid="mock-hero-media" />,
}));

vi.mock('@/components/contact/CustomerQueryForm', () => ({
  CustomerQueryForm: ({ intent, source }: { intent: string | null; source: string | null }) => (
    <div data-testid="mock-query-form">
      <span>Intent: {intent || 'none'}</span>
      <span>Source: {source || 'none'}</span>
    </div>
  ),
}));

vi.mock('@phosphor-icons/react', () => ({
  MapPin: () => <span data-testid="mappin-icon" />,
  Phone: () => <span data-testid="phone-icon" />,
  Envelope: () => <span data-testid="envelope-icon" />,
}));

const contact = enMessages.contact as {
  heroKicker: string;
  heroTitleLead: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  sectionTitle: string;
  introTitle: string;
  resourceDeskLead: string;
  resourceDeskCta: string;
  resourceDeskTail: string;
  quickDeskKicker: string;
  quickDeskTitle: string;
  quickDeskDescription: string;
  quickDeskPrimaryCta: string;
  quickDeskSecondaryCta: string;
  channelRegionLabel: string;
  channelQuotesLabel: string;
  channelSupportLabel: string;
  channelEmailLabel: string;
  channelsAriaLabel: string;
  offices: { title: string; lines: string[] }[];
};

const defaultProps = {
  intent: 'quote',
  source: 'google',
  heroKicker: contact.heroKicker,
  heroTitleLead: contact.heroTitleLead,
  heroTitleAccent: contact.heroTitleAccent,
  heroSubtitle: contact.heroSubtitle,
  sectionTitle: contact.sectionTitle,
  introTitle: contact.introTitle,
  resourceDeskLead: contact.resourceDeskLead,
  resourceDeskCta: contact.resourceDeskCta,
  resourceDeskTail: contact.resourceDeskTail,
  quickDeskKicker: contact.quickDeskKicker,
  quickDeskTitle: contact.quickDeskTitle,
  quickDeskDescription: contact.quickDeskDescription,
  quickDeskPrimaryCta: contact.quickDeskPrimaryCta,
  quickDeskSecondaryCta: contact.quickDeskSecondaryCta,
  channelRegionLabel: contact.channelRegionLabel,
  channelQuotesLabel: contact.channelQuotesLabel,
  channelSupportLabel: contact.channelSupportLabel,
  channelEmailLabel: contact.channelEmailLabel,
  channelsAriaLabel: contact.channelsAriaLabel,
  offices: contact.offices,
};

describe('ContactPageView Component', () => {
  it('renders hero, offices, contact channels, and the query form', () => {
    const { container } = render(<ContactPageView {...defaultProps} />);

    expect(container.querySelector('[data-testid="contact-hero"]')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      `${contact.heroTitleLead} ${contact.heroTitleAccent}`,
    );

    contact.offices.forEach((office) => {
      expect(screen.getByText(office.title)).toBeInTheDocument();
      office.lines.forEach((line) => {
        expect(screen.getAllByText(line).length).toBeGreaterThan(0);
      });
    });

    expect(screen.getByText(SITE_CONTACT.regionLine)).toBeInTheDocument();
    expect(screen.getByText(SITE_CONTACT.salesPhone)).toBeInTheDocument();
    expect(screen.getByText(SITE_CONTACT.supportPhone)).toBeInTheDocument();
    expect(screen.getByText(SITE_CONTACT.salesEmail)).toBeInTheDocument();

    expect(screen.getByTestId('mock-query-form')).toBeInTheDocument();
    expect(screen.getByText('Intent: quote')).toBeInTheDocument();
    expect(screen.getByText('Source: google')).toBeInTheDocument();
  });
});
