import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SkinAgeInsightCard } from './SkinAgeInsightCard';
import * as insightExport from '../../utils/insightExport';
import { digitalTwinService } from '@/services/digitalTwinService';

// Mock dependencies
vi.mock('../../utils/insightExport', () => ({
  exportInsightToPdf: vi.fn(),
  exportInsightToExcel: vi.fn(),
}));

vi.mock('@/services/digitalTwinService', () => ({
  digitalTwinService: {
    getLatestDigitalTwin: vi.fn(),
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

describe('SkinAgeInsightCard', () => {
  const mockInsight = {
    userId: 'user-1',
    status: 'younger',
    delta: -2,
    latestAnalysis: {
      skinScore: 85,
      skinAge: 23,
      realAge: 25,
    },
    headline: 'Your skin is doing great!',
    advice: ['Keep using sunscreen', 'Drink water'],
    trend: {
      series: [80, 82, 85],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (digitalTwinService.getLatestDigitalTwin as any).mockResolvedValue({
      simulationContext: {
        lifestyleFactors: ['Exercising', 'Sleep 8h'],
      },
    });
  });

  it('renders loading state', () => {
    render(
      <BrowserRouter>
        <SkinAgeInsightCard loading={true} />
      </BrowserRouter>
    );
    expect(document.querySelector('.animate-pulse')).toBeDefined();
  });

  it('renders insight data correctly', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <SkinAgeInsightCard insight={mockInsight as any} />
        </BrowserRouter>
      );
    });

    expect(screen.getByText('Your skin is doing great!')).toBeDefined();
    expect(screen.getByText('Score 85')).toBeDefined();
    expect(screen.getByText('Δ -2 yrs')).toBeDefined();
    expect(screen.getByText('Keep using sunscreen')).toBeDefined();
  });

  it('handles export to PDF', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <SkinAgeInsightCard insight={mockInsight as any} />
        </BrowserRouter>
      );
    });

    const pdfButton = screen.getByText(/Export PDF/i);
    fireEvent.click(pdfButton);
    expect(insightExport.exportInsightToPdf).toHaveBeenCalled();
  });

  it('handles export to Excel', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <SkinAgeInsightCard insight={mockInsight as any} />
        </BrowserRouter>
      );
    });

    const excelButton = screen.getByText(/Export Excel/i);
    fireEvent.click(excelButton);
    expect(insightExport.exportInsightToExcel).toHaveBeenCalled();
  });

  it('handles refresh action', async () => {
    const onRetry = vi.fn();
    await act(async () => {
      render(
        <BrowserRouter>
          <SkinAgeInsightCard insight={mockInsight as any} onRetry={onRetry} />
        </BrowserRouter>
      );
    });

    const refreshButton = screen.getByText(/Refresh/i);
    fireEvent.click(refreshButton);
    expect(onRetry).toHaveBeenCalledWith(true);
  });

  it('handles speech synthesis for tips', async () => {
    await act(async () => {
      render(
        <BrowserRouter>
          <SkinAgeInsightCard insight={mockInsight as any} />
        </BrowserRouter>
      );
    });

    const listenButton = screen.getByText(/Ecouter/i);
    fireEvent.click(listenButton);

    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    expect(screen.getByText(/Arreter/i)).toBeDefined();

    fireEvent.click(screen.getByText(/Arreter/i));
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
  });
});
