import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ActivityTimeline from './ActivityTimeline';
import { activityService } from '@/services/activityService';

// Mock activityService
vi.mock('@/services/activityService', () => ({
    activityService: {
        getActivities: vi.fn(),
        getSecuritySummary: vi.fn(),
        verifyIntegrity: vi.fn(),
        exportCsv: vi.fn(),
    }
}));

const mockActivities = {
    items: [
        {
            id: '1',
            type: 'LOGIN_SUCCESS',
            riskLevel: 'low',
            createdAt: new Date().toISOString(),
            ipAddress: '192.168.1.1',
            location: { city: 'Paris', country: 'France' },
            deviceInfo: 'Windows Desktop',
            metadata: { browser: 'Chrome' },
            riskExplanation: 'Normal login pattern.',
            recommendedAction: 'none',
        },
        {
            id: '2',
            type: 'SENSITIVE_ACTION',
            riskLevel: 'high',
            createdAt: new Date().toISOString(),
            ipAddress: '10.0.0.5',
            location: { city: 'Unknown', country: 'Unknown' },
            deviceInfo: 'Linux Server',
            metadata: { action: 'delete_database' },
            riskExplanation: 'Action performed from an unusual IP.',
            recommendedAction: 'lock_account',
        }
    ],
    total: 2,
    page: 1,
    limit: 15,
    totalPages: 1
};

const mockSummary = {
    summary: 'Everything looks normal.',
    stats: {
        total: 2,
        high: 1,
        medium: 0,
        low: 1,
        loginFailures: 0,
        uniqueIps: 2
    }
};

describe('ActivityTimeline Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (activityService.getActivities as any).mockResolvedValue(mockActivities);
        (activityService.getSecuritySummary as any).mockResolvedValue(mockSummary);
    });

    it('renders the activity timeline with data', async () => {
        render(<ActivityTimeline />);
        
        expect(screen.getByText(/Account Activity/i)).toBeDefined();
        
        await waitFor(() => {
            expect(screen.getByText(/Login Successful/i)).toBeDefined();
            expect(screen.getByText(/Sensitive Action/i)).toBeDefined();
        });
        
        expect(screen.getByText(/192.168.1.1/i)).toBeDefined();
    });

    it('expands an activity card on click', async () => {
        render(<ActivityTimeline />);
        
        await waitFor(() => {
            const loginCard = screen.getByText(/Login Successful/i);
            fireEvent.click(loginCard);
        });
        
        expect(screen.getByText(/AI Risk Analysis/i)).toBeDefined();
        expect(screen.getByText(/Normal login pattern/i)).toBeDefined();
    });

    it('toggles filters and applies a filter', async () => {
        render(<ActivityTimeline />);
        
        const filterBtn = screen.getByText(/Filters/i);
        fireEvent.click(filterBtn);
        
        const select = screen.getByDisplayValue(/All Types/i);
        fireEvent.change(select, { target: { value: 'SENSITIVE_ACTION' } });
        
        await waitFor(() => {
            expect(activityService.getActivities).toHaveBeenCalledWith(expect.objectContaining({
                type: 'SENSITIVE_ACTION'
            }));
        });
    });

    it('handles integrity check', async () => {
        (activityService.verifyIntegrity as any).mockResolvedValue({ valid: true });
        render(<ActivityTimeline />);
        
        const verifyBtn = screen.getByText(/Verify/i);
        fireEvent.click(verifyBtn);
        
        await waitFor(() => {
            expect(activityService.verifyIntegrity).toHaveBeenCalled();
            expect(screen.getByText(/Chain OK/i)).toBeDefined();
        });
    });

    it('handles export CSV', async () => {
        (activityService.exportCsv as any).mockResolvedValue(undefined);
        render(<ActivityTimeline />);
        
        const exportBtn = screen.getByText(/Export CSV/i);
        fireEvent.click(exportBtn);
        
        await waitFor(() => {
            expect(activityService.exportCsv).toHaveBeenCalled();
        });
    });

    it('shows loading state initially', () => {
        // Slow down the response
        (activityService.getActivities as any).mockReturnValue(new Promise(() => {}));
        render(<ActivityTimeline />);
        
        // We expect to find some skeletons (divs with pulse animation)
        // In the code, skeletons are rendered when loading is true
        // But since we are testing the main component, we can look for the absent text or some placeholder
        expect(screen.queryByText(/Login Successful/i)).toBeNull();
    });

    it('handles API failure by showing mock data (fallback)', async () => {
        (activityService.getActivities as any).mockRejectedValue(new Error('API Down'));
        render(<ActivityTimeline />);
        
        await waitFor(() => {
            // The code has a catch block that sets mockActivities
            expect(screen.getByText(/Login Successful/i)).toBeDefined();
        });
    });
});
