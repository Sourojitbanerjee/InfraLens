import React from 'react';
import { useInfra } from '../../context/InfraContext';
import { AppView } from '../../types/navigation';
import { 
  Layers, 
  Scan, 
  MapPin, 
  Filter, 
  Sparkles,
  BarChart3
} from 'lucide-react';

interface MobileNavProps {
  onStartDemo?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onStartDemo }) => {
  const { currentView, setCurrentView } = useInfra();

  const navItems: { view: AppView; label: string; icon: React.ReactNode }[] = [
    {
      view: 'dashboard',
      label: 'Command',
      icon: <Layers className="w-5 h-5" />,
    },
    {
      view: 'analyze',
      label: 'AI Scan',
      icon: <Scan className="w-5 h-5" />,
    },
    {
      view: 'map',
      label: 'GIS Map',
      icon: <MapPin className="w-5 h-5" />,
    },
    {
      view: 'queue',
      label: 'Queue',
      icon: <Filter className="w-5 h-5" />,
    },
  ];

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#080B13]/95 backdrop-blur-lg border-t border-slate-800/80 px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom,0.375rem))] flex items-center justify-around shadow-2xl"
    >
      {navItems.map((item) => {
        const isActive = currentView === item.view;
        return (
          <button
            key={item.view}
            onClick={() => setCurrentView(item.view)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-mono transition-colors min-h-[44px] ${
              isActive
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-md ${isActive ? 'bg-cyan-950/70 text-cyan-300' : ''}`}>
              {item.icon}
            </div>
            <span className="mt-0.5">{item.label}</span>
          </button>
        );
      })}

      {onStartDemo && (
        <button
          onClick={onStartDemo}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-lg text-[10px] font-mono text-amber-400 hover:text-amber-300 transition-colors min-h-[44px]"
        >
          <div className="p-1 rounded-md bg-amber-950/50">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <span className="mt-0.5 font-bold">Demo</span>
        </button>
      )}
    </nav>
  );
};
