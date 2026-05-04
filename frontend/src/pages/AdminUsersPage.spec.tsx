import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import AdminUsersPage from './AdminUsersPage';
import * as adminService from '@/services/adminService';

// Mock the admin service
vi.mock('@/services/adminService', () => ({
  getAdminUsers: vi.fn(),
  updateUserRole: vi.fn(),
  deleteAdminUser: vi.fn(),
}));

// Mock the components used within the page
vi.mock('@/components/admin/AdminUsersTable', () => ({
  AdminUsersTable: ({ onRefresh, onView, onEdit, onDelete }: any) => (
    <div>
      <button onClick={onRefresh}>Refresh</button>
      <button onClick={() => onView({ id: '1', firstName: 'John' })}>View</button>
      <button onClick={() => onEdit({ id: '1', firstName: 'John' })}>Edit</button>
      <button onClick={() => onDelete({ id: '1', firstName: 'John' })}>Delete</button>
    </div>
  ),
}));

vi.mock('@/components/admin/ViewUserModal', () => ({
  ViewUserModal: ({ isOpen }: any) => isOpen ? <div>View Modal</div> : null,
}));

vi.mock('@/components/admin/EditUserModal', () => ({
  EditUserModal: ({ isOpen, onSave }: any) => isOpen ? (
    <div>
      Edit Modal
      <button onClick={() => onSave({ id: '1', firstName: 'John' }, 'admin')}>Save</button>
    </div>
  ) : null,
}));

vi.mock('@/components/admin/DeleteUserModal', () => ({
  DeleteUserModal: ({ isOpen, onConfirm }: any) => isOpen ? (
    <div>
      Delete Modal
      <button onClick={() => onConfirm({ id: '1', firstName: 'John' })}>Confirm</button>
    </div>
  ) : null,
}));

vi.mock('@/components/admin/CreateUserModal', () => ({
  CreateUserModal: ({ isOpen }: any) => isOpen ? <div>Create Modal</div> : null,
}));

describe('AdminUsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (adminService.getAdminUsers as any).mockResolvedValue({
      data: [{ id: '1', firstName: 'John', email: 'john@example.com' }],
      meta: { totalPages: 1 },
    });
  });

  it('loads users on mount', async () => {
    await act(async () => {
      render(<AdminUsersPage />);
    });
    expect(adminService.getAdminUsers).toHaveBeenCalled();
  });

  it('opens create modal when button is clicked', async () => {
    await act(async () => {
      render(<AdminUsersPage />);
    });
    fireEvent.click(screen.getByText(/Créer un utilisateur/i));
    expect(screen.getByText('Create Modal')).toBeDefined();
  });

  it('handles user viewing', async () => {
    await act(async () => {
      render(<AdminUsersPage />);
    });
    fireEvent.click(screen.getByText('View'));
    expect(screen.getByText('View Modal')).toBeDefined();
  });

  it('handles user editing', async () => {
    await act(async () => {
      render(<AdminUsersPage />);
    });
    fireEvent.click(screen.getByText('Edit'));
    expect(screen.getByText('Edit Modal')).toBeDefined();

    await act(async () => {
        fireEvent.click(screen.getByText('Save'));
    });
    expect(adminService.updateUserRole).toHaveBeenCalledWith('1', { role: 'admin' });
  });

  it('handles user deletion', async () => {
    await act(async () => {
      render(<AdminUsersPage />);
    });
    fireEvent.click(screen.getByText('Delete'));
    expect(screen.getByText('Delete Modal')).toBeDefined();

    await act(async () => {
        fireEvent.click(screen.getByText('Confirm'));
    });
    expect(adminService.deleteAdminUser).toHaveBeenCalledWith('1');
  });
});
