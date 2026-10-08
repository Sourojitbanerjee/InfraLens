import { INITIAL_ISSUES } from '../data/mockIssues';
import { MOCK_AUTHORITIES } from '../data/mockAuthorities';
import { MOCK_ANALYTICS_SUMMARY, MOCK_WARDS } from '../data/mockAnalytics';
import { 
  Issue, 
  Authority, 
  AnalyticsSummary, 
  ResolutionStatus, 
  AuditEvent, 
  DBSCANCluster,
  CityHealthMetrics
} from '../types/infrastructure';
import { GisEngine } from './gisEngine';
import { ClusteringEngine } from './clusteringEngine';
import { ImpactEngine } from './impactEngine';
import { PriorityEngine } from './priorityEngine';
import { AuthorityResolver } from './authorityResolver';
import { CityHealthEngine } from './cityHealthEngine';

export interface IInfrastructureService {
  getIssues(): Promise<Issue[]>;
  getClusters(): Promise<DBSCANCluster[]>;
  getIssueById(id: string): Promise<Issue | null>;
  updateIssueStatus(id: string, status: ResolutionStatus, notes?: string, actor?: string): Promise<Issue>;
  assignAuthority(issueId: string, authorityId: string): Promise<Issue>;
  createIssue(issue: Omit<Issue, 'id' | 'issueCode' | 'createdAt' | 'updatedAt' | 'lifecycle'>): Promise<Issue>;
  getAuthorities(): Promise<Authority[]>;
  getAnalyticsSummary(): Promise<AnalyticsSummary>;
  getCityHealthMetrics(): Promise<CityHealthMetrics>;
  getAuditEvents(): Promise<AuditEvent[]>;
  subscribe(listener: () => void): () => void;
}

class InfrastructureServiceImpl implements IInfrastructureService {
  private issues: Issue[] = [...INITIAL_ISSUES];
  private authorities: Authority[] = [...MOCK_AUTHORITIES];
  private clusters: DBSCANCluster[] = [];
  private listeners: Set<() => void> = new Set();
  private auditEvents: AuditEvent[] = [
    {
      id: 'aud-0',
      timestamp: '2026-10-08T05:48:00Z',
      issueId: 'iss-p0-wire',
      issueCode: 'INF-2026-0922',
      action: 'ESCALATED',
      actorName: 'Priority Engine AI',
      actorRole: 'Autonomous Risk Classifier',
      details: 'P0 Emergency flagged: Active 480V arcing wire near Civic Center Subway.',
      severity: 'critical',
    },
    {
      id: 'aud-1',
      timestamp: '2026-10-08T05:30:00Z',
      issueId: 'iss-002',
      issueCode: 'INF-2026-0894',
      action: 'DETECTED',
      actorName: 'AI Edge Node #12-Mission',
      actorRole: 'Automated Computer Vision Camera',
      details: 'Catastrophic stormwater overflow detected; confidence 96%',
      severity: 'critical',
    },
    {
      id: 'aud-2',
      timestamp: '2026-10-08T05:12:00Z',
      issueId: 'iss-001',
      issueCode: 'INF-2026-0891',
      action: 'STATUS_CHANGED',
      actorName: 'Comm. Elena Rostova',
      actorRole: 'PWD Dispatch Commander',
      details: 'Flagged status changed to IN_PROGRESS. Crew #4 assigned.',
      severity: 'critical',
    },
  ];

