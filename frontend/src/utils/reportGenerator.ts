import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const TEAL = '#0d9488';
const LIGHT_TEAL = '#f0fdfa';
const SLATE = '#0f172a';
const GRAY = '#64748b';
const MARGIN_X = 20;

/**
 * Extracts scores from combined insights source.
 */
const getScoresFromCombined = (combinedInsights: any): any[] => {
  return Object.entries(combinedInsights).map(([key, entry]: [string, any]) => ({
    type: key,
    score: entry.combinedScore || entry.aiScore || entry.userScore || 0,
    description: `Analysis based on ${entry.weight?.ai > 0 ? 'AI Scan' : ''}${entry.weight?.ai > 0 && entry.weight?.user > 0 ? ' & ' : ''}${entry.weight?.user > 0 ? 'Profile' : ''}.`
  }));
};

/**
 * Extracts scores from basic metrics source.
 */
const getScoresFromMetrics = (analysis: any): any[] => {
  const rawMetrics = analysis?.metrics || analysis?.data?.metrics || [];
  if (!Array.isArray(rawMetrics)) return [];
  return rawMetrics.map((m: any) => ({
    type: m.metricType || m.name || 'Unknown',
    score: m.score || 0,
    description: m.severityLevel || 'Analysis complete.'
  }));
};

/**
 * Extracts scores from routine trends source.
 */
const getScoresFromTrends = (trends: any): any[] => {
  const scores: any[] = [];
  if (trends.hydration) scores.push({ type: 'Hydratation', score: trends.hydration.current, description: 'Current hydration levels detected.' });
  if (trends.oil) scores.push({ type: 'Sébum', score: trends.oil.current, description: 'Sebum and lipid activity.' });
  if (trends.acne) scores.push({ type: 'Acné', score: trends.acne.current, description: 'Inflammatory activity level.' });
  if (trends.wrinkles) scores.push({ type: 'Rides', score: trends.wrinkles.current, description: 'Elasticity and line depth.' });
  return scores;
};

/**
 * Normalizes condition scores from multiple potential sources to reduce cognitive complexity.
 */
const getConditionScores = (analysis: any, routine: any): any[] => {
  if (analysis?.combinedInsights) {
    return getScoresFromCombined(analysis.combinedInsights);
  }
  if (Array.isArray(analysis?.conditionScores)) {
    return analysis.conditionScores;
  }
  if (Array.isArray(analysis?.aiRawResponse?.conditionScores)) {
    return analysis.aiRawResponse.conditionScores;
  }

  const metricScores = getScoresFromMetrics(analysis);
  if (metricScores.length > 0) return metricScores;

  if (routine?.trends) {
    return getScoresFromTrends(routine.trends);
  }

  return [];
};

const checkPage = (doc: any, currentY: number, needed: number) => {
  if (currentY + needed > 280) {
    doc.addPage();
    return 20;
  }
  return currentY;
};

const drawHeader = (doc: any, plan: string) => {
  doc.setFillColor(LIGHT_TEAL);
  doc.rect(0, 0, 210, 45, 'F');
  
  doc.setTextColor(TEAL);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32);
  doc.text('DeepSkyn', MARGIN_X, 25);
  
  doc.setTextColor(GRAY);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('PROFESSIONAL CLINICAL SKIN DIAGNOSIS', MARGIN_X, 34);
  
  doc.setTextColor(TEAL);
  doc.setFontSize(10);
  doc.text(`REPORT ID: DS-${Math.random().toString(36).substring(2, 11).toUpperCase()}`, 145, 20);
  doc.text(`DATE: ${new Date().toLocaleDateString()}`, 145, 26);
  doc.text(`${plan} ACCESS LEVEL`, 145, 32);
};

const drawSectionTitle = (doc: any, y: number, title: string) => {
  const newY = checkPage(doc, y, 15);
  doc.setFillColor(TEAL);
  doc.rect(MARGIN_X, newY, 5, 10, 'F');
  doc.setTextColor(SLATE);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, MARGIN_X + 10, newY + 8);
  return newY + 18;
};

