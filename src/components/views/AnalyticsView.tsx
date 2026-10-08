import React, { useMemo, useState } from 'react';
import { useInfra } from '../../context/InfraContext';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown,
  Minus,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { StatCard } from '../common/StatCard';

export const AnalyticsView: React.FC = () => {
  const { analytics, cityHealth, issues } = useInfra();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'ytd'>('7d');

  if (!analytics) return null;

  // Compute severity distribution from live issues (active only)
  const severityPieData = useMemo(() => {
    const active = issues.filter(i => i.status !== 'resolved');
    const critical = active.filter(i => i.severityScore >= 81).length;
    const high     = active.filter(i => i.severityScore >= 61 && i.severityScore < 81).length;
    const moderate = active.filter(i => i.severityScore >= 31 && i.severityScore < 61).length;
    const low      = active.filter(i => i.severityScore < 31).length;
    return [
      { name: 'Critical (81–100)', value: critical || 1, color: '#EF4444' },
      { name: 'High (61–80)',      value: high     || 0, color: '#F97316' },
      { name: 'Moderate (31–60)', value: moderate  || 0, color: '#F59E0B' },
      { name: 'Low (0–30)',        value: low       || 0, color: '#10B981' },
    ].filter(d => d.value > 0);
  }, [issues]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Title & Time Range Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-wide">
              INFRASTRUCTURE INTELLIGENCE
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              METRIC VIZ
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono">
            Macro-civic trend analysis, mean-time-to-repair (MTTR), and demographic impact scores.
          </p>
        </div>

        {/* Time Filter */}
        <div className="flex items-center rounded-lg bg-[#0E1524] border border-slate-800 p-1 text-xs font-mono">
          {(['7d', '30d', 'ytd'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-md transition-colors ${
                timeRange === range
                  ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Year to Date'}
            </button>
          ))}
        </div>
      </div>

      {/* Tactical Civic Insights Strip (Rule 11) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-[#0F172A] border border-amber-500/30 flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-amber-950/80 text-amber-400 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-amber-400 font-bold">Trend Velocity</div>
            <p className="text-xs text-slate-200 font-mono font-medium mt-0.5">
              Road damage increased 18% this month.
            </p>
            <div className="text-[10px] text-slate-500 font-mono mt-1">Accelerated by seasonal heavy rainfall</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0F172A] border border-rose-500/30 flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-rose-950/80 text-rose-400 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-rose-400 font-bold">Density Outlier</div>
            <p className="text-xs text-slate-200 font-mono font-medium mt-0.5">
              Ward 17 has the highest unresolved issue density.
            </p>
            <div className="text-[10px] text-slate-500 font-mono mt-1">4.8 reports / km² above metro median</div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0F172A] border border-cyan-500/30 flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 text-cyan-400 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-cyan-400 font-bold">SLA Performance</div>
            <p className="text-xs text-slate-200 font-mono font-medium mt-0.5">
              Drainage incidents have the longest average resolution time.
            </p>
            <div className="text-[10px] text-slate-500 font-mono mt-1">Average MTTR 46.2h vs 28.4h target</div>
          </div>
        </div>
      </div>

      {/* Top High-Level Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="CITY HEALTH INDEX"
          value={cityHealth ? `${cityHealth.overallScore.toFixed(1)}` : `${analytics.systemHealthIndex}%`}
          subValue={cityHealth
            ? (cityHealth.trend === 'improving' ? '▲ IMPROVING' : cityHealth.trend === 'declining' ? '▼ DECLINING' : '— STABLE')
            : 'AGGREGATE'}
          accentColor="emerald"
          trend={{
            value: cityHealth
              ? (cityHealth.trend === 'improving' ? '+2.1 pts vs last week' : cityHealth.trend === 'declining' ? '−1.8 pts vs last week' : 'No change this week')
              : '+2.1% this week',
            isPositive: cityHealth ? cityHealth.trend === 'improving' : true,
            isNeutral: cityHealth ? cityHealth.trend === 'stable' : false,
          }}
        />

        <StatCard
          label="AVERAGE MTTR"
          value={`${analytics.averageMttrHours}h`}
          subValue="DISPATCH TO FIX"
          accentColor="cyan"
          trend={{ value: '4.2x baseline speed', isPositive: true }}
        />

        <StatCard
          label="POPULATION COVERED"
          value="330.1k"
          subValue="ACTIVE COMMUTERS"
          accentColor="slate"
          trend={{ value: '100% Wards', isNeutral: true }}
        />

        <StatCard
          label="AUTONOMOUS TRIAGE"
          value="94.6%"
          subValue="PRECISION"
          accentColor="amber"
          trend={{ value: 'Zero False Dispatches', isPositive: true }}
        />
      </div>

      {/* Chart Grid: Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Issues Over Time (8 Cols) */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-[#090D17] border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h3 className="font-mono text-sm font-bold text-slate-100 uppercase tracking-wide">
                Issues Over Time: Detection vs Resolution
              </h3>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                Daily volume of AI-flagged defects vs completed municipal repairs
              </p>
            </div>
            <span className="text-[11px] font-mono text-emerald-400">Net Delta: +6 Resolved/Day</span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDetected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} fontFamily="monospace" />
                <YAxis stroke="#64748B" fontSize={11} fontFamily="monospace" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0E1524',
                    borderColor: '#1E293B',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: '#F8FAFC',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="detected"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorDetected)"
                  name="Detected Defects"
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorResolved)"
                  name="Resolved Work Orders"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Distribution Donut (4 Cols) */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-[#090D17] border border-slate-800 shadow-xl space-y-4">
          <div className="border-b border-slate-800/80 pb-3">
            <h3 className="font-mono text-sm font-bold text-slate-100 uppercase tracking-wide">
              Severity Distribution
            </h3>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Active defects stratified by life-safety impact
            </p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {severityPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0E1524',
                    borderColor: '#1E293B',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: '#F8FAFC',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            {severityPieData.map((s, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-slate-300">{s.name}: {s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Grid: Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ward Health Index Comparison (6 Cols) */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-[#090D17] border border-slate-800 shadow-xl space-y-4">
          <div className="border-b border-slate-800/80 pb-3">
            <h3 className="font-mono text-sm font-bold text-slate-100 uppercase tracking-wide">
              Ward Infrastructure Health Index
            </h3>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Comparative rating across administrative districts (Higher is healthier)
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.wards}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <XAxis type="number" domain={[0, 100]} stroke="#64748B" fontSize={11} fontFamily="monospace" />
                <YAxis
                  dataKey="wardId"
                  type="category"
                  stroke="#64748B"
                  fontSize={11}
                  fontFamily="monospace"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0E1524',
                    borderColor: '#1E293B',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: '#F8FAFC',
                  }}
                  formatter={(val: any) => [`${val} / 100`, 'Health Score']}
                />
                <Bar dataKey="healthScore" fill="#0EA5E9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Worst / Best Ward Callouts */}
          {cityHealth && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="rounded-lg bg-red-950/30 border border-red-500/20 p-3 space-y-0.5">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-red-400 uppercase tracking-wider">
                  <AlertTriangle size={10} />
                  Worst Ward
                </div>
                <div className="font-mono text-sm font-bold text-white">{cityHealth.worstPerformingWard.name}</div>
                <div className="font-mono text-xs text-red-300">{cityHealth.worstPerformingWard.score.toFixed(1)} / 100</div>
              </div>
              <div className="rounded-lg bg-emerald-950/30 border border-emerald-500/20 p-3 space-y-0.5">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 uppercase tracking-wider">
                  <TrendingUp size={10} />
                  Most Improved
                </div>
                <div className="font-mono text-sm font-bold text-white">{cityHealth.mostImprovedWard.name}</div>
                <div className="font-mono text-xs text-emerald-300">+{cityHealth.mostImprovedWard.improvement.toFixed(1)} pts</div>
              </div>
            </div>
          )}
        </div>

        {/* Resolution Time (MTTR) by Authority (6 Cols) */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-[#090D17] border border-slate-800 shadow-xl space-y-4">
          <div className="border-b border-slate-800/80 pb-3">
            <h3 className="font-mono text-sm font-bold text-slate-100 uppercase tracking-wide">
              Resolution Time (MTTR in Hours) by Department
            </h3>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Average turnaround from AI detection to work order closure
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.departmentPerformance}
                margin={{ top: 10, right: 10, left: -15, bottom: 25 }}
              >
                <XAxis
                  dataKey="name"
                  stroke="#64748B"
                  fontSize={10}
                  fontFamily="monospace"
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis stroke="#64748B" fontSize={11} fontFamily="monospace" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0E1524',
                    borderColor: '#1E293B',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: '#F8FAFC',
                  }}
                  formatter={(val: any) => [`${val} hours`, 'Average MTTR']}
                />
                <Bar dataKey="avgTimeHours" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
