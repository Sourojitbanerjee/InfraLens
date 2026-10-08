import React from 'react';
import { useInfra } from '../../context/InfraContext';
import { 
  Building2, 
  Phone, 
  Mail, 
  Truck, 
  Users, 
  Clock, 
  CheckCircle, 
  ShieldAlert, 
  ArrowRight 
} from 'lucide-react';
import { Badge } from '../common/Badge';

export const AuthoritiesView: React.FC = () => {
  const { authorities, setCurrentView, setFilters } = useInfra();

  const handleFilterByAuthority = (cat: string) => {
    setFilters((p) => ({ ...p, category: cat }));
    setCurrentView('dashboard');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-wide">
              MUNICIPAL AUTHORITIES & DISPATCH MATRIX
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              6 AGENCIES
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono">
            Direct operational routing protocols, SLA guarantees, and deployed field crew capacities.
          </p>
        </div>
      </div>

      {/* Authority Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {authorities.map((auth) => (
          <div
            key={auth.id}
            className="rounded-2xl bg-[#090D17] border border-slate-800 hover:border-cyan-500/40 p-5 shadow-xl transition-all duration-300 flex flex-col justify-between group"
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="cyan">{auth.shortCode}</Badge>
                  <h3 className="text-base font-bold text-slate-100 mt-1.5 group-hover:text-cyan-300 transition-colors">
                    {auth.name}
                  </h3>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    Lead: {auth.headOfDepartment}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>

              {/* Key Metrics Quad */}
              <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
                <div className="p-2.5 rounded-lg bg-[#0E1524] border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase">Active Orders</span>
                  <div className="text-base font-bold text-amber-400 mt-0.5">
                    {auth.activeWorkOrders}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0E1524] border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase">Average SLA</span>
                  <div className="text-base font-bold text-cyan-400 mt-0.5">
                    {auth.averageResolutionHours}h
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0E1524] border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase">Field Crews</span>
                  <div className="text-base font-bold text-slate-200 mt-0.5">
                    {auth.fieldCrewsDeployed} units
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0E1524] border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase">SLA Met</span>
                  <div className="text-base font-bold text-emerald-400 mt-0.5">
                    {auth.slaComplianceRate}%
                  </div>
                </div>
              </div>

              {/* Contact details */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs font-mono text-slate-400">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{auth.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span className="truncate">{auth.email}</span>
                </div>
              </div>
            </div>

            {/* Bottom Action */}
            <div className="mt-5 pt-3 border-t border-slate-800/60">
              <button
                onClick={() => handleFilterByAuthority(auth.category)}
                className="w-full py-2 px-3 rounded-xl bg-[#141C2E] hover:bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Filter Active Incidents</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
