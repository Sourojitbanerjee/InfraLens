import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  Issue, 
  Authority, 
  AnalyticsSummary, 
  AuditEvent, 
  ResolutionStatus,
  DBSCANCluster,
  CityHealthMetrics,
  CreateIssueInput
} from '../types/infrastructure';
import { AppView, FilterState } from '../types/navigation';
import { infrastructureService } from '../services/infrastructureService';
import { supabaseIncidentService } from '../services/supabaseIncidentService';
import { isSupabaseConfigured } from '../lib/supabase';
import { UserSession } from '../types/auth';
import { authService } from '../services/authService';
import { supabaseAuthService } from '../services/supabaseAuthService';
import { t as translateHelper } from '../i18n/translations';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'critical' | 'info' | 'success';
}

interface InfraContextType {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  issues: Issue[];
  filteredIssues: Issue[];
  selectedIssue: Issue | null;
  setSelectedIssue: (issue: Issue | null) => void;
  clusters: DBSCANCluster[];
  selectedCluster: DBSCANCluster | null;
  setSelectedCluster: (cluster: DBSCANCluster | null) => void;
  authorities: Authority[];
  analytics: AnalyticsSummary | null;
  cityHealth: CityHealthMetrics | null;
  auditEvents: AuditEvent[];
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  
  // Geolocation & Manual Pin Picker
  manualGpsPin: { latitude: number; longitude: number; address?: string } | null;
  setManualGpsPin: (pin: { latitude: number; longitude: number; address?: string } | null) => void;

  // Drawer & Modals
  isDetailDrawerOpen: boolean;
  openDetailDrawer: (issue: Issue) => void;
  closeDetailDrawer: () => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;

  // Authentication & RBAC
  currentUser: UserSession | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserSession | null>>;

  // Regional Localization (9 Indian Languages)
  currentLanguage: string;
  setCurrentLanguage: (lang: string) => void;
  t: (key: string) => string;
  
  // Actions
  updateIssueStatus: (id: string, status: ResolutionStatus, notes?: string) => Promise<void>;
  assignAuthority: (issueId: string, authorityId: string) => Promise<void>;
  createNewIssue: (data: CreateIssueInput) => Promise<Issue>;
  
  // Notifications & Toasts
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  toasts: ToastItem[];
  addToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;

  // Key stats (Rule 2 Command Center requirements)
  stats: {
    activeIssues: number;
    p0Emergency: number;
    critical: number;
    activeClusters: number;
    resolved: number;
    affectedPopulation: number;
    avgResolutionHours: number;
  };

  isLoading: boolean;
  realtimeActive: boolean;
}

const defaultFilters: FilterState = {
  searchQuery: '',
  category: 'all',
  severity: 'all',
  priority: 'all',
  status: 'all',
  ward: 'all',
  authority: 'all',
  dateRange: 'all',
  clusterOnly: false,
};

const InfraContext = createContext<InfraContextType | undefined>(undefined);

