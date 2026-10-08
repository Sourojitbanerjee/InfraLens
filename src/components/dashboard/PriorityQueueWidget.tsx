import React from 'react';
import { useInfra } from '../../context/InfraContext';
import { Priority } from '../../types/infrastructure';
import { 
  ChevronRight, 
  MapPin, 
  Users, 
  Clock, 
  ArrowUpRight,
  Flame,
  ShieldCheck 
} from 'lucide-react';

interface PriorityQueueWidgetProps {
  onViewAll?: () => void;
  maxItems?: number;
}

export const PriorityQueueWidget: React.FC<PriorityQueueWidgetProps> = ({ 
  onViewAll,
  maxItems = 5 
}) => {
  const { filteredIssues, openDetailDrawer, setCurrentView } = useInfra();

  // Multi-tier sort: Priority (P0 -> P4), then Severity, then Impact, then Age
  const priorityOrder: Record<Priority, number> = { P0: 0, P1: 1, P2: 2, P3: 3, P4: 4 };

  const sortedIssues = [...filteredIssues].sort((a, b) => {
    // 1. Priority rank
    const pDiff = (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9);
    if (pDiff !== 0) return pDiff;

    // 2. Severity score
    const sDiff = b.severityScore - a.severityScore;
    if (sDiff !== 0) return sDiff;

    // 3. Impact (affected users)
    const iDiff = (b.impact?.affectedUsersPerDay ?? 0) - (a.impact?.affectedUsersPerDay ?? 0);
    if (iDiff !== 0) return iDiff;

    // 4. Age (older issues first)
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const displayList = sortedIssues.slice(0, maxItems);

  return (
    <div className="rounded-2xl bg-[#090D17] border border-slate-800 p-4 sm:p-5 flex flex-col h-full shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <h3 className="font-mono text-sm font-bold text-slate-100 tracking-wide uppercase">
            Priority Queue
          </h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            {sortedIssues.length} items
          </span>
        </div>

        <button
          onClick={onViewAll || (() => setCurrentView('queue'))}
          className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
        >
          <span>Full Queue</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {displayList.length === 0 ? (
        <div className="py-12 text-center text-slate-500 font-mono text-xs">
          No prioritized incidents matching active filters.
        </div>
      ) : (
        <div className="space-y-2.5 overflow-y-auto flex-1">
          {displayList.map((issue) => (
            <div
              key={issue.id}
              onClick={() => openDetailDrawer(issue)}
              className="p-3 rounded-xl bg-[#0E1524] hover:bg-[#141E33] border border-slate-800/90 hover:border-cyan-500/40 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded flex items-center gap-1 ${
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
                    {issue.priority} {issue.priorityExplainability?.priorityLabel || issue.severity.toUpperCase()}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {issue.issueCode}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>SLA: {issue.impact.slaDeadlineHours}h</span>
                </div>
              </div>

              <div className="text-xs font-semibold text-slate-200 line-clamp-1 group-hover:text-cyan-300 transition-colors">
                {issue.title}
              </div>

              {/* Explainability snippet */}
              {issue.priorityExplainability?.reasons?.[0] && (
                <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-1 truncate">
                  <ShieldCheck className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="truncate">{issue.priorityExplainability.reasons[0]}</span>
                </div>
              )}

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-1 truncate max-w-[200px]">
                  <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="truncate">{issue.location.address}</span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Users className="w-3 h-3 text-cyan-400" />
                    ~{issue.impact.affectedUsersPerDay.toLocaleString()}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
