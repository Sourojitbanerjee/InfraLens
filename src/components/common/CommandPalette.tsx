import React, { useState, useEffect, useRef } from 'react';
import { useInfra } from '../../context/InfraContext';
import { 
  Search, 
  MapPin, 
  AlertOctagon, 
  Layers, 
  Camera, 
  BarChart3, 
  Building2, 
  History, 
  ArrowRight,
  Filter,
  CheckCircle,
  Home,
  Flame
} from 'lucide-react';

export const CommandPalette: React.FC = () => {
  const { 
    isCommandPaletteOpen, 
    setIsCommandPaletteOpen, 
    setCurrentView, 
    issues, 
    openDetailDrawer,
    setFilters,
    addToast 
  } = useInfra();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener: CMD+K or CTRL+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(!isCommandPaletteOpen);
      }
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  interface PaletteAction {
    id: string;
    title: string;
    subtitle: string;
    category: string;
    icon: React.ReactNode;
    run: () => void;
  }

  // Define static commands
  const navigationCommands: PaletteAction[] = [
    {
      id: 'cmd-landing',
      title: 'Portal Overview & Hero',
      subtitle: 'Return to public-facing intelligence portal',
      category: 'Navigation',
      icon: <Home className="w-4 h-4 text-cyan-400" />,
      run: () => {
        setCurrentView('landing');
        setIsCommandPaletteOpen(false);
      },
    },
    {
      id: 'cmd-dashboard',
      title: 'City Command Center',
      subtitle: 'Open real-time operations dashboard & overview',
      category: 'Navigation',
      icon: <Layers className="w-4 h-4 text-cyan-400" />,
      run: () => {
        setCurrentView('dashboard');
        setIsCommandPaletteOpen(false);
      },
    },
    {
      id: 'cmd-analyze',
      title: 'AI Street Analysis',
      subtitle: 'Upload or scan street imagery for damage classification',
      category: 'Intelligence',
      icon: <Camera className="w-4 h-4 text-emerald-400" />,
      run: () => {
        setCurrentView('analyze');
        setIsCommandPaletteOpen(false);
      },
    },
    {
      id: 'cmd-map',
      title: 'Open Infrastructure GIS Map',
      subtitle: 'View dark geospatial map with clusters and heatmaps',
      category: 'Geospatial',
      icon: <MapPin className="w-4 h-4 text-indigo-400" />,
      run: () => {
        setCurrentView('map');
        setIsCommandPaletteOpen(false);
      },
    },
    {
      id: 'cmd-p0',
      title: 'Filter: P0 Emergency Hazards',
      subtitle: 'Immediate life-safety arcing lines and catastrophic blowouts',
      category: 'Triage',
      icon: <Flame className="w-4 h-4 text-purple-400" />,
      run: () => {
        setCurrentView('dashboard');
        setFilters((prev) => ({ ...prev, priority: 'P0' }));
        setIsCommandPaletteOpen(false);
        addToast('Filtered view: Showing P0 Emergency hazards only', 'warning');
      },
    },
    {
      id: 'cmd-critical',
      title: 'Filter: P1 Critical Incidents',
      subtitle: 'Show only high-risk life-safety road & drainage hazards',
      category: 'Triage',
      icon: <AlertOctagon className="w-4 h-4 text-rose-400" />,
      run: () => {
        setCurrentView('dashboard');
        setFilters((prev) => ({ ...prev, severity: 'critical', priority: 'P1' }));
        setIsCommandPaletteOpen(false);
        addToast('Filtered view: Showing P1 Critical incidents only', 'info');
      },
    },
    {
      id: 'cmd-queue',
      title: 'Priority Work Queue',
      subtitle: 'Triage and dispatch unassigned infrastructure items',
      category: 'Operations',
      icon: <Filter className="w-4 h-4 text-amber-400" />,
      run: () => {
        setCurrentView('queue');
        setIsCommandPaletteOpen(false);
      },
    },
    {
      id: 'cmd-analytics',
      title: 'Infrastructure Intelligence & Analytics',
      subtitle: 'View trends, ward health index, and MTTR performance',
      category: 'Intelligence',
      icon: <BarChart3 className="w-4 h-4 text-cyan-400" />,
      run: () => {
        setCurrentView('analytics');
        setIsCommandPaletteOpen(false);
      },
    },
    {
      id: 'cmd-authorities',
      title: 'Municipal Authorities Matrix',
      subtitle: 'Inspect department dispatch units, response SLAs and fleets',
      category: 'Municipal',
      icon: <Building2 className="w-4 h-4 text-slate-300" />,
      run: () => {
        setCurrentView('authorities');
        setIsCommandPaletteOpen(false);
      },
    },
    {
      id: 'cmd-activity',
      title: 'Audit Trail & Live Activity Feed',
      subtitle: 'Inspect immutable ledger of automated and operator actions',
      category: 'Operations',
      icon: <History className="w-4 h-4 text-slate-400" />,
      run: () => {
        setCurrentView('activity');
        setIsCommandPaletteOpen(false);
      },
    },
  ];

  // Smart Intent Commands based on natural language queries (Rule 7)
  const smartIntentCommands: PaletteAction[] = [];
  const q = query.trim().toLowerCase();

  if (q.includes('school') || q.includes('near school') || q.includes('potholes near')) {
    const schoolMatches = issues.filter((i) => i.impact?.nearbyRisks?.some((r) => r.type === 'school'));
    smartIntentCommands.push({
      id: 'cmd-smart-schools',
      title: 'Filter: Potholes & Defects Near Schools',
      subtitle: `Found ${schoolMatches.length} issues proximate to schools / child crossings`,
      category: 'Smart Civic Query',
      icon: <MapPin className="w-4 h-4 text-amber-400" />,
      run: () => {
        setCurrentView('queue');
        setFilters((prev) => ({ ...prev, category: 'road_damage' }));
        setIsCommandPaletteOpen(false);
        addToast(`Applied filter: Defects near schools (${schoolMatches.length} items)`, 'info');
      },
    });
  }

  if (q.includes('critical') || q.includes('incident') || q.includes('urgent')) {
    smartIntentCommands.push({
      id: 'cmd-smart-critical',
      title: 'View: All Critical Incidents (P0 & P1)',
      subtitle: 'Immediate life-safety and structural failure reports',
      category: 'Smart Civic Query',
      icon: <AlertOctagon className="w-4 h-4 text-rose-400" />,
      run: () => {
        setCurrentView('dashboard');
        setFilters((prev) => ({ ...prev, severity: 'critical' }));
        setIsCommandPaletteOpen(false);
        addToast('Filtered to Critical Incidents', 'warning');
      },
    });
  }

  if (q.includes('cl-027') || (q.includes('cluster') && q.includes('27'))) {
    smartIntentCommands.push({
      id: 'cmd-smart-cl027',
      title: 'Navigate to Cluster CL-027 (37 Reports)',
      subtitle: 'High damage severity cluster on 4th & Bryant (Lincoln High School zone)',
      category: 'Smart Civic Query',
      icon: <Layers className="w-4 h-4 text-orange-400" />,
      run: () => {
        setCurrentView('map');
        setIsCommandPaletteOpen(false);
        addToast('Focused on DBSCAN Cluster CL-027', 'info');
      },
    });
  }

  if (q.includes('streetlight') || q.includes('lighting') || q.includes('lamp')) {
    smartIntentCommands.push({
      id: 'cmd-smart-lighting',
      title: 'Filter: Broken Streetlights & Power Failures',
      subtitle: 'Inspect dark corridors and broken municipal luminaires',
      category: 'Smart Civic Query',
      icon: <Search className="w-4 h-4 text-amber-300" />,
      run: () => {
        setCurrentView('queue');
        setFilters((prev) => ({ ...prev, category: 'lighting_failure' }));
        setIsCommandPaletteOpen(false);
        addToast('Filtered to Lighting Failures', 'info');
      },
    });
  }

  if (q.includes('ward 17') || q.includes('ward 6') || q.includes('ward 3') || q.includes('ward 9') || q.includes('ward 5')) {
    const wardName = q.includes('ward 17')
      ? 'Ward 17 (Metro Sub-District)'
      : q.includes('ward 6')
      ? 'Ward 6 — Mission & SOMA'
      : q.includes('ward 3')
      ? 'Ward 3 — Civic & Financial'
      : q.includes('ward 9')
      ? 'Ward 9 — Mission District'
      : 'Ward 5 — Western Addition';

    smartIntentCommands.push({
      id: 'cmd-smart-ward',
      title: `Navigate to ${wardName}`,
      subtitle: 'Filter geospatial telemetry to this municipal administrative ward',
      category: 'Smart Civic Query',
      icon: <Building2 className="w-4 h-4 text-cyan-400" />,
      run: () => {
        setCurrentView('map');
        setFilters((prev) => ({ ...prev, ward: wardName.split(' ')[0] + ' ' + wardName.split(' ')[1] }));
        setIsCommandPaletteOpen(false);
        addToast(`Filtered to ${wardName}`, 'info');
      },
    });
  }

  // Issue dynamic search
  const issueCommands: PaletteAction[] = issues
    .filter((issue) => {
      if (!q) return true;
      return (
        issue.issueCode.toLowerCase().includes(q) ||
        issue.title.toLowerCase().includes(q) ||
        issue.location.address.toLowerCase().includes(q) ||
        issue.location.ward.toLowerCase().includes(q) ||
        issue.category.toLowerCase().includes(q) ||
        issue.impact?.nearbyRisks?.some((r) => r.name.toLowerCase().includes(q))
      );
    })
    .slice(0, 10)
    .map((issue) => ({
      id: `cmd-issue-${issue.id}`,
      title: `${issue.issueCode} — ${issue.title}`,
      subtitle: `${issue.location.address} • ${issue.severity.toUpperCase()} • ${issue.status.toUpperCase()}`,
      category: 'Issues & Reports',
      icon: <CheckCircle className={`w-4 h-4 ${issue.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'}`} />,
      run: () => {
        openDetailDrawer(issue);
        setIsCommandPaletteOpen(false);
      },
    }));

  const allActions = [...smartIntentCommands, ...navigationCommands, ...issueCommands];

  // Filter actions based on query
  const filteredActions = allActions.filter((action) => {
    if (!q) return true;
    return (
      action.title.toLowerCase().includes(q) ||
      action.subtitle.toLowerCase().includes(q) ||
      action.category.toLowerCase().includes(q)
    );
  });

  const handleKeyDownList = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredActions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredActions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredActions[selectedIndex]) {
        filteredActions[selectedIndex].run();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-start justify-center p-4 pt-16 sm:pt-24 text-center">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
          onClick={() => setIsCommandPaletteOpen(false)}
          aria-hidden="true"
        />

        {/* Palette Dialog */}
        <div
          className="relative transform overflow-hidden rounded-2xl bg-[#090D17] border border-cyan-500/20 text-left shadow-2xl transition-all w-full max-w-2xl z-10 shadow-cyan-950/40"
          role="dialog"
          aria-modal="true"
        >
          {/* Search Bar */}
          <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-[#0E1524]">
            <Search className="w-5 h-5 text-cyan-400 shrink-0 mr-3" />
            <input
              ref={inputRef}
              type="text"
              className="w-full bg-transparent text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
              placeholder="Type a command or search issues, wards, coordinates... (e.g. 'P1', 'pothole', 'map')"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDownList}
            />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800/80 rounded border border-slate-700">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-slate-800/40">
            {filteredActions.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm font-mono">
                No commands or issues matching "{query}"
              </div>
            ) : (
              filteredActions.map((action, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={action.id}
                    onClick={() => action.run()}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-cyan-950/50 border border-cyan-500/30 text-white'
                        : 'text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="p-1.5 rounded-md bg-slate-900 border border-slate-800 shrink-0">
                        {action.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-medium truncate flex items-center gap-2">
                          <span>{action.title}</span>
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400">
                            {action.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono truncate">
                          {action.subtitle}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Shortcuts */}
          <div className="px-4 py-2.5 bg-[#070A12] border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-4">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>ESC Close</span>
            </div>
            <span className="text-cyan-400/80">InfraLens Tactical OS v1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};
