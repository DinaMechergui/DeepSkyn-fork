import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Activity, Info, Waves, Flame, Microscope,
    Bandage, CircleDot, HeartPulse, Sparkles,
    AlertTriangle, CheckCircle, X,
    ChevronRight
} from 'lucide-react';
import type { ConditionScore } from '../../types/aiAnalysis';

/* ─────────────────────── Metadata Getter ────────────────────── */

export const getAnalysisMetadata = (t: any) => {
    const CONDITION_META: Record<string, {
        label: string;
        icon: any;
        color: string;
        bg: string;
        border: string;
        gradient: string;
        description: string;
    }> = {
        'Acne': {
            label: t('analysis.conditions.Acne'), icon: Flame, color: '#f43f5e',
            bg: 'rgba(244,63,94,0.05)', border: 'rgba(244,63,94,0.15)',
            gradient: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
            description: t('analysis.condition_meta_desc.Acne')
        },
        'Enlarged-Pores': {
            label: t('analysis.conditions.Enlarged-Pores'), icon: Waves, color: '#8b5cf6',
            bg: 'rgba(139,92,246,0.05)', border: 'rgba(139,92,246,0.15)',
            gradient: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
            description: t('analysis.condition_meta_desc.Enlarged-Pores')
        },
        'Atrophic Scars': {
            label: t('analysis.conditions.Atrophic Scars'), icon: Bandage, color: '#64748b',
            bg: 'rgba(100,116,139,0.05)', border: 'rgba(100,116,139,0.15)',
            gradient: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            description: t('analysis.condition_meta_desc.Atrophic Scars')
        },
        'Skin Redness': {
            label: t('analysis.conditions.Skin Redness'), icon: HeartPulse, color: '#ef4444',
            bg: 'rgba(239,68,68,0.05)', border: 'rgba(239,68,68,0.15)',
            gradient: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
            description: t('analysis.condition_meta_desc.Skin Redness')
        },
        'Blackheads': {
            label: t('analysis.conditions.Blackheads'), icon: CircleDot, color: '#1e293b',
            bg: 'rgba(30,41,59,0.05)', border: 'rgba(30,41,59,0.15)',
            gradient: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
            description: t('analysis.condition_meta_desc.Blackheads')
        },
        'Dark-Spots': {
            label: t('analysis.conditions.Dark-Spots'), icon: Sparkles, color: '#d97706',
            bg: 'rgba(217,119,6,0.05)', border: 'rgba(217,119,6,0.15)',
            gradient: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            description: t('analysis.condition_meta_desc.Dark-Spots')
        },
        'black_dots': {
            label: t('analysis.conditions.black_dots'), icon: Microscope, color: '#0d9488',
            bg: 'rgba(13,148,136,0.05)', border: 'rgba(13,148,136,0.15)',
            gradient: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            description: t('analysis.condition_meta_desc.black_dots')
        },
        'Hydration': {
            label: t('analysis.conditions.Hydration'), icon: Waves, color: '#0ea5e9',
            bg: 'rgba(14,165,233,0.05)', border: 'rgba(14,165,233,0.15)',
            gradient: 'linear-gradient(135deg, #ecfeff 0%, #e0f2fe 100%)',
            description: t('analysis.condition_meta_desc.Hydration')
        },
        'Wrinkles': {
            label: t('analysis.conditions.Wrinkles'), icon: AlertTriangle, color: '#d97706',
            bg: 'rgba(217,119,6,0.05)', border: 'rgba(217,119,6,0.15)',
            gradient: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            description: t('analysis.condition_meta_desc.Wrinkles')
        },
    };

    const BLEND_LABELS: Record<string, { label: string; helper: string }> = {
        'Acne': { label: t('analysis.conditions.Acne'), helper: t('analysis.fusion') },
        'Blackheads': { label: t('analysis.conditions.Blackheads'), helper: t('analysis.fusion') },
        'Enlarged-Pores': { label: t('analysis.profile.concerns_labels.pores'), helper: t('analysis.fusion') },
        'Skin Redness': { label: t('analysis.conditions.Skin Redness'), helper: t('analysis.fusion') },
        'Hydration': { label: t('analysis.conditions.Hydration'), helper: t('analysis.fusion') },
        'Wrinkles': { label: t('analysis.conditions.Wrinkles'), helper: t('analysis.fusion') },
    };

    const CONDITION_DETAILS: Record<string, { detailedDescription: string; causes: string[]; careRecommendations: string[] }> = {
        'Acne': {
            detailedDescription: t('analysis.condition_details.Acne.desc'),
            causes: t('analysis.condition_details.Acne.causes', { returnObjects: true }) as string[],
            careRecommendations: t('analysis.condition_details.Acne.care', { returnObjects: true }) as string[]
        },
        'Enlarged-Pores': {
            detailedDescription: t('analysis.condition_details.Enlarged-Pores.desc'),
            causes: t('analysis.condition_details.Enlarged-Pores.causes', { returnObjects: true }) as string[],
            careRecommendations: t('analysis.condition_details.Enlarged-Pores.care', { returnObjects: true }) as string[]
        },
        'Blackheads': {
            detailedDescription: t('analysis.condition_details.Blackheads.desc'),
            causes: t('analysis.condition_details.Blackheads.causes', { returnObjects: true }) as string[],
            careRecommendations: t('analysis.condition_details.Blackheads.care', { returnObjects: true }) as string[]
        },
        'Skin Redness': {
            detailedDescription: t('analysis.condition_details.Skin Redness.desc'),
            causes: t('analysis.condition_details.Skin Redness.causes', { returnObjects: true }) as string[],
            careRecommendations: t('analysis.condition_details.Skin Redness.care', { returnObjects: true }) as string[]
        },
        'Hydration': {
            detailedDescription: t('analysis.condition_details.Hydration.desc'),
            causes: t('analysis.condition_details.Hydration.causes', { returnObjects: true }) as string[],
            careRecommendations: t('analysis.condition_details.Hydration.care', { returnObjects: true }) as string[]
        },
        'Wrinkles': {
            detailedDescription: t('analysis.condition_details.Wrinkles.desc'),
            causes: t('analysis.condition_details.Wrinkles.causes', { returnObjects: true }) as string[],
            careRecommendations: t('analysis.condition_details.Wrinkles.care', { returnObjects: true }) as string[]
        },
        'Atrophic Scars': {
            detailedDescription: t('analysis.condition_details.Atrophic Scars.desc'),
            causes: t('analysis.condition_details.Atrophic Scars.causes', { returnObjects: true }) as string[],
            careRecommendations: t('analysis.condition_details.Atrophic Scars.care', { returnObjects: true }) as string[]
        },
        'Dark-Spots': {
            detailedDescription: t('analysis.condition_details.Dark-Spots.desc'),
            causes: t('analysis.condition_details.Dark-Spots.causes', { returnObjects: true }) as string[],
            careRecommendations: t('analysis.condition_details.Dark-Spots.care', { returnObjects: true }) as string[]
        },
        'black_dots': {
            detailedDescription: t('analysis.condition_details.black_dots.desc'),
            causes: t('analysis.condition_details.black_dots.causes', { returnObjects: true }) as string[],
            careRecommendations: t('analysis.condition_details.black_dots.care', { returnObjects: true }) as string[]
        }
    };

    return { CONDITION_META, BLEND_LABELS, CONDITION_DETAILS };
};

