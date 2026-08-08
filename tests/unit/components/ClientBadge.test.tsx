import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClientBadge } from '@/components/ClientBadge';

vi.mock('next/image', () => ({
  default: (props: { src: string; className?: string; alt?: string }) => (
    <img src={props.src} className={props.className} alt={props.alt ?? ''} />
  ),
}));

describe('ClientBadge Component', () => {
  it('renders name and sector correctly', () => {
    const { container } = render(<ClientBadge name="Acme Corp" sector="Tech" />);
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Tech')).toBeInTheDocument();
    expect(container.querySelector('.client-badge__location')).toBeNull();
  });

  it('renders location if provided', () => {
    render(<ClientBadge name="Acme Corp" sector="Tech" location="New York" />);
    expect(screen.getByText('New York')).toBeInTheDocument();
  });

  it('shows mapped logo from public client-logos when name is known', () => {
    const { container } = render(<ClientBadge name="Titan" sector="Manufacturing" />);
    const logo = container.querySelector('img.client-badge__logo');
    expect(logo).toHaveAttribute('src', '/assets/marketing/client-logos/Titan.png');
    expect(logo).toHaveAttribute('alt', 'Titan logo');
    expect(container.querySelector('.client-badge__monogram')).toBeNull();
  });

  it('falls back to monogram when no logo file is mapped', () => {
    const { container } = render(<ClientBadge name="Acme Corp" sector="Tech" />);
    expect(container.querySelector('.client-badge__monogram')).toHaveTextContent('AC');
    expect(container.querySelector('img.client-badge__logo')).toBeNull();
  });

  it('applies featured class if featured is true', () => {
    const { container } = render(<ClientBadge name="Acme Corp" sector="Tech" featured={true} />);
    const badge = container.querySelector('.client-badge');
    expect(badge?.classList.contains('client-badge--featured')).toBe(true);
  });

  it('does not apply featured class if featured is false', () => {
    const { container } = render(<ClientBadge name="Acme Corp" sector="Tech" featured={false} />);
    const badge = container.querySelector('.client-badge');
    expect(badge?.classList.contains('client-badge--featured')).toBe(false);
  });
});
