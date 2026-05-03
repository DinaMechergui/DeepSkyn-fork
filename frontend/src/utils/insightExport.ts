import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';

const safeNum = (value: unknown): number | null => {
    return typeof value === 'number' && !Number.isNaN(value) ? value : null;
};

const classifyScore = (value: number | null): string => {
    if (value == null) return 'Unknown';
    if (value >= 80) return 'Excellent';
    if (value >= 65) return 'Good';
    if (value >= 50) return 'Moderate';
    return 'Needs attention';
};

const classifyDelta = (value: number | null): string => {
    if (value == null) return 'Not available';
    if (value <= -2) return 'Skin appears younger than chronological age';
    if (value <= 1) return 'Skin age is aligned with chronological age';
    return 'Skin appears older than chronological age';
};

const fmt = (value: unknown, suffix = ''): string => {
    if (value == null) return 'N/A';
    if (typeof value === 'number') {
        const text = Number.isInteger(value) ? String(value) : value.toFixed(1);
        return `${text}${suffix}`;
    }
    return `${String(value)}${suffix}`;
};

const getScoreColor = (percent: number, palette: any): [number, number, number] => {
    if (percent >= 75) return palette.emerald;
    if (percent >= 55) return palette.amber;
    return palette.rose;
};

const getRiskLevel = (value: number | null): string => {
    if (value == null) return 'Unknown';
    if (value >= 75) return 'Low Risk';
    if (value >= 55) return 'Moderate Risk';
    return 'High Risk';
};

const getPriorityLabel = (idx: number): string => {
    if (idx < 2) return 'High';
    if (idx < 5) return 'Medium';
    return 'Low';
};

const getTimelineLabel = (idx: number): string => {
    if (idx < 2) return 'Next 7 days';
    return 'Next 30 days';
};

const getCategoryLabel = (idx: number): string => {
    if (idx === 0) return 'Core';
    if (idx < 3) return 'Priority';
    return 'Support';
};

