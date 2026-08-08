import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionIntro } from '@/components/shared/SectionIntro';

describe('SectionIntro Component', () => {
  it('renders title, kicker, and description in light tone by default', () => {
    render(
      <SectionIntro
        kicker="Label kicker"
        title="Main Title"
        description="Detailed description goes here."
      />
    );

    const kicker = screen.getByText('Label kicker');
    const title = screen.getByText('Main Title');
    const desc = screen.getByText('Detailed description goes here.');

    expect(kicker).toBeInTheDocument();
    expect(kicker).toHaveClass('text-body');

    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('home-heading');

    expect(desc).toBeInTheDocument();
    expect(desc).toHaveClass('text-body');
  });

  it('renders title accent with correct theme classes', () => {
    const { rerender } = render(
      <SectionIntro
        title="Main Title"
        titleAccent="Stressed Phrase"
        tone="light"
      />
    );

    const accent = screen.getByText('Stressed Phrase');
    expect(accent).toHaveClass('text-accent-italic');

    // Switch to dark tone
    rerender(
      <SectionIntro
        title="Main Title"
        titleAccent="Stressed Phrase"
        tone="dark"
      />
    );

    const darkAccent = screen.getByText('Stressed Phrase');
    expect(darkAccent).toHaveClass('text-accent-italic-on-dark');
  });

  it('correctly formats element styles for dark tone', () => {
    render(
      <SectionIntro
        kicker="Label kicker"
        title="Main Title"
        description="Detailed description."
        tone="dark"
      />
    );

    const kicker = screen.getByText('Label kicker');
    expect(kicker).toHaveClass('text-inverse-muted');

    const desc = screen.getByText('Detailed description.');
    expect(desc).toHaveClass('text-inverse-body');
  });
});