const drawFooter = (doc: any) => {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(TEAL);
    doc.rect(0, 285, 210, 15, 'F');
    doc.setFontSize(9);
    doc.setTextColor('#ffffff');
    doc.text(`DeepSkyn AI Clinical System  |  Page ${i} of ${pageCount}`, 105, 292, { align: 'center' });
    
    doc.setTextColor(GRAY);
    doc.setFontSize(7);
    doc.text('CONFIDENTIAL MEDICAL GRADE REPORT - NOT FOR RESALE', MARGIN_X, 280);
  }
};

const getStatusFromScore = (score: number) => {
  if (score > 70) return 'CRITICAL';
  if (score > 40) return 'MODERATE';
  return 'STABLE';
};

const drawDiagnosticCards = (doc: any, y: number, conditionScores: any[]) => {
  const diagnosticMap: Record<string, { why: string; ingredients: string }> = {
    acne: { why: "Acne is typically caused by sebum and bacteria.", ingredients: "Salicylic Acid, Zinc PCA." },
    'acné': { why: "L'acné est causée par le sébum et les bactéries.", ingredients: "Acide Salicylique, Zinc PCA." },
    wrinkles: { why: "Wrinkles occur due to collagen decline.", ingredients: "Retinoids, Peptides." },
    rides: { why: "Les rides sont dues à la baisse de collagène.", ingredients: "Rétinol, Peptides." },
    hydration: { why: "Skin dehydration is a lack of water.", ingredients: "Hyaluronic Acid, Glycerin." }
  };

  let currentY = y;
  conditionScores.filter(c => (c.score || 0) >= 5).forEach(c => {
    const detail = diagnosticMap[c.type.toLowerCase().trim()];
    if (!detail) return;

    const score = Math.round(c.score || 0);
    const status = getStatusFromScore(score);
    currentY = checkPage(doc, currentY, 80);

    doc.setFillColor(252, 255, 254);
    doc.setDrawColor(204, 251, 241);
    doc.roundedRect(MARGIN_X, currentY, 170, 70, 3, 3, 'FD');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(TEAL);
    doc.text(`${c.type.toUpperCase()} — ${score}% Severity (${status})`, MARGIN_X + 8, currentY + 10);
    
    doc.setFontSize(8);
    doc.setTextColor(SLATE);
    doc.text('CLINICAL REASONING:', MARGIN_X + 8, currentY + 35);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(GRAY);
    doc.text(doc.splitTextToSize(detail.why, 155), MARGIN_X + 8, currentY + 40);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(SLATE);
    doc.text('ACTIVE RESOLUTION:', MARGIN_X + 8, currentY + 55);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(TEAL);
    doc.text(doc.splitTextToSize(detail.ingredients, 155), MARGIN_X + 8, currentY + 60);
    
    currentY += 80;
  });
  return currentY;
};

const drawExpertAdvice = (doc: any, y: number, advice: string[]) => {
  let currentY = drawSectionTitle(doc, y, 'Expert Clinical Guidance');
  doc.setFontSize(10);
  doc.setTextColor(GRAY);
  
  advice.forEach((text: string) => {
    const splitText = doc.splitTextToSize(`• ${text}`, 170);
    currentY = checkPage(doc, currentY, splitText.length * 7);
    doc.text(splitText, MARGIN_X + 5, currentY);
    currentY += (splitText.length * 6);
  });
  return currentY;
};

export const generateClinicalReport = async (data: any) => {
  const { user, plan, routine, insight, analysis } = data;
  const doc = new jsPDF() as any;
  let y = 60;

  drawHeader(doc, plan);

  // --- SECTION 0: VALUE BOX ---
  y = drawValueBox(doc, y);

  // --- SECTION 1: DERMATOLOGICAL PROFILE ---
  y = drawProfileSection(doc, y, user, insight, analysis, routine);

  // --- SECTION 2: CLINICAL ANALYSIS ---
  const conditionScores = getConditionScores(analysis, routine);
  y = drawAnalysisSection(doc, y, conditionScores);

  // --- DIAGNOSTIC CARDS ---
  y = drawSectionTitle(doc, y, 'Deep Diagnostic & Active Resolution');
  y = drawDiagnosticCards(doc, y, conditionScores);

  // --- SECTION 4: ROUTINE ---
  y = drawRoutineSection(doc, y, routine);

  // --- SECTION 5: ADVICE ---
  const advice = insight?.expertAdvice || [
    "UV Protection: Apply SPF 50+ every morning.",
    "Hydration: Prioritize Hyaluronic Acid.",
    "Consistency: Visible clinical improvements require 4-6 weeks.",
    "Barrier Health: Avoid over-exfoliation."
  ];
  drawExpertAdvice(doc, y, advice);

  drawFooter(doc);
  doc.save(`DeepSkyn_Clinical_Report_${new Date().toISOString().substring(0, 10)}.pdf`);
};

