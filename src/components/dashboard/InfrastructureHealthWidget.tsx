import React from 'react';
import { useInfra } from '../../context/InfraContext';
import { 
  Activity, 
  Droplet, 
  Lightbulb, 
  Trash2, 
  Footprints, 
  Car, 
  TrendingDown, 
  TrendingUp,
  AlertTriangle,
  Award,
  Compass
} from 'lucide-react';
import { InfrastructureCategory } from '../../types/infrastructure';

export const InfrastructureHealthWidget: React.FC = () => {
  const { filters, setFilters, addToast, cityHealth } = useInfra();

  const health = cityHealth || {
    overallScore: 76,
    categoryScores: {
      roads: 68,
      drainage: 74,
      lighting: 82,
      sidewalks: 71,
      waste: 89,
      signage: 92,
    },
    trend: 'improving',
    worstPerformingWard: { id: 'ward-6', name: 'Ward 6 — Mission & SOMA', score: 64 },
    mostImprovedWard: { id: 'ward-3', name: 'Ward 3 — Civic & Financial', score: 79, improvement: 4.8 },
  };

  const categories: {
    id: InfrastructureCategory;
    name: string;
    icon: React.ReactNode;
    healthScore: number;
    color: string;
  }[] = [
    {
      id: 'road_damage',
      name: 'Roads & Asphalt',
      icon: <Car className="w-4 h-4 text-rose-400" />,
      healthScore: health.categoryScores.roads,
      color: '#EF4444',
    },
    {
      id: 'drainage_overflow',
      name: 'Storm Drainage',
      icon: <Droplet className="w-4 h-4 text-cyan-400" />,
      healthScore: health.categoryScores.drainage,
      color: '#38BDF8',
    },
    {
      id: 'lighting_failure',
      name: 'Lighting & Grid',
      icon: <Lightbulb className="w-4 h-4 text-amber-400" />,
      healthScore: health.categoryScores.lighting,
      color: '#F59E0B',
    },
    {
      id: 'waste_accumulation',
      name: 'Solid Waste',
      icon: <Trash2 className="w-4 h-4 text-emerald-400" />,
      healthScore: health.categoryScores.waste,
      color: '#10B981',
    },
    {
      id: 'sidewalk_hazard',
      name: 'Sidewalks & ADA',
      icon: <Footprints className="w-4 h-4 text-orange-400" />,
      healthScore: health.categoryScores.sidewalks,
      color: '#F97316',
    },
  ];

  const handleFilterCategory = (catId: InfrastructureCategory) => {
    if (filters.category === catId) {
      setFilters((prev) => ({ ...prev, category: 'all' }));
      addToast('Reset category filter to All', 'info');
    } else {
      setFilters((prev) => ({ ...prev, category: catId }));
      addToast(`Filtered to ${catId.replace('_', ' ').toUpperCase()}`, 'info');
    }
  };

  return (
    <div className="rounded-2xl bg-[#090D17] border border-slate-800 p-4 sm:p-5 flex flex-col h-full shadow-xl">
      {/* Overall Score Header */}
      <div className="pb-3 border-b border-slate-800/80 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="font-mono text-sm font-bold text-slate-100 tracking-wide uppercase">
            City Infrastructure Health
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xl font-extrabold font-mono text-emerald-400">
            {health.overallScore} <span className="text-xs text-slate-500 font-normal">/ 100</span>
          </span>
          {health.trend === 'improving' ? (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-0.5 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
              <TrendingUp className="w-3 h-3" />
              <span>+2.4%</span>
            </span>
          ) : (
            <span className="text-xs font-mono text-rose-400 flex items-center gap-0.5 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-500/30">
              <TrendingDown className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>

      {/* Ward Benchmarks (Rule 13 requirement) */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-[11px] font-mono">
        <div className="p-2 rounded-lg bg-[#0E1524] border border-slate-800/80">
          <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            Worst Ward
          </span>
          <div className="font-bold text-rose-400 truncate mt-0.5">
            {health.worstPerformingWard.name.split('—')[0].trim()} ({health.worstPerformingWard.score}%)
          </div>
        </div>

        <div className="p-2 rounded-lg bg-[#0E1524] border border-slate-800/80">
          <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
            <Award className="w-3 h-3 text-emerald-400" />
            Most Improved
          </span>
          <div className="font-bold text-emerald-400 truncate mt-0.5">
            {health.mostImprovedWard.name.split('—')[0].trim()} (+{health.mostImprovedWard.improvement}%)
          </div>
        </div>
      </div>

      {/* Category Progress Bars */}
      <div className="space-y-2.5 flex-1 overflow-y-auto">
        {categories.map((cat) => {
          const isSelected = filters.category === cat.id;

          return (
            <div
              key={cat.id}
              onClick={() => handleFilterCategory(cat.id)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-cyan-950/40 border-cyan-400/80 ring-1 ring-cyan-500/50'
                  : 'bg-[#0E1524] border-slate-800/80 hover:border-slate-700 hover:bg-[#121B2F]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-slate-900 border border-slate-800">
                    {cat.icon}
                  </div>
                  <span className="text-xs font-semibold text-slate-200">
                    {cat.name}
                  </span>
                </div>

                <div className="text-xs font-mono font-bold text-slate-100">
                  {cat.healthScore}%
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${cat.healthScore}%`,
                    backgroundColor: cat.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Click to filter map & queue</span>
        {filters.category !== 'all' && (
          <button
            onClick={() => setFilters((p) => ({ ...p, category: 'all' }))}
            className="text-cyan-400 hover:underline"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
};
