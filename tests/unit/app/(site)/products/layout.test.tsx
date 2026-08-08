import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import ProductsLayout from '@/app/(site)/products/layout';

describe('ProductsLayout', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <ProductsLayout>
        <div>Test Child</div>
      </ProductsLayout>
    );

    expect(getByText('Test Child')).toBeInTheDocument();
  });
});
