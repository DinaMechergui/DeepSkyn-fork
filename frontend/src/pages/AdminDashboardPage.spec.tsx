import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminDashboardPage from './AdminDashboardPage';
import * as adminService from '@/services/adminService';

// Mock the admin service
vi.mock('@/services/adminService', () => ({
  getAdminStats: vi.fn(),
}));

describe('AdminDashboardPage', () => {
  const mockStats = {
    totalUsers: 100,
    totalAdmins: 5,
    totalModerators: 10,
    newUsersThisMonth: 15,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    (adminService.getAdminStats as any).mockReturnValue(new Promise(() => {}));
    
    render(
      <BrowserRouter>
        <AdminDashboardPage />
      </BrowserRouter>
    );

    expect(document.querySelector('.animate-spin')).toBeDefined();
  });

  it('renders stats correctly on success', async () => {
    (adminService.getAdminStats as any).mockResolvedValue(mockStats);

    await act(async () => {
      render(
        <BrowserRouter>
          <AdminDashboardPage />
        </BrowserRouter>
      );
    });

    expect(screen.getByText('Utilisateurs totaux')).toBeDefined();
    expect(screen.getByText('100')).toBeDefined();
    expect(screen.getByText('Administrateurs')).toBeDefined();
    expect(screen.getByText('5')).toBeDefined();
    expect(screen.getByText('Modérateurs')).toBeDefined();
    expect(screen.getByText('10')).toBeDefined();
    expect(screen.getByText('Nouveaux utilisateurs')).toBeDefined();
    expect(screen.getByText('15')).toBeDefined();
  });

  it('renders error message on failure', async () => {
    (adminService.getAdminStats as any).mockRejectedValue(new Error('Fetch failed'));

    await act(async () => {
      render(
        <BrowserRouter>
          <AdminDashboardPage />
        </BrowserRouter>
      );
    });

    expect(screen.getByText('Erreur')).toBeDefined();
    expect(screen.getByText('Fetch failed')).toBeDefined();
  });

  it('refresh button calls loadStats', async () => {
    (adminService.getAdminStats as any).mockResolvedValue(mockStats);

    await act(async () => {
      render(
        <BrowserRouter>
          <AdminDashboardPage />
        </BrowserRouter>
      );
    });

    const refreshButton = screen.getByText('Actualiser');
    await act(async () => {
      fireEvent.click(refreshButton);
    });

    expect(adminService.getAdminStats).toHaveBeenCalledTimes(2);
  });

  it('navigates to users page when button is clicked', async () => {
    (adminService.getAdminStats as any).mockResolvedValue(mockStats);

    await act(async () => {
      render(
        <BrowserRouter>
          <AdminDashboardPage />
        </BrowserRouter>
      );
    });

    const manageUsersLink = screen.getByRole('link', { name: /Gérer les utilisateurs/i });
    expect(manageUsersLink.getAttribute('href')).toBe('/admin/users');
  });
});
