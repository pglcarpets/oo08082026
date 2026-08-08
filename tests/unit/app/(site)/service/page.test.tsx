import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ServicePage, { metadata } from '@/app/(site)/service/page';
import { SITE_CONTACT } from '@/features/site/data/contact';
import {
  SERVICE_PAGE_CHANNELS,
  SERVICE_PAGE_COPY,
  SERVICE_PAGE_PILLARS,
} from '@/features/site/data/routeCopy';

vi.mock('@/features/site/data/routeMetadata', () => ({
  SERVICE_PAGE_METADATA: { title: 'Service & Support' },
}));

vi.mock('@/components/shared/ContactTeaser', () => ({
  ContactTeaser: () => <div data-testid="mock-contact-teaser">Contact Teaser</div>,
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

describe('ServicePage Component', () => {
  it('renders all components and channels correctly', () => {
    expect(metadata).toEqual({ title: 'Service & Support' });

    render(<ServicePage />);

    expect(screen.getByText(SERVICE_PAGE_COPY.heroSubtitle)).toBeInTheDocument();

    SERVICE_PAGE_PILLARS.forEach((pillar) => {
      expect(screen.getByText(pillar.title)).toBeInTheDocument();
      expect(screen.getByText(pillar.detail)).toBeInTheDocument();
    });

    expect(screen.getByText(SITE_CONTACT.supportPhone)).toBeInTheDocument();
    expect(screen.getByText(SITE_CONTACT.salesEmail)).toBeInTheDocument();
    const whatsappChannel = SERVICE_PAGE_CHANNELS.find((c) => c.kind === 'whatsapp');
    expect(whatsappChannel).toBeDefined();
    expect(screen.getByText(whatsappChannel!.value)).toBeInTheDocument();

    expect(screen.getByTestId('mock-contact-teaser')).toBeInTheDocument();
  });
});
