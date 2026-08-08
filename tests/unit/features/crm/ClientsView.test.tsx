import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ClientsView from '@/features/crm/ClientsView';

const mockClients = [
  { id: '1', name: 'John Doe', company: 'Nexus Tech', email: 'john@nexus.com', phone: '+919999', address: '123 St', notes: 'Prefers mesh chairs' },
  { id: '2', name: 'Alice Smith', company: '', email: 'alice@test.com', phone: '', address: '', notes: '' }
];
const mockProjects = [
  { id: 'p1', name: 'Office Fitout', clientId: '1', status: 'in_progress' }
];

const mockAddClient = vi.fn();
const mockDeleteClient = vi.fn();

const mockStoreState = {
  clients: mockClients,
  projects: mockProjects,
  quotes: [],
  addClient: mockAddClient,
  deleteClient: mockDeleteClient,
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

describe('ClientsView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render suite header in the view (layout-owned chrome)', () => {
    render(<ClientsView embedded={false} />);
    expect(screen.queryByTestId('mock-global-nav-header')).not.toBeInTheDocument();
  });

  it('does not render suite header when embedded', () => {
    render(<ClientsView embedded={true} />);
    expect(screen.queryByTestId('mock-global-nav-header')).not.toBeInTheDocument();
  });

  it('displays the stats correctly', () => {
    render(<ClientsView />);
    expect(screen.getByText('Total Clients').nextElementSibling).toHaveTextContent('2');
    expect(screen.getByText('Corporate Accounts').nextElementSibling).toHaveTextContent('1');
    expect(screen.getByText('Linked Projects').nextElementSibling).toHaveTextContent('1');
  });

  it('filters clients list based on search query', () => {
    render(<ClientsView />);

    const searchInput = screen.getByPlaceholderText('Search by name, company, or email...');
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();

    // Filter to John
    fireEvent.change(searchInput, { target: { value: 'Nexus' } });
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument();
  });

  it('shows empty state when no clients match search query', () => {
    render(<ClientsView />);
    const searchInput = screen.getByPlaceholderText('Search by name, company, or email...');
    fireEvent.change(searchInput, { target: { value: 'nobody' } });

    expect(screen.getByText('No clients found')).toBeInTheDocument();
  });

  it('selects and displays client detail, notes, and associated projects', () => {
    render(<ClientsView />);

    // Click John Doe
    fireEvent.click(screen.getByText('John Doe'));

    // Sidebar should display details
    expect(screen.getByRole('link', { name: 'john@nexus.com' })).toBeInTheDocument();
    expect(screen.getByText('+919999')).toBeInTheDocument();
    expect(screen.getByText('123 St')).toBeInTheDocument();
    expect(screen.getByText('Prefers mesh chairs')).toBeInTheDocument();

    // Project should be listed
    expect(screen.getByText('Office Fitout')).toBeInTheDocument();
    expect(screen.getByText(/in progress/i)).toBeInTheDocument();

    // Click Alice Smith
    fireEvent.click(screen.getByText('Alice Smith'));
    expect(screen.getByText('No projects linked to this client yet.')).toBeInTheDocument();

    // Close details
    const closeBtn = screen.getByRole('button', { name: /Close client details/i });
    fireEvent.click(closeBtn);
    expect(screen.getByText('Select a contact')).toBeInTheDocument();
  });

  it('calls deleteClient when delete button is clicked', () => {
    render(<ClientsView />);

    // John Doe delete button
    const deleteBtns = screen.getAllByTitle('Delete client');
    fireEvent.click(deleteBtns[0]);

    expect(mockDeleteClient).toHaveBeenCalledWith('1');
  });

  it('opens modal, fills out form, and submits new client', () => {
    render(<ClientsView />);

    const newBtn = screen.getByRole('button', { name: /New Client/i });
    fireEvent.click(newBtn);

    // Form fields in modal
    const nameInput = screen.getByPlaceholderText('Full Name');
    const companyInput = screen.getByPlaceholderText('e.g. Nexus Tech');
    const emailInput = screen.getByPlaceholderText('name@company.com');
    const phoneInput = screen.getByPlaceholderText('+91...');
    const addressInput = screen.getByPlaceholderText('Office Address');
    const notesInput = screen.getByPlaceholderText('Client preferences, project scoping details...');

    fireEvent.change(nameInput, { target: { value: 'Bob Vance' } });
    fireEvent.change(companyInput, { target: { value: 'Vance Refrigeration' } });
    fireEvent.change(emailInput, { target: { value: 'bob@vance.com' } });
    fireEvent.change(phoneInput, { target: { value: '+918888' } });
    fireEvent.change(addressInput, { target: { value: 'Scranton' } });
    fireEvent.change(notesInput, { target: { value: 'Refrigeration units' } });

    // Submit
    const saveBtn = screen.getByRole('button', { name: 'Save Client' });
    fireEvent.click(saveBtn);

    expect(mockAddClient).toHaveBeenCalledWith({
      name: 'Bob Vance',
      company: 'Vance Refrigeration',
      email: 'bob@vance.com',
      phone: '+918888',
      address: 'Scranton',
      notes: 'Refrigeration units',
    });
  });
});
