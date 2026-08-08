import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import QuotesView from '@/features/crm/QuotesView';

const mockQuotes = [
  { id: 'q1', title: 'Quote Alpha', clientId: 'c1', projectId: 'p1', planId: 'pl1', items: [], totalAmount: 50000, status: 'approved' as const, updatedAt: '2026-06-26T00:00:00Z' },
  { id: 'q2', title: 'Quote Beta', clientId: 'none', projectId: 'none', planId: 'pl2', items: [], totalAmount: 120000, status: 'sent' as const, updatedAt: '2026-06-26T00:00:00Z' }
];
const mockClients = [
  { id: 'c1', name: 'Client Acme', company: 'Acme Corp' }
];
const mockProjects = [
  { id: 'p1', name: 'Project Alpha' }
];

const mockAddQuote = vi.fn();
const mockUpdateQuote = vi.fn();
const mockDeleteQuote = vi.fn();

const mockStoreState = {
  quotes: mockQuotes,
  clients: mockClients,
  projects: mockProjects,
  addQuote: mockAddQuote,
  updateQuote: mockUpdateQuote,
  deleteQuote: mockDeleteQuote,
  seedDemoData: vi.fn(),
  clearAll: vi.fn(),
  exportSnapshot: vi.fn(() => ({ version: 1 as const, exportedAt: '', clients: [], projects: [], quotes: [] })),
  importSnapshot: vi.fn(() => true),
};

vi.mock('@/features/crm/stores/crmStore', () => ({
  useCrmStore: (selector?: (s: typeof mockStoreState) => unknown) =>
    typeof selector === 'function' ? selector(mockStoreState) : mockStoreState,
}));

vi.mock('@/features/crm/CrmWorkspaceBanner', () => ({
  CrmWorkspaceBanner: () => <div data-testid="crm-workspace-banner">Browser-only CRM</div>,
}));

vi.mock('@/features/shared/shell/GlobalNavHeader', () => ({
  GlobalNavHeader: () => <div data-testid="mock-global-nav-header">Header</div>,
}));

describe('QuotesView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render suite header in the view (layout-owned chrome)', () => {
    render(<QuotesView embedded={false} />);
    expect(screen.queryByTestId('mock-global-nav-header')).not.toBeInTheDocument();
  });

  it('displays the correct financial stats summaries', () => {
    render(<QuotesView />);

    expect(screen.getByText('Closed Approved').nextElementSibling).toHaveTextContent('₹50,000');
    expect(screen.getByText('Active In-Flight').nextElementSibling).toHaveTextContent('₹1,20,000');
    expect(screen.getByText('Total Quotes').nextElementSibling).toHaveTextContent('2');
  });

  it('filters deal cards based on search query', () => {
    render(<QuotesView />);

    const searchInput = screen.getByPlaceholderText('Search deals, clients, or projects...');
    expect(screen.getByText('Quote Alpha')).toBeInTheDocument();
    expect(screen.getByText('Quote Beta')).toBeInTheDocument();

    // Search by client name
    fireEvent.change(searchInput, { target: { value: 'Acme' } });
    expect(screen.getByText('Quote Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Quote Beta')).not.toBeInTheDocument();
  });

  it('displays quotes in their respective status columns', () => {
    render(<QuotesView />);

    const approvedColumnHeader = screen.getByText('Approved');
    expect(approvedColumnHeader).toBeInTheDocument();
    // Approved total value: ₹50,000
    expect(approvedColumnHeader.parentElement?.nextElementSibling).toHaveTextContent('₹50,000');

    const sentColumnHeader = screen.getByText('Sent');
    expect(sentColumnHeader).toBeInTheDocument();
    expect(sentColumnHeader.parentElement?.nextElementSibling).toHaveTextContent('₹1,20,000');
  });

  it('calls updateQuote when status column select changes', () => {
    render(<QuotesView />);

    const select = screen.getByDisplayValue('Move to Approved'); // Quote Alpha
    fireEvent.change(select, { target: { value: 'sent' } });

    expect(mockUpdateQuote).toHaveBeenCalledWith('q1', { status: 'sent' });
  });

  it('calls deleteQuote when delete button clicked', () => {
    render(<QuotesView />);

    const deleteBtn = screen.getByRole('button', { name: /Delete quote Quote Alpha/i });
    fireEvent.click(deleteBtn);

    expect(mockDeleteQuote).toHaveBeenCalledWith('q1');
  });

  it('opens modal, configures and creates a new quote', () => {
    render(<QuotesView />);

    const openBtn = screen.getByRole('button', { name: /Create Quote/i });
    fireEvent.click(openBtn);

    const titleInput = screen.getByPlaceholderText('e.g. Nexus Tech Furnishing Phase 1');
    const clientSelect = screen.getByRole('combobox', { name: /Client Account/i });
    const projectSelect = screen.getByRole('combobox', { name: /Project Association/i });
    const amountInput = screen.getByPlaceholderText('Enter deal value');
    const stageSelect = screen.getByRole('combobox', { name: /Pipeline Stage/i });

    fireEvent.change(titleInput, { target: { value: 'Phase 2 Deal' } });
    fireEvent.change(clientSelect, { target: { value: 'c1' } });
    fireEvent.change(projectSelect, { target: { value: 'p1' } });
    fireEvent.change(amountInput, { target: { value: '75000' } });
    fireEvent.change(stageSelect, { target: { value: 'draft' } });

    const saveBtn = screen.getByRole('button', { name: 'Save Quote' });
    fireEvent.click(saveBtn);

    expect(mockAddQuote).toHaveBeenCalledWith({
      title: 'Phase 2 Deal',
      clientId: 'c1',
      projectId: 'p1',
      planId: expect.stringContaining('plan-'),
      items: [],
      totalAmount: 75000,
      status: 'draft',
    });
  });
});
