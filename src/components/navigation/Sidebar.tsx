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
  ChevronRight,
  Shield,
  Users,
  Briefcase,
  Smartphone,
  ShieldAlert
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const { currentView, setCurrentView, stats, t } = useInfra();

  const primaryNavItems: { id: AppView; label: string; icon: React.ReactNode; badge?: string | number; badgeVariant?: 'rose' | 'amber' | 'cyan' | 'slate' | 'emerald' }[] = [
    {
      id: 'dashboard',
      label: t('nav.command_center'),
      icon: <LayoutDashboard className="w-4 h-4" />,
      badge: stats.activeIssues,
      badgeVariant: 'cyan',
    },
    {
      id: 'map',
      label: t('nav.map'),
      icon: <MapPin className="w-4 h-4" />,
      badge: 'GIS',
      badgeVariant: 'slate',
    },
    {
      id: 'analyze',
      label: t('nav.analyze'),
      icon: <Camera className="w-4 h-4" />,
      badge: 'LIVE',
      badgeVariant: 'amber',
    },
    {
      id: 'queue',
      label: t('nav.queue'),
      icon: <ListOrdered className="w-4 h-4" />,
      badge: stats.critical,
      badgeVariant: 'rose',
    },
    {
      id: 'analytics',
      label: t('nav.analytics'),
      icon: <BarChart3 className="w-4 h-4" />,
    },
  ];

  const civicRoleItems: { id: AppView; label: string; icon: React.ReactNode; badge?: string | number; badgeVariant?: 'rose' | 'amber' | 'cyan' | 'slate' | 'emerald' }[] = [
    {
      id: 'citizen-portal',
      label: t('nav.citizen_portal'),
      icon: <Shield className="w-4 h-4" />,
      badge: 'CITIZEN',
      badgeVariant: 'emerald',
    },
    {
      id: 'chief-inspector',
      label: t('nav.chief_inspector'),
      icon: <Users className="w-4 h-4" />,
      badge: 'REVIEW',
      badgeVariant: 'cyan',
    },
    {
      id: 'supervisor',
      label: t('nav.supervisor'),
      icon: <Briefcase className="w-4 h-4" />,
      badge: 'ORDERS',
      badgeVariant: 'amber',
    },
    {
      id: 'inspector-mobile',
      label: t('nav.inspector_mobile'),
      icon: <Smartphone className="w-4 h-4" />,
      badge: 'GPS',
      badgeVariant: 'emerald',
    },
    {
      id: 'super-admin',
      label: t('nav.super_admin'),
      icon: <ShieldAlert className="w-4 h-4" />,
      badge: 'GLOBAL',
      badgeVariant: 'rose',
    },
  ];

  const systemItems: { id: AppView; label: string; icon: React.ReactNode }[] = [
    {
      id: 'landing',
      label: t('nav.platform_overview'),
      icon: <Globe className="w-4 h-4" />,
    },
    {
      id: 'authorities',
      label: t('nav.authorities'),
      icon: <Building2 className="w-4 h-4" />,
    },
    {
      id: 'activity',
      label: t('nav.activity'),
      icon: <Activity className="w-4 h-4" />,
    },
  ];

  const handleSelectView = (view: AppView) => {
    setCurrentView(view);
    if (onCloseMobile) onCloseMobile();
  };

  const renderNavGroup = (title: string, items: typeof primaryNavItems) => (
    <div className="space-y-1">
      <div className="px-3 mb-1 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-semibold">
        {title}
      </div>
      <nav className="space-y-1">
        {items.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono font-medium transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-950/80 to-slate-900 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-950/50'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`transition-colors ${
                    isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {item.badge !== undefined && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                      item.badgeVariant === 'rose'
                        ? 'bg-rose-950 text-rose-400 border border-rose-500/30'
                        : item.badgeVariant === 'amber'
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                        : item.badgeVariant === 'cyan'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                        : item.badgeVariant === 'emerald'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
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
  );

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

        {/* Navigation lists */}
        <div className="p-3.5 space-y-5 overflow-y-auto flex-1">
          {renderNavGroup('Operations & Command', primaryNavItems)}
          {renderNavGroup('Citizen & Role Portals', civicRoleItems)}
          {renderNavGroup('System & Analytics', systemItems as any)}

          {/* Quick Municipal Health Summary */}
          <div className="p-3.5 rounded-xl bg-[#0E1524] border border-slate-800 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-300 mb-2 font-semibold">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                City Health Index
              </span>
              <span className="text-emerald-400">76.4 / 100</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
              <div
                className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 h-full rounded-full"
                style={{ width: '76.4%' }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>NDMC & BMC Connected</span>
              <span className="text-emerald-400">92.4% SLA</span>
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
            Build 2026.11 • PostGIS Multi-Tenant
          </div>
        </div>
      </aside>
    </>
  );
};
