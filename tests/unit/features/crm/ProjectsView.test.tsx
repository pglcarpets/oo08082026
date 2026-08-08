import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ProjectsView from '@/features/crm/ProjectsView';

const mockProjects = [
  { id: '1', name: 'Project Alpha', clientId: 'c1', status: 'active' as const, notes: 'Brief for alpha', planIds: ['p1'], createdAt: '2026-06-25T00:00:00Z', updatedAt: '2026-06-26T00:00:00Z' },
  { id: '2', name: 'Project Beta', clientId: 'none', status: 'on_hold' as const, notes: '', planIds: [] as string[], createdAt: '2026-06-25T00:00:00Z', updatedAt: '2026-06-26T00:00:00Z' }
];
const mockClients = [
  { id: 'c1', name: 'Client Acme', company: 'Acme Corp' }
];

const mockAddProject = vi.fn();
const mockDeleteProject = vi.fn();

const mockStoreState = {
  projects: mockProjects,
  clients: mockClients,
  quotes: [],
  addProject: mockAddProject,
  deleteProject: mockDeleteProject,
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

describe('ProjectsView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render suite header in the view (layout-owned chrome)', () => {
    render(<ProjectsView embedded={false} />);
    expect(screen.queryByTestId('mock-global-nav-header')).not.toBeInTheDocument();
  });

  it('displays the projects statistics grid correctly', () => {
    render(<ProjectsView />);
    const grid = screen.getByLabelText('Project statistics');
    expect(grid).toHaveTextContent('Total Projects');
    expect(grid).toHaveTextContent('2');
    expect(grid).toHaveTextContent('Active Projects');
    expect(grid).toHaveTextContent('On Hold');
    expect(grid).toHaveTextContent('Completed');
    // Active = 1, On Hold = 1, Completed = 0 (Total = 2 already asserted)
    const values = Array.from(grid.querySelectorAll('.crm-projects-kpi p:last-child')).map(
      (el) => el.textContent,
    );
    expect(values).toEqual(['2', '1', '1', '0']);
  });

  it('groups and lists projects under client categories', () => {
    render(<ProjectsView />);

    expect(screen.getByRole('heading', { name: 'Client Acme' })).toBeInTheDocument();
    expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    expect(screen.getByText('Brief for alpha')).toBeInTheDocument();
    expect(screen.getByText('1 floor plan')).toBeInTheDocument();

    expect(screen.getByText('Unassigned Clients')).toBeInTheDocument();
    expect(screen.getByText('Project Beta')).toBeInTheDocument();
    expect(screen.getByText('0 floor plans')).toBeInTheDocument();
  });

  it('calls deleteProject when delete button is clicked', () => {
    render(<ProjectsView />);

    const deleteBtns = screen.getAllByTitle('Delete project');
    fireEvent.click(deleteBtns[0]); // delete project 1

    expect(mockDeleteProject).toHaveBeenCalledWith('1');
  });

  it('opens modal, configures and creates a new project', () => {
    render(<ProjectsView />);

    const newBtn = screen.getByRole('button', { name: /New Project/i });
    fireEvent.click(newBtn);

    const nameInput = screen.getByPlaceholderText('e.g. Nexus Office Level 4');
    const clientSelect = screen.getByRole('combobox', { name: /Client Association/i });
    const statusSelect = screen.getByRole('combobox', { name: /Initial Status/i });
    const notesInput = screen.getByPlaceholderText('Design specs, seat requirements...');

    fireEvent.change(nameInput, { target: { value: 'Project Gamma' } });
    fireEvent.change(clientSelect, { target: { value: 'c1' } });
    fireEvent.change(statusSelect, { target: { value: 'completed' } });
    fireEvent.change(notesInput, { target: { value: 'Finished layout design' } });

    const submitBtn = screen.getByRole('button', { name: 'Create Project' });
    fireEvent.click(submitBtn);

    expect(mockAddProject).toHaveBeenCalledWith({
      name: 'Project Gamma',
      clientId: 'c1',
      status: 'completed',
      notes: 'Finished layout design',
    });
  });

  it('renders empty state when there are no projects in store', () => {
    const previous = mockStoreState.projects;
    mockStoreState.projects = [];

    render(<ProjectsView />);

    expect(screen.getByText('No projects yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Get Started' })).toBeInTheDocument();

    mockStoreState.projects = previous;
  });
});
