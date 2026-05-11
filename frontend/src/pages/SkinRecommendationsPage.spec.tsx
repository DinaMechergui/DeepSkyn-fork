import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SkinRecommendationsPage from './SkinRecommendationsPage';
import * as authSession from '@/lib/authSession';
import * as apiClient from '@/services/apiClient';
import { comparisonService } from '@/services/comparison.service';

// Mock dependencies
vi.mock('@/lib/authSession', () => ({
  getUser: vi.fn(),
}));
vi.mock('@/services/apiClient', () => ({
  apiGet: vi.fn(),
}));
vi.mock('@/services/comparison.service', () => ({
  comparisonService: {
    getUserAnalyses: vi.fn(),
    getAnalysis: vi.fn(),
  }
}));

// Mock useLocation and useNavigate
const mockNavigate = vi.fn();
let mockLocation = { state: null };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

describe('SkinRecommendationsPage', () => {
  const mockUser = { id: 'user-123' };
  const mockProfile = {
    skinType: 'Oily',
    age: 30,
    gender: 'Male',
    concerns: ['Acne'],
    hydrationLevel: 40,
    acneLevel: 80,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockLocation = { state: null };
    (authSession.getUser as any).mockReturnValue(mockUser);
    (apiClient.apiGet as any).mockResolvedValue({ plan: 'FREE' });
  });

  it('renders loading state initially', async () => {
    render(
      <BrowserRouter>
        <SkinRecommendationsPage />
      </BrowserRouter>
    );
    expect(screen.getByText(/Récupération de votre profil IA/i)).toBeDefined();
  });

  it('resolves profile from location state', async () => {
    mockLocation.state = { profile: mockProfile } as any;

    await act(async () => {
      render(
        <BrowserRouter>
          <SkinRecommendationsPage />
        </BrowserRouter>
      );
    });

    expect(screen.getByText('Produits Recommandés')).toBeDefined();
  });

  it('resolves profile from localStorage (skinAnalysisProfile)', async () => {
    localStorage.setItem('skinAnalysisProfile', JSON.stringify(mockProfile));

    await act(async () => {
      render(
        <BrowserRouter>
          <SkinRecommendationsPage />
        </BrowserRouter>
      );
    });

    expect(screen.getByText('Produits Recommandés')).toBeDefined();
  });

  it('resolves profile from backend when no local data exists', async () => {
    const mockAnalysis = { id: 'analysis-1', metrics: { hydration: 50, acne: 10 } };
    (comparisonService.getUserAnalyses as any).mockResolvedValue({ data: [{ id: 'analysis-1' }] });
    (comparisonService.getAnalysis as any).mockResolvedValue(mockAnalysis);

    await act(async () => {
      render(
        <BrowserRouter>
          <SkinRecommendationsPage />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
        expect(screen.getByText('Produits Recommandés')).toBeDefined();
    });
  });

  it('renders error state when no profile is found', async () => {
    (comparisonService.getUserAnalyses as any).mockResolvedValue({ data: [] });

    await act(async () => {
      render(
        <BrowserRouter>
          <SkinRecommendationsPage />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
        expect(screen.getByText('Analyse Requise')).toBeDefined();
    });
  });

  it('fetches subscription plan on mount', async () => {
    mockLocation.state = { profile: mockProfile } as any;
    (apiClient.apiGet as any).mockResolvedValue({ plan: 'PRO' });

    await act(async () => {
      render(
        <BrowserRouter>
          <SkinRecommendationsPage />
        </BrowserRouter>
      );
    });

    expect(apiClient.apiGet).toHaveBeenCalledWith('/subscription/user-123');
  });
});