/* ─────────────────────── Helper Components ────────────────────── */

export function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
    const r = 45;
    const circumference = 2 * Math.PI * r;
    const filled = ((100 - score) / 100) * circumference;
    const { t } = useTranslation();
    
    const getColor = (s: number) => {
        if (s >= 75) return '#10b981';
        if (s >= 50) return '#f59e0b';
        return '#ef4444';
    };
    
    const getLabel = (s: number) => {
        if (s >= 75) return t('analysis.optimal');
        if (s >= 50) return t('analysis.moderate');
        return t('analysis.critical');
    };
    
    const color = getColor(score);
    const label = getLabel(score);

    return (
        <div style={{ position: 'relative', width: size, height: size }}>
            <svg width={size} height={size} viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r={r + 3} fill="none" stroke="rgba(0,0,0,0.03)" strokeWidth="1" />
                <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
                <circle
                    cx="50" cy="50" r={r} fill="none"
                    stroke={color} strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={filled}
                    strokeLinecap="round"
                    style={{
                        filter: `drop-shadow(0 0 10px ${color}40)`,
                        transition: 'stroke-dashoffset 1.5s cubic-bezier(0.22, 1, 0.36, 1), stroke 0.5s ease'
                    }}
                />
            </svg>
            <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center'
            }}>
                <span style={{ fontSize: size * 0.25, fontWeight: 900, color: '#1e293b', lineHeight: 1, letterSpacing: '-0.03em' }}>
                    {Math.round(score)}
                </span>
                <div style={{
                    marginTop: 4, padding: '2px 8px', borderRadius: 99,
                    background: `${color}15`, color: color, fontSize: size * 0.08,
                    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>
                    {label}
                </div>
            </div>
        </div>
    );
}

