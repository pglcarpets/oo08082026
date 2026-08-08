import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OneAndOnlyLogo } from '@/components/ui/Logo';

describe('OneAndOnlyLogo Component', () => {
  it('renders default orange variant logo correctly', () => {
    render(<OneAndOnlyLogo />);

    const img = screen.getByRole("img", { name: "One&Only Furniture" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/assets/marketing/brand/logos/logo-sharp.png');
    expect(img).toHaveAttribute('alt', 'One&Only Furniture');
    expect(img).toHaveAttribute('width', '1024');
    expect(img).toHaveAttribute('height', '263');
    expect(img.getAttribute('data-priority')).toBe('true');
    expect(img.getAttribute('data-unoptimized')).toBe('true');
  });

  it('renders white variant logo when variant is set to white', () => {
    render(<OneAndOnlyLogo variant="white" />);

    const img = screen.getByRole("img", { name: "One&Only Furniture" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/assets/marketing/brand/logos/logo-sharp-white.png');
  });

  it('renders mark monogram for admin compact chrome', () => {
    render(<OneAndOnlyLogo variant="mark" />);

    const img = screen.getByRole("img", { name: "One&Only" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/assets/marketing/brand/logos/OneandOnlySmall-LogoHS.png');
    expect(img).toHaveAttribute('width', '192');
    expect(img).toHaveAttribute('height', '192');
  });

  it('applies custom className to wrapper', () => {
    const { container } = render(<OneAndOnlyLogo className="custom-wrapper-class" />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('custom-wrapper-class');
    expect(wrapper.className).toContain('relative');
  });
});

