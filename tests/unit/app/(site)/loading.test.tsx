import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Loading from '@/app/(site)/loading';

describe('app/(site)/loading.tsx', () => {
  it('renders loading indicator', () => {
    render(<Loading />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
