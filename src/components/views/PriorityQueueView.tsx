import React, { useState } from 'react';
import { useInfra } from '../../context/InfraContext';
import { Badge } from '../common/Badge';
import { FilterBar } from '../common/FilterBar';
import { Priority } from '../../types/infrastructure';
import { 
  Download, 
  Flame, 
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  RotateCcw,
  ArrowUpDown
} from 'lucide-react';

export const PriorityQueueView: React.FC = () => {
  const { 
    issues,
    filteredIssues, 
    openDetailDrawer, 
    filters, 
    setFilters, 
    resetFilters,
    authorities,
    addToast 
  } = useInfra();

  const [sortField, setSortField] = useState<'priority' | 'severity' | 'affected' | 'sla'>('priority');
  const [expandedIssueId, setExpandedIssueId] = useState<string | null>(null);

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        'IssueCode,Title,Category,Priority,Severity,Status,Address,AffectedUsers,Authority,PriorityReason',
        ...filteredIssues.map(
          (i) =>
            `"${i.issueCode}","${i.title}","${i.categoryLabel}","${i.priority}","${i.severity}","${i.status}","${i.location.address}","${i.impact.affectedUsersPerDay}","${i.authorityName}","${i.priorityExplainability?.reasons?.join('; ') || ''}"`
        ),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `InfraLens_Queue_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Priority queue exported as CSV report', 'success');
  };

  const priorityOrder: Record<Priority, number> = { P0: 0, P1: 1, P2: 2, P3: 3, P4: 4 };

  const sortedIssues = [...filteredIssues].sort((a, b) => {
    if (sortField === 'priority') {
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (pDiff !== 0) return pDiff;
      const sDiff = b.severityScore - a.severityScore;
      if (sDiff !== 0) return sDiff;
      return (b.impact?.affectedUsersPerDay ?? 0) - (a.impact?.affectedUsersPerDay ?? 0);
    }
    if (sortField === 'severity') {
      return b.severityScore - a.severityScore;
    }
    if (sortField === 'affected') {
      return b.impact.affectedUsersPerDay - a.impact.affectedUsersPerDay;
    }
    if (sortField === 'sla') {
      return a.impact.slaDeadlineHours - b.impact.slaDeadlineHours;
    }
    return 0;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-wide">
              TACTICAL PRIORITY QUEUE
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/40 font-bold">
              {filteredIssues.length} ACTIVE WORK ORDERS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono">
            Automated impact ranking cross-referencing population density, civic risk factors, and sub-base degradation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-[#0E1524] border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono">
            <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 hidden sm:inline">Sort:</span>
            <select
              value={sortField}
              aria-label="Sort issues by"
              onChange={(e) => setSortField(e.target.value as 'priority' | 'severity' | 'affected' | 'sla')}
              className="bg-transparent border-none text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="priority" className="bg-[#0E1524]">Priority Rank (P0/P1 First)</option>
              <option value="severity" className="bg-[#0E1524]">Severity Score (Highest)</option>
              <option value="affected" className="bg-[#0E1524]">Daily Commuters Affected</option>
              <option value="sla" className="bg-[#0E1524]">SLA Deadline (Urgent First)</option>
            </select>
          </div>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-xl bg-[#0E1524] hover:bg-[#141E33] border border-slate-800 text-slate-200 text-xs font-mono font-medium flex items-center gap-2 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Advanced FilterBar */}
      <FilterBar
        filters={filters}
        setFilters={setFilters}
        resetFilters={resetFilters}
        authorities={authorities}
        totalCount={issues.length}
        filteredCount={filteredIssues.length}
      />

      {/* Main Queue: Mobile Cards (< sm) + Desktop Table (sm+) */}
      <div className="rounded-2xl bg-[#090D17] border border-slate-800 overflow-hidden shadow-2xl">
        {sortedIssues.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="font-mono text-sm font-bold text-white tracking-wide">
                  No critical infrastructure issues.
                </div>
                <div className="text-xs font-mono text-emerald-400 font-medium mt-0.5">
                  That's good news.
                </div>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                All active work orders have met SLA thresholds or active filters eliminated remaining records.
              </p>
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0E1524] hover:bg-[#141E33] border border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Reset All Filters</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Card List (< sm) */}
            <div className="sm:hidden divide-y divide-slate-800/80">
              {sortedIssues.map((issue) => {
                const isExpanded = expandedIssueId === issue.id;

                return (
                  <div
                    key={`mobile-${issue.id}`}
                    onClick={() => openDetailDrawer(issue)}
                    className="p-4 space-y-2.5 hover:bg-[#0E1626] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                            issue.priority === 'P0'
                              ? 'bg-purple-950 text-rose-300 border border-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)] animate-pulse'
                              : issue.priority === 'P1'
                              ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                              : issue.priority === 'P2'
                              ? 'bg-orange-950 text-orange-300 border border-orange-500/40'
                              : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {issue.priority === 'P0' && <Flame className="w-3 h-3 text-rose-400" />}
                          <span>{issue.priority}</span>
                        </span>
                        <span className="text-xs font-mono text-cyan-400 font-bold">
                          {issue.issueCode}
                        </span>
                      </div>

                      <Badge
                        variant={
                          issue.status === 'resolved'
                            ? 'success'
                            : issue.status === 'in_progress'
                            ? 'warning'
                            : issue.status === 'assigned' || issue.status === 'dispatched'
                            ? 'cyan'
                            : 'danger'
                        }
                      >
                        {issue.status.toUpperCase().replace('_', ' ')}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-100 font-sans leading-snug">
                        {issue.title}
                      </h4>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">
                        {issue.location.address} • {issue.location.ward}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                      <div>
                        Commuters: <strong className="text-slate-200">~{issue.impact.affectedUsersPerDay.toLocaleString()}</strong>
                      </div>
                      <div className="text-amber-400 font-semibold">
                        SLA: {issue.impact.slaDeadlineHours}h
                      </div>
                    </div>

                    {issue.priorityExplainability?.reasons?.[0] && (
                      <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between gap-1 bg-[#090E1A] p-2 rounded-lg border border-slate-800">
                        <div className="flex items-center gap-1.5 truncate">
                          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="truncate">{issue.priorityExplainability.reasons[0]}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedIssueId(isExpanded ? null : issue.id);
                          }}
                          className="text-cyan-400 hover:underline shrink-0 text-[10px]"
                        >
                          {isExpanded ? 'Less' : 'More'}
                        </button>
                      </div>
                    )}

                    {isExpanded && (
                      <div className="p-2.5 rounded-lg bg-[#0B101D] border border-cyan-500/20 text-[11px] font-mono text-slate-300 space-y-1">
                        <div className="text-[10px] uppercase font-bold text-cyan-400">
                          Priority Drivers ({issue.priorityExplainability?.score ?? issue.severityScore}/100):
                        </div>
                        {(issue.priorityExplainability?.reasons || []).map((r, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <span className="text-cyan-400">•</span>
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop and Tablet Table (sm+) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs font-mono min-w-[760px]">
                <thead className="bg-[#0D1220] border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">Priority</th>
                    <th className="px-4 py-3.5">Incident ID & Title</th>
                    <th className="px-4 py-3.5">Location</th>
                    <th className="px-4 py-3.5">Commuters</th>
                    <th className="px-4 py-3.5">Prioritization Reason</th>
                    <th className="px-4 py-3.5">SLA Deadline</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {sortedIssues.map((issue) => {
                    const isExpanded = expandedIssueId === issue.id;

                    return (
                      <React.Fragment key={issue.id}>
                        <tr
                          onClick={() => openDetailDrawer(issue)}
                          className="hover:bg-[#0E1626] transition-colors cursor-pointer group"
                        >
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                                issue.priority === 'P0'
                                  ? 'bg-purple-950 text-rose-300 border border-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)] animate-pulse'
                                  : issue.priority === 'P1'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                                  : issue.priority === 'P2'
                                  ? 'bg-orange-950 text-orange-300 border border-orange-500/40'
                                  : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                              }`}
                            >
                              {issue.priority === 'P0' && <Flame className="w-3 h-3 text-rose-400" />}
                              <span>{issue.priority}</span>
                            </span>
                          </td>

                          <td className="px-4 py-3.5 max-w-xs">
                            <div className="font-bold text-slate-100 group-hover:text-cyan-300 transition-colors font-sans truncate">
                              {issue.title}
                            </div>
                            <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
                              {issue.issueCode} • {issue.categoryLabel}
                            </div>
                          </td>

                          <td className="px-4 py-3.5 text-slate-300 max-w-[180px] truncate">
                            <div className="truncate">{issue.location.address}</div>
                            <div className="text-[10px] text-slate-500">{issue.location.ward}</div>
                          </td>

                          <td className="px-4 py-3.5 text-slate-300 font-semibold">
                            ~{issue.impact.affectedUsersPerDay.toLocaleString()}
                          </td>

                          {/* Explainability Column */}
                          <td className="px-4 py-3.5 text-slate-300 max-w-[240px]">
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              <span className="truncate">
                                {issue.priorityExplainability?.reasons?.[0] || 'High impact factor'}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedIssueId(isExpanded ? null : issue.id);
                                }}
                                className="text-slate-500 hover:text-cyan-400 p-0.5 rounded"
                                title="Toggle full reason list"
                              >
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 text-amber-400 font-semibold">
                            Within {issue.impact.slaDeadlineHours}h
                          </td>

                          <td className="px-4 py-3.5">
                            <Badge
                              variant={
                                issue.status === 'resolved'
                                  ? 'success'
                                  : issue.status === 'in_progress'
                                  ? 'warning'
                                  : issue.status === 'assigned' || issue.status === 'dispatched'
                                  ? 'cyan'
                                  : 'danger'
                              }
                            >
                              {issue.status.toUpperCase().replace('_', ' ')}
                            </Badge>
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetailDrawer(issue);
                              }}
                              className="px-2.5 py-1 rounded bg-[#141C2E] group-hover:bg-cyan-600 text-slate-300 group-hover:text-white transition-colors"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>

                        {/* Expandable reasons drawer row */}
                        {isExpanded && (
                          <tr className="bg-[#0B101D] border-b border-slate-800">
                            <td colSpan={8} className="px-6 py-3 font-mono text-xs">
                              <div className="flex items-start gap-4">
                                <span className="text-cyan-400 font-bold uppercase text-[10px]">
                                  Full Prioritization Drivers ({issue.priorityExplainability?.score ?? issue.severityScore}/100):
                                </span>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-300 text-[11px]">
                                  {(issue.priorityExplainability?.reasons || []).map((r, i) => (
                                    <span key={i} className="flex items-center gap-1">
                                      <span className="text-cyan-400">•</span>
                                      <span>{r}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
