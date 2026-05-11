import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, RefreshCcw, Sparkles, Activity, HeartPulse, FileText, Sheet, Volume2, Square } from 'lucide-react';
import type { SkinAgeInsightResponse } from '@/services/skinAgeInsightsService';
import { exportInsightToPdf, exportInsightToExcel } from '../../utils/insightExport';
import { digitalTwinService } from '@/services/digitalTwinService';

interface SkinAgeInsightCardProps {
  insight?: SkinAgeInsightResponse | null;
  loading?: boolean;
  onRetry?: (skipDebounce?: boolean) => void;
  onLaunchAnalysis?: () => void;
  productsLoading?: boolean;
  onRefreshProducts?: () => void;
  recommendedProducts?: any[];
}

const statusCopy: Record<string, { color: string; bg: string; label: string }> = {
  younger: { color: '#16a34a', bg: '#dcfce7', label: 'Skin age looks younger' },
  aligned: { color: '#0ea5e9', bg: '#e0f2fe', label: 'Skin age aligned' },
  older: { color: '#ef4444', bg: '#fee2e2', label: 'Needs improvement' },
  unknown: { color: '#64748b', bg: '#e2e8f0', label: 'Pending analysis' },
};

export const SkinAgeInsightCard: React.FC<SkinAgeInsightCardProps> = ({
  insight,
  loading,
  onRetry,
  productsLoading,
  onRefreshProducts,
  recommendedProducts
}) => {
  const [latestTwin, setLatestTwin] = useState<any | null>(null);
  const [isSpeakingTips, setIsSpeakingTips] = useState(false);
  const copy = statusCopy[insight?.status || 'unknown'];
  const realAge = insight?.latestAnalysis?.realAge;
  const skinAge = insight?.latestAnalysis?.skinAge;
  const delta = insight?.delta;
  const score = insight?.latestAnalysis?.skinScore;
  const trendSeries = insight?.trend?.series || [];
  const quickTips = insight?.advice?.length ? insight.advice : ['Add a first analysis.'];

  useEffect(() => {
    let mounted = true;
    const loadTwin = async () => {
      try {
        const twin = await digitalTwinService.getLatestDigitalTwin();
        if (mounted) setLatestTwin(twin);
      } catch {
        if (mounted) setLatestTwin(null);
      }
    };
    void loadTwin();
    return () => { mounted = false; };
  }, [insight?.userId]);

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

  const getRiskLevel = (value: number | null): string => {
    if (value == null) return 'Unknown';
    if (value >= 75) return 'Low Risk';
    if (value >= 55) return 'Moderate Risk';
    return 'High Risk';
  };

  const getLifestyleFactors = (): string[] => {
    const fromTwin = latestTwin?.simulationContext?.lifestyleFactors;
    if (Array.isArray(fromTwin) && fromTwin.length > 0) return fromTwin;
    return ['Not enough lifestyle data'];
  };

  const buildAnalysisSummary = (): string => {
    const scoreValue = safeNum(score);
    const deltaValue = safeNum(delta);
    return [
      `Current skin score is ${scoreValue ?? 'N/A'}/100 (${classifyScore(scoreValue)}).`,
      `Skin age gap is ${deltaValue ?? 'N/A'} years (${classifyDelta(deltaValue)}).`,
    ].join(' ');
  };

  const buildRecommendedActions = (): string[] => {
    return (insight?.advice || []).slice(0, 8);
  };

  const userCtx = (() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : { name: 'User', email: 'N/A' };
    } catch {
      return { name: 'User', email: 'N/A' };
    }
  })();

  const exportData = {
    insight, score, delta, realAge, skinAge, trendSeries,
    userCtx: { name: userCtx.name || userCtx.firstName || 'User', email: userCtx.email || 'N/A' },
    riskLevel: getRiskLevel(safeNum(score)),
    lifestyleFactors: getLifestyleFactors(),
    recommendedActions: buildRecommendedActions(),
    analysisSummary: buildAnalysisSummary()
  };

  const handleExportPdf = () => exportInsightToPdf(exportData);
  const handleExportExcel = () => exportInsightToExcel(exportData);

  const handleSpeakQuickTips = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const tipsText = quickTips.map((tip, index) => `Tip ${index + 1}. ${tip}`).join(' ');
    const utterance = new SpeechSynthesisUtterance(tipsText);
    utterance.onend = () => setIsSpeakingTips(false);
    setIsSpeakingTips(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleStopQuickTips = () => {
    window.speechSynthesis.cancel();
    setIsSpeakingTips(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-lg p-8 flex flex-col gap-6">
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-100 to-teal-50 border border-teal-200 grid place-items-center text-teal-700 flex-shrink-0 mt-0.5">
            <HeartPulse size={20} />
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase font-bold text-slate-400 tracking-widest mb-1">Overview</p>
            <h3 className="text-base font-extrabold text-slate-900 mb-1">Skin Age Insights</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Track your skin age progression and get personalized insights</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={handleExportPdf} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors">
            <FileText size={13} /> Export PDF
          </button>
          <button onClick={handleExportExcel} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors">
            <Sheet size={13} /> Export Excel
          </button>
          {onRetry && (
            <button onClick={() => onRetry(true)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-colors">
              <RefreshCcw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-100 rounded-lg" />
          <div className="h-4 bg-slate-100 rounded-lg w-2/3" />
          <div className="h-24 bg-slate-100 rounded-lg" />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-2 rounded-full text-xs font-bold" style={{ color: copy.color, background: copy.bg }}>
              {copy.label}
            </span>
            {delta != null && (
              <span className="px-3 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold">
                Δ {delta > 0 ? '+' : ''}{delta} yrs
              </span>
            )}
            {score != null && (
              <span className="px-3 py-2 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold border border-teal-200 flex items-center gap-2">
                <Activity size={13} /> Score {score}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 p-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-teal-50 via-white to-white md:order-1">
              <div className="flex items-center justify-between gap-3 mb-5">
                <p className="text-sm font-bold text-slate-700 uppercase tracking-wider">Quick tips</p>
                <button
                  onClick={isSpeakingTips ? handleStopQuickTips : handleSpeakQuickTips}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-teal-200 bg-white text-teal-700 text-xs font-semibold hover:bg-teal-50 transition-colors"
                >
                  {isSpeakingTips ? <Square size={13} /> : <Volume2 size={13} />}
                  {isSpeakingTips ? 'Arreter' : 'Ecouter'}
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {quickTips.map((item) => (
                  <span key={item} className="px-4 py-3 rounded-lg bg-white border border-slate-200 text-sm text-slate-800 font-medium shadow-sm hover:shadow-md hover:border-slate-300 transition-all">{item}</span>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-white md:order-2 shadow-sm">
              <div className="mb-5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Summary</p>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  {insight?.headline || 'No summary available. Run a skin analysis to generate advanced insights.'}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <Link to="/digital-twin" className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                      <Sparkles size={14} />
                    </div>
                    <span className="text-xs font-bold text-slate-600 group-hover:text-teal-600 transition-colors">Digital Twin Simulation</span>
                  </div>
                  <ArrowRight size={14} className="text-slate-400 group-hover:text-teal-600 transform group-hover:translate-x-1 transition-all" />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
