import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Label } from '@/components/ui/Label';

describe('Label Component', () => {
  it('renders label with children', () => {
    render(<Label data-testid="label">Test Label</Label>);
    const label = screen.getByTestId('label');
    expect(label).toBeInTheDocument();
    expect(label).toHaveTextContent('Test Label');
  });

  it('merges default classes and custom classNames', () => {
    render(<Label className="custom-class" data-testid="label">Test Label</Label>);
    const label = screen.getByTestId('label');
    expect(label.className).toContain('custom-class');
    expect(label.className).toContain('admin-field__label');
  });

  it('passes standard HTML attributes like htmlFor', () => {
    render(<Label htmlFor="email-field" data-testid="label">Email</Label>);
    const label = screen.getByTestId('label');
    expect(label).toHaveAttribute('for', 'email-field');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLLabelElement>();
    render(<Label ref={ref} data-testid="label" />);
    expect(ref.current).toBeInTheDocument();
  });
});
