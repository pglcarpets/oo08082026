import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { CollectionsSectionHeading } from '@/components/home/CollectionsSectionHeading';
import { HOMEPAGE_COLLECTIONS_CONTENT } from '@/features/site/data/homepage';

describe('CollectionsSectionHeading Component', () => {
  it('renders heading with default tag (h2) and content', () => {
    const { container } = render(<CollectionsSectionHeading />);
    const heading = container.querySelector('h2');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent(HOMEPAGE_COLLECTIONS_CONTENT.titleLead);
    expect(heading).toHaveTextContent(HOMEPAGE_COLLECTIONS_CONTENT.titleAccent);
  });

  it('renders heading with custom tag (h1)', () => {
    const { container } = render(<CollectionsSectionHeading as="h1" />);
    const heading = container.querySelector('h1');
    expect(heading).toBeInTheDocument();
    expect(container.querySelector('h2')).toBeNull();
  });
});