export const InfraProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [clusters, setClusters] = useState<DBSCANCluster[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<DBSCANCluster | null>(null);
  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [cityHealth, setCityHealth] = useState<CityHealthMetrics | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [realtimeActive, setRealtimeActive] = useState(true);

  // Authentication — sync from supabaseAuthService on mount
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => 
    supabaseAuthService.getCurrentSessionSync() ?? authService.getCurrentSession()
  );

  // Regional 9-Language Localization
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const t = (key: string) => translateHelper(key, currentLanguage);

  // Manual GPS coordinate pin state
  const [manualGpsPin, setManualGpsPin] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Notifications (Believable municipal operations alerts - Rule 9)
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-0',
      title: 'P0 EMERGENCY: High-Voltage Feeder Arcing',
      message: 'Active electrical hazard detected at Connaught Place Radial 2 Plaza. Immediate isolation ordered.',
      timestamp: '2 min ago',
      read: false,
      type: 'critical',
    },
    {
      id: 'notif-1',
      title: 'Cluster CL-027 Escalated to P1',
      message: '37 aggregated reports within 400m radius of Modern School Barakhamba Road. Impact score 87/100.',
      timestamp: '6 min ago',
      read: false,
      type: 'critical',
    },
    {
      id: 'notif-2',
      title: 'P1 Cluster Detected Near Modern School',
      message: 'Autonomous computer vision scan flagged arterial pavement fracturing along bus corridor.',
      timestamp: '14 min ago',
      read: false,
      type: 'critical',
    },
    {
      id: 'notif-3',
      title: '7 New Infrastructure Reports in Ward 1',
      message: 'Citizen feedback and patrol UAV sensors detected drainage backflow and missing signage.',
      timestamp: '28 min ago',
      read: false,
      type: 'info',
    },
    {
      id: 'notif-4',
      title: 'Road Repair Marked Complete (INF-2026-902)',
      message: 'NDMC Civil Roads Department closed work order. Severity reduced from 87 to 12 in 4.2 days.',
      timestamp: '1 hr ago',
      read: true,
      type: 'success',
    },
  ]);

  const addToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearAllNotifications = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Sync data — uses Supabase when configured, falls back to in-memory
  const syncData = async () => {
    try {
      const dataService = isSupabaseConfigured ? supabaseIncidentService : infrastructureService;
      const [
        loadedIssues,
        loadedClusters,
        loadedAuthorities,
        loadedAnalytics,
        loadedCityHealth,
        loadedAudits,
      ] = await Promise.all([
        dataService.getIssues(),
        dataService.getClusters(),
        dataService.getAuthorities(),
        dataService.getAnalyticsSummary(),
        dataService.getCityHealthMetrics(),
        dataService.getAuditEvents(),
      ]);
      setIssues(loadedIssues);
      setClusters(loadedClusters);
      setAuthorities(loadedAuthorities);
      setAnalytics(loadedAnalytics);
      setCityHealth(loadedCityHealth);
      setAuditEvents(loadedAudits);
    } catch (err) {
      console.error('Failed to sync InfraLens data:', err);
    }
  };

  // Initial Load & Real-Time Subscription
  useEffect(() => {
    let unsubscribeInMemory: (() => void) | undefined;
    let unsubscribeRealtime: (() => void) | null = null;

    const init = async () => {
      setIsLoading(true);
      await syncData();
      setIsLoading(false);

      if (isSupabaseConfigured) {
        // Real-time sync via Supabase Realtime
        unsubscribeRealtime = supabaseIncidentService.subscribeToRealtime(
          (newIssue) => {
            // New incident inserted — add to map immediately
            setIssues((prev) => {
              const exists = prev.some((i) => i.id === newIssue.id);
              if (exists) return prev;
              return [newIssue, ...prev];
            });
            setRealtimeActive(true);
            addToast(`New incident ${newIssue.issueCode} received in real-time`, 'info');
          },
          (updatedIssue) => {
            // Incident updated — sync map marker and drawer
            setIssues((prev) => prev.map((i) => i.id === updatedIssue.id ? updatedIssue : i));
            setSelectedIssue((prev) => prev?.id === updatedIssue.id ? updatedIssue : prev);
          }
        );
      } else {
        // In-memory bus subscription (fallback)
        unsubscribeInMemory = infrastructureService.subscribe(() => {
          syncData();
        });
      }
    };

    init();

    return () => {
      if (unsubscribeInMemory) unsubscribeInMemory();
      if (unsubscribeRealtime) unsubscribeRealtime();
    };
  }, []);

  // Filtered Issues calculation
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      // Search query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchesQuery =
          issue.title.toLowerCase().includes(query) ||
          issue.issueCode.toLowerCase().includes(query) ||
          issue.location.address.toLowerCase().includes(query) ||
          issue.authorityName.toLowerCase().includes(query) ||
          issue.categoryLabel.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      // Category
      if (filters.category !== 'all' && issue.category !== filters.category) {
        return false;
      }

      // Severity
      if (filters.severity !== 'all' && issue.severity !== filters.severity) {
        return false;
      }

      // Priority
      if (filters.priority !== 'all' && issue.priority !== filters.priority) {
        return false;
      }

      // Status
      if (filters.status !== 'all' && issue.status !== filters.status) {
        return false;
      }

      // Ward
      if (filters.ward !== 'all' && !issue.location.ward.toLowerCase().includes(filters.ward.toLowerCase())) {
        return false;
      }

      // Authority filter
      if (filters.authority !== 'all' && issue.authorityId !== filters.authority) {
        return false;
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const now = Date.now();
        const issueTime = new Date(issue.createdAt).getTime();
        const diffHours = (now - issueTime) / (1000 * 60 * 60);
        if (filters.dateRange === 'today' && diffHours > 24) return false;
        if (filters.dateRange === '7d' && diffHours > 24 * 7) return false;
        if (filters.dateRange === '30d' && diffHours > 24 * 30) return false;
      }

      // Cluster only
      if (filters.clusterOnly && (!issue.clusterCount || issue.clusterCount < 3)) {
        return false;
      }

      return true;
    });
  }, [issues, filters]);

  // Statistics calculation with P0 Emergency & Macro Metrics (Rule 2)
  const stats = useMemo(() => {
    const active = issues.filter((i) => i.status !== 'resolved' && i.status !== 'dismissed');
    const p0 = issues.filter((i) => i.priority === 'P0' && i.status !== 'resolved').length;
    const critical = issues.filter(
      (i) => (i.severity === 'critical' || i.priority === 'P1') && i.status !== 'resolved' && i.status !== 'dismissed'
    ).length;
    const activeClusters = clusters.length;
    const resolved = issues.filter((i) => i.status === 'resolved').length;

    // Macro civic impact metrics
    const affectedPop = active.reduce((acc, curr) => acc + (curr.impact?.affectedUsersPerDay || 0), 0);
    const avgHours = analytics?.averageMttrHours || 28.4;

    return {
      activeIssues: active.length,
      p0Emergency: p0,
      critical,
      activeClusters,
      resolved,
      affectedPopulation: affectedPop > 0 ? affectedPop : 14200,
      avgResolutionHours: avgHours,
    };
  }, [issues, clusters, analytics]);

  const openDetailDrawer = (issue: Issue) => {
    setSelectedIssue(issue);
    setIsDetailDrawerOpen(true);
  };

  const closeDetailDrawer = () => {
    setIsDetailDrawerOpen(false);
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const updateIssueStatus = async (id: string, status: ResolutionStatus, notes?: string) => {
    try {
      const dataService = isSupabaseConfigured ? supabaseIncidentService : infrastructureService;
      const updated = await dataService.updateIssueStatus(id, status, notes, currentUser?.fullName);
      setIssues((prev) => prev.map((i) => (i.id === id ? updated : i)));
      if (selectedIssue && selectedIssue.id === id) {
        setSelectedIssue(updated);
      }
      addToast(`Work order ${updated.issueCode} updated to ${status.toUpperCase().replace('_', ' ')}`, 'success');
    } catch (err) {
      console.error('Failed to update issue status:', err);
      addToast('Failed to update issue status', 'error');
    }
  };

  const assignAuthority = async (issueId: string, authorityId: string) => {
    try {
      const dataService = isSupabaseConfigured ? supabaseIncidentService : infrastructureService;
      const updated = await dataService.assignAuthority(issueId, authorityId);
      setIssues((prev) => prev.map((i) => (i.id === issueId ? updated : i)));
      if (selectedIssue && selectedIssue.id === issueId) {
        setSelectedIssue(updated);
      }
      addToast(`Dispatched ${updated.issueCode} to ${updated.authorityName}`, 'success');
    } catch (err) {
      console.error('Failed to assign authority:', err);
      addToast('Failed to route work order', 'error');
    }
  };

  const createNewIssue = async (
    data: CreateIssueInput
  ) => {
    try {
      const dataService = isSupabaseConfigured ? supabaseIncidentService : infrastructureService;
      const created = await dataService.createIssue(data);
      // Optimistically add to map immediately (realtime will also broadcast if Supabase)
      setIssues((prev) => [created, ...prev]);
      addToast(`New incident ${created.issueCode} registered into Command Center (${created.priority})`, 'success');
      return created;
    } catch (err) {
      console.error('Failed to create issue:', err);
      addToast('Failed to register detected issue', 'error');
      throw err;
    }
  };

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  return (
    <InfraContext.Provider
      value={{
        currentView,
        setCurrentView,
        issues,
        filteredIssues,
        selectedIssue,
        setSelectedIssue,
        clusters,
        selectedCluster,
        setSelectedCluster,
        authorities,
        analytics,
        cityHealth,
        auditEvents,
        filters,
        setFilters,
        resetFilters,
        manualGpsPin,
        setManualGpsPin,
        isDetailDrawerOpen,
        openDetailDrawer,
        closeDetailDrawer,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        currentUser,
        setCurrentUser,
        currentLanguage,
        setCurrentLanguage,
        t,
        updateIssueStatus,
        assignAuthority,
        createNewIssue,
        notifications,
        unreadNotificationCount,
        markNotificationRead,
        clearAllNotifications,
        toasts,
        addToast,
        removeToast,
        stats,
        isLoading,
        realtimeActive,
      }}
    >
      {children}
    </InfraContext.Provider>
  );
};

export const useInfra = () => {
  const context = useContext(InfraContext);
  if (!context) {
    throw new Error('useInfra must be used within an InfraProvider');
  }
  return context;
};