  constructor() {
    this.recalculateClusters();
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Error in infrastructure service listener:', err);
      }
    });
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private recalculateClusters(): void {
    const { clusters, updatedIssues } = ClusteringEngine.clusterIssues(this.issues, {
      epsilonMeters: 400,
      minPoints: 3,
    });
    this.clusters = clusters;
    this.issues = updatedIssues;
  }

  async getIssues(): Promise<Issue[]> {
    return [...this.issues];
  }

  async getClusters(): Promise<DBSCANCluster[]> {
    return [...this.clusters];
  }

  async getIssueById(id: string): Promise<Issue | null> {
    const issue = this.issues.find((i) => i.id === id);
    return issue ? { ...issue } : null;
  }

  async updateIssueStatus(
    id: string,
    status: ResolutionStatus,
    notes?: string,
    actor: string = 'Ops Controller #09'
  ): Promise<Issue> {
    const idx = this.issues.findIndex((i) => i.id === id);
    if (idx === -1) {
      throw new Error(`Issue ${id} not found`);
    }

    const current = this.issues[idx];
    const now = new Date().toISOString();
    const createdTime = new Date(current.createdAt).getTime();
    const durationHours = Number(((Date.now() - createdTime) / (1000 * 60 * 60)).toFixed(1));

    const newLifecycle = [
      ...(current.lifecycle || []),
      {
        status,
        timestamp: now,
        actor,
        role: 'City Command Operator',
        notes: notes || `Status changed from ${current.status} to ${status}`,
        durationHoursSinceReported: durationHours,
      },
    ];

    let resolutionComparison = current.resolutionComparison;
    if (status === 'resolved' && !resolutionComparison) {
      const days = Number((Math.max(12, durationHours) / 24).toFixed(1));
      resolutionComparison = {
        beforeSeverityScore: current.severityScore,
        afterSeverityScore: Math.min(14, Math.max(6, Math.round(current.severityScore * 0.14))),
        beforeSeverity: current.severity,
        afterSeverity: 'healthy',
        resolutionTimeDays: days > 0 ? days : 4.2,
        commutersProtected: current.impact?.affectedUsersPerDay || 2400,
        beforeImageUrl: current.imageUrl,
        afterImageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
        repairedByDepartment: current.departmentName || current.authorityName,
        notes: notes || `Repairs completed by ${current.departmentName || current.authorityName}. All structural defects remediated.`,
      };
    }

    const updated: Issue = {
      ...current,
      status,
      notes: notes || current.notes,
      updatedAt: now,
      lifecycle: newLifecycle,
      resolutionComparison,
    };

    this.issues[idx] = updated;
    this.recalculateClusters();

    // Record audit event
    this.auditEvents.unshift({
      id: `aud-${Date.now()}`,
      timestamp: now,
      issueId: updated.id,
      issueCode: updated.issueCode,
      action: status === 'resolved' ? 'RESOLVED' : status === 'in_progress' ? 'STATUS_CHANGED' : 'ASSIGNED',
      actorName: actor,
      actorRole: 'City Command Operator',
      details: `Status transitioned to ${status.toUpperCase()}${notes ? `: ${notes}` : ''}`,
      severity: updated.severity,
    });

    this.notifyListeners();
    return updated;
  }

  async assignAuthority(issueId: string, authorityId: string): Promise<Issue> {
    const idx = this.issues.findIndex((i) => i.id === issueId);
    if (idx === -1) {
      throw new Error(`Issue ${issueId} not found`);
    }

    const auth = this.authorities.find((a) => a.id === authorityId);
    if (!auth) {
      throw new Error(`Authority ${authorityId} not found`);
    }

    const current = this.issues[idx];
    const now = new Date().toISOString();

    const updated: Issue = {
      ...current,
      authorityId: auth.id,
      authorityName: auth.name,
      departmentName: auth.name,
      status: 'assigned',
      updatedAt: now,
      lifecycle: [
        ...(current.lifecycle || []),
        {
          status: 'assigned',
          timestamp: now,
          actor: 'Dispatch Officer S. Vance',
          role: 'Municipal Router',
          notes: `Work order routed to ${auth.name} (${auth.shortCode})`,
        },
      ],
    };

    this.issues[idx] = updated;

    this.auditEvents.unshift({
      id: `aud-${Date.now()}`,
      timestamp: now,
      issueId: updated.id,
      issueCode: updated.issueCode,
      action: 'ASSIGNED',
      actorName: 'Dispatch Officer S. Vance',
      actorRole: 'Municipal Router',
      details: `Dispatched to ${auth.name} (${auth.shortCode})`,
      severity: updated.severity,
    });

    this.notifyListeners();
    return updated;
  }

  /**
   * Complete End-to-End Ingestion Pipeline:
   * IMAGE -> CV -> DETECTION -> SEVERITY -> GPS -> GIS -> CLUSTERING -> IMPACT -> PRIORITY -> AUTHORITY -> LIFECYCLE
   */
  async createIssue(
    issueData: Omit<Issue, 'id' | 'issueCode' | 'createdAt' | 'updatedAt' | 'lifecycle'>
  ): Promise<Issue> {
    const now = new Date().toISOString();
    const randomCode = `INF-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Geospatial & Ward Enhancement
    const wardData = GisEngine.lookupWard(issueData.location.latitude, issueData.location.longitude);
    const location = {
      ...issueData.location,
      ward: issueData.location.ward || wardData.wardName,
      zone: issueData.location.zone || wardData.zone,
      timestamp: now,
    };

    // 2. Impact Analysis
    const impact = ImpactEngine.assessImpact(
      location.latitude,
      location.longitude,
      issueData.category,
      issueData.severityScore
    );

    // 3. Priority Engine with Explainability
    const priorityExplainability = PriorityEngine.evaluatePriority({
      severityScore: issueData.severityScore,
      complaintDensityCount: issueData.clusterCount || 1,
      affectedPopulation: impact.affectedUsersPerDay,
      trafficImportance: impact.trafficImportance,
      sensitiveLocationScore: impact.sensitiveLocationScore,
      createdAt: now,
      nearbyRisks: impact.nearbyRisks,
      category: issueData.category,
    });

    // 4. Authority Resolver
    const authorityRoute = AuthorityResolver.resolve(
      location,
      issueData.category,
      issueData.severity
    );

    const newIssue: Issue = {
      ...issueData,
      id: `iss-${Date.now()}`,
      issueCode: randomCode,
      location,
      priority: priorityExplainability.priority,
      authorityId: authorityRoute.authority.id,
      authorityName: authorityRoute.authority.name,
      departmentName: authorityRoute.departmentName,
      impact: {
        ...impact,
        recommendedAction: authorityRoute.recommendedAction,
        slaDeadlineHours: authorityRoute.slaHours,
      },
      priorityExplainability,
      lifecycle: [
        {
          status: 'detected',
          timestamp: now,
          actor: 'AI Edge Vision (Street-Lens v3.4)',
          role: 'Inference Engine',
          notes: `Defect identified with ${issueData.confidence}% confidence. Priority set to ${priorityExplainability.priority}.`,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    this.issues.unshift(newIssue);
    this.recalculateClusters();

    this.auditEvents.unshift({
      id: `aud-${Date.now()}`,
      timestamp: now,
      issueId: newIssue.id,
      issueCode: newIssue.issueCode,
      action: 'DETECTED',
      actorName: 'AI Edge Vision Engine',
      actorRole: 'Autonomous Computer Vision',
      details: `${newIssue.priority} defect logged: ${newIssue.title}. Priority score: ${priorityExplainability.score}/100`,
      severity: newIssue.severity,
    });

    this.notifyListeners();
    return newIssue;
  }

  async getAuthorities(): Promise<Authority[]> {
    return [...this.authorities];
  }

  async getCityHealthMetrics(): Promise<CityHealthMetrics> {
    return CityHealthEngine.calculateCityHealth(this.issues, MOCK_WARDS);
  }

  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    const healthMetrics = CityHealthEngine.calculateCityHealth(this.issues, MOCK_WARDS);
    return {
      ...MOCK_ANALYTICS_SUMMARY,
      systemHealthIndex: healthMetrics.overallScore,
      cityHealthMetrics: healthMetrics,
    };
  }

  async getAuditEvents(): Promise<AuditEvent[]> {
    return [...this.auditEvents];
  }
}

export const infrastructureService = new InfrastructureServiceImpl();
