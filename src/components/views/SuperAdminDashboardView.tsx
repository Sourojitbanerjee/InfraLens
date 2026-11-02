import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  Building2,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  Sparkles,
  Search,
  Plus,
  Sliders,
  ExternalLink,
  ChevronRight,
  Database
} from 'lucide-react';
import { InstitutionVerificationService } from '../../services/institutionVerificationService';
import { Institution, VerificationStatus, InstitutionSize } from '../../types/institution';
import { InstitutionalRegistrationModal } from '../institution/InstitutionalRegistrationModal';

export const SuperAdminDashboardView: React.FC = () => {
  const [institutions, setInstitutions] = useState<Institution[]>(InstitutionVerificationService.getAllInstitutions());
  const [selectedInst, setSelectedInst] = useState<Institution | null>(
    institutions.find((i) => i.verificationStatus === 'DOCUMENT_REVIEW') || institutions[0]
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const pendingCount = institutions.filter((i) => i.verificationStatus === 'DOCUMENT_REVIEW').length;
  const approvedCount = institutions.filter((i) => i.verificationStatus === 'APPROVED').length;

  const handleStatusUpdate = (instId: string, status: VerificationStatus) => {
    const updated = InstitutionVerificationService.updateVerificationStatus(
      instId,
      status,
      reviewNotes || (status === 'APPROVED' ? 'Approved by Platform Super Administrator' : 'Rejected due to insufficient documentation')
    );
    if (updated) {
      setInstitutions(InstitutionVerificationService.getAllInstitutions());
      setSelectedInst(updated);
      setFeedback(`Institutional status updated to ${status} for ${updated.name}`);
      setTimeout(() => setFeedback(null), 3000);
      setReviewNotes('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Super Admin Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <ShieldAlert className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">InfraLens Platform Super Administration</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
                GLOBAL PLATFORM LEVEL
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Multi-Tenant Governance | Cross-ULB Verification & Size Classification
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-2 shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" /> Onboard New Authority / Panchayat
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {feedback}
        </div>
      )}

      {/* Global Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-mono">Tenants Configured</div>
          <div className="text-2xl font-bold text-white mt-1 font-mono">{institutions.length}</div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">ULBs & Panchayats</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-mono">Awaiting Document Review</div>
          <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">{pendingCount}</div>
          <div className="text-[11px] text-amber-400/90 font-mono mt-1">Verification Queue</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-mono">Verified Active ULBs</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{approvedCount}</div>
          <div className="text-[11px] text-emerald-400 font-mono mt-1">Live Routing</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-mono">Global Health Status</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1 font-mono">99.98%</div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">Zero Latency Breach</div>
        </div>
      </div>

      {/* Main Dual Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Tenants List */}
        <div className="lg:col-span-5 rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">Tenant Authorities Directory</h3>
            <span className="text-xs font-mono text-slate-400">{institutions.length} Total</span>
          </div>

          <div className="space-y-3">
            {institutions.map((inst) => {
              const isSelected = selectedInst?.id === inst.id;
              return (
                <div
                  key={inst.id}
                  onClick={() => setSelectedInst(inst)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 ${
                    isSelected
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-purple-400 font-bold">{inst.officialCode}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                      inst.verificationStatus === 'APPROVED'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : inst.verificationStatus === 'DOCUMENT_REVIEW'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {inst.verificationStatus}
                    </span>
                  </div>

                  <h4 className="font-semibold text-white text-sm">{inst.name}</h4>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>{inst.state} / {inst.district}</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-bold">
                      {inst.sizeTier}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 7 Cols: Verification & Audit Detail */}
        {selectedInst && (
          <div className="lg:col-span-7 rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <span className="text-xs font-mono text-purple-400 font-bold">{selectedInst.officialCode}</span>
                <h3 className="text-xl font-bold text-white">{selectedInst.name}</h3>
                <p className="text-xs text-slate-400 font-mono">{selectedInst.headquartersAddress}</p>
              </div>

              <div className="text-right font-mono text-xs">
                <div className="text-slate-400">Scale Tier:</div>
                <div className="text-emerald-400 font-bold text-base">{selectedInst.sizeTier}</div>
              </div>
            </div>

            {/* Scale Rationale */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Algorithmic Sizing Rationale:
              </div>
              <p className="text-slate-400 leading-relaxed">{selectedInst.sizeRationale}</p>
            </div>

            {/* Document Checklist */}
            <div className="space-y-2">
              <div className="text-xs font-mono text-slate-300 font-semibold">Submitted Verification Documents:</div>
              <div className="space-y-2">
                {selectedInst.documents.map((doc) => (
                  <div key={doc.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-400" />
                      <span className="text-slate-200">{doc.fileName}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      doc.status === 'ACCEPTED' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Notes Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400">Super Admin Audit Notes</label>
              <textarea
                rows={2}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="State verified gazette reference or specify grounds for clarification..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-purple-500 focus:outline-none font-mono"
              />
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => handleStatusUpdate(selectedInst.id, 'APPROVED')}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve Institutional Registration
              </button>
              <button
                onClick={() => handleStatusUpdate(selectedInst.id, 'REJECTED')}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-mono border border-slate-700 flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>
        )}
      </div>

      <InstitutionalRegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => setInstitutions(InstitutionVerificationService.getAllInstitutions())}
      />
    </div>
  );
};
