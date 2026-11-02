import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  FileCheck,
  ChevronRight,
  Truck,
  Phone,
  Eye,
  Check,
  X,
  Camera,
  MapPin,
  Calendar
} from 'lucide-react';
import { WorkOrderService } from '../../services/workOrderService';
import { WorkOrder, InspectionTeam, BeforeAfterEvidenceRecord } from '../../types/workOrder';
import { SeverityIndicator } from '../common/SeverityIndicator';

export const ChiefInspectorDashboardView: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(WorkOrderService.getAllWorkOrders());
  const [teams, setTeams] = useState<InspectionTeam[]>(WorkOrderService.getInspectionTeams());
  const [selectedEvidenceOrder, setSelectedEvidenceOrder] = useState<WorkOrder | null>(
    workOrders.find((w) => w.status === 'EVIDENCE_SUBMITTED') || null
  );
  const [approvalNote, setApprovalNote] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Evidence pending sign-off queue
  const pendingEvidenceOrders = workOrders.filter((w) => w.status === 'EVIDENCE_SUBMITTED');
  const pendingInspectionOrders = workOrders.filter((w) => w.status === 'INSPECTION_SCHEDULED' || w.status === 'CREATED');

  const handleApprove = (orderId: string) => {
    const updated = WorkOrderService.approveResolution(
      orderId,
      'usr-chief-01',
      'Er. Arvind Mehta (Chief Field Inspector)'
    );
    if (updated) {
      setWorkOrders(WorkOrderService.getAllWorkOrders());
      setFeedbackMessage(`Resolution verified and approved for ${updated.workOrderCode}. Citizen notified.`);
      setTimeout(() => setFeedbackMessage(null), 3000);
      setSelectedEvidenceOrder(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Official Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Users className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Chief Field Inspector Workstation</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                CHIEF INSPECTION SQUAD
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Officer: <span className="text-slate-200">Er. Arvind Mehta</span> | Authority: <span className="text-slate-200">NDMC Operations</span>
            </p>
          </div>
        </div>

        {feedbackMessage && (
          <div className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {feedbackMessage}
          </div>
        )}
      </div>

      {/* Roster & Squad Readiness Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {teams.map((t) => (
          <div key={t.id} className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-cyan-400" />
                <h3 className="font-semibold text-white text-sm">{t.name}</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE
              </span>
            </div>

            <div className="space-y-1 text-xs text-slate-400 font-mono">
              <div>Vehicle: <span className="text-slate-200">{t.vehicleRegistration}</span></div>
              <div>Active Work Orders: <span className="text-cyan-400 font-bold">{t.activeAssignmentsCount}</span></div>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <div className="text-[11px] font-mono text-slate-400">Squad Members:</div>
              {t.members.map((m) => (
                <div key={m.userId} className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">{m.fullName} ({m.role})</span>
                  <span className="text-slate-500 text-[11px] flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {m.phone}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Main Dual Workstation: Evidence Approval & Inspection Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Evidence Approval Station (Left 7 Cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-400" />
              <h2 className="font-bold text-white text-base">Photographic Evidence Sign-Off Station</h2>
            </div>
            <span className="px-2 py-0.5 rounded font-mono text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {pendingEvidenceOrders.length} Pending Approval
            </span>
          </div>

          {selectedEvidenceOrder && selectedEvidenceOrder.beforeAfterEvidence ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-400 font-bold">{selectedEvidenceOrder.workOrderCode}</span>
                  <span className="text-slate-400">{selectedEvidenceOrder.departmentName}</span>
                </div>
                <h4 className="text-sm font-semibold text-white">{selectedEvidenceOrder.title}</h4>
                <p className="text-xs text-slate-400 font-mono">{selectedEvidenceOrder.location.address}</p>
              </div>

              {/* Before vs After Photos */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-400" /> Before Repair (Defect State)
                  </div>
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                    <img
                      src={selectedEvidenceOrder.beforeAfterEvidence.beforeImageUrl}
                      alt="Before"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> After Repair (Completed Resolution)
                  </div>
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-emerald-500/40 bg-slate-950">
                    <img
                      src={selectedEvidenceOrder.beforeAfterEvidence.afterImageUrl}
                      alt="After"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-2 text-xs font-mono">
                <div className="text-slate-300 font-semibold">Resolution Summary:</div>
                <p className="text-slate-400 leading-relaxed">
                  {selectedEvidenceOrder.beforeAfterEvidence.resolutionSummary}
                </p>
                {selectedEvidenceOrder.beforeAfterEvidence.materialsUsed && (
                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                    Materials: <span className="text-slate-300">{selectedEvidenceOrder.beforeAfterEvidence.materialsUsed}</span>
                  </div>
                )}
                <div className="text-[11px] text-slate-500">
                  Submitted by: {selectedEvidenceOrder.beforeAfterEvidence.submittedByCrewLeader}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => handleApprove(selectedEvidenceOrder.id)}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <Check className="w-4 h-4" /> Approve Resolution & Close Work Order
                </button>
                <button
                  onClick={() => alert('Re-inspection task scheduled back to crew lead.')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-mono border border-slate-700 flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" /> Reject & Re-inspect
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs font-mono text-slate-500 border border-dashed border-slate-800 rounded-xl">
              Select a work order from the evidence queue to evaluate before/after photographic proof.
            </div>
          )}
        </div>

        {/* Pending Inspections Queue (Right 5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-white text-sm">Pending Inspection Orders</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">{pendingInspectionOrders.length} In Queue</span>
          </div>

          <div className="space-y-3">
            {pendingInspectionOrders.map((wo) => (
              <div
                key={wo.id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-cyan-400 font-bold">{wo.workOrderCode}</span>
                  <SeverityIndicator severity={wo.severity} size="sm" showLabel={false} />
                </div>
                <h4 className="text-xs font-semibold text-white">{wo.title}</h4>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>{wo.assignedTeamName || 'Unassigned Team'}</span>
                  <span className="text-amber-400">{wo.slaRemainingHours}h SLA remaining</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