/* ── Helpers to reduce complexity ── */

const drawValueBox = (doc: any, y: number) => {
  doc.setFillColor(LIGHT_TEAL);
  doc.roundedRect(MARGIN_X, y, 170, 25, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setTextColor(TEAL);
  doc.setFont('helvetica', 'bold');
  doc.text('THE VALUE OF YOUR PROFESSIONAL CLINICAL REPORT', MARGIN_X + 5, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(GRAY);
  const proExplain = "This clinical-grade protocol is driven by DeepSkyn's AI Diagnostic Engine to ensure medical-grade efficacy and skin barrier safety.";
  doc.text(doc.splitTextToSize(proExplain, 160), MARGIN_X + 5, y + 14);
  return y + 35;
};

const drawProfileSection = (doc: any, y: number, user: any, insight: any, analysis: any, routine: any) => {
  const newY = drawSectionTitle(doc, y, 'Dermatological Profile');
  const profileData = [
    ['Patient Name', user?.name || user?.email || 'Valued Member'],
    ['Biological Age', analysis?.realAge || localStorage.getItem('userAge') || '—'],
    ['AI-Estimated Skin Age', insight?.currentSkinAge || analysis?.skinAge || '—'],
    ['Primary Skin Type', routine?.inferredSkinType || 'Normal'],
    ['Dominant Condition', analysis?.aiRawResponse?.globalAnalysis?.dominantCondition || 'Standard'],
  ];

  autoTable(doc, {
    startY: newY,
    head: [],
    body: profileData,
    theme: 'plain',
    styles: { fontSize: 11, cellPadding: 4, textColor: GRAY },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55, textColor: SLATE } },
    margin: { left: MARGIN_X + 5 }
  });
  return doc.lastAutoTable.finalY + 15;
};

const drawAnalysisSection = (doc: any, y: number, conditionScores: any[]) => {
  const newY = drawSectionTitle(doc, y, 'Clinical Analysis Results');
  const getStatusLabel = (s: number) => {
    if (s > 70) return 'CRITICAL';
    if (s > 40) return 'MODERATE';
    return 'OPTIMAL';
  };

  const analysisTable = conditionScores.map((c: any) => {
    const score = c.score || 0;
    return [
      c.type.charAt(0).toUpperCase() + c.type.slice(1),
      `${Math.round(score)}%`,
      getStatusLabel(score),
      c.description || 'Monitoring recommended.'
    ];
  });

  autoTable(doc, {
    startY: newY,
    head: [['Skin Biomarker', 'Severity', 'Status', 'Clinical Observation']],
    body: analysisTable.length > 0 ? analysisTable : [['General Health', 'Normal', 'STABLE', 'Functional barrier.']],
    theme: 'grid',
    headStyles: { fillColor: TEAL, textColor: '#fff', fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 5 },
    margin: { left: MARGIN_X }
  });
  return doc.lastAutoTable.finalY + 12;
};

const drawRoutineSection = (doc: any, y: number, routine: any) => {
  const newY = drawSectionTitle(doc, y, 'Prescribed Routine Protocol');
  const routineSteps = [
    ... (routine?.morning || []).map((s: any) => ({ ...s, time: 'MORNING (AM)' })),
    ... (routine?.night || []).map((s: any) => ({ ...s, time: 'EVENING (PM)' }))
  ];

  if (routineSteps.length === 0) return newY;

  autoTable(doc, {
    startY: newY,
    head: [['Time', 'Step', 'Product Name', 'Instructions']],
    body: routineSteps.map((s: any) => [s.time, s.stepName || 'Treatment', s.product?.name || 'SVR Treatment', s.instruction || 'Apply to clean skin.']),
    theme: 'striped',
    headStyles: { fillColor: '#f8fafc', textColor: TEAL, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 4 },
    margin: { left: MARGIN_X }
  });
  return doc.lastAutoTable.finalY + 15;
};
