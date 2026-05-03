import React from 'react';
import {
    Sun, Moon, Sparkles, ChevronDown, ChevronUp,
    Loader2, Lock, ArrowUpRight, Info, CheckCircle, AlertCircle,
    Droplets, Star, Zap,
} from 'lucide-react';
import type { SvrRoutineStep, SvrRecommendedProduct } from '../../services/svrRoutineService';

/* ─── Category colour map ────────────────────────────────────────── */
export const CAT_META: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
    cleanser: { label: 'Nettoyant', color: '#0891b2', bg: 'rgba(8,145,178,0.08)', emoji: '🧼' },
    toner: { label: 'Tonique', color: '#7c3aed', bg: 'rgba(124,58,237,0.08)', emoji: '💦' },
    serum: { label: 'Sérum', color: '#0d9488', bg: 'rgba(13,148,136,0.08)', emoji: '💧' },
    moisturizer: { label: 'Hydratant', color: '#2563eb', bg: 'rgba(37,99,235,0.08)', emoji: '🫧' },
    sunscreen: { label: 'Écran Solaire', color: '#d97706', bg: 'rgba(217,119,6,0.08)', emoji: '☀️' },
    'eye-cream': { label: 'Contour Yeux', color: '#7e22ce', bg: 'rgba(126,34,206,0.08)', emoji: '👁️' },
    exfoliant: { label: 'Exfoliant', color: '#b45309', bg: 'rgba(180,83,9,0.08)', emoji: '✨' },
    mask: { label: 'Masque', color: '#be185d', bg: 'rgba(190,24,93,0.08)', emoji: '🌿' },
    treatment: { label: 'Traitement', color: '#16a34a', bg: 'rgba(22,163,74,0.08)', emoji: '🔬' },
};

export function getCat(category: string) {
    return CAT_META[category] ?? { label: category, color: '#64748b', bg: 'rgba(100,116,139,0.08)', emoji: '🧴' };
}

export const normalizeImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('//')) return `https:${url}`;
    if (!url.startsWith('http')) return `https://${url}`;
    return url;
};

export const RoutineTabButton = ({ tab, activeTab, onClick, count, t }: { tab: 'morning' | 'night', activeTab: string, onClick: () => void, count: number, t: any }) => (
    <button onClick={onClick} style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '10px 22px', borderRadius: 50, border: 'none', cursor: 'pointer',
        fontSize: 13, fontWeight: 700, transition: 'all 0.2s',
        background: activeTab === tab ? 'linear-gradient(135deg,#0d9488,#6366f1)' : '#f1f5f9',
        color: activeTab === tab ? 'white' : '#64748b',
        boxShadow: activeTab === tab ? '0 4px 14px rgba(13,148,136,0.3)' : 'none',
    }}>
        {tab === 'morning' ? <Sun size={15} /> : <Moon size={15} />}
        {tab === 'morning' ? t('svr_routine.morning_tab', { defaultValue: ' Routine Matin (AM)' }) : t('svr_routine.night_tab', { defaultValue: ' Routine Soir (PM)' })}
        <span style={{
            fontSize: 10, fontWeight: 800,
            background: activeTab === tab ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
            color: activeTab === tab ? 'white' : '#64748b',
            padding: '2px 8px', borderRadius: 99,
        }}>
            {t('svr_routine.steps_count', { count, defaultValue: 'étapes' })}
        </span>
    </button>
);
