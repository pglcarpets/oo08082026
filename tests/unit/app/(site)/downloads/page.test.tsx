import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Page from '@/app/(site)/downloads/page';

vi.mock('@/components/site/EditorialHeroMedia', () => ({
  EditorialHeroMedia: () => <div data-testid="Hero" />
}));
vi.mock('@/components/shared/ContactTeaser', () => ({
  ContactTeaser: () => <div data-testid="ContactTeaser" />
}));
vi.mock('@/components/shared/SectionIntro', () => ({
  SectionIntro: ({ title }: { title: string }) => <div data-testid="SectionIntro">{title}</div>
}));
vi.mock('@/components/shared/RouteActionCard', () => ({
  RouteActionCard: () => <div data-testid="RouteActionCard" />
}));
vi.mock('@/components/ui/TrackedLink', () => ({
  TrackedLink: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('app/(site)/downloads/page.tsx', () => {
  it('renders successfully', () => {
    render(<Page />);
    expect(screen.getByTestId('Hero')).toBeInTheDocument();
    expect(screen.getByTestId('ContactTeaser')).toBeInTheDocument();
  });
});
