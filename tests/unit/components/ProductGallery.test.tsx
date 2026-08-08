import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductGallery } from '@/components/ProductGallery';

// Mock next/image
describe('ProductGallery Component', () => {
  const images = ['/img1.jpg', '/img2.jpg', '/img3.jpg'];
  const productName = 'Chair';

  it('renders thumbnails and main image correctly', () => {
    render(<ProductGallery images={images} productName={productName} />);
    
    // Check aria-label of the region
    expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Chair gallery');
    
    // Check main image rendering
    const mainImg = screen.getByAltText('Primary product gallery image of Chair');
    expect(mainImg).toHaveAttribute('src', '/img1.jpg');

    // Check count badge
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('uses fallback placeholder when images array is empty', () => {
    render(<ProductGallery images={[]} productName={productName} />);
    const fallbackImg = screen.getByAltText('Primary product gallery image of Chair');
    expect(fallbackImg).toBeInTheDocument();
    expect(fallbackImg).toHaveAttribute('src', '/assets/marketing/brand/logos/logo-sharp.png');
  });

  it('changes selected image on thumbnail click', () => {
    render(<ProductGallery images={images} productName={productName} />);
    
    const secondThumb = screen.getByRole('button', { name: 'Show gallery image 2 of 3 for Chair' });
    fireEvent.click(secondThumb);

    const mainImg = screen.getByAltText('Primary product gallery image of Chair');
    expect(mainImg).toHaveAttribute('src', '/img2.jpg');
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('handles arrow key navigation correctly', () => {
    render(<ProductGallery images={images} productName={productName} />);
    const gallery = screen.getByRole('region');

    // Press ArrowRight -> moves to index 1
    fireEvent.keyDown(gallery, { key: 'ArrowRight' });
    expect(screen.getByText('2 / 3')).toBeInTheDocument();

    // Press ArrowRight again -> moves to index 2
    fireEvent.keyDown(gallery, { key: 'ArrowRight' });
    expect(screen.getByText('3 / 3')).toBeInTheDocument();

    // Press ArrowRight again -> wraps around to 0
    fireEvent.keyDown(gallery, { key: 'ArrowRight' });
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    // Press ArrowLeft -> wraps around to index 2
    fireEvent.keyDown(gallery, { key: 'ArrowLeft' });
    expect(screen.getByText('3 / 3')).toBeInTheDocument();

    // Press ArrowLeft again -> moves to index 1
    fireEvent.keyDown(gallery, { key: 'ArrowLeft' });
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('ensures safeIndex is within bounds when images change', () => {
    const { rerender } = render(<ProductGallery images={images} productName={productName} />);
    
    // Select last image (index 2)
    const thirdThumb = screen.getByRole('button', { name: 'Show gallery image 3 of 3 for Chair' });
    fireEvent.click(thirdThumb);
    expect(screen.getByText('3 / 3')).toBeInTheDocument();

    // Rerender with fewer images (length 1) — count badge hidden for single photo
    rerender(<ProductGallery images={['/only-one.jpg']} productName={productName} />);
    expect(screen.queryByText('1 / 1')).not.toBeInTheDocument();

    const mainImg = screen.getByAltText('Primary product gallery image of Chair');
    expect(mainImg).toHaveAttribute('src', '/only-one.jpg');
  });
});
