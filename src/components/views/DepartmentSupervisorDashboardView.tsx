import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Plus,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Filter,
  DollarSign,
  ChevronRight,
  Send,
  Building2,
  SlidersHorizontal
} from 'lucide-react';
import { WorkOrderService } from '../../services/workOrderService';
import { WorkOrder, WorkOrderStatus } from '../../types/workOrder';
import { SeverityIndicator } from '../common/SeverityIndicator';

export const DepartmentSupervisorDashboardView: React.FC = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(WorkOrderService.getAllWorkOrders());
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Quick stats
  const totalOrders = workOrders.length;
  const inProgress = workOrders.filter((w) => ['REPAIR_DISPATCHED', 'CREW_ON_SITE', 'EVIDENCE_SUBMITTED'].includes(w.status)).length;
  const completed = workOrders.filter((w) => w.status === 'CLOSED_RESOLVED').length;
  const totalEstimatedCost = workOrders.reduce((sum, w) => sum + (w.estimatedCostInr || 0), 0);

  const filteredOrders = workOrders.filter((w) => {
    if (selectedStatusFilter === 'all') return true;
    return w.status === selectedStatusFilter;
  });

  const handleDispatch = (orderId: string) => {
    const updated = WorkOrderService.assignTeam(
      orderId,
      'team-ndmc-alpha',
      'NDMC Civil Rapid Response Alpha',
      'Praveen Saxena (AEE Civil)'
    );
    if (updated) {
      setWorkOrders(WorkOrderService.getAllWorkOrders());
      setFeedback(`Team Alpha dispatched to ${updated.workOrderCode}`);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Briefcase className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Department Operations Supervisor</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                ROADS & CIVIL BRIDGES
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Supervisor: <span className="text-slate-200">Er. Praveen Saxena</span> | Ward Division: <span className="text-slate-200">Zone 1 & 2</span>
            </p>
          </div>
        </div>

        {feedback && (
          <div className="px-3.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {feedback}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-mono">Total Work Orders</div>
          <div className="text-2xl font-bold text-white mt-1 font-mono">{totalOrders}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-mono">Active Crew Dispatched</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1 font-mono">{inProgress}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-mono">Repairs Closed</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{completed}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-mono">Allocated Budget</div>
          <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">₹{(totalEstimatedCost / 1000).toFixed(0)}k</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
        {['all', 'CREATED', 'INSPECTION_SCHEDULED', 'REPAIR_DISPATCHED', 'CREW_ON_SITE', 'EVIDENCE_SUBMITTED', 'CLOSED_RESOLVED'].map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${
              selectedStatusFilter === status
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {status.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Work Orders List */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>{filteredOrders.length} Department Work Orders</span>
          <span>SLA Adherence Target: 92%</span>
        </div>

        <div className="divide-y divide-slate-800">
          {filteredOrders.map((wo) => (
            <div key={wo.id} className="p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-800/30 transition-all">
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-400">{wo.workOrderCode}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                    {wo.wardName || 'Ward 1'}
                  </span>
                  <SeverityIndicator severity={wo.severity} size="sm" showLabel={false} />
                </div>
                <h4 className="font-semibold text-white text-sm">{wo.title}</h4>
                <p className="text-xs text-slate-400 font-mono">{wo.location.address}</p>
                <div className="text-[11px] font-mono text-slate-500 pt-1">
                  Assigned Team: <span className="text-slate-300">{wo.assignedTeamName || 'Pending Dispatch'}</span> | Est: ₹{(wo.estimatedCostInr || 0).toLocaleString()}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right font-mono text-xs hidden sm:block">
                  <div className="text-amber-400">{wo.slaRemainingHours}h SLA</div>
                  <div className="text-[10px] text-slate-500 uppercase">{wo.status.replace(/_/g, ' ')}</div>
                </div>

                {wo.status === 'CREATED' && (
                  <button
                    onClick={() => handleDispatch(wo.id)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                  >
                    <Truck className="w-3.5 h-3.5" /> Dispatch Crew Alpha
                  </button>
                )}

                {wo.status === 'REPAIR_DISPATCHED' && (
                  <span className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-mono">
                    Crew En Route
                  </span>
                )}

                {wo.status === 'CLOSED_RESOLVED' && (
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
