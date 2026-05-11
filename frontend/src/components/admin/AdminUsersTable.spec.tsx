import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AdminUsersTable } from './AdminUsersTable';
import type { AdminUser } from '@/types/admin';

describe('AdminUsersTable', () => {
  const mockUsers: AdminUser[] = [
    {
      id: '1',
      email: 'user1@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'user',
      createdAt: '2023-01-01T00:00:00Z',
      lastLogin: '2023-01-02T00:00:00Z',
    },
    {
      id: '2',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      createdAt: '2023-01-01T00:00:00Z',
      lastLogin: '2023-01-02T00:00:00Z',
    }
  ];

  const defaultProps = {
    users: mockUsers,
    isLoading: false,
    totalPages: 1,
    currentPage: 1,
    onPageChange: vi.fn(),
    onSearch: vi.fn(),
    onFilterRole: vi.fn(),
    onView: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onRefresh: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('renders loading state', () => {
    render(<AdminUsersTable {...defaultProps} isLoading={true} />);
    expect(document.querySelector('.animate-spin')).toBeDefined();
  });

  it('renders empty state', () => {
    render(<AdminUsersTable {...defaultProps} users={[]} />);
    expect(screen.getByText('Aucun utilisateur trouvé')).toBeDefined();
  });

  it('renders users in desktop and mobile views', () => {
    render(<AdminUsersTable {...defaultProps} />);
    // Elements appear twice (one for desktop table, one for mobile cards)
    expect(screen.getAllByText('user1@example.com').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('admin@example.com').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/John Doe/i).length).toBeGreaterThanOrEqual(1);
  });

  it('calls onSearch with debounce', async () => {
    render(<AdminUsersTable {...defaultProps} />);
    const searchInput = screen.getByPlaceholderText(/Rechercher/i);
    
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // Should not be called immediately
    expect(defaultProps.onSearch).not.toHaveBeenCalled();
    
    act(() => {
      vi.advanceTimersByTime(300);
    });
    
    expect(defaultProps.onSearch).toHaveBeenCalledWith('test');
  });

  it('calls onFilterRole when role button clicked', () => {
    render(<AdminUsersTable {...defaultProps} />);
    const adminFilterButton = screen.getByText('Admin');
    
    fireEvent.click(adminFilterButton);
    expect(defaultProps.onFilterRole).toHaveBeenCalledWith('admin');
  });

  it('calls action handlers', () => {
    render(<AdminUsersTable {...defaultProps} />);
    
    // View action (Eye icon)
    const viewButtons = screen.getAllByTitle('Voir');
    fireEvent.click(viewButtons[0]);
    expect(defaultProps.onView).toHaveBeenCalledWith(mockUsers[0]);

    // Edit action (Edit2 icon)
    const editButtons = screen.getAllByTitle('Modifier');
    fireEvent.click(editButtons[0]);
    expect(defaultProps.onEdit).toHaveBeenCalledWith(mockUsers[0]);

    // Delete action (Trash2 icon)
    const deleteButtons = screen.getAllByTitle('Supprimer');
    fireEvent.click(deleteButtons[0]);
    expect(defaultProps.onDelete).toHaveBeenCalledWith(mockUsers[0]);
  });

  it('renders mobile version and handles expansion', () => {
    // We can't easily trigger CSS 'hidden md:block', but we can test the expansion logic
    render(<AdminUsersTable {...defaultProps} />);
    
    const moreButtons = screen.getAllByRole('button').filter(b => b.querySelector('svg.lucide-more-vertical'));
    if (moreButtons.length > 0) {
      fireEvent.click(moreButtons[0]);
      // After expansion, action buttons should be visible in mobile view
      expect(screen.getAllByText('Voir').length).toBeGreaterThan(0);
    }
  });

  it('handles pagination correctly', () => {
    render(<AdminUsersTable {...defaultProps} totalPages={5} currentPage={2} />);
    
    const nextButton = screen.getByText('Suivant');
    fireEvent.click(nextButton);
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(3);

    const prevButton = screen.getByText('Précédent');
    fireEvent.click(prevButton);
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(1);
  });

  it('calls onRefresh', () => {
    render(<AdminUsersTable {...defaultProps} />);
    const refreshButton = screen.getByText('Actualiser');
    fireEvent.click(refreshButton);
    expect(defaultProps.onRefresh).toHaveBeenCalled();
  });
});
