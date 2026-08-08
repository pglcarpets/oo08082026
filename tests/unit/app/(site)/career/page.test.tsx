import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Page from '@/app/(site)/career/page';

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async (namespace: string) => {
    const t = (key: string) => `${namespace}.${key}`;
    t.raw = (key: string) => {
      if (key === 'pillars') {
        return [{ title: 'Pillar', detail: 'Detail', icon: 'users' }];
      }
      if (key === 'processSteps') {
        return [{ title: 'Step', detail: 'Detail' }];
      }
      if (key === 'openingsAvailableTemplate') {
        return '{count} roles available';
      }
      return [];
    };
    return t;
  }),
}));

vi.mock('@/components/career/CareerPageView', () => ({
  CareerPageView: () => <div data-testid="CareerPageView" />,
}));

describe('app/(site)/career/page.tsx', () => {
  it('renders successfully with career JobPosting JSON-LD', async () => {
    const { container } = render(await Page());
    expect(screen.getByTestId('CareerPageView')).toBeInTheDocument();
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBeGreaterThanOrEqual(2);
    const payloads = [...scripts].map((el) => el.innerHTML);
    expect(payloads.some((p) => p.includes('JobPosting'))).toBe(true);
    expect(payloads.some((p) => p.includes('WebPage'))).toBe(true);
  });
});
