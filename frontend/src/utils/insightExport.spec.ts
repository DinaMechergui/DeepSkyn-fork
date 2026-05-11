import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportInsightToPdf, exportInsightToExcel, drawCover, drawKPIs, drawProfile, drawAnalysis, drawTrends, drawActions } from './insightExport';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';

// Mock jsPDF
vi.mock('jspdf', () => {
    const mockDoc = {
        addPage: vi.fn(),
        setFillColor: vi.fn(),
        setDrawColor: vi.fn(),
        setLineWidth: vi.fn(),
        line: vi.fn(),
        circle: vi.fn(),
        rect: vi.fn(),
        roundedRect: vi.fn(),
        setTextColor: vi.fn(),
        setFont: vi.fn(),
        setFontSize: vi.fn(),
        text: vi.fn(),
        splitTextToSize: vi.fn((text) => Array.isArray(text) ? text : [text]),
        getNumberOfPages: vi.fn(() => 1),
        setPage: vi.fn(),
        save: vi.fn(),
        internal: {
            pageSize: {
                getHeight: vi.fn(() => 297),
                getWidth: vi.fn(() => 210),
            }
        }
    };
    return {
        jsPDF: vi.fn(() => mockDoc),
    };
});

// Mock autoTable
vi.mock('jspdf-autotable', () => ({
    default: vi.fn(),
}));

// Mock ExcelJS
vi.mock('exceljs', () => {
    const mockSheet = {
        addRow: vi.fn(),
        columns: [],
        getRow: vi.fn(() => ({ font: {} })),
    };
    const mockWorkbook = {
        addWorksheet: vi.fn(() => mockSheet),
        xlsx: {
            writeBuffer: vi.fn(() => Promise.resolve(new ArrayBuffer(8))),
        },
    };
    return {
        default: {
            Workbook: vi.fn(() => mockWorkbook),
        },
    };
});

// Mock URL and Blob
global.URL.createObjectURL = vi.fn(() => 'blob:url');
global.URL.revokeObjectURL = vi.fn();

describe('insightExport Utility', () => {
    const mockData = {
        insight: {
            headline: 'Excellent skin health',
            userBenchmark: { sampleSize: 10, avgRealAge: 30, avgSkinAge: 28, avgDelta: -2 },
            datasetBenchmark: { sampleSize: 1000, avgRealAge: 35, avgSkinAge: 36, avgDelta: 1 },
            trend: { averageDelta: -1.5 },
            latestAnalysis: { createdAt: new Date().toISOString() },
            status: 'stable'
        },
        score: 85,
        delta: -2,
        realAge: 30,
        skinAge: 28,
        trendSeries: [
            { createdAt: new Date().toISOString(), delta: -1 },
            { createdAt: new Date().toISOString(), delta: -2 }
        ],
        userCtx: { name: 'John Doe', email: 'john@example.com' },
        riskLevel: 'Low Risk',
        recommendedActions: ['Wear sunscreen', 'Hydrate'],
        analysisSummary: 'Your skin is doing great overall.'
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('exportInsightToPdf', () => {
        it('should generate and save a PDF', () => {
            exportInsightToPdf(mockData);
            const docInstance = (jsPDF as any).mock.results[0].value;
            expect(docInstance.save).toHaveBeenCalled();
            expect(autoTable).toHaveBeenCalled();
        });

        it('should handle missing data gracefully', () => {
            const partialData = {
                ...mockData,
                trendSeries: [],
                insight: null,
            };
            exportInsightToPdf(partialData);
            const docInstance = (jsPDF as any).mock.results[0].value;
            expect(docInstance.save).toHaveBeenCalled();
        });
    });

    describe('Sub-draw functions', () => {
        let doc: any;
        const palette = {
            teal600: [13, 148, 136],
            teal500: [20, 184, 166],
            teal700: [15, 118, 110],
            white: [255, 255, 255],
            slate700: [51, 65, 85],
            slate200: [226, 232, 240],
            amber: [245, 158, 11],
            rose: [225, 29, 72],
            emerald: [22, 163, 74]
        };

        beforeEach(() => {
            doc = new jsPDF();
        });

        it('drawCover should render header elements', () => {
            drawCover(doc, 210, palette, 'Low Risk', 85, new Date());
            expect(doc.text).toHaveBeenCalledWith('Skin Age Insights Report', 14, 16);
        });

        it('drawKPIs should render metrics', () => {
            const metricCard = vi.fn();
            drawKPIs(doc, palette, { score: 85, realAge: 30, skinAge: 28, delta: -2 }, 'Low Risk', metricCard);
            expect(metricCard).toHaveBeenCalledTimes(4);
            expect(doc.text).toHaveBeenCalledWith('Risk Level: Low Risk', 14, 80);
        });

        it('drawProfile should render user details', () => {
            const sectionHeader = vi.fn();
            const paragraph = vi.fn();
            drawProfile(doc, palette, mockData.userCtx, mockData.insight, sectionHeader, paragraph);
            expect(sectionHeader).toHaveBeenCalledWith('User Profile', palette.teal500);
            expect(paragraph).toHaveBeenCalled();
        });

        it('drawAnalysis should render summary', () => {
            const sectionHeader = vi.fn();
            const paragraph = vi.fn();
            drawAnalysis(doc, palette, mockData.insight, 'Summary text', sectionHeader, paragraph);
            expect(paragraph).toHaveBeenCalledWith('Summary text');
        });

        it('drawTrends should handle empty trend data', () => {
            const sectionHeader = vi.fn();
            const paragraph = vi.fn();
            const ensureSpace = vi.fn();
            drawTrends(doc, palette, mockData.insight, [], sectionHeader, paragraph, ensureSpace);
            expect(paragraph).toHaveBeenCalledWith('- Not enough historical data.');
        });

        it('drawActions should render all recommended actions', () => {
            const sectionHeader = vi.fn();
            const paragraph = vi.fn();
            drawActions(doc, palette, ['Action 1', 'Action 2'], sectionHeader, paragraph);
            expect(paragraph).toHaveBeenCalledTimes(2);
        });
    });

    describe('exportInsightToExcel', () => {
        it('should generate and download an Excel file', async () => {
            // Mock link creation and click
            const mockLink = {
                href: '',
                download: '',
                click: vi.fn(),
            };
            const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
            const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
            const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);

            await exportInsightToExcel(mockData);

            expect(ExcelJS.Workbook).toHaveBeenCalled();
            expect(mockLink.click).toHaveBeenCalled();
            expect(mockLink.download).toContain('skin-age-insights');
            
            createElementSpy.mockRestore();
            appendChildSpy.mockRestore();
            removeChildSpy.mockRestore();
        });
    });
});
