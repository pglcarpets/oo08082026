import '@/tests/helpers/nextIntlServerEnMock';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Page from '@/app/(site)/about/page';

describe('app/(site)/about/page.tsx', () => {
  it('renders successfully', async () => {
    const jsx = await Page();
    render(jsx);
    expect(screen.getByTestId('home-marketing-layout')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /interiors executed with craft/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('about-hero')).toBeInTheDocument();
    expect(screen.getByTestId('about-story')).toBeInTheDocument();
  });
});
