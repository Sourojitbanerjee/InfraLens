import React, { useState } from 'react';
import { useInfra } from '../../context/InfraContext';
import { SeverityIndicator } from '../common/SeverityIndicator';
import { Badge } from '../common/Badge';
import { 
  Activity, 
  Filter, 
  Clock, 
  User, 
  Bot, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  Flame,
  CheckCircle,
  Truck,
  Layers,
  Sparkles,
  Calendar
} from 'lucide-react';

export const ActivityLogView: React.FC = () => {
  const { auditEvents, issues, openDetailDrawer } = useInfra();
  const [activeTab, setActiveTab] = useState<'operational' | 'audit'>('operational');
  const [filterAction, setFilterAction] = useState<string>('all');

  const filteredEvents = auditEvents.filter((event) => {
    if (filterAction === 'all') return true;
    return event.action === filterAction;
  });

  // Canonical Operational Timeline Flow (Rule 10)
  const operationalTimelineSteps = [
    {
      time: '09:41',
      date: 'TODAY',
      title: 'AI Detected Severe Pothole',
      actor: 'Municipal Patrol UAV #04 • Edge Model v11',
      details: 'High-definition stereo scan flagged 180mm depth pavement crater at 4th & Bryant Corridor. Confidence 94.8%.',
      severity: 'critical' as const,
      badge: 'DETECTED',
      badgeVariant: 'danger' as const,
      icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
    },
    {
      time: '09:42',
      date: 'TODAY',
      title: 'Cluster CL-027 Formed (37 Proximate Reports)',
      actor: 'Autonomous DBSCAN Clustering Engine',
      details: 'Synthesized 37 aggregated defect records within 400m radius. Spatial epicenter anchored near Lincoln High School.',
      severity: 'high' as const,
      badge: 'CLUSTERING',
      badgeVariant: 'warning' as const,
      icon: <Layers className="w-4 h-4 text-orange-400" />,
    },
    {
      time: '09:43',
      date: 'TODAY',
      title: 'Priority Escalated to P1 Critical',
      actor: 'Multi-Factor Priority Engine',
      details: 'Demographic weighting triggered: Lincoln High School (180m away) + bus stop (90m) + 2,000 daily commuters elevates SLA to 6 hours.',
      severity: 'critical' as const,
      badge: 'PRIORITY ESCALATED',
      badgeVariant: 'danger' as const,
      icon: <Flame className="w-4 h-4 text-rose-400" />,
    },
    {
      time: '09:44',
      date: 'TODAY',
      title: 'Municipal Roads Department Assigned',
      actor: 'Authority Dispatch Router',
      details: 'Work order WO-2026-881 routed to District 6 Highway Division. Crew Supervisor notified on mobile dispatch console.',
      severity: 'moderate' as const,
      badge: 'ASSIGNED',
      badgeVariant: 'cyan' as const,
      icon: <Truck className="w-4 h-4 text-cyan-400" />,
    },
    {
      time: '11:20',
      date: 'TODAY',
      title: 'Field Repair Operations Commenced',
      actor: 'Field Crew Lead Marcus Chen (Truck #14)',
      details: 'Traffic calming barriers deployed in outer bus lane. Asphalt milling machine engaged to clear damaged substrate.',
      severity: 'moderate' as const,
      badge: 'IN PROGRESS',
      badgeVariant: 'warning' as const,
      icon: <Clock className="w-4 h-4 text-amber-400" />,
    },
    {
      time: '16:45',
      date: 'NEXT DAY',
      title: 'Issue Fully Resolved & Verified',
      actor: 'Chief Inspector Elena Rostova',
      details: 'Polymer binder compacted and cured. Surface friction verified via tactile sensor. Severity dropped from 87 to 12. Closed in 4.2 days.',
      severity: 'healthy' as const,
      badge: 'RESOLVED',
      badgeVariant: 'success' as const,
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      {/* Title & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-2xl font-bold font-mono text-white tracking-wide">
              OPERATIONAL TIMELINE & AUDIT FEED
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              REALTIME LEDGER
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono">
            Telling cities what needs to be fixed first, why it matters, and verifying completion.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center rounded-lg bg-[#0E1524] border border-slate-800 p-0.5 sm:p-1 text-[11px] sm:text-xs font-mono w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('operational')}
            className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 sm:py-1 rounded text-center transition-colors ${
              activeTab === 'operational'
                ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="inline sm:hidden">Lifecycle</span>
            <span className="hidden sm:inline">Incident Lifecycle (CL-027)</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 sm:py-1 rounded text-center transition-colors ${
              activeTab === 'audit'
                ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="inline sm:hidden">Audit Log ({auditEvents.length})</span>
            <span className="hidden sm:inline">System Audit Log ({auditEvents.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'operational' ? (
        /* Operational Incident Lifecycle Flow (Rule 10) */
        <div className="rounded-2xl bg-[#090D17] border border-slate-800 p-4 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-mono text-orange-400 uppercase tracking-wider font-bold">
                INCIDENT FLOW • CLUSTER CL-027 (4TH & BRYANT CORRIDOR)
              </span>
              <h3 className="font-mono text-sm sm:text-base font-bold text-white mt-0.5">
                From Computer Vision Detection to Field Repair Sign-off
              </h3>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-lg hidden sm:inline">
              100% Closed Loop
            </span>
          </div>

          <div className="relative border-l-2 border-cyan-500/30 ml-3.5 sm:ml-6 space-y-6 sm:space-y-8 pl-5 sm:pl-8">
            {operationalTimelineSteps.map((step, idx) => (
              <div key={idx} className="relative group">
                {/* Timeline Pin */}
                <div className="absolute -left-[31px] sm:-left-[43px] top-1 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0D1525] border-2 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.5)] flex items-center justify-center">
                  {step.icon}
                </div>

                {/* Timeline Card */}
                <div className="p-3.5 sm:p-5 rounded-xl bg-[#0E1524] border border-slate-800/80 hover:border-cyan-500/40 transition-all space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="text-xs font-mono font-black text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                        {step.time}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{step.date}</span>
                      <Badge variant={step.badgeVariant}>{step.badge}</Badge>
                    </div>

                    <SeverityIndicator severity={step.severity} size="sm" />
                  </div>

                  <h4 className="font-mono text-sm sm:text-base font-bold text-white">
                    {step.title}
                  </h4>

                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {step.details}
                  </p>

                  <div className="text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-800/60 flex flex-wrap items-center gap-1.5">
                    <span className="text-slate-400 uppercase text-[9px] font-bold">Actor:</span>
                    <span className="text-slate-300 break-words">{step.actor}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Immutable System Audit Feed */
        <div className="rounded-2xl bg-[#090D17] border border-slate-800 p-4 sm:p-6 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <span className="text-xs font-mono text-slate-400">
              Filter System Actions:
            </span>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-[#0E1524] border border-slate-800 text-slate-300 rounded px-2.5 sm:px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Events</option>
              <option value="DETECTED">AI Detections</option>
              <option value="STATUS_CHANGED">Status Transitions</option>
              <option value="ASSIGNED">Dispatches</option>
              <option value="RESOLVED">Work Order Closures</option>
            </select>
          </div>

          <div className="relative border-l border-slate-800 ml-3.5 sm:ml-4 space-y-5 sm:space-y-6">
            {filteredEvents.map((event) => {
              const matchedIssue = issues.find((i) => i.id === event.issueId);

              return (
                <div key={event.id} className="relative pl-5 sm:pl-6 group">
                  {/* Timeline Node Dot */}
                  <div
                    className={`absolute -left-2 top-1.5 w-4 h-4 rounded-full border-2 border-[#090D17] ${
                      event.action === 'RESOLVED'
                        ? 'bg-emerald-500'
                        : event.action === 'DETECTED'
                        ? 'bg-rose-500'
                        : 'bg-cyan-500'
                    }`}
                  />

                  {/* Event Card */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-[#0E1524] border border-slate-800/80 hover:border-cyan-500/30 transition-all space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <Badge
                          variant={
                            event.action === 'RESOLVED'
                              ? 'success'
                              : event.action === 'DETECTED'
                              ? 'danger'
                              : 'cyan'
                          }
                        >
                          {event.action}
                        </Badge>
                        <span className="font-mono text-xs font-bold text-slate-200">
                          {event.issueCode}
                        </span>
                        <SeverityIndicator severity={event.severity} size="sm" />
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      {event.details}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-[11px] font-mono text-slate-400">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {event.actorRole.includes('Camera') || event.actorRole.includes('Engine') ? (
                          <Bot className="w-3.5 h-3.5 text-cyan-400" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-indigo-400" />
                        )}
                        <span>{event.actorName}</span>
                        <span className="text-slate-600">({event.actorRole})</span>
                      </div>

                      {matchedIssue && (
                        <button
                          onClick={() => openDetailDrawer(matchedIssue)}
                          className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                        >
                          <span>Inspect</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
