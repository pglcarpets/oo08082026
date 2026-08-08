import type React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContactTeaser } from '@/components/shared/ContactTeaser';
import { trackContactSubmission, trackSiteCtaClick } from '@/lib/analytics/siteEvents';

const mockPathname = '/test-page';
const executeAsync = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

// Mock phosphor icons
vi.mock('@phosphor-icons/react', () => ({
  ArrowUpRight: () => <span data-testid="arrow-icon" />,
  ChatCircleDots: () => <span data-testid="chat-dots-icon" />,
  ChatText: () => <span data-testid="chat-text-icon" />,
  PhoneCall: () => <span data-testid="phone-call-icon" />,
}));

// Mock framer-motion — pass through structure; enter props are ignored in unit tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>,
    form: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => <form {...props}>{children}</form>,
  },
  useReducedMotion: () => false,
}));

// Mock motion helper
vi.mock('@/lib/helpers/motion', () => ({
  fadeUpMount: () => ({}),
}));

// Mock site-data & analytics
vi.mock('@/features/site/data/contact', () => ({
  buildWhatsAppHref: (msg: string) => `https://wa.me/12345?text=${encodeURIComponent(msg)}`,
  SITE_CONTACT: {
    supportPhone: '+91 99999 99999',
  },
  toTelHref: (num: string) => `tel:${num}`,
}));

vi.mock('@/features/site/data/homepage', () => ({
  HOMEPAGE_CONTACT_CONTENT: {
    titleLead: 'Quick project',
    titleAccent: 'brief',
    subtitle: 'Send us your details.',
    image: {
      src: '/assets/marketing/hero/pages/contact-poster.webp',
      alt: 'Corporate workspace',
    },
    directActions: [
      { type: 'whatsapp', label: 'WhatsApp' },
      { type: 'phone', label: 'Call support' },
    ],
  },
}));

vi.mock('next/image', () => ({
  default: (props: { alt: string; src: string }) => (
    <img alt={props.alt} src={props.src} data-testid="contact-teaser-image" />
  ),
}));

vi.mock('@/lib/analytics/siteEvents', () => ({
  trackContactSubmission: vi.fn(),
  trackSiteCtaClick: vi.fn(),
}));

vi.mock('next-safe-action/hooks', () => ({
  useAction: (
    _action: unknown,
    opts?: {
      onSuccess?: (args: { data: unknown; input: unknown }) => void;
      onError?: (args: { error: unknown; input: unknown }) => void;
    },
  ) => ({
    executeAsync: async (input: unknown) => {
      try {
        const result = (await executeAsync(input)) as
          | {
              data?: {
                queryId: string;
                followUp: { email: string | null; whatsapp: string | null };
              };
              serverError?: string;
              validationErrors?: Record<string, unknown>;
            }
          | undefined;
        if (result?.data) {
          await opts?.onSuccess?.({ data: result.data, input });
        } else if (result?.serverError || result?.validationErrors) {
          await opts?.onError?.({
            error: {
              serverError: result.serverError,
              validationErrors: result.validationErrors,
            },
            input,
          });
        }
        return result ?? {};
      } catch (thrownError) {
        await opts?.onError?.({
          error: { thrownError },
          input,
        });
        throw thrownError;
      }
    },
    isExecuting: false,
    status: 'idle',
    result: {},
    reset: vi.fn(),
    execute: vi.fn(),
    isIdle: true,
    isPending: false,
    isTransitioning: false,
    hasSucceeded: false,
    hasErrored: false,
    hasNavigated: false,
    input: undefined,
  }),
}));

function fillRequiredTeaserFields(options?: { channel?: 'email' | 'phone' }) {
  fireEvent.change(screen.getByLabelText(/^Name/i), { target: { value: 'Ayush' } });
  fireEvent.change(screen.getByLabelText(/^City/i), { target: { value: 'Patna' } });
  fireEvent.change(screen.getByPlaceholderText(/Team size, scope, or timeline/i), {
    target: { value: 'Looking for seating.' },
  });
  if (options?.channel === 'email') {
    fireEvent.change(screen.getByLabelText(/^Email/i), {
      target: { value: 'test@oando.local' },
    });
  } else {
    fireEvent.change(screen.getByLabelText(/^Phone/i), {
      target: { value: '+91 8888888888' },
    });
  }
  fireEvent.click(screen.getByTestId('contact-teaser-consent'));
}

