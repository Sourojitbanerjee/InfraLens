import React from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  ShieldCheck,
  Workflow,
  ArrowRight,
  MapPin
} from 'lucide-react';
import { useInfra } from '../../context/InfraContext';
export const FeatureGrid: React.FC = () => {
  const { setCurrentView } = useInfra();

  const features = [
    {
      icon: <Eye className="w-5 h-5 text-cyan-400" />,
      title: 'Neural Vision Pipeline',
      description:
        'Multi-task detection architecture identifies potholes, surface buckling, sewer backflows, and luminaire failure from raw street imagery.',
      badge: 'Vision v3.4',
      accent: 'border-cyan-500/20 hover:border-cyan-500/50',
      glow: 'hover:shadow-cyan-950/30',
    },
    {
      icon: <MapPin className="w-5 h-5 text-indigo-400" />,
      title: 'Geospatial DBSCAN Clustering',
      description:
        'Continuous spatial clustering eliminates duplicate dispatches and surfaces macro-infrastructure failures invisible to individual reports.',
      badge: 'GIS Engine',
      accent: 'border-indigo-500/20 hover:border-indigo-500/50',
      glow: 'hover:shadow-indigo-950/30',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-amber-400" />,
      title: 'Commuter Impact Index',
      description:
        'Calculates life-safety threat scores by cross-referencing proximity to schools, hospitals, transit hubs, and daily vehicular throughput.',
      badge: 'Prioritization',
      accent: 'border-amber-500/20 hover:border-amber-500/50',
      glow: 'hover:shadow-amber-950/30',
    },
    {
      icon: <Workflow className="w-5 h-5 text-emerald-400" />,
      title: 'Autonomous Work Order Routing',
      description:
        'Automatically routes prioritized work orders to the correct municipal authority with pre-filled repair specs, SLA targets, and hazard indices.',
      badge: 'Zero-Touch',
      accent: 'border-emerald-500/20 hover:border-emerald-500/50',
      glow: 'hover:shadow-emerald-950/30',
    },
  ];

  // Product journey steps
  const journey = [
    { step: '01', label: 'Street image captured by patrol camera, UAV, or citizen device.' },
    { step: '02', label: 'Neural inference identifies defect class, severity, and localization.' },
    { step: '03', label: 'DBSCAN clusters nearby reports into single actionable incident.' },
    { step: '04', label: 'Priority engine scores impact against schools, transit, population.' },
    { step: '05', label: 'Work order auto-routed to responsible municipal authority.' },
    { step: '06', label: 'Field crew dispatched; live audit trail records SLA compliance.' },
    { step: '07', label: 'Before/After verification confirms resolution and severity drop.' },
    { step: '08', label: 'Analytics track MTTR, ward health, and recurring hotspot patterns.' },
    { step: '09', label: 'City dashboard reflects real-time infrastructure health index.' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-800/60">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
        <div>
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
            PLATFORM ARCHITECTURE
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1.5 font-display tracking-tight">
            Engineered for metropolitan resilience.
          </h2>
        </div>
        <p className="text-sm text-slate-400 max-w-md font-sans leading-relaxed">
          Replacing fragmented citizen hotlines with autonomous edge vision and real-time geographic prioritization.
        </p>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: i * 0.1, duration: 0.45 }}
            className={`p-6 rounded-2xl bg-[#090D17] border ${f.accent} transition-all duration-300 group hover:shadow-xl ${f.glow}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 group-hover:scale-105 transition-transform">
                {f.icon}
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800/80 text-slate-400">
                {f.badge}
              </span>
            </div>

            <h3 className="text-base font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors mb-2 font-display">
              {f.title}
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              {f.description}
            </p>
          </motion.div>
        ))}
      </div>

      {/* 9-Step Product Journey */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="mt-16"
      >
        <div className="mb-8">
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
            PRODUCT JOURNEY
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1.5 font-display tracking-tight">
            9 stages. Street evidence to resolved civic action.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {journey.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
              className="flex gap-3 p-4 rounded-xl bg-[#090D17]/80 border border-slate-800/60 hover:border-slate-700 transition-colors group"
            >
              <span className="text-xl font-black font-mono text-slate-700 group-hover:text-cyan-500/60 transition-colors leading-none mt-0.5 shrink-0">
                {s.step}
              </span>
              <p className="text-xs text-slate-400 leading-relaxed font-sans group-hover:text-slate-300 transition-colors">
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="mt-12 rounded-2xl bg-gradient-to-r from-[#0C1424] via-[#090D17] to-[#120F24] border border-slate-800/70 p-8 flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div className="space-y-2 text-center md:text-left">
          <h4 className="text-xl font-bold text-white font-display">
            Ready to inspect the live metropolitan network?
          </h4>
          <p className="text-xs sm:text-sm text-slate-400 font-sans">
            Open the City Command Center to monitor live sensor feeds, dispatch crews, and triage P1 incidents.
          </p>
        </div>

        <button
          onClick={() => setCurrentView('dashboard')}
          className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-display text-xs sm:text-sm transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2 shrink-0 active:scale-95"
        >
          <span>Enter City Command Center</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
};
