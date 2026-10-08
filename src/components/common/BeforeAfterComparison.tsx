import React, { useState } from 'react';
import { Issue, ResolutionComparison } from '../../types/infrastructure';
import { SeverityIndicator } from './SeverityIndicator';
import { Badge } from './Badge';
import { 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  Users, 
  TrendingDown, 
  ShieldCheck, 
  Split,
  Eye
} from 'lucide-react';

interface BeforeAfterComparisonProps {
  issue?: Issue;
  comparison?: ResolutionComparison;
  onClose?: () => void;
}

export const BeforeAfterComparison: React.FC<BeforeAfterComparisonProps> = ({
  issue,
  comparison: customComparison,
  onClose,
}) => {
  const comparison = customComparison || issue?.resolutionComparison || {
    beforeSeverityScore: 87,
    afterSeverityScore: 12,
    beforeSeverity: 'critical',
    afterSeverity: 'healthy',
    resolutionTimeDays: 4.2,
    commutersProtected: 3500,
    beforeImageUrl: issue?.imageUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80',
    afterImageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
    repairedByDepartment: issue?.departmentName || 'Municipal Roads Department',
    notes: 'Full depth asphalt reclamation, binder layer injection, and high-friction seal coat applied. Structural integrity restored to 94%.',
  };

  const [sliderPos, setSliderPos] = useState(50);
  const [activeViewMode, setActiveViewMode] = useState<'split' | 'side-by-side'>('split');

  const severityDropPct = Math.round(
    ((comparison.beforeSeverityScore - comparison.afterSeverityScore) / comparison.beforeSeverityScore) * 100
  );

  return (
    <div className="rounded-2xl bg-[#090D17] border border-slate-800 p-5 sm:p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              LIFECYCLE RESOLUTION AUDIT
            </span>
            <span className="text-xs font-mono text-slate-400">
              {issue?.issueCode || 'INF-2026-902'}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold font-mono text-white mt-1">
            {issue?.title || 'Arterial Pavement Rehabilitation & Manhole Collar Leveling'}
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Verified post-repair telemetry, structural delta, and demographic risk mitigation.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center rounded-lg bg-[#0E1524] border border-slate-800 p-1 text-xs font-mono self-start sm:self-auto">
          <button
            onClick={() => setActiveViewMode('split')}
            className={`px-3 py-1 rounded transition-colors ${
              activeViewMode === 'split'
                ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Interactive Slider
          </button>
          <button
            onClick={() => setActiveViewMode('side-by-side')}
            className={`px-3 py-1 rounded transition-colors ${
              activeViewMode === 'side-by-side'
                ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Side by Side
          </button>
        </div>
      </div>

      {/* 4 Impact Delta Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#121624] to-[#0A0E17] border border-slate-800 space-y-1">
          <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-emerald-400" />
            Severity Reduction
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xl sm:text-2xl font-black text-rose-400 line-through opacity-80">
              {comparison.beforeSeverityScore}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono text-xl sm:text-2xl font-black text-emerald-400">
              {comparison.afterSeverityScore}
            </span>
          </div>
          <div className="text-[10px] font-mono text-emerald-400">
            ▼ {severityDropPct}% Damage Drop
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#121624] to-[#0A0E17] border border-slate-800 space-y-1">
          <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-400" />
            Resolution Time
          </div>
          <div className="font-mono text-xl sm:text-2xl font-black text-cyan-400">
            {comparison.resolutionTimeDays} Days
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            1.8 Days Ahead of SLA
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#121624] to-[#0A0E17] border border-slate-800 space-y-1">
          <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
            <Users className="w-3 h-3 text-indigo-400" />
            Commuters Protected
          </div>
          <div className="font-mono text-xl sm:text-2xl font-black text-slate-100">
            ~{comparison.commutersProtected.toLocaleString()}
          </div>
          <div className="text-[10px] font-mono text-indigo-300">
            Daily Corridor Flow
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#121624] to-[#0A0E17] border border-slate-800 space-y-1">
          <div className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-amber-400" />
            Repair Authority
          </div>
          <div className="font-mono text-xs font-bold text-amber-300 truncate mt-1">
            {comparison.repairedByDepartment}
          </div>
          <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
            <span>● Signed & Closed</span>
          </div>
        </div>
      </div>

      {/* Visual Image Inspection */}
      {activeViewMode === 'split' ? (
        <div className="relative h-72 sm:h-96 w-full rounded-xl overflow-hidden border border-slate-800 select-none bg-black">
          {/* After image (Background full) */}
          <img
            src={comparison.afterImageUrl}
            alt="Resolved Infrastructure"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold backdrop-blur-md">
            AFTER: RESOLVED (12/100)
          </div>

          {/* Before image (Clipped by slider) */}
          <div
            className="absolute inset-y-0 left-0 overflow-hidden"
            style={{ width: `${sliderPos}%` }}
          >
            <img
              src={comparison.beforeImageUrl}
              alt="Before Infrastructure Defect"
              className="absolute inset-0 w-full h-full object-cover max-w-none"
              style={{ width: '100%', minWidth: '100%', height: '100%' }}
            />
            <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold backdrop-blur-md">
              BEFORE: CRITICAL (87/100)
            </div>
          </div>

          {/* Slider divider line and draggable thumb */}
          <div
            className="absolute inset-y-0 w-1 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] cursor-ew-resize z-20"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-cyan-500 border-2 border-white shadow-xl flex items-center justify-center text-slate-950 font-bold text-xs pointer-events-none">
              ↔
            </div>
          </div>

          {/* Invisible interactive input range overlay */}
          <input
            type="range"
            min={0}
            max={100}
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-30"
            aria-label="Drag to compare before and after"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-rose-400 font-bold">BEFORE: CRITICAL DEFECT</span>
              <span className="text-slate-400">Severity: {comparison.beforeSeverityScore}/100</span>
            </div>
            <div className="relative h-64 rounded-xl overflow-hidden border border-rose-900/50">
              <img
                src={comparison.beforeImageUrl}
                alt="Before"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-rose-950/90 text-rose-300 border border-rose-500/30 text-[10px] font-mono">
                Detected by UAV Scan • P1 Triage
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-400 font-bold">AFTER: RESOLVED WORK ORDER</span>
              <span className="text-slate-400">Severity: {comparison.afterSeverityScore}/100</span>
            </div>
            <div className="relative h-64 rounded-xl overflow-hidden border border-emerald-900/50">
              <img
                src={comparison.afterImageUrl}
                alt="After"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                Work Closed in {comparison.resolutionTimeDays} Days
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Engineering Sign-off Notes */}
      <div className="p-3.5 rounded-xl bg-[#0E1524] border border-slate-800 space-y-1.5 text-xs font-mono">
        <div className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">
          Certified Inspection Sign-off:
        </div>
        <p className="text-slate-300 leading-relaxed font-sans text-xs">
          {comparison.notes}
        </p>
      </div>
    </div>
  );
};