describe('ContactTeaser Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    executeAsync.mockReset();
  });

  afterEach(() => {
    // clearAllMocks only — restoreAllMocks would wipe the module-level useAction mock.
    vi.clearAllMocks();
  });

  it('renders inputs, labels, and CTA links correctly', () => {
    render(<ContactTeaser />);

    expect(screen.getByRole('heading', { name: /Share a brief/i })).toBeInTheDocument();
    expect(screen.getByTestId('contact-teaser-image')).toHaveAttribute(
      'src',
      '/assets/marketing/hero/pages/contact-oneandonly-bright.webp',
    );
    expect(screen.getByLabelText(/^Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^City/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Team size, scope, or timeline/i)).toBeInTheDocument();

    const waLink = screen.getByRole('link', { name: /WhatsApp/i });
    expect(waLink).toHaveAttribute('href', 'https://wa.me/12345?text=Need%20a%20direct%20workspace%20response%20for%20my%20project%20brief.');

    const phoneLink = screen.getByRole('link', { name: /Call team/i });
    expect(phoneLink).toHaveAttribute('href', 'tel:+91 99999 99999');
  });

  it('requires name, city, brief, consent, and a contact channel before submit is enabled', async () => {
    render(<ContactTeaser />);

    const submitBtn = screen.getByTestId('home-contact-teaser-submit');
    expect(submitBtn).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/^Name/i), { target: { value: 'Ayush' } });
    fireEvent.change(screen.getByLabelText(/^City/i), { target: { value: 'Patna' } });
    fireEvent.change(screen.getByPlaceholderText(/Team size, scope, or timeline/i), {
      target: { value: 'Looking for tables.' },
    });
    await waitFor(() => {
      expect(submitBtn).toBeDisabled();
    });

    fireEvent.click(screen.getByTestId('contact-teaser-consent'));
    await waitFor(() => {
      expect(submitBtn).toBeDisabled();
    });

    fireEvent.change(screen.getByLabelText(/^Phone/i), { target: { value: '+91 8888888888' } });
    await waitFor(() => {
      expect(submitBtn).toBeEnabled();
    });
    expect(executeAsync).not.toHaveBeenCalled();
  });

  it('exposes privacy consent and policy link', () => {
    render(<ContactTeaser />);
    expect(screen.getByTestId('contact-teaser-consent')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Privacy policy/i })).toHaveAttribute(
      'href',
      '/privacy/',
    );
  });

  it('submits form successfully via action when fields are valid', async () => {
    executeAsync.mockResolvedValue({
      data: {
        queryId: 'Q-TEASER-1',
        followUp: { email: null, whatsapp: null },
      },
    });

    render(<ContactTeaser />);
    fillRequiredTeaserFields({ channel: 'phone' });

    const submitBtn = screen.getByRole('button', { name: /Send Brief/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(executeAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Ayush',
          email: '',
          phone: '+91 8888888888',
          message: 'Looking for seating.\nCity: Patna',
          requirement: 'Workspace planning',
          preferredContact: 'phone',
          source: 'homepage-quick-brief',
          sourcePath: mockPathname,
          website: '',
          consent: true,
        }),
      );
    });

    await waitFor(() => {
      expect(trackContactSubmission).toHaveBeenCalledWith({
        pathname: mockPathname,
        surface: 'contact-teaser',
        source: 'homepage-quick-brief',
        status: 'success',
      });
    });

    expect(screen.getByText('Brief received. Our team will contact you shortly.')).toBeInTheDocument();
  });

  it('handles action serverError correctly', async () => {
    executeAsync.mockResolvedValue({
      serverError: 'Database offline',
    });

    render(<ContactTeaser />);
    fillRequiredTeaserFields({ channel: 'email' });
    fireEvent.change(screen.getByPlaceholderText(/Team size, scope, or timeline/i), {
      target: { value: 'Need pricing guidance.' },
    });

    const submitBtn = screen.getByRole('button', { name: /Send Brief/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(trackContactSubmission).toHaveBeenCalledWith({
        pathname: mockPathname,
        surface: 'contact-teaser',
        source: 'homepage-quick-brief',
        status: 'error',
      });
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Database offline');
  });

  it('tracks CTA click on external support link', () => {
    render(<ContactTeaser />);

    const waLink = screen.getByRole('link', { name: /WhatsApp/i });
    fireEvent.click(waLink);

    expect(trackSiteCtaClick).toHaveBeenCalledWith({
      href: expect.any(String),
      label: 'WhatsApp now',
      pathname: mockPathname,
      surface: 'contact-teaser',
    });
  });

  it('includes honeypot field and treats honest success envelope as success', async () => {
    executeAsync.mockResolvedValue({
      data: {
        queryId: 'submitted',
        followUp: { email: null, whatsapp: null },
      },
    });

    render(<ContactTeaser />);

    const honeypot = screen.getByTestId('contact-teaser-honeypot');
    expect(honeypot).toHaveAttribute('name', 'website');
    expect(honeypot).toHaveAttribute('tabIndex', '-1');

    fireEvent.change(screen.getByLabelText(/^Name/i), { target: { value: 'Bot' } });
    fireEvent.change(screen.getByLabelText(/^City/i), { target: { value: 'Spam' } });
    fireEvent.change(screen.getByLabelText(/^Email/i), { target: { value: 'bot@evil.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Team size, scope, or timeline/i), {
      target: { value: 'spam brief' },
    });
    fireEvent.change(honeypot, { target: { value: 'http://spam.example' } });
    fireEvent.click(screen.getByTestId('contact-teaser-consent'));
    fireEvent.click(screen.getByRole('button', { name: /Send Brief/i }));

    await waitFor(() => {
      expect(executeAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          website: 'http://spam.example',
          message: 'spam brief\nCity: Spam',
        }),
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText('Brief received. Our team will contact you shortly.'),
      ).toBeInTheDocument();
    });
  });

  it('surfaces rate-limit message from action serverError', async () => {
    executeAsync.mockResolvedValue({
      serverError: 'Too many submissions. Please try again after some time.',
    });

    render(<ContactTeaser />);
    fillRequiredTeaserFields({ channel: 'phone' });
    fireEvent.change(screen.getByPlaceholderText(/Team size, scope, or timeline/i), {
      target: { value: 'Need desks.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Send Brief/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Too many submissions. Please try again after some time.',
      );
    });
  });
});