export const exportInsightToPdf = (data: any) => {
    const { insight, score, delta, realAge, skinAge, trendSeries, userCtx, riskLevel, lifestyleFactors, recommendedActions, analysisSummary } = data;
    const doc = new jsPDF();
    const now = new Date();
    const fileDate = now.toISOString().slice(0, 10);

    const palette = {
        slate900: [15, 23, 42] as [number, number, number],
        slate700: [51, 65, 85] as [number, number, number],
        slate500: [100, 116, 139] as [number, number, number],
        slate100: [241, 245, 249] as [number, number, number],
        slate200: [226, 232, 240] as [number, number, number],
        teal700: [15, 118, 110] as [number, number, number],
        teal600: [13, 148, 136] as [number, number, number],
        teal500: [20, 184, 166] as [number, number, number],
        teal50: [240, 253, 250] as [number, number, number],
        emerald: [22, 163, 74] as [number, number, number],
        amber: [245, 158, 11] as [number, number, number],
        rose: [225, 29, 72] as [number, number, number],
        white: [255, 255, 255] as [number, number, number],
    };

    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 14;

    const drawPageChrome = () => {
        doc.setFillColor(palette.slate100[0], palette.slate100[1], palette.slate100[2]);
        doc.circle(pageWidth - 8, 12, 26, 'F');
        doc.setFillColor(palette.teal50[0], palette.teal50[1], palette.teal50[2]);
        doc.circle(10, pageHeight - 6, 30, 'F');
        doc.setDrawColor(palette.slate200[0], palette.slate200[1], palette.slate200[2]);
        doc.setLineWidth(0.2);
        doc.line(12, pageHeight - 14, pageWidth - 12, pageHeight - 14);
    };

    const ensureSpace = (needed = 10) => {
        if (y + needed > pageHeight - 16) {
            doc.addPage();
            drawPageChrome();
            y = 14;
        }
    };

    const sectionHeader = (title: string, accent: [number, number, number]) => {
        ensureSpace(12);
        doc.setFillColor(palette.teal50[0], palette.teal50[1], palette.teal50[2]);
        doc.roundedRect(14, y, pageWidth - 28, 10, 2, 2, 'F');
        doc.setFillColor(accent[0], accent[1], accent[2]);
        doc.rect(14, y, 4, 10, 'F');
        doc.setTextColor(palette.slate900[0], palette.slate900[1], palette.slate900[2]);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(title, 21, y + 6.5);
        y += 14;
    };

    const paragraph = (text: string, indent = 16, maxWidth = 176) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(palette.slate700[0], palette.slate700[1], palette.slate700[2]);
        const lines = doc.splitTextToSize(text, maxWidth);
        ensureSpace(lines.length * 4.6 + 2);
        doc.text(lines, indent, y);
        y += lines.length * 4.6;
    };

    const metricCard = (x: number, label: string, value: string, color: [number, number, number]) => {
        doc.setFillColor(palette.white[0], palette.white[1], palette.white[2]);
        doc.setDrawColor(palette.slate200[0], palette.slate200[1], palette.slate200[2]);
        doc.roundedRect(x, y, 43, 24, 2, 2, 'FD');
        doc.setFillColor(color[0], color[1], color[2]);
        doc.rect(x, y, 43, 4, 'F');
        doc.setFillColor(palette.teal50[0], palette.teal50[1], palette.teal50[2]);
        doc.roundedRect(x + 1.5, y + 5.2, 40, 16.8, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(palette.slate500[0], palette.slate500[1], palette.slate500[2]);
        doc.text(label, x + 2, y + 10);
        doc.setFontSize(12.5);
        doc.setTextColor(palette.slate900[0], palette.slate900[1], palette.slate900[2]);
        doc.text(value, x + 2, y + 18);
    };

    drawPageChrome();

    // Template-aligned cover/header
    doc.setFillColor(palette.teal600[0], palette.teal600[1], palette.teal600[2]);
    doc.rect(0, 0, pageWidth, 42, 'F');
    doc.setFillColor(palette.teal500[0], palette.teal500[1], palette.teal500[2]);
    doc.rect(0, 0, 78, 42, 'F');
    doc.setFillColor(palette.teal700[0], palette.teal700[1], palette.teal700[2]);
    doc.rect(0, 36, pageWidth, 6, 'F');
    doc.setTextColor(palette.white[0], palette.white[1], palette.white[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Skin Age Insights Report', 14, 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Personalized dermatology intelligence and action plan', 14, 23);
    doc.text(`Generated on ${now.toLocaleString()}`, 14, 30);
      
    doc.setFillColor(palette.white[0], palette.white[1], palette.white[2]);
    doc.roundedRect(136, 8, 58, 18, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(palette.teal700[0], palette.teal700[1], palette.teal700[2]);
    doc.text('Premium Skin Intelligence', 140, 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(palette.slate700[0], palette.slate700[1], palette.slate700[2]);
    doc.text(`Risk: ${riskLevel}`, 140, 18.5);
    doc.text(`Score: ${fmt(score, '/100')}`, 168, 18.5);

    y = 50;

    // KPI cards row
    const scorePercent = Math.max(0, Math.min(100, score ?? 0));
    const scoreColor = getScoreColor(scorePercent, palette);
    metricCard(14, 'Skin Age Score', fmt(score, '/100'), scoreColor);
    metricCard(60, 'User Age', fmt(realAge, ' yrs'), palette.teal500);
    metricCard(106, 'Skin Age', fmt(skinAge, ' yrs'), palette.teal600);
    metricCard(152, 'Age Delta', fmt(delta, ' yrs'), palette.teal700);
    y += 30;

    // Progress strip
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(palette.slate700[0], palette.slate700[1], palette.slate700[2]);
    doc.text(`Risk Level: ${riskLevel}`, 14, y);
    doc.text(`Score Band: ${classifyScore(score)}`, 64, y);
    doc.text(`Interpretation: ${classifyDelta(delta)}`, 108, y);
    y += 4;
    doc.setFillColor(palette.slate200[0], palette.slate200[1], palette.slate200[2]);
    doc.roundedRect(14, y, 182, 5, 2, 2, 'F');
    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.roundedRect(14, y, (182 * scorePercent) / 100, 5, 2, 2, 'F');
    y += 11;

    sectionHeader('User Profile', palette.teal500);
    [
      `User name: ${userCtx.name}`,
      `User email: ${userCtx.email}`,
      `Assessment date: ${insight?.latestAnalysis?.createdAt ? new Date(insight.latestAnalysis.createdAt).toLocaleString() : 'N/A'}`,
      `Status flag: ${insight?.status || 'unknown'}`,
    ].forEach((line) => paragraph(`- ${line}`));
    y += 2;

    sectionHeader('Executive Summary', palette.teal600);
    paragraph(insight?.headline || 'No summary available.');
    y += 2;

    sectionHeader('Clinical Analysis', palette.teal700);
    paragraph(analysisSummary);
    y += 2;

    sectionHeader('Trend Intelligence', palette.teal500);
    if (trendSeries.length === 0) {
      paragraph('- Not enough historical data.');
    } else {
      const avgTrendDelta = safeNum(insight?.trend?.averageDelta);
      const latestTrendDelta = trendSeries.length > 0 ? safeNum(trendSeries[trendSeries.length - 1]?.delta) : null;
      const earliestTrendDelta = trendSeries.length > 0 ? safeNum(trendSeries[0]?.delta) : null;
      const trendShift = latestTrendDelta != null && earliestTrendDelta != null ? (latestTrendDelta - earliestTrendDelta) : null;

      [
        `Data points: ${trendSeries.length}`,
        `Earliest delta: ${fmt(earliestTrendDelta, ' yrs')}`,
        `Latest delta: ${fmt(latestTrendDelta, ' yrs')}`,
        `Average delta: ${fmt(avgTrendDelta, ' yrs')}`,
        `Shift: ${fmt(trendShift, ' yrs')}`,
      ].forEach((line) => paragraph(`- ${line}`));

      ensureSpace(34);
      doc.setDrawColor(203, 213, 225);
      doc.rect(18, y + 4, 170, 24);
      y += 34;
    }

    sectionHeader('Recommended Actions', palette.teal600);
    recommendedActions.forEach((tip: string, idx: number) => paragraph(`${idx + 1}. ${tip}`));

    autoTable(doc, {
        startY: y + 10,
        head: [['Source', 'Sample Size', 'Avg Real Age', 'Avg Skin Age', 'Avg Delta']],
        body: [
            ['Personal', fmt(insight?.userBenchmark?.sampleSize), fmt(insight?.userBenchmark?.avgRealAge), fmt(insight?.userBenchmark?.avgSkinAge), fmt(insight?.userBenchmark?.avgDelta)],
            ['Dataset', fmt(insight?.datasetBenchmark?.sampleSize), fmt(insight?.datasetBenchmark?.avgRealAge), fmt(insight?.datasetBenchmark?.avgSkinAge), fmt(insight?.datasetBenchmark?.avgDelta)],
        ],
        theme: 'grid',
        headStyles: { fillColor: [13, 148, 136] }
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 25, pageHeight - 10);
    }

    doc.save(`skin-age-insights-${fileDate}.pdf`);
};

export const exportInsightToExcel = async (data: any) => {
    const { score, delta, realAge, skinAge, trendSeries, userCtx, insight } = data;
    const now = new Date();
    const fileDate = now.toISOString().slice(0, 10);
    const workbook = new ExcelJS.Workbook();

    const addSheet = (name: string, rows: any[], widths: number[]) => {
        const sheet = workbook.addWorksheet(name);
        if (rows.length > 0) {
            const keys = Object.keys(rows[0]);
            sheet.columns = keys.map((k, i) => ({ header: k, key: k, width: widths[i] || 20 }));
            rows.forEach(row => sheet.addRow(row));
            sheet.getRow(1).font = { bold: true };
        }
    };

    addSheet('Profile', [{ Field: 'User', Value: userCtx.name }, { Field: 'Email', Value: userCtx.email }, { Field: 'Age', Value: realAge }, { Field: 'Skin Age', Value: skinAge }, { Field: 'Delta', Value: delta }], [20, 40]);
    
    const trendRows = trendSeries.map((t: any, i: number) => ({
        Index: i + 1,
        Date: new Date(t.createdAt).toLocaleDateString(),
        Delta: t.delta ?? 'N/A'
    }));
    addSheet('Trend', trendRows, [10, 20, 15]);

    const excelBuffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `skin-age-insights-${fileDate}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
};
