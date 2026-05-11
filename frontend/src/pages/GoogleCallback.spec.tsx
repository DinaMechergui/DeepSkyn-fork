import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import GoogleCallback from './GoogleCallback';
import { BrowserRouter } from 'react-router-dom';
import GoogleRealOAuthService from '@/services/googleRealOAuthService';
import { aiService } from '@/services/aiService';
import { historyService } from '@/services/historyService';
import { setSession } from '@/lib/authSession';

// Mock dependencies
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/lib/authSession', () => ({
  setSession: vi.fn(),
}));

vi.mock('@/services/googleRealOAuthService', () => ({
  default: {
    getRealGoogleUserInfo: vi.fn(),
    storeUserInfo: vi.fn(),
  }
}));

vi.mock('@/services/aiService', () => ({
  aiService: {
    verifyIdentity: vi.fn(),
  }
}));

vi.mock('@/services/historyService', () => ({
  historyService: {
    recordLoginAttempt: vi.fn(),
  }
}));

// Mock fetch
global.fetch = vi.fn();

describe('GoogleCallback Component', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock window.location
    const mockLocation = {
      href: 'http://localhost:3000/auth/callback#id_token=test_id&access_token=test_access',
      hash: '#id_token=test_id&access_token=test_access',
      search: '',
      pathname: '/auth/callback',
      origin: 'http://localhost:3000',
      replaceState: vi.fn(),
      assign: vi.fn(),
      reload: vi.fn(),
      replace: vi.fn(),
    };
    
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      configurable: true,
      writable: true
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      configurable: true,
      writable: true
    });
  });

  it('handles successful authentication', async () => {
    const mockUser = { id: '123', name: 'Test User', email: 'test@gmail.com', picture: 'pic.jpg' };
    const mockAi = { score: 0.9, details: { photoQuality: 0.8, emailTrust: 1.0 } };
    const mockBackend = { 
      accessToken: 'backend_token', 
      user: { id: '123', role: 'USER' },
      accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString(),
      refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 3600000).toISOString()
    };

    (GoogleRealOAuthService.getRealGoogleUserInfo as any).mockResolvedValue(mockUser);
    (aiService.verifyIdentity as any).mockResolvedValue(mockAi);
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockBackend)
    });

    render(<BrowserRouter><GoogleCallback /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText(/Welcome, Test User!/i)).toBeDefined();
    }, { timeout: 5000 });

    expect(setSession).toHaveBeenCalledWith(expect.objectContaining({
      accessToken: 'backend_token',
      user: expect.objectContaining({ id: '123', authMethod: 'google' })
    }));

    expect(historyService.recordLoginAttempt).toHaveBeenCalledWith(expect.objectContaining({
      status: 'success'
    }));
  });

  it('handles admin role redirection', async () => {
    const mockUser = { id: '123', name: 'Admin User', email: 'admin@gmail.com' };
    const mockAi = { score: 1.0, details: {} };
    const mockBackend = { 
      accessToken: 'admin_token', 
      user: { id: '1', role: 'ADMIN' } 
    };

    (GoogleRealOAuthService.getRealGoogleUserInfo as any).mockResolvedValue(mockUser);
    (aiService.verifyIdentity as any).mockResolvedValue(mockAi);
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockBackend)
    });

    render(<BrowserRouter><GoogleCallback /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText(/Welcome, Admin User!/i)).toBeDefined();
    }, { timeout: 5000 });
  });

  it('handles OAuth error from URL params', async () => {
    // @ts-ignore
    window.location.search = '?error=access_denied&error_description=User+denied+access';
    window.location.hash = '';

    render(<BrowserRouter><GoogleCallback /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText(/Authentication Failed/i)).toBeDefined();
      expect(screen.getByText(/User denied access/i)).toBeDefined();
    }, { timeout: 5000 });

    expect(historyService.recordLoginAttempt).toHaveBeenCalledWith(expect.objectContaining({
      status: 'failed',
      failureReason: 'User denied access'
    }));
  });

  it('handles missing tokens error', async () => {
    window.location.hash = '';
    window.location.search = '';

    render(<BrowserRouter><GoogleCallback /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText(/No authentication data received/i)).toBeDefined();
    }, { timeout: 5000 });
  });

  it('handles backend authentication failure', async () => {
    (GoogleRealOAuthService.getRealGoogleUserInfo as any).mockResolvedValue({ name: 'User' });
    (aiService.verifyIdentity as any).mockResolvedValue({ score: 0.5, details: {} });
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'Invalid credentials' })
    });

    render(<BrowserRouter><GoogleCallback /></BrowserRouter>);

    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeDefined();
    }, { timeout: 5000 });
  });
});
