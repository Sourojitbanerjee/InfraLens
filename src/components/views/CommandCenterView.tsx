import React, { useState } from 'react';
import { useInfra } from '../../context/InfraContext';
import { StatCard } from '../common/StatCard';
import { GisMap } from '../map/GisMap';
import { PriorityQueueWidget } from '../dashboard/PriorityQueueWidget';
import { InfrastructureHealthWidget } from '../dashboard/InfrastructureHealthWidget';
import { BeforeAfterComparison } from '../common/BeforeAfterComparison';
import { 
  Flame, 
  Camera, 
  RotateCcw,
  Maximize2,
  ShieldAlert,
  ArrowRight,
  Play,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';

export const CommandCenterView: React.FC = () => {
  const { 
    stats, 
    setCurrentView, 
    filters, 
    setFilters, 
    resetFilters,
    filteredIssues,
    openDetailDrawer,
    issues,
    cityHealth,
    setSelectedCluster
  } = useInfra();

  const [showBeforeAfterSpotlight, setShowBeforeAfterSpotlight] = useState(false);

  const emergencyIssue = issues.find((i) => i.priority === 'P0' && i.status !== 'resolved');
  const resolvedIssue = issues.find((i) => i.status === 'resolved' && i.resolutionComparison);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
      {/* P0 Emergency Alert Banner if Active */}
      {emergencyIssue && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/90 via-rose-950/90 to-purple-950/90 border border-rose-500/80 shadow-[0_0_20px_rgba(244,63,94,0.35)] flex flex-wrap items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-900/60 border border-rose-400 text-rose-300">
              <Flame className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-extrabold uppercase px-2 py-0.5 rounded bg-rose-600 text-white">
                  P0 EMERGENCY ACTIVE
                </span>
                <span className="text-xs font-mono font-bold text-rose-200">
                  {emergencyIssue.issueCode}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-100 font-semibold mt-0.5">
                {emergencyIssue.title} — {emergencyIssue.location.address}
              </p>
            </div>
          </div>

          <button
            onClick={() => openDetailDrawer(emergencyIssue)}
            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-rose-900/50"
          >
            <span>Triage Emergency</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner / Breadcrumb & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-wide">
              INFRASTRUCTURE COMMAND CENTER
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE TELEMETRY
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono">
            Metro GIS operations hub • Telling cities what to fix first, why it matters, and who should fix it.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setCurrentView('analyze')}
            className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold transition-all shadow-md shadow-cyan-600/20 flex items-center gap-2 active:scale-95"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>AI Street Scan</span>
          </button>

          <button
            onClick={() => setCurrentView('map')}
            className="px-3.5 py-2 rounded-xl bg-[#0E1524] hover:bg-[#141E33] border border-slate-800 text-slate-300 text-xs font-mono font-medium flex items-center gap-2 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Fullscreen GIS</span>
          </button>

          <button
            onClick={() => setShowBeforeAfterSpotlight(!showBeforeAfterSpotlight)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-mono font-medium flex items-center gap-2 transition-colors ${
              showBeforeAfterSpotlight
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-[#0E1524] hover:bg-[#141E33] border-slate-800 text-slate-300'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Before / After Audit</span>
          </button>

          {(filters.category !== 'all' || filters.severity !== 'all' || filters.priority !== 'all' || filters.ward !== 'all' || filters.status !== 'all') && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-colors"
              title="Reset Filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Statistics 6-Cards Municipal Operations Grid (Rule 2) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3.5">
        <StatCard
          label="ACTIVE ISSUES"
          value={stats.activeIssues}
          subValue="METRO WIDE"
          accentColor="cyan"
          trend={{ value: '+4 today', isNeutral: true }}
          onClick={() => setFilters((p) => ({ ...p, status: 'all' }))}
        />

        <StatCard
          label="CRITICAL INCIDENTS"
          value={stats.critical}
          subValue={stats.p0Emergency > 0 ? `${stats.p0Emergency} P0 ALERT` : 'P1 LIFE SAFETY'}
          accentColor="rose"
          trend={{ value: stats.p0Emergency > 0 ? 'P0 Triggered' : 'Priority 1', isPositive: false }}
          active={filters.severity === 'critical' || filters.priority === 'P1'}
          onClick={() =>
            setFilters((p) => ({
              ...p,
              severity: p.severity === 'critical' ? 'all' : 'critical',
            }))
          }
        />

        <StatCard
          label="ACTIVE CLUSTERS"
          value={stats.activeClusters}
          subValue="400m HUBS"
          accentColor="amber"
          trend={{ value: `${stats.activeClusters} hubs active`, isPositive: true }}
          active={filters.clusterOnly}
          onClick={() => setFilters((p) => ({ ...p, clusterOnly: !p.clusterOnly }))}
        />

        <StatCard
          label="AFFECTED POPULATION"
          value={`~${stats.affectedPopulation.toLocaleString()}`}
          subValue="COMMUTERS/DAY"
          accentColor="slate"
          trend={{ value: 'Lincoln & BART', isNeutral: true }}
        />

        <StatCard
          label="AVG RESOLUTION TIME"
          value={`${stats.avgResolutionHours}h`}
          subValue="DISPATCH TO FIX"
          accentColor="emerald"
          trend={{ value: '4.2x baseline speed', isPositive: true }}
        />

        <StatCard
          label="CITY HEALTH"
          value={`${cityHealth ? cityHealth.overallScore.toFixed(1) : '76.4'}%`}
          subValue={cityHealth ? `${cityHealth.trend.toUpperCase()} TREND` : 'AGGREGATE'}
          accentColor="emerald"
          trend={{ value: '+2.1% this week', isPositive: true }}
          onClick={() => setCurrentView('analytics')}
        />
      </div>

      {/* Optional Before / After Audit Spotlight (Rule 6) */}
      {showBeforeAfterSpotlight && resolvedIssue && (
        <div className="relative animate-fadeIn">
          <BeforeAfterComparison issue={resolvedIssue} onClose={() => setShowBeforeAfterSpotlight(false)} />
        </div>
      )}

      {/* Main Visual Centerpiece: Interactive GIS Map */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>METRO GEOSPATIAL INTELLIGENCE MAP</span>
          </span>
          <span>Showing {filteredIssues.length} Geocoded Incident Points</span>
        </div>

        {filteredIssues.length === 0 ? (
          <div className="h-[340px] sm:h-[440px] lg:h-[540px] rounded-2xl bg-[#090D17] border border-slate-800 flex flex-col items-center justify-center text-center p-6 sm:p-8 space-y-3">
            <div className="p-3 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-mono text-lg font-bold text-white">No critical infrastructure issues.</h3>
            <p className="text-sm font-mono text-emerald-400 font-medium">That&apos;s good news.</p>
            <p className="text-xs text-slate-400 max-w-md">
              All sensors and citizen feeds in the active filter selection are clear or fully resolved.
            </p>
            <button
              onClick={resetFilters}
              className="mt-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-white font-bold transition-colors"
            >
              Reset Filters to View All Incidents
            </button>
          </div>
        ) : (
          <GisMap heightClass="h-[340px] sm:h-[440px] lg:h-[540px]" showControls={true} />
        )}
      </div>

      {/* Bottom Grid: Left = Priority Queue, Right = Infrastructure Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Col: Priority Queue (7 Cols) */}
        <div className="lg:col-span-7 h-[420px] sm:h-[440px]">
          <PriorityQueueWidget maxItems={6} />
        </div>

        {/* Right Col: Infrastructure Health (5 Cols) */}
        <div className="lg:col-span-5 h-[420px] sm:h-[440px]">
          <InfrastructureHealthWidget />
        </div>
      </div>
    </div>
  );
};
