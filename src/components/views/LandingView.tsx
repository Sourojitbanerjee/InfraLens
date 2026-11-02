import React from 'react';
import { motion } from 'framer-motion';
import { HeroCinematic } from '../landing/HeroCinematic';
import { FeatureGrid } from '../landing/FeatureGrid';
import { useInfra } from '../../context/InfraContext';
import { Radio, ArrowRight } from 'lucide-react';

const statItems = [
  { value: '≤7 ms', label: 'Avg. Inference Latency', accent: 'text-cyan-400' },
  { value: '100%', label: 'Blank & Noise Rejection Rate', accent: 'text-emerald-400' },
  { value: '37 Rpts', label: 'Max Cluster Aggregation', accent: 'text-amber-400' },
  { value: '0 FP', label: 'False Positive Detections', accent: 'text-rose-400' },
];

export const LandingView: React.FC = () => {
  const { setCurrentView } = useInfra();

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col justify-between overflow-x-hidden">
      <div>
        {/* Cinematic Hero */}
        <HeroCinematic />

        {/* Feature Grid & Platform Pillars */}
        <FeatureGrid />

        {/* Measured Performance Stat Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-800/60"
        >
          <div className="mb-6">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">
              MEASURED SYSTEM PERFORMANCE — 46-SCENARIO EVALUATION
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {statItems.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="p-5 rounded-xl bg-[#090D17] border border-slate-800/70 hover:border-slate-700 transition-colors group"
              >
                <div className={`text-3xl font-black font-mono ${stat.accent} group-hover:scale-105 transition-transform inline-block`}>
                  {stat.value}
                </div>
                <div className="text-xs font-sans text-slate-500 mt-1.5 leading-tight">{stat.label}</div>
              </motion.div>
            ))}
          </div>
          <p className="mt-4 text-[11px] font-mono text-slate-600">
            * Evaluated on 46 controlled scenarios across negative, positive, and difficult categories. Results reflect the rule-based CV engine in the absence of a connected inference backend.
          </p>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 bg-[#06080D] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div>
              <span className="font-bold text-slate-200 text-sm font-display tracking-wide">InfraLens</span>
              <span className="text-slate-600 text-xs font-mono ml-2">Urban Infrastructure Intelligence</span>
            </div>
          </div>

          <nav className="flex items-center gap-5 text-xs font-sans text-slate-500">
            {[
              { label: 'Command Center', view: 'dashboard' },
              { label: 'AI Scanner', view: 'analyze' },
              { label: 'GIS Map', view: 'map' },
              { label: 'Analytics', view: 'analytics' },
            ].map((link) => (
              <button
                key={link.view}
                onClick={() => setCurrentView(link.view as any)}
                className="hover:text-cyan-400 transition-colors"
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
};
