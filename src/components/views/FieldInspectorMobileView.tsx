import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Navigation,
  MapPin,
  CheckCircle2,
  Camera,
  AlertTriangle,
  Upload,
  Ruler,
  Check,
  Send,
  ExternalLink,
  Smartphone,
  Compass
} from 'lucide-react';
import { WorkOrderService } from '../../services/workOrderService';
import { WorkOrder } from '../../types/workOrder';
import { SeverityIndicator } from '../common/SeverityIndicator';

export const FieldInspectorMobileView: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(WorkOrderService.getAllWorkOrders());
  const [activeTask, setActiveTask] = useState<WorkOrder>(workOrders[0]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [lengthM, setLengthM] = useState(1.4);
  const [widthM, setWidthM] = useState(0.8);
  const [depthCm, setDepthCm] = useState(9.5);
  const [notes, setNotes] = useState('Sub-base cavitation confirmed. Requires 2 batches of hot-mix bitumen.');
  const [afterImageUrl, setAfterImageUrl] = useState('https://images.unsplash.com/photo-1578874691223-a49267d3419e?w=800&auto=format&fit=crop&q=80');
  const [resolutionSummary, setResolutionSummary] = useState('Excavated compromised base. Filled with crushed stone aggregate and sealed with high-compaction hot-mix asphalt.');
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleCheckIn = () => {
    setIsCheckedIn(true);
    setFeedback('GPS Check-in Verified: 28.6315° N, 77.2167° E (Accuracy: 3.8m)');
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSaveVerification = () => {
    WorkOrderService.submitFieldVerification(activeTask.id, {
      inspectorId: 'usr-insp-01',
      inspectorName: 'Vikram Rawat',
      checkInCoords: { latitude: activeTask.location.latitude, longitude: activeTask.location.longitude },
      accuracyMeters: 3.8,
      isConfirmed: true,
      dimensions: { lengthMeters: lengthM, widthMeters: widthM, depthCm },
      notes,
    });
    setWorkOrders(WorkOrderService.getAllWorkOrders());
    setFeedback('On-site measurements recorded & synced with Department Supervisor.');
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSubmitAfterProof = () => {
    WorkOrderService.submitBeforeAfterEvidence(activeTask.id, {
      beforeImageUrl: activeTask.beforeAfterEvidence?.beforeImageUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
      afterImageUrl,
      summary: resolutionSummary,
      materialsUsed: 'Grade VG-30 Bitumen, 20mm crushed stone aggregate',
      crewLeader: 'Vikram Rawat (Field Lead)',
    });
    setWorkOrders(WorkOrderService.getAllWorkOrders());
    setFeedback('Repair photo uploaded! Routed to Chief Inspector for closure approval.');
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 max-w-lg mx-auto space-y-5">
      {/* Mobile Top Bar */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Smartphone className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white text-sm">Field Inspector Mobile</h2>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                GPS ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">Inspector: Vikram Rawat (Squad Alpha)</p>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {feedback}
        </div>
      )}

      {/* Task Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {workOrders.map((wo) => (
          <button
            key={wo.id}
            onClick={() => {
              setActiveTask(wo);
              setIsCheckedIn(false);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-mono border whitespace-nowrap transition-all ${
              activeTask.id === wo.id
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            {wo.workOrderCode}
          </button>
        ))}
      </div>

      {/* Active Task Card */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-emerald-400 font-bold">{activeTask.workOrderCode}</span>
          <SeverityIndicator severity={activeTask.severity} size="sm" />
        </div>

        <div>
          <h3 className="font-bold text-white text-base">{activeTask.title}</h3>
          <p className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            {activeTask.location.address}
          </p>
        </div>

        {/* Turn-by-Turn GPS Navigation CTA */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${activeTask.location.latitude},${activeTask.location.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700 flex items-center justify-center gap-1.5"
          >
            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            Navigate (Turn-by-Turn)
          </a>

          <button
            onClick={handleCheckIn}
            className={`py-2.5 px-3 rounded-xl text-xs font-mono border flex items-center justify-center gap-1.5 transition-all ${
              isCheckedIn
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            {isCheckedIn ? 'GPS Verified' : 'Check-In On-Site'}
          </button>
        </div>

        {/* Physical Measurement Recording */}
        <div className="pt-3 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300 font-semibold">
            <Ruler className="w-3.5 h-3.5 text-amber-400" /> Ground Caliper Measurements:
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div>
              <label className="text-[10px] text-slate-400">Length (m)</label>
              <input
                type="number"
                step="0.1"
                value={lengthM}
                onChange={(e) => setLengthM(parseFloat(e.target.value))}
                className="w-full mt-1 p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400">Width (m)</label>
              <input
                type="number"
                step="0.1"
                value={widthM}
                onChange={(e) => setWidthM(parseFloat(e.target.value))}
                className="w-full mt-1 p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400">Depth (cm)</label>
              <input
                type="number"
                step="0.5"
                value={depthCm}
                onChange={(e) => setDepthCm(parseFloat(e.target.value))}
                className="w-full mt-1 p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200"
              />
            </div>
          </div>

          <button
            onClick={handleSaveVerification}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700 flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" /> Save Physical Measurements
          </button>
        </div>

        {/* Repair Evidence Upload Station */}
        <div className="pt-3 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300 font-semibold">
            <Camera className="w-3.5 h-3.5 text-emerald-400" /> Post-Repair Resolution Evidence:
          </div>

          <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
            <img src={afterImageUrl} alt="After repair" className="w-full h-full object-cover" />
            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded font-mono text-[10px] bg-slate-950/80 text-emerald-400 border border-emerald-500/30">
              ✓ Geo-tagged Timestamp
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-mono">Resolution Notes</label>
            <textarea
              rows={2}
              value={resolutionSummary}
              onChange={(e) => setResolutionSummary(e.target.value)}
              className="w-full mt-1 p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none"
            />
          </div>

          <button
            onClick={handleSubmitAfterProof}
            className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
          >
            <Send className="w-3.5 h-3.5" /> Submit Proof for Chief Verification
          </button>
        </div>
      </div>
    </div>
  );
};
