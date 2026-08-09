import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { HomepageHero } from '@/components/home/HomepageHero';
import {
  HOMEPAGE_HERO_IMAGES,
  joinAccessibleTitleLines,
} from '@/features/site/data/homepage';
import enMessages from '@/i18n/messages/en.json';
import type * as GsapMotionModule from '@/lib/helpers/gsapMotion';

const hero = enMessages.home.hero;
const heroTitle = hero.title as string[];
const accessibleTitle = joinAccessibleTitleLines(heroTitle);
/** Glued DOM text that block-level line spans produce without an accessible join. */
const gluedTitle = heroTitle.join('');

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

vi.mock('next/image', () => ({
  default: (props: { alt: string; src: string }) => (
    <img alt={props.alt} src={props.src} />
  ),
}));

vi.mock('@/lib/analytics/siteEvents', () => ({
  trackSiteCtaClick: vi.fn(),
  handlePlannerEntryNavigation: vi.fn(),
}));

vi.mock('@phosphor-icons/react', () => ({
  ArrowRight: () => <span data-testid="arrow-right" />,
  SealCheck: () => <span data-testid="seal-check" />
}));

vi.mock('@gsap/react', () => ({
  useGSAP: () => {},
}));

vi.mock('gsap', () => ({
  default: {
    context: (fn: () => void) => {
      fn();
      return { revert: () => {} };
    },
    from: () => {},
    to: () => {},
    registerPlugin: () => {},
  },
}));

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {},
}));

vi.mock('@/lib/helpers/gsapMotion', async (importOriginal) => {
  const actual = await importOriginal<typeof GsapMotionModule>();
  return {
    ...actual,
    registerGsapPlugins: () => {},
    gsapReducedMotion: () => true,
  };
});

vi.mock('@/lib/client/afterIdle', () => ({
  runAfterIdle: (task: () => void) => {
    task();
    return () => {};
  },
  runAfterIdleOrInteraction: (task: () => void) => {
    task();
    return () => {};
  },
}));

describe('HomepageHero Component', () => {
  it('exposes exact accessible h1 name with spaces between animated lines (SF-01 / SITE-HOME-02 / SITE-SEO-01)', () => {
    render(<HomepageHero />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveAttribute('id', 'home-hero-heading');
    expect(heading).toHaveAccessibleName(accessibleTitle);
    expect(accessibleTitle).toBe('Spaces that work harder');
    expect(accessibleTitle).not.toMatch(/workas|asyour|workharder/);
    expect(accessibleTitle).not.toBe(gluedTitle);
    expect(heading).not.toHaveAccessibleName(gluedTitle);

    for (const line of heroTitle) {
      expect(within(heading).getAllByText(line, { exact: false }).length).toBeGreaterThan(0);
    }
  });

  it('renders hero title, proof panel, and full-bleed background image', () => {
    render(<HomepageHero />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: accessibleTitle,
      }),
    ).toBeInTheDocument();

    heroTitle.forEach((line) => {
      expect(screen.getByText(line)).toBeInTheDocument();
    });

    expect(screen.getByText(hero.kicker)).toBeInTheDocument();

    const primaryBtn = screen.getByRole('link', { name: hero.secondaryCta.label });
    expect(primaryBtn).toHaveAttribute('href', hero.secondaryCta.href);

    expect(screen.queryByRole('link', { name: hero.primaryCta.label })).not.toBeInTheDocument();

    expect(screen.getByText(hero.glassProof.badge)).toBeInTheDocument();
    expect(screen.getByText(hero.glassProof.lead)).toBeInTheDocument();

    const heroImage = screen.getByRole('img', { name: HOMEPAGE_HERO_IMAGES[0].alt });
    expect(heroImage).toHaveAttribute('src', HOMEPAGE_HERO_IMAGES[0].src);
    expect(
      screen.getByRole('button', { name: /Show project image 1 of/i }),
    ).toBeInTheDocument();
  });

  it('tracks hero CTAs via links', () => {
    render(<HomepageHero />);

    const browseProducts = screen.getByRole('link', {
      name: hero.secondaryCta.label,
    });
    expect(browseProducts).toHaveAttribute('href', hero.secondaryCta.href);
    expect(screen.queryByRole('link', { name: hero.primaryCta.label })).not.toBeInTheDocument();
  });
});
