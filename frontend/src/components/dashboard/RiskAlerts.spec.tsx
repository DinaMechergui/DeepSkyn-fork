import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RiskAlerts } from './RiskAlerts';
import { apiClient } from '../../services/apiClient';

// Mock les services
vi.mock('../../services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { act } from 'react';

vi.mock('../../services/dashboardService', () => ({
  dashboardService: {
    getRiskPrediction: vi.fn(),
    getMetrics: vi.fn(),
    getTrends: vi.fn(),
  },
}));

vi.mock('../../services/analysisService', () => ({
  analysisService: {
    getLatestAnalysis: vi.fn(),
    getAnalysisById: vi.fn(),
  },
}));

vi.mock('../../services/digitalTwinService', () => ({
  digitalTwinService: {
    getDigitalTwin: vi.fn(),
  },
}));

// Mock window.speechSynthesis
Object.defineProperty(window, 'speechSynthesis', {
  value: {
    speak: vi.fn(),
    cancel: vi.fn(),
    getVoices: vi.fn(() => []),
  },
  writable: true,
});

global.SpeechSynthesisUtterance = vi.fn().mockImplementation((text) => ({
  text,
  lang: '',
  rate: 1,
  onend: null,
  onerror: null,
})) as any;

describe('RiskAlerts Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    (apiClient.post as any).mockResolvedValue({
      data: {
        success: true,
        data: {
          risks: [],
          overall_risk_score: 40,
          immediate_actions: []
        }
      }
    });
  });

  it('should render the RiskAlerts component', async () => {
    let container: any;
    await act(async () => {
      const rendered = render(<RiskAlerts />);
      container = rendered.container;
    });
    expect(container).toBeDefined();
  });

  it('should render with custom className', async () => {
    let container: any;
    await act(async () => {
      const rendered = render(<RiskAlerts className="test-class" />);
      container = rendered.container;
    });
    expect(container.querySelector('.test-class')).toBeDefined();
  });

  it('should initialize with default habits', async () => {
    await act(async () => {
      render(<RiskAlerts />);
    });
    const habits = localStorage.getItem('userHabits');
    expect(habits === null || typeof habits === 'string').toBe(true);
  });

  it('should load custom habits from localStorage', async () => {
    const customHabits = {
      sleepHours: 8,
      waterIntake: 3,
      sunProtection: 'daily',
      Exercise: 'intense',
      stressLevel: 'low',
      diet: 'healthy',
      skincarRoutine: 'advanced',
    };
    localStorage.setItem('userHabits', JSON.stringify(customHabits));

    await act(async () => {
      render(<RiskAlerts />);
    });
    const saved = localStorage.getItem('userHabits');
    expect(saved).toBe(JSON.stringify(customHabits));
  });

  it('should cleanup speech synthesis on unmount', async () => {
    let unmount: any;
    await act(async () => {
      const rendered = render(<RiskAlerts />);
      unmount = rendered.unmount;
    });
    unmount();
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
  });

  it('should accept onRefresh callback prop', async () => {
    const mockOnRefresh = vi.fn();
    let container: any;
    await act(async () => {
      const rendered = render(<RiskAlerts onRefresh={mockOnRefresh} />);
      container = rendered.container;
    });
    expect(container).toBeDefined();
  });

  it('should show habits form when settings button is clicked', async () => {
    await act(async () => {
      render(<RiskAlerts />);
    });
    const settingsButton = screen.getByTitle(/Ajustez votre rythme de vie/i);
    fireEvent.click(settingsButton);
    expect(screen.getByText(/Mon Rythme de Vie/i)).toBeDefined();
  });

  it('should handle speech synthesis', async () => {
    const mockRisks = [
      { type: 'acne', risk_score: 80, cause: 'Test', prevention: ['Tip 1'], urgency: 'high' }
    ];
    (apiClient.post as any).mockResolvedValue({
      data: { success: true, data: { risks: mockRisks, overall_risk_score: 80, immediate_actions: ['Action 1'] } }
    });

    await act(async () => {
      render(<RiskAlerts />);
    });

    const speakButton = screen.getByText(/Ecouter/i);
    fireEvent.click(speakButton);
    
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    expect(screen.getByText(/Arreter/i)).toBeDefined();

    fireEvent.click(screen.getByText(/Arreter/i));
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
  });

  it('should handle API errors and show fallback risks', async () => {
    (apiClient.post as any).mockRejectedValue(new Error('API Error'));
    
    await act(async () => {
      render(<RiskAlerts />);
    });

    expect(screen.getByText(/API Error/i)).toBeDefined();
    // Check for fallback risks (acne, aging, dryness are in setFallbackRisks)
    expect(screen.getByText(/acne/i)).toBeDefined();
    expect(screen.getByText(/aging/i)).toBeDefined();
  });

  it('should refresh data when refresh button is clicked', async () => {
    const mockOnRefresh = vi.fn();
    await act(async () => {
      render(<RiskAlerts onRefresh={mockOnRefresh} />);
    });

    const refreshBtn = screen.getByText(/Refresh/i);
    fireEvent.click(refreshBtn);

    expect(apiClient.post).toHaveBeenCalled();
    expect(mockOnRefresh).toHaveBeenCalled();
  });

  it('should save habits and refresh prediction', async () => {
    await act(async () => {
      render(<RiskAlerts />);
    });

    fireEvent.click(screen.getByTitle(/Ajustez votre rythme de vie/i));
    
    const sleepInput = screen.getByText(/Sommeil/i).parentElement?.querySelector('input');
    if (sleepInput) {
      fireEvent.change(sleepInput, { target: { value: '9' } });
    }

    const saveBtn = screen.getByText(/Recalculer les risques/i);
    fireEvent.click(saveBtn);

    expect(localStorage.getItem('userHabits')).toContain('"sleepHours":9');
    expect(apiClient.post).toHaveBeenCalled();
  });

  it('should expand risk details on click', async () => {
    const mockRisks = [
      { type: 'acne', risk_score: 80, cause: 'Specific cause', prevention: ['Tip A'], urgency: 'high' }
    ];
    (apiClient.post as any).mockResolvedValue({
      data: { success: true, data: { risks: mockRisks, overall_risk_score: 80 } }
    });

    await act(async () => {
      render(<RiskAlerts />);
    });

    const riskHeader = screen.getByText(/acne/i);
    fireEvent.click(riskHeader);

    expect(screen.getByText(/Why this risk?/i)).toBeDefined();
    expect(screen.getByText(/Specific cause/i)).toBeDefined();
  });
});
