import React from 'react';
import { useInfra } from '../../context/InfraContext';
import { AppView } from '../../types/navigation';
import { 
  LayoutDashboard, 
  Camera, 
  MapPin, 
  ListOrdered, 
  BarChart3, 
  Building2, 
  Activity, 
  Globe, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const { currentView, setCurrentView, stats } = useInfra();

  const navItems: { id: AppView; label: string; icon: React.ReactNode; badge?: string | number; badgeVariant?: 'rose' | 'amber' | 'cyan' | 'slate' }[] = [
    {
      id: 'landing',
      label: 'Portal Overview',
      icon: <Globe className="w-4 h-4" />,
    },
    {
      id: 'dashboard',
      label: 'Command Center',
      icon: <LayoutDashboard className="w-4 h-4" />,
      badge: stats.activeIssues,
      badgeVariant: 'cyan',
    },
    {
      id: 'analyze',
      label: 'AI Street Analysis',
      icon: <Camera className="w-4 h-4" />,
      badge: 'LIVE',
      badgeVariant: 'amber',
    },
    {
      id: 'map',
      label: 'Infrastructure Map',
      icon: <MapPin className="w-4 h-4" />,
      badge: 'GIS',
      badgeVariant: 'slate',
    },
    {
      id: 'queue',
      label: 'Priority Queue',
      icon: <ListOrdered className="w-4 h-4" />,
      badge: stats.critical,
      badgeVariant: 'rose',
    },
    {
      id: 'analytics',
      label: 'Analytics & Intel',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'authorities',
      label: 'Authorities Matrix',
      icon: <Building2 className="w-4 h-4" />,
    },
    {
      id: 'activity',
      label: 'Audit & Activity',
      icon: <Activity className="w-4 h-4" />,
    },
  ];

  const handleSelectView = (view: AppView) => {
    setCurrentView(view);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 lg:top-16 bottom-0 left-0 z-50 lg:z-30 w-72 sm:w-64 bg-[#090D17] border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Mobile-only Header */}
        <div className="lg:hidden p-4 border-b border-slate-800 flex items-center justify-between bg-[#0B0F19]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-mono text-xs font-bold text-slate-200">INFRALENS NAVIGATION</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close navigation menu"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="p-3.5 space-y-6 overflow-y-auto flex-1">
          <div>
            <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-semibold">
              Operations & Triage
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectView(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-mono font-medium transition-all group ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-950/80 to-slate-900 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-950/50'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`transition-colors ${
                          isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.badge !== undefined && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                            item.badgeVariant === 'rose'
                              ? 'bg-rose-950 text-rose-400 border border-rose-500/30'
                              : item.badgeVariant === 'amber'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                              : item.badgeVariant === 'cyan'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Municipal Health Summary */}
          <div className="p-3.5 rounded-xl bg-[#0E1524] border border-slate-800 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-300 mb-2 font-semibold">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                City Index
              </span>
              <span className="text-emerald-400">76.4 / 100</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2.5">
              <div
                className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 h-full rounded-full"
                style={{ width: '76.4%' }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>92 Active</span>
              <span>86 Resolved</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800/80 bg-[#070A12] text-[11px] font-mono text-slate-500">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Tactical GIS Cluster</span>
            <span className="text-emerald-400 font-bold">ONLINE</span>
          </div>
          <div className="text-[10px] text-slate-600 mt-1">
            Build 2026.10-ALPHA • PostGIS/Edge Ready
          </div>
        </div>
      </aside>
    </>
  );
};
