import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Loading from '@/app/(site)/products/[category]/loading';

describe('Loading Component', () => {
  it('renders loading skeletons correctly', () => {
    const { container } = render(<Loading />);
    expect(container.firstChild).toHaveClass('w-full');
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
