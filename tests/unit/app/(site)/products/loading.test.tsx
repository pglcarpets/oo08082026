import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import ProductsLoading from '@/app/(site)/products/loading';

describe('ProductsLoading', () => {
  it('renders loading skeletons', () => {
    const { container } = render(<ProductsLoading />);
    
    // There should be 1 main skeleton + 6 product skeletons (each having 3 parts usually, but let's just check by class/elements)
    const pulses = container.querySelectorAll('.animate-pulse');
    // 1 header + 6 * 3 = 19
    expect(pulses.length).toBe(19);
  });
});