export function ConditionBar({ condition, onSelect }: { condition: ConditionScore; onSelect?: (condition: ConditionScore) => void }) {
    const { t } = useTranslation();
    const { CONDITION_META } = getAnalysisMetadata(t);
    const meta = CONDITION_META[condition.type] || {
        label: condition.type, icon: Info, color: '#6b7280',
        bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.2)',
        gradient: '', description: ''
    };

    const isEvaluated = typeof condition.score === 'number';
    const scoreValue = isEvaluated ? condition.score : 0;
    const getScoreColor = (evaluated: boolean, val: number) => {
        if (!evaluated) return '#94a3b8';
        if (val >= 75) return '#10b981';
        if (val >= 50) return '#f59e0b';
        return '#ef4444';
    };
    const scoreColor = getScoreColor(isEvaluated, scoreValue);

    const getInterpretation = () => {
        if (!isEvaluated) return t('analysis.unavailable');
        if (scoreValue >= 75) return `${t('analysis.optimal')} : ${t('analysis.interpretation.optimal')}`;
        if (scoreValue >= 50) return `${t('analysis.moderate')} : ${t('analysis.interpretation.moderate')}`;
        return `${t('analysis.critical')} : ${t('analysis.interpretation.critical')}`;
    };
    const interpretation = getInterpretation();
    const Icon = meta.icon;

    return (
        <div
            className="skin-condition-bar"
            data-testid={`condition-bar-${condition.type}`}
            onClick={() => onSelect?.(condition)}
            style={{
                background: '#ffffff', border: '1px solid #f1f5f9',
                borderRadius: 16, padding: '18px 22px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                position: 'relative', overflow: 'hidden', cursor: 'pointer'
            }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: meta.gradient || meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${meta.border}` }}>
                        <Icon size={20} style={{ color: meta.color }} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, color: meta.color, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{meta.label}</div>
                        <div style={{ fontWeight: 800, color: '#1e293b', fontSize: 15, letterSpacing: '-0.01em' }}>
                            {isEvaluated ? interpretation?.split(':')[0] : t('analysis.non_evaluated')}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: scoreColor, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                            {isEvaluated ? Math.round(scoreValue) : '—'}
                        </div>
                        <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, marginTop: 2, fontFamily: 'monospace' }}>SCORE/100</div>
                    </div>
                    <ChevronRight size={18} color="#bbb" />
                </div>
            </div>
            <div style={{ color: '#64748b', fontSize: 12, lineHeight: 1.5, marginBottom: 14, minHeight: '1.5em' }}>
                {isEvaluated ? interpretation?.split(':')[1]?.trim() : (condition.notEvaluatedReason || t('analysis.no_data_available'))}
            </div>
            {isEvaluated ? (
                <div style={{ height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden', position: 'relative' }}>
                    <div style={{ height: '100%', width: `${scoreValue}%`, background: `linear-gradient(90deg, ${scoreColor}cc, ${scoreColor})`, borderRadius: 99, transition: 'width 1.5s cubic-bezier(0.22, 1, 0.36, 1)' }} />
                </div>
            ) : (
                <div style={{ height: 8, background: '#f8fafc', borderRadius: 99, border: '1px dashed #e2e8f0' }} />
            )}
        </div>
    );
}

export function ConditionDetailDrawer({ condition, result, onClose }: { condition: any; result: any; onClose: () => void }) {
    const { t } = useTranslation();
    const { CONDITION_META, CONDITION_DETAILS } = getAnalysisMetadata(t);
    const meta = CONDITION_META[condition.type] || { label: condition.type, icon: Info, color: '#6b7280', description: t('analysis.no_description_available') };
    const baseDetails = CONDITION_DETAILS[condition.type] || { detailedDescription: meta.description, causes: [], careRecommendations: [] };

    const scoreValue = typeof condition.score === 'number' ? Math.round(condition.score) : null;

    const getTier = (val: number | null) => {
        if (val === null) return 'unknown';
        if (val >= 75) return 'excellent';
        if (val >= 50) return 'moderate';
        return 'critical';
    };
    const tier = getTier(scoreValue);

    const getSeverityColor = (t: string) => {
        switch (t) {
            case 'excellent': return '#10b981';
            case 'moderate': return '#f59e0b';
            case 'critical': return '#ef4444';
            default: return '#94a3b8';
        }
    };
    const severityColor = getSeverityColor(tier);

    const tierLabel = (() => {
        if (tier === 'excellent') return t('analysis.optimal');
        if (tier === 'moderate') return t('analysis.moderate');
        return t('analysis.critical');
    })();

    const getDynamicDescription = () => {
        if (result.totalDetections === 0) return t('analysis.no_detection_summary', { condition: meta.label.toLowerCase() });
        if (tier === 'excellent') return `${baseDetails.detailedDescription} ${t('analysis.desc_excellent')}`;
        if (tier === 'moderate') return `${baseDetails.detailedDescription} ${t('analysis.desc_moderate', { score: scoreValue })}`;
        
        const count = condition.count ?? 0;
        let detectionsStr = t('analysis.several_signals');
        if (count > 1) {
            detectionsStr = t('analysis.detections_plural', { count });
        } else if (count === 1) {
            detectionsStr = t('analysis.detections_singular', { count });
        }
        
        return `${baseDetails.detailedDescription} ${t('analysis.desc_critical', { score: scoreValue, detections: detectionsStr })}`;
    };

    return (
        <div className="drawer-overlay fade-in" onClick={onClose}>
            <div className="drawer-content slide-up" role="dialog" onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 16, background: `${meta.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color }}>
                            {meta.icon ? <meta.icon size={24} /> : <Activity size={24} />}
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#1e293b' }}>{meta.label}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: severityColor, textTransform: 'uppercase' }}>
                                    {tierLabel}
                                </span>
                                <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#cbd5e1' }} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Score {scoreValue}/100</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ width: 40, height: 40, borderRadius: '50%', background: '#f8fafc', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: 20, background: '#f8fafc', borderRadius: 20, border: '1px solid #f1f5f9', marginBottom: 24 }}>
                    <h4 style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('analysis.ai_diagnostic')}</h4>
                    <p style={{ margin: 0, fontSize: 14, color: '#334155', lineHeight: 1.6 }}>{getDynamicDescription()}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <div>
                        <h4 style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>{t('analysis.pdf.probable_causes')}</h4>
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                            {baseDetails.causes.map((cause) => (
                                <li key={cause} style={{ fontSize: 13, color: '#64748b', marginBottom: 10, display: 'flex', gap: 8 }}>
                                    <span style={{ color: meta.color, fontWeight: 'bold' }}>•</span> {cause}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 style={{ margin: '0 0 12px', fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>{t('analysis.pdf.care_advice')}</h4>
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                            {baseDetails.careRecommendations.map((reco) => (
                                <li key={reco} style={{ fontSize: 13, color: '#334155', marginBottom: 10, display: 'flex', gap: 8, fontWeight: 500 }}>
                                    <CheckCircle size={14} style={{ color: '#10b981', marginTop: 2, flexShrink: 0 }} /> {reco}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
