import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Page from '@/app/(site)/contact/page';

vi.mock('@/components/contact/ContactPageView', () => ({
  ContactPageView: () => <div data-testid="ContactPageView" />
}));

describe('app/(site)/contact/page.tsx', () => {
  it('renders successfully', async () => {
    const page = await Page({});
    render(page);
    expect(screen.getByTestId('ContactPageView')).toBeInTheDocument();
  });
});
