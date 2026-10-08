import React, { useState } from 'react';
import { useInfra } from '../../context/InfraContext';
import { Drawer } from '../common/Drawer';
import { SeverityIndicator } from '../common/SeverityIndicator';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { BeforeAfterComparison } from '../common/BeforeAfterComparison';
import { 
  Building2, 
  MapPin, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Users, 
  Sparkles, 
  Send, 
  Crosshair,
  Flame,
  HelpCircle,
  History,
  CheckCircle,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export const IssueDetailDrawer: React.FC = () => {
  const { 
    selectedIssue, 
    isDetailDrawerOpen, 
    closeDetailDrawer, 
    updateIssueStatus, 
    assignAuthority, 
    authorities,
    setCurrentView 
  } = useInfra();

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedAuthorityId, setSelectedAuthorityId] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showFactorDetail, setShowFactorDetail] = useState(false);

  if (!selectedIssue) return null;

  const handleMarkInProgress = async () => {
    setIsUpdatingStatus(true);
    await updateIssueStatus(selectedIssue.id, 'in_progress', 'Technician arrived on site');
    setIsUpdatingStatus(false);
  };

  const handleMarkResolved = async () => {
    setIsUpdatingStatus(true);
    await updateIssueStatus(selectedIssue.id, 'resolved', 'Pavement leveled and verified compliant');
    setIsUpdatingStatus(false);
  };

  const handleConfirmAssignment = async () => {
    if (!selectedAuthorityId) return;
    await assignAuthority(selectedIssue.id, selectedAuthorityId);
    setIsAssignModalOpen(false);
  };

  const handleViewClusterOnMap = () => {
    closeDetailDrawer();
    setCurrentView('map');
  };

  const explainability = selectedIssue.priorityExplainability;
  const lifecycle = selectedIssue.lifecycle || [];

  return (
    <>
      <Drawer
        isOpen={isDetailDrawerOpen}
        onClose={closeDetailDrawer}
        width="max-w-2xl"
        title={
          <div className="flex items-center gap-3">
            <span className="font-mono text-cyan-400 font-bold">{selectedIssue.issueCode}</span>
            <span className="text-slate-500">•</span>
            <span className="font-bold text-slate-100">{selectedIssue.categoryLabel}</span>
          </div>
        }
        subtitle={
          <div className="flex items-center gap-2 mt-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{selectedIssue.location.address}</span>
            <span className="text-slate-600">({selectedIssue.location.ward})</span>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Header Priority Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[#0E1524] border border-slate-800">
            <div className="flex items-center gap-3">
              <span
                className={`text-sm font-mono font-extrabold px-2.5 py-1 rounded flex items-center gap-1.5 ${
                  selectedIssue.priority === 'P0'
                    ? 'bg-purple-950/80 text-rose-300 border border-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse'
                    : selectedIssue.priority === 'P1'
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                    : selectedIssue.priority === 'P2'
                    ? 'bg-orange-950/80 text-orange-300 border border-orange-500/40'
                    : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                }`}
              >
                {selectedIssue.priority === 'P0' && <Flame className="w-4 h-4 text-rose-400" />}
                {selectedIssue.priority} — {selectedIssue.priorityExplainability?.priorityLabel || selectedIssue.severity.toUpperCase()}
              </span>
              <SeverityIndicator severity={selectedIssue.severity} size="md" />
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400">Current Status:</span>
              <Badge
                variant={
                  selectedIssue.status === 'resolved'
                    ? 'success'
                    : selectedIssue.status === 'in_progress'
                    ? 'warning'
                    : selectedIssue.status === 'assigned' || selectedIssue.status === 'dispatched'
                    ? 'cyan'
                    : 'danger'
                }
              >
                {selectedIssue.status.toUpperCase().replace('_', ' ')}
              </Badge>
            </div>
          </div>

          {/* PRIORITY EXPLAINABILITY CARD (Rule 9 requirement) */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#0F1829] to-[#0A0F1B] border border-cyan-500/30 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-bold text-slate-100 uppercase tracking-wide">
                  Why this received {selectedIssue.priority} {explainability?.priorityLabel || 'Priority'}
                </span>
              </div>
              <span className="text-xs font-mono font-extrabold text-cyan-400">
                Score: {explainability?.score ?? selectedIssue.severityScore} / 100
              </span>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              <span className="text-[11px] text-slate-400 font-semibold uppercase">
                Prioritization Drivers:
              </span>
              <ul className="space-y-1 pl-1">
                {(explainability?.reasons || [
                  `High severity score (${selectedIssue.severityScore}/100)`,
                  `Proximity to sensitive public corridor`,
                  `Elevated daily commuter footfall`,
                ]).map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-200">
                    <span className="text-cyan-400 shrink-0 font-bold">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Toggle Detailed 6-Factor Weights */}
            <div className="pt-2 border-t border-slate-800/60">
              <button
                onClick={() => setShowFactorDetail(!showFactorDetail)}
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                <span>{showFactorDetail ? 'Hide' : 'View'} 6-Factor Ranking Weights</span>
                <ChevronRight className={`w-3.5 h-3.5 transform transition-transform ${showFactorDetail ? 'rotate-90' : ''}`} />
              </button>

              {showFactorDetail && explainability?.factorScores && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2.5 text-[11px] font-mono">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-slate-400">Severity (30%)</div>
                    <div className="font-bold text-rose-400">{explainability.factorScores.severityScore}/100</div>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-slate-400">Cluster Density (20%)</div>
                    <div className="font-bold text-amber-400">{explainability.factorScores.complaintDensityScore}/100</div>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-slate-400">Population (15%)</div>
                    <div className="font-bold text-cyan-400">{explainability.factorScores.populationImpactScore}/100</div>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-slate-400">Traffic Route (15%)</div>
                    <div className="font-bold text-indigo-400">{explainability.factorScores.trafficImportanceScore}/100</div>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-slate-400">Sensitive POIs (10%)</div>
                    <div className="font-bold text-emerald-400">{explainability.factorScores.sensitiveLocationScore}/100</div>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-slate-400">Unresolved Time (10%)</div>
                    <div className="font-bold text-slate-300">{explainability.factorScores.timeUnresolvedScore}/100</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Issue Image & Detection Overlays */}
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 group">
            <img
              src={selectedIssue.imageUrl}
              alt={selectedIssue.title}
              className="w-full h-56 sm:h-64 object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            />
            
            {/* Overlay bounding boxes */}
            {selectedIssue.detections.map((det) => (
              <div
                key={det.id}
                className="absolute border-2 border-rose-500 bg-rose-500/10 pointer-events-none transition-all"
                style={{
                  left: `${det.x}%`,
                  top: `${det.y}%`,
                  width: `${det.width}%`,
                  height: `${det.height}%`,
                }}
              >
                <span className="absolute -top-6 left-0 bg-rose-600 text-white text-[10px] font-mono px-1.5 py-0.5 rounded font-bold whitespace-nowrap shadow">
                  {det.label} ({det.confidence}%)
                </span>
              </div>
            ))}

            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/80 backdrop-blur-md rounded text-[10px] font-mono text-slate-300 border border-slate-700/60">
              AI INFERENCE RESOLUTION: 1080P • STREET SCAN
            </div>
          </div>

          {/* Metric Quad Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-[#0E1524] border border-slate-800 text-center">
              <span className="text-[10px] font-mono uppercase text-slate-500">Severity</span>
              <div className="text-xl sm:text-2xl font-extrabold font-mono text-rose-400 mt-1">
                {selectedIssue.severityScore} <span className="text-xs text-slate-500">/ 100</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0E1524] border border-slate-800 text-center">
              <span className="text-[10px] font-mono uppercase text-slate-500">Confidence</span>
              <div className="text-xl sm:text-2xl font-extrabold font-mono text-cyan-400 mt-1">
                {selectedIssue.confidence}%
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0E1524] border border-slate-800 text-center">
              <span className="text-[10px] font-mono uppercase text-slate-500">Related Reports</span>
              <div className="text-xl sm:text-2xl font-extrabold font-mono text-amber-400 mt-1">
                {selectedIssue.clusterCount ?? 1}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0E1524] border border-slate-800 text-center">
              <span className="text-[10px] font-mono uppercase text-slate-500">Cluster Radius</span>
              <div className="text-xl sm:text-2xl font-extrabold font-mono text-indigo-400 mt-1">
                {selectedIssue.clusterRadiusMeters ?? 150}m
              </div>
            </div>
          </div>

          {/* Nearby Risk Factors Card */}
          <div className="p-4 rounded-xl bg-[#0E1524] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300 font-semibold border-b border-slate-800/80 pb-2">
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Nearby Risk Factors
              </span>
              <span className="text-slate-500">Geospatial Buffer Analysis</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-xs">
              {selectedIssue.impact.nearbyRisks.map((risk, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#090D17] border border-slate-800/80"
                >
                  <span className="text-slate-300 truncate pr-2">{risk.name}</span>
                  <span className="text-rose-400 font-bold shrink-0">{risk.distanceMeters}m</span>
                </div>
              ))}
            </div>
          </div>

          {/* Commuter Impact & Recommended Action */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-[#0E1524] border border-slate-800 space-y-1">
              <span className="text-[11px] font-mono text-slate-500 uppercase flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                Estimated Users Affected
              </span>
              <div className="text-xl font-bold font-mono text-slate-100">
                ~{selectedIssue.impact.affectedUsersPerDay.toLocaleString()} / day
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Traffic Corridor: <span className="text-amber-300 font-bold uppercase">{selectedIssue.impact.trafficImportance}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0E1524] border border-slate-800 space-y-1">
              <span className="text-[11px] font-mono text-slate-500 uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Recommended Action
              </span>
              <div className="text-sm font-bold text-amber-300 leading-tight">
                {selectedIssue.impact.recommendedAction}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                SLA Target: Within {selectedIssue.impact.slaDeadlineHours} hours
              </div>
            </div>
          </div>

          {/* ISSUE LIFECYCLE AUDIT TRAIL (Rule 14 requirement) */}
          <div className="p-4 rounded-xl bg-[#0E1524] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300 font-semibold border-b border-slate-800/80 pb-2">
              <span className="flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                Issue Lifecycle Tracker
              </span>
              <span className="text-slate-500">PENDING → ASSIGNED → IN_PROGRESS → RESOLVED</span>
            </div>

            <div className="relative border-l border-slate-800 ml-3 space-y-3 text-xs font-mono">
              {lifecycle.map((step, idx) => (
                <div key={idx} className="relative pl-5">
                  <div
                    className={`absolute -left-1.5 top-1 w-3 h-3 rounded-full border-2 border-[#0E1524] ${
                      step.status === 'resolved'
                        ? 'bg-emerald-500'
                        : step.status === 'in_progress'
                        ? 'bg-amber-500'
                        : step.status === 'assigned'
                        ? 'bg-cyan-500'
                        : 'bg-rose-500'
                    }`}
                  />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 uppercase">
                      {step.status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {step.actor} ({step.role})
                  </div>
                  {step.notes && (
                    <div className="text-[11px] text-slate-300 italic mt-0.5">
                      "{step.notes}"
                    </div>
                  )}
                  {step.durationHoursSinceReported !== undefined && (
                    <div className="text-[10px] text-cyan-400 mt-0.5">
                      Elapsed since detection: {step.durationHoursSinceReported}h
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Responsible Authority Banner */}
          <div className="p-4 rounded-xl bg-[#0E1524] border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-500">
                  Responsible Authority
                </span>
                <div className="text-sm font-bold text-slate-200">
                  {selectedIssue.authorityName}
                </div>
                {selectedIssue.departmentName && (
                  <div className="text-[11px] text-slate-400 font-mono">
                    {selectedIssue.departmentName}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 px-3 py-1.5 rounded-lg transition-colors"
            >
              Reassign
            </button>
          </div>

          {/* Lifecycle Before / After Resolution Comparison (Rule 6) */}
          {(selectedIssue.status === 'resolved' || selectedIssue.resolutionComparison) && (
            <div className="pt-2">
              <BeforeAfterComparison issue={selectedIssue} />
            </div>
          )}

          {/* Action Buttons Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="py-2.5 px-4 rounded-xl bg-[#141C2E] hover:bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>ASSIGN WORK ORDER</span>
            </button>

            <button
              onClick={handleMarkInProgress}
              disabled={isUpdatingStatus || selectedIssue.status === 'in_progress'}
              className="py-2.5 px-4 rounded-xl bg-[#1F180A] hover:bg-amber-950/80 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>MARK IN PROGRESS</span>
            </button>

            <button
              onClick={handleViewClusterOnMap}
              className="py-2.5 px-4 rounded-xl bg-[#161226] hover:bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>VIEW CLUSTER</span>
            </button>
          </div>

          {/* Quick Resolution Button */}
          {selectedIssue.status !== 'resolved' && (
            <div className="pt-2">
              <button
                onClick={handleMarkResolved}
                disabled={isUpdatingStatus}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>CLOSE & MARK RESOLVED IN DATABASE</span>
              </button>
            </div>
          )}
        </div>
      </Drawer>

      {/* Assign Authority Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Dispatch Authority"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400 font-mono">
            Route work order for <span className="text-white font-bold">{selectedIssue.issueCode}</span> to a certified municipal engineering division:
          </p>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {authorities.map((auth) => (
              <div
                key={auth.id}
                onClick={() => setSelectedAuthorityId(auth.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedAuthorityId === auth.id
                    ? 'bg-cyan-950/60 border-cyan-400 text-white'
                    : 'bg-[#0E1524] border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>{auth.name}</span>
                  <Badge variant="cyan">{auth.shortCode}</Badge>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono flex items-center justify-between">
                  <span>Active Orders: {auth.activeWorkOrders}</span>
                  <span>Avg SLA: {auth.averageResolutionHours}h</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              onClick={() => setIsAssignModalOpen(false)}
              className="px-4 py-2 text-xs font-mono text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmAssignment}
              disabled={!selectedAuthorityId}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-mono font-bold transition-colors"
            >
              Confirm Dispatch
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
