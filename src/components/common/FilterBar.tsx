import React from 'react';
import { FilterState } from '../../types/navigation';
import { Authority } from '../../types/infrastructure';
import { 
  Filter, 
  X, 
  RotateCcw, 
  Search, 
  SlidersHorizontal,
  Calendar,
  Building2,
  ShieldAlert,
  Flame,
  CheckCircle2
} from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  authorities?: Authority[];
  totalCount?: number;
  filteredCount?: number;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  setFilters,
  resetFilters,
  authorities = [],
  totalCount,
  filteredCount,
  className = '',
}) => {
  const activeChips: { key: keyof FilterState; label: string; value: string }[] = [];

  if (filters.searchQuery) {
    activeChips.push({ key: 'searchQuery', label: 'Query', value: `"${filters.searchQuery}"` });
  }
  if (filters.category !== 'all') {
    activeChips.push({ key: 'category', label: 'Category', value: filters.category.replace('_', ' ') });
  }
  if (filters.severity !== 'all') {
    activeChips.push({ key: 'severity', label: 'Severity', value: filters.severity.toUpperCase() });
  }
  if (filters.priority !== 'all') {
    activeChips.push({ key: 'priority', label: 'Priority', value: filters.priority });
  }
  if (filters.ward !== 'all') {
    activeChips.push({ key: 'ward', label: 'Ward', value: filters.ward });
  }
  if (filters.authority !== 'all') {
    const authName = authorities.find((a) => a.id === filters.authority)?.name || filters.authority;
    activeChips.push({ key: 'authority', label: 'Authority', value: authName });
  }
  if (filters.status !== 'all') {
    activeChips.push({ key: 'status', label: 'Status', value: filters.status.replace('_', ' ').toUpperCase() });
  }
  if (filters.dateRange !== 'all') {
    activeChips.push({ key: 'dateRange', label: 'Date', value: filters.dateRange === 'today' ? 'Today' : filters.dateRange === '7d' ? 'Last 7 Days' : 'Last 30 Days' });
  }
  if (filters.clusterOnly) {
    activeChips.push({ key: 'clusterOnly', label: 'Clustered', value: 'Hubs Only' });
  }

  const handleRemoveChip = (key: keyof FilterState) => {
    setFilters((prev) => ({
      ...prev,
      [key]: key === 'clusterOnly' ? false : key === 'searchQuery' ? '' : 'all',
    }));
  };

  return (
    <div className={`space-y-3 bg-[#0A0E18] border border-slate-800 rounded-xl p-3.5 shadow-xl ${className}`}>
      {/* Top Filter Controls Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2">
        {/* Search Input */}
        <div className="relative col-span-2">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search defects, street..."
            value={filters.searchQuery}
            onChange={(e) => setFilters((p) => ({ ...p, searchQuery: e.target.value }))}
            className="w-full bg-[#0E1524] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
          />
          {filters.searchQuery && (
            <button
              onClick={() => setFilters((p) => ({ ...p, searchQuery: '' }))}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Priority Filter */}
        <select
          value={filters.priority}
          onChange={(e) => setFilters((p) => ({ ...p, priority: e.target.value }))}
          className={`bg-[#0E1524] border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-cyan-500 ${
            filters.priority !== 'all' ? 'text-rose-400 font-bold border-rose-500/40' : 'text-slate-400'
          }`}
        >
          <option value="all">Priority: All</option>
          <option value="P0">⚡ P0 Emergency</option>
          <option value="P1">🔴 P1 Critical</option>
          <option value="P2">🟠 P2 High</option>
          <option value="P3">🟡 P3 Medium</option>
          <option value="P4">🟢 P4 Low</option>
        </select>

        {/* Severity Filter */}
        <select
          value={filters.severity}
          onChange={(e) => setFilters((p) => ({ ...p, severity: e.target.value }))}
          className={`bg-[#0E1524] border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-cyan-500 ${
            filters.severity !== 'all' ? 'text-amber-400 font-bold border-amber-500/40' : 'text-slate-400'
          }`}
        >
          <option value="all">Severity: All</option>
          <option value="critical">Critical (81–100)</option>
          <option value="high">High (61–80)</option>
          <option value="moderate">Moderate (31–60)</option>
          <option value="healthy">Healthy (0–30)</option>
        </select>

        {/* Ward Filter */}
        <select
          value={filters.ward}
          onChange={(e) => setFilters((p) => ({ ...p, ward: e.target.value }))}
          className={`bg-[#0E1524] border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-cyan-500 ${
            filters.ward !== 'all' ? 'text-cyan-400 font-bold border-cyan-500/40' : 'text-slate-400'
          }`}
        >
          <option value="all">Ward: All Wards</option>
          <option value="Ward 6">Ward 6 — SOMA & Mission</option>
          <option value="Ward 3">Ward 3 — Financial & Civic</option>
          <option value="Ward 9">Ward 9 — Mission District</option>
          <option value="Ward 5">Ward 5 — Western Addition</option>
          <option value="Ward 1">Ward 1 — Richmond</option>
        </select>

        {/* Authority Filter */}
        <select
          value={filters.authority}
          onChange={(e) => setFilters((p) => ({ ...p, authority: e.target.value }))}
          className={`bg-[#0E1524] border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-cyan-500 ${
            filters.authority !== 'all' ? 'text-indigo-400 font-bold border-indigo-500/40' : 'text-slate-400'
          }`}
        >
          <option value="all">Authority: All</option>
          {authorities.map((auth) => (
            <option key={auth.id} value={auth.id}>
              {auth.name.replace('Department', 'Dept').replace('Bureau of', 'Bur.')}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
          className={`bg-[#0E1524] border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-cyan-500 ${
            filters.status !== 'all' ? 'text-emerald-400 font-bold border-emerald-500/40' : 'text-slate-400'
          }`}
        >
          <option value="all">Status: All</option>
          <option value="detected">Detected</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>

        {/* Date Filter */}
        <select
          value={filters.dateRange}
          onChange={(e) => setFilters((p) => ({ ...p, dateRange: e.target.value }))}
          className={`bg-[#0E1524] border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-cyan-500 ${
            filters.dateRange !== 'all' ? 'text-cyan-300 font-bold border-cyan-500/40' : 'text-slate-400'
          }`}
        >
          <option value="all">Date: All Time</option>
          <option value="today">Today (24h)</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      {/* Active Filter Chips & Clear Action */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono uppercase text-slate-500 mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
              Active Filters:
            </span>
            {activeChips.map((chip) => (
              <span
                key={chip.key}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#131B2E] border border-cyan-500/30 text-cyan-300 text-[11px] font-mono"
              >
                <span className="text-slate-400 uppercase text-[9px]">{chip.label}:</span>
                <span className="font-semibold">{chip.value}</span>
                <button
                  onClick={() => handleRemoveChip(chip.key)}
                  className="text-cyan-400 hover:text-white ml-0.5"
                  title="Remove filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {filteredCount !== undefined && totalCount !== undefined && (
              <span className="text-[11px] font-mono text-slate-400">
                Showing <strong className="text-white">{filteredCount}</strong> of {totalCount} items
              </span>
            )}
            <button
              onClick={resetFilters}
              className="text-[11px] font-mono text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors px-2 py-0.5 rounded bg-slate-900 border border-slate-800"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
