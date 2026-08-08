import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Reviews } from '@/components/Reviews';

// Mock @phosphor-icons/react
vi.mock('@phosphor-icons/react', () => ({
  Star: ({ className }: { className?: string }) => (
    <span className={`mock-star ${className}`} data-testid="star" />
  ),
}));

describe('Reviews Component', () => {
  const initialReviews = [
    { id: '1', user_name: 'John Doe', rating: 4, comment: 'Great product', created_at: '2026-01-01T00:00:00.000Z' },
    { id: '2', user_name: 'Jane Smith', rating: 5, comment: 'Amazing quality', created_at: '2026-01-02T00:00:00.000Z' }
  ];

  it('renders initial reviews and average rating correctly', () => {
    render(<Reviews productId="prod_1" initialReviews={initialReviews} />);
    
    // Check average rating ( (4+5)/2 = 4.5 )
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('2 reviews')).toBeInTheDocument();

    // Check review list details
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Great product')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Amazing quality')).toBeInTheDocument();
  });

  it('renders empty state if no reviews are provided', () => {
    render(<Reviews productId="prod_1" initialReviews={[]} />);
    expect(screen.getByText('0.0')).toBeInTheDocument();
    expect(screen.getByText('0 reviews')).toBeInTheDocument();
    expect(screen.getByText('No reviews yet.')).toBeInTheDocument();
  });

  it('allows rating selection and submitting a new review', async () => {
    render(<Reviews productId="prod_1" initialReviews={[]} />);

    // Click rating star button 4
    const starButtons = screen.getAllByRole('button', { name: /Rate \d stars/ });
    fireEvent.click(starButtons[3]); // Rating 4
    expect(starButtons[3]).toHaveAttribute('aria-pressed', 'true');

    // Fill out form fields
    const nameInput = screen.getByLabelText('Name');
    const commentInput = screen.getByLabelText('Review');
    
    fireEvent.change(nameInput, { target: { value: 'Alice Johnson' } });
    fireEvent.change(commentInput, { target: { value: 'Excellent comfort and design.' } });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: 'Submit Review' });
    fireEvent.click(submitBtn);

    // Should show submitting state
    expect(screen.getByText('Submitting...')).toBeInTheDocument();

    // Wait for submission to complete
    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    expect(screen.getByText('Excellent comfort and design.')).toBeInTheDocument();
    expect(screen.getByText('4.0')).toBeInTheDocument();
    expect(screen.getByText('1 reviews')).toBeInTheDocument();

    // Fields should clear
    expect(nameInput).toHaveValue('');
    expect(commentInput).toHaveValue('');
  });

  it('does not submit if required fields are missing', () => {
    render(<Reviews productId="prod_1" initialReviews={[]} />);
    const submitBtn = screen.getByRole('button', { name: 'Submit Review' });
    
    fireEvent.click(submitBtn);
    // Should not show submitting or add review
    expect(screen.queryByText('Submitting...')).toBeNull();
  });
});
