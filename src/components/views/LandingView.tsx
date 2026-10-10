import React from 'react';
import { HeroCinematic } from '../landing/HeroCinematic';
import { FeatureGrid } from '../landing/FeatureGrid';
import { useInfra } from '../../context/InfraContext';
import { 
  Shield, 
  MapPin, 
  Layers, 
  Activity, 
  Cpu, 
  Building2, 
  CheckCircle, 
  Radio, 
  ArrowRight 
} from 'lucide-react';

export const LandingView: React.FC = () => {
  const { setCurrentView } = useInfra();

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col justify-between overflow-x-hidden">
      <div>
        {/* Cinematic Hero Component */}
        <HeroCinematic />

        {/* Feature Grid & Platform Pillars */}
        <FeatureGrid />

        {/* Civic Trust & Department Compliance Row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-800/80">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-xl bg-[#090D17] border border-slate-800">
              <div className="text-3xl font-extrabold font-mono text-cyan-400">94.8%</div>
              <div className="text-xs font-mono text-slate-400 mt-1">CV Precision & Recall</div>
            </div>

            <div className="p-4 rounded-xl bg-[#090D17] border border-slate-800">
              <div className="text-3xl font-extrabold font-mono text-emerald-400">4.2x</div>
              <div className="text-xs font-mono text-slate-400 mt-1">Faster Dispatch Turnaround</div>
            </div>

            <div className="p-4 rounded-xl bg-[#090D17] border border-slate-800">
              <div className="text-3xl font-extrabold font-mono text-amber-400">37 Rpts</div>
              <div className="text-xs font-mono text-slate-400 mt-1">Max Cluster Grouping</div>
            </div>

            <div className="p-4 rounded-xl bg-[#090D17] border border-slate-800">
              <div className="text-3xl font-extrabold font-mono text-indigo-400">0.0%</div>
              <div className="text-xs font-mono text-slate-400 mt-1">Manual Triage Bottlenecks</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#06080D] py-8 px-4 sm:px-6 lg:px-8 text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-300">INFRALENS TACTICAL PLATFORM</span>
            <span>• Next-Gen Civic Infrastructure AI</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="text-slate-400 hover:text-cyan-400 transition-colors"
            >
              Command Center
            </button>
            <button
              onClick={() => setCurrentView('analyze')}
              className="text-slate-400 hover:text-cyan-400 transition-colors"
            >
              AI Scanner
            </button>
            <button
              onClick={() => setCurrentView('map')}
              className="text-slate-400 hover:text-cyan-400 transition-colors"
            >
              GIS Map
            </button>
            <button
              onClick={() => setCurrentView('analytics')}
              className="text-slate-400 hover:text-cyan-400 transition-colors"
            >
              Intelligence
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
