import React, { useState, useEffect } from 'react';
import { useInfra } from '../../context/InfraContext';
import { 
  Bell, 
  Search, 
  Terminal, 
  Radio, 
  ShieldAlert, 
  User, 
  ChevronDown, 
  ExternalLink,
  Flame,
  CheckCircle,
  Menu,
  X,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
  onStartDemo?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu, isMobileMenuOpen, onStartDemo }) => {
  const { 
    currentView, 
    setCurrentView, 
    setIsCommandPaletteOpen, 
    notifications, 
    unreadNotificationCount,
    markNotificationRead,
    clearAllNotifications,
    stats,
    openDetailDrawer,
    issues
  } = useInfra();

  const [currentTime, setCurrentTime] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeRole, setActiveRole] = useState<'Director of Operations' | 'Field Chief Inspector' | 'Public Works Dispatch'>('Director of Operations');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short',
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#080B13]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 h-16 flex items-center justify-between">
      {/* Left: Brand & Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 focus:outline-none"
          aria-label="Toggle mobile navigation"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div
          onClick={() => setCurrentView('landing')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-400 shadow-sm shadow-cyan-500/20 group-hover:border-cyan-400 transition-colors">
            <Radio className="w-4 h-4 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#080B13]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-slate-100 text-base font-mono">
                INFRALENS
              </span>
              <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase bg-cyan-950/80 border border-cyan-800/60 px-1.5 py-0.2 rounded">
                OPS v1.0
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono tracking-tight hidden sm:inline">
              URBAN INFRASTRUCTURE INTELLIGENCE
            </span>
          </div>
        </div>

        {/* Global Critical / P0 Emergency State Pill */}
        <div className="hidden xl:flex items-center gap-2 ml-6 pl-6 border-l border-slate-800">
          {stats.p0Emergency > 0 ? (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-950/80 border border-rose-500 text-rose-300 text-xs font-mono animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.4)]">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>{stats.p0Emergency} P0 EMERGENCY</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs font-mono">
              <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>{stats.critical} CRITICAL ISSUES</span>
            </div>
          )}
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>REALTIME SYNC</span>
          </div>
        </div>
      </div>

      {/* Center: Command Palette Quick Search */}
      <div className="hidden md:flex items-center max-w-sm lg:max-w-md w-full mx-4">
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-lg bg-[#0E1524] border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-slate-200 text-xs font-mono transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
            <span>Search issues, wards, coordinates...</span>
          </div>
          <kbd className="flex items-center gap-1 text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 border border-slate-700">
            <span>⌘</span>
            <span>K</span>
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Clock */}
        <div className="hidden sm:flex flex-col items-end mr-1 text-right">
          <span className="font-mono text-xs font-medium text-slate-200 tracking-wider">
            {currentTime || '00:00:00 UTC'}
          </span>
          <span className="text-[10px] font-mono text-cyan-400 uppercase">
            SYSTEM ONLINE
          </span>
        </div>

        {/* Command Palette Mobile Button */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="md:hidden p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          title="Search (CMD+K)"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* 2-Minute Demo Tour Launch Button (Rule 19) */}
        {onStartDemo && (
          <button
            onClick={onStartDemo}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-500/50 hover:border-amber-400 text-amber-300 hover:text-white font-mono text-xs font-bold transition-all shadow-md shadow-amber-950/40 flex items-center gap-1.5 active:scale-95"
            title="Launch 2-Minute Judge Walkthrough"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="hidden sm:inline">DEMO TOUR</span>
            <span className="sm:hidden">DEMO</span>
          </button>
        )}

        {/* Notification Center */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800/80 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#080B13] animate-pulse" />
            )}
          </button>

          {/* Notifications Flyout */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-[#0B0F19] border border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-[#0E1524]">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-semibold text-slate-200 uppercase">
                    Incident Dispatch Log
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={clearAllNotifications}
                    className="text-[11px] text-cyan-400 hover:underline font-mono"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 p-1">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      markNotificationRead(notif.id);
                      if (issues.length > 0) {
                        openDetailDrawer(issues[0]);
                      }
                      setShowNotifications(false);
                    }}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      notif.read ? 'opacity-60 hover:opacity-100 hover:bg-slate-800/40' : 'bg-slate-900/60 hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-200">
                        {notif.title}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {notif.timestamp}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {notif.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile / Role Selector */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-lg bg-[#0E1524] border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 transition-colors"
          >
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
              OP
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-[11px] font-semibold text-slate-200 leading-tight">
                Cmdr. S. Vance
              </span>
              <span className="text-[9px] text-cyan-400 truncate max-w-[120px]">
                {activeRole}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#0B0F19] border border-slate-800 shadow-2xl z-50 p-2 text-xs font-mono animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-slate-800 mb-1">
                <div className="text-slate-300 font-semibold">Active Command Profile</div>
                <div className="text-[11px] text-slate-500">Department of Civic Analytics</div>
              </div>
              <div className="space-y-1">
                {(['Director of Operations', 'Field Chief Inspector', 'Public Works Dispatch'] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      setActiveRole(role);
                      setShowProfileMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-md flex items-center justify-between ${
                      activeRole === role ? 'bg-cyan-950/60 text-cyan-300 font-semibold' : 'text-slate-400 hover:bg-slate-800/60'
                    }`}
                  >
                    <span>{role}</span>
                    {activeRole === role && <CheckCircle className="w-3 h-3 text-cyan-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
