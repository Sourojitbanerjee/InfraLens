import React from 'react';
import { 
  Eye, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  Workflow, 
  Flame,
  ArrowRight
} from 'lucide-react';
import { useInfra } from '../../context/InfraContext';

export const FeatureGrid: React.FC = () => {
  const { setCurrentView } = useInfra();

  const features = [
    {
      icon: <Eye className="w-5 h-5 text-cyan-400" />,
      title: 'Neural Vision Pipeline',
      description:
        'Custom multi-task convolutional architectures detect potholes, surface buckling, sewer backflows, and luminaire damage with sub-millimeter scale precision.',
      badge: 'Vision v3.4',
    },
    {
      icon: <Layers className="w-5 h-5 text-indigo-400" />,
      title: 'Geospatial DBSCAN Clustering',
      description:
        'Raw citizen and sensor reports are continuously grouped into spatial clusters, eliminating duplicate dispatches and revealing macro-infrastructure failures.',
      badge: 'PostGIS / GIS',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-amber-400" />,
      title: 'Commuter Impact Index',
      description:
        'Calculates life-safety threat scores by cross-referencing proximity to schools, hospitals, transit hubs, and average daily vehicular throughput.',
      badge: 'Prioritization',
    },
    {
      icon: <Workflow className="w-5 h-5 text-emerald-400" />,
      title: 'Autonomous Work Order Routing',
      description:
        'Automatically routes prioritized work orders to the correct municipal authority with pre-filled repair specifications, SLA targets, and hazard indices.',
      badge: 'Zero-Touch',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-800/80">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
        <div>
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
            PLATFORM ARCHITECTURE
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Engineered for metropolitan resilience.
          </h2>
        </div>
        <p className="text-sm text-slate-400 max-w-md mt-2 md:mt-0 font-mono">
          Replacing fragmented citizen hotlines with autonomous edge vision and real-time geographic prioritization.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f, i) => (
          <div
            key={i}
            className="p-6 rounded-2xl bg-[#090D17] border border-slate-800 hover:border-cyan-500/40 transition-all duration-300 group hover:shadow-xl hover:shadow-cyan-950/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 group-hover:scale-105 transition-transform">
                {f.icon}
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800/80 text-slate-300">
                {f.badge}
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors mb-2">
              {f.title}
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              {f.description}
            </p>
          </div>
        ))}
      </div>

      {/* Interactive Platform Preview Banner */}
      <div className="mt-12 rounded-2xl bg-gradient-to-r from-[#0C1424] via-[#090D17] to-[#120F24] border border-slate-800 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <h4 className="text-xl font-bold text-white">
            Ready to inspect the live metropolitan network?
          </h4>
          <p className="text-xs sm:text-sm text-slate-400 font-mono">
            Open the real-time City Command Center to monitor live sensor feeds, dispatch crews, and triage P1 incidents.
          </p>
        </div>

        <button
          onClick={() => setCurrentView('dashboard')}
          className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs sm:text-sm transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2 shrink-0"
        >
          <span>ENTER CITY COMMAND CENTER</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
