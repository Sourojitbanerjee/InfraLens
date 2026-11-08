/**
 * InfraLens Supabase Incident Service
 *
 * When Supabase is configured: reads/writes from real PostgreSQL database.
 * When NOT configured: falls back to in-memory store (identical to existing behavior).
 *
 * This wraps the existing IInfrastructureService interface so the rest of the
 * application doesn't need to change — it's a drop-in replacement.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { infrastructureService } from './infrastructureService';
import {
  Issue,
  Authority,
  AnalyticsSummary,
  ResolutionStatus,
  AuditEvent,
  DBSCANCluster,
  CityHealthMetrics,
  GeoLocation,
  InfrastructureCategory,
  Severity,
  Priority,
  CreateIssueInput,
} from '../types/infrastructure';
import { GisEngine } from './gisEngine';
import { MOCK_AUTHORITIES } from '../data/mockAuthorities';
import { MOCK_ANALYTICS_SUMMARY, MOCK_WARDS } from '../data/mockAnalytics';
import { CityHealthEngine } from './cityHealthEngine';

// ---- Supabase DB row types ----
interface IncidentRow {
  id: string;
  issue_code: string;
  title: string;
  description?: string;
  category: string;
  category_label?: string;
  detection_type?: string;
  severity: string;
  severity_score: number;
  priority: string;
  confidence: number;
  status: string;
  latitude: number;
  longitude: number;
  address?: string;
  ward?: string;
  zone?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  road_name?: string;
  accuracy_meters?: number;
  gps_source?: string;
  location_verification_status?: string;
  image_url?: string;
  supporting_images?: string[];
  reporter_id?: string;
  reporter_name?: string;
  is_anonymous?: boolean;
  landmark_notes?: string;
  authority_id?: string;
  authority_name?: string;
  department_name?: string;
  jurisdiction_code?: string;
  local_body_type?: string;
  local_body_name?: string;
  assigned_officer?: string;
  work_order_id?: string;
  resolution_deadline?: string;
  record_type?: string;
  verification_status?: string;
  ai_model_name?: string;
  community_confirmations_count?: number;
  is_duplicate?: boolean;
  hazard_score?: number;
  affected_users_per_day?: number;
  sla_deadline_hours?: number;
  created_at: string;
  updated_at: string;
}

/** Convert a Supabase DB row to the Issue type used throughout the app */
function rowToIssue(row: IncidentRow): Issue {
  return {
    id: row.id,
    issueCode: row.issue_code,
    title: row.title,
    description: row.description,
    category: row.category as InfrastructureCategory,
    categoryLabel: row.category_label || row.category,
    detectionType: row.detection_type as Issue['detectionType'],
    severity: row.severity as Severity,
    severityScore: row.severity_score,
    priority: row.priority as Priority,
    confidence: row.confidence,
    status: mapDbStatus(row.status),
    location: {
      latitude: row.latitude,
      longitude: row.longitude,
      address: row.address || `${row.latitude.toFixed(5)}, ${row.longitude.toFixed(5)}`,
      ward: row.ward || 'Unassigned',
      zone: row.zone || '',
      city: row.city,
      district: row.district,
      state: row.state,
      pincode: row.pincode,
      roadName: row.road_name,
      accuracyMeters: row.accuracy_meters,
      gpsSource: (row.gps_source as GeoLocation['gpsSource']) || 'CITIZEN_MOBILE',
      locationVerificationStatus: (row.location_verification_status as GeoLocation['locationVerificationStatus']) || 'UNVERIFIED_PROVISIONAL',
      timestamp: row.created_at,
    },
    imageUrl: row.image_url || '',
    supportingImages: row.supporting_images || [],
    recordType: (row.record_type as 'PRODUCTION' | 'DEMO' | 'CITIZEN_REPORT' | 'VERIFIED') || 'CITIZEN_REPORT',
    verificationStatus: (row.verification_status as 'VERIFIED' | 'UNVERIFIED_PROVISIONAL' | 'PENDING_INSPECTION') || 'UNVERIFIED_PROVISIONAL',
    authorityId: row.authority_id || 'auth-roads',
    authorityName: row.authority_name || 'NDMC Civil Engineering (Roads & Bridges)',
    departmentName: row.department_name || 'NDMC Infrastructure Division',
    assignedOfficerOrTeam: row.assigned_officer,
    resolutionDeadline: row.resolution_deadline,
    isAnonymous: row.is_anonymous,
    landmarkNotes: row.landmark_notes,
    communityConfirmations: row.community_confirmations_count || 0,
    reportedBy: 'CITIZEN_FEEDBACK',
    detections: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // Computed / enriched fields — populated by engines at read time
    impact: {
      affectedUsersPerDay: row.affected_users_per_day || 0,
      safetyIndexScore: 50,
      economicImpactRating: 'moderate',
      nearbyRisks: [],
      recommendedAction: '',
      slaDeadlineHours: row.sla_deadline_hours || 48,
      trafficImportance: 'moderate',
      sensitiveLocationScore: 50,
    },
    lifecycle: [],
  };
}

/** Map database status string to ResolutionStatus */
function mapDbStatus(s: string): ResolutionStatus {
  const statusMap: Record<string, ResolutionStatus> = {
    DETECTED: 'detected',
    SUBMITTED: 'pending',
    UNDER_VERIFICATION: 'triaged',
    VERIFIED: 'triaged',
    FORWARDED_TO_AUTHORITY: 'dispatched',
    ACKNOWLEDGED: 'assigned',
    ASSIGNED_TO_FIELD_TEAM: 'assigned',
    INSPECTION_IN_PROGRESS: 'in_progress',
    REPAIR_IN_PROGRESS: 'in_progress',
    RESOLVED: 'resolved',
    CLOSED: 'resolved',
    REJECTED: 'dismissed',
    DUPLICATE: 'dismissed',
    REOPENED: 'pending',
  };
  return statusMap[s] || 'pending';
}

/** Map ResolutionStatus back to DB status */
function statusToDb(s: ResolutionStatus): string {
  const map: Record<ResolutionStatus, string> = {
    detected: 'DETECTED',
    pending: 'SUBMITTED',
    triaged: 'UNDER_VERIFICATION',
    dispatched: 'FORWARDED_TO_AUTHORITY',
    assigned: 'ACKNOWLEDGED',
    in_progress: 'REPAIR_IN_PROGRESS',
    resolved: 'RESOLVED',
    dismissed: 'REJECTED',
  };
  return map[s] || 'SUBMITTED';
}

/** Convert Issue object to Supabase insert row */
function issueToInsertRow(issue: CreateIssueInput): Partial<IncidentRow> {
  const issueCode = `INF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  return {
    issue_code: issueCode,
    title: issue.title,
    description: issue.description,
    category: issue.category,
    category_label: issue.categoryLabel,
    detection_type: issue.detectionType,
    severity: issue.severity,
    severity_score: issue.severityScore,
    priority: issue.priority,
    confidence: issue.confidence || 0,
    status: 'SUBMITTED',
    latitude: issue.location.latitude,
    longitude: issue.location.longitude,
    address: issue.location.address,
    ward: issue.location.ward,
    zone: issue.location.zone,
    city: issue.location.city,
    district: issue.location.district,
    state: issue.location.state,
    pincode: issue.location.pincode,
    road_name: issue.location.roadName,
    accuracy_meters: issue.location.accuracyMeters,
    gps_source: issue.location.gpsSource || 'CITIZEN_MOBILE',
    location_verification_status: issue.location.locationVerificationStatus || 'UNVERIFIED_PROVISIONAL',
    image_url: issue.imageUrl,
    supporting_images: issue.supportingImages || [],
    reporter_name: issue.reporterName,
    is_anonymous: issue.isAnonymous || false,
    landmark_notes: issue.landmarkNotes,
    authority_id: issue.authorityId,
    authority_name: issue.authorityName,
    department_name: issue.departmentName,
    record_type: issue.recordType || 'CITIZEN_REPORT',
    verification_status: 'UNVERIFIED_PROVISIONAL',
    hazard_score: issue.severityScore,
    affected_users_per_day: issue.impact?.affectedUsersPerDay || 0,
    sla_deadline_hours: issue.impact?.slaDeadlineHours || 48,
  };
}

/**
 * Supabase-backed Incident Service
 * Falls back to in-memory when Supabase is not configured.
 */
class SupabaseIncidentServiceImpl {
  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => { try { l(); } catch {} });
  }

  async getIssues(): Promise<Issue[]> {
    if (!isSupabaseConfigured || !supabase) {
      return infrastructureService.getIssues();
    }

    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      console.error('[SupabaseIncidentService] getIssues failed:', error.message);
      return infrastructureService.getIssues();
    }

    return (data as IncidentRow[]).map(rowToIssue);
  }

  async getIssueById(id: string): Promise<Issue | null> {
    if (!isSupabaseConfigured || !supabase) {
      return infrastructureService.getIssueById(id);
    }

    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return rowToIssue(data as IncidentRow);
  }

  async createIssue(
    issueData: CreateIssueInput
  ): Promise<Issue> {
    if (!isSupabaseConfigured || !supabase) {
      return infrastructureService.createIssue(issueData);
    }

    const row = issueToInsertRow(issueData);

    const { data, error } = await supabase
      .from('incidents')
      .insert([row])
      .select()
      .single();

    if (error) {
      console.error('[SupabaseIncidentService] createIssue failed:', error.message);
      // Fall back to in-memory
      return infrastructureService.createIssue(issueData);
    }

    // Also insert lifecycle event
    await supabase.from('incident_lifecycle').insert([{
      incident_id: data.id,
      from_status: null,
      to_status: 'SUBMITTED',
      actor_name: issueData.reporterName || 'Citizen Reporter',
      actor_role: 'CITIZEN',
      notes: 'Incident submitted via InfraLens Citizen Portal',
    }]);

    // Audit log
    await supabase.from('audit_log').insert([{
      incident_id: data.id,
      incident_code: data.issue_code,
      action: 'CREATED',
      actor_name: issueData.reporterName || 'Citizen Reporter',
      actor_role: 'CITIZEN',
      details: `New ${issueData.priority} incident submitted: ${issueData.title}`,
      severity: issueData.severity,
    }]);

    this.notify();
    return rowToIssue(data as IncidentRow);
  }

  async updateIssueStatus(
    id: string,
    status: ResolutionStatus,
    notes?: string,
    actor?: string
  ): Promise<Issue> {
    if (!isSupabaseConfigured || !supabase) {
      return infrastructureService.updateIssueStatus(id, status, notes, actor);
    }

    const dbStatus = statusToDb(status);

    // Get current status first
    const { data: current } = await supabase
      .from('incidents')
      .select('status, issue_code, title, severity')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('incidents')
      .update({ status: dbStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[SupabaseIncidentService] updateIssueStatus failed:', error.message);
      return infrastructureService.updateIssueStatus(id, status, notes, actor);
    }

    // Record lifecycle event
    await supabase.from('incident_lifecycle').insert([{
      incident_id: id,
      from_status: current?.status || null,
      to_status: dbStatus,
      actor_name: actor || 'Operations Officer',
      actor_role: 'OFFICIAL',
      notes: notes || `Status updated to ${dbStatus}`,
    }]);

    // Audit
    await supabase.from('audit_log').insert([{
      incident_id: id,
      incident_code: current?.issue_code,
      action: 'STATUS_CHANGED',
      actor_name: actor || 'Operations Officer',
      actor_role: 'OFFICIAL',
      details: `Status changed from ${current?.status} to ${dbStatus}. ${notes || ''}`,
      severity: current?.severity,
    }]);

    this.notify();
    return rowToIssue(data as IncidentRow);
  }

  async assignAuthority(issueId: string, authorityId: string): Promise<Issue> {
    if (!isSupabaseConfigured || !supabase) {
      return infrastructureService.assignAuthority(issueId, authorityId);
    }

    const authority = MOCK_AUTHORITIES.find((a) => a.id === authorityId) || MOCK_AUTHORITIES[0];

    const { data, error } = await supabase
      .from('incidents')
      .update({
        authority_id: authority.id,
        authority_name: authority.name,
        department_name: authority.name,
        status: 'ACKNOWLEDGED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', issueId)
      .select()
      .single();

    if (error) {
      return infrastructureService.assignAuthority(issueId, authorityId);
    }

    await supabase.from('incident_lifecycle').insert([{
      incident_id: issueId,
      to_status: 'ACKNOWLEDGED',
      actor_name: 'Dispatch System',
      actor_role: 'SYSTEM',
      notes: `Routed to ${authority.name}`,
    }]);

    this.notify();
    return rowToIssue(data as IncidentRow);
  }

  async getAuthorities(): Promise<Authority[]> {
    return infrastructureService.getAuthorities();
  }

  async getClusters(): Promise<DBSCANCluster[]> {
    return infrastructureService.getClusters();
  }

  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    if (!isSupabaseConfigured || !supabase) {
      return infrastructureService.getAnalyticsSummary();
    }

    // Compute from real issues
    const issues = await this.getIssues();
    const healthMetrics = CityHealthEngine.calculateCityHealth(issues, MOCK_WARDS);

    const active = issues.filter((i) => i.status !== 'resolved' && i.status !== 'dismissed');
    const resolved = issues.filter((i) => i.status === 'resolved');

    const categoryDist = [
      'road_damage', 'drainage_overflow', 'waste_accumulation',
      'electrical_hazard', 'lighting_failure', 'sidewalk_hazard',
      'bridge_damage', 'building_damage', 'railway_damage', 'public_utility',
    ].map((cat) => ({
      category: cat as InfrastructureCategory,
      label: cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      count: issues.filter((i) => i.category === cat).length,
      percentage: issues.length > 0 ? Math.round(issues.filter((i) => i.category === cat).length / issues.length * 100) : 0,
      color: '#06B6D4',
      healthScore: 78,
    })).filter((d) => d.count > 0);

    const resolvedWithTime = resolved.filter((i) => i.createdAt && i.updatedAt);
    const avgMttr = resolvedWithTime.length > 0
      ? resolvedWithTime.reduce((acc, i) => {
          const diff = (new Date(i.updatedAt).getTime() - new Date(i.createdAt).getTime()) / (1000 * 60 * 60);
          return acc + diff;
        }, 0) / resolvedWithTime.length
      : 0;

    return {
      ...MOCK_ANALYTICS_SUMMARY,
      totalIssues: issues.length,
      activeIssues: active.length,
      resolvedIssues: resolved.length,
      criticalIssues: issues.filter((i) => i.severity === 'critical' && i.status !== 'resolved').length,
      averageMttrHours: Math.round(avgMttr * 10) / 10 || MOCK_ANALYTICS_SUMMARY.averageMttrHours,
      categories: categoryDist,
      systemHealthIndex: healthMetrics.overallScore,
      cityHealthMetrics: healthMetrics,
      trends: MOCK_ANALYTICS_SUMMARY.trends,
      wards: MOCK_ANALYTICS_SUMMARY.wards,
      departmentPerformance: MOCK_ANALYTICS_SUMMARY.departmentPerformance,
    };
  }

  async getCityHealthMetrics(): Promise<CityHealthMetrics> {
    if (!isSupabaseConfigured || !supabase) {
      return infrastructureService.getCityHealthMetrics();
    }
    const issues = await this.getIssues();
    return CityHealthEngine.calculateCityHealth(issues, MOCK_WARDS);
  }

  async getAuditEvents(): Promise<AuditEvent[]> {
    if (!isSupabaseConfigured || !supabase) {
      return infrastructureService.getAuditEvents();
    }

    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !data) return infrastructureService.getAuditEvents();

    return data.map((row) => ({
      id: row.id,
      timestamp: row.created_at,
      issueId: row.incident_id,
      issueCode: row.incident_code,
      action: row.action,
      actorName: row.actor_name || 'System',
      actorRole: row.actor_role || 'System',
      details: row.details || '',
      severity: row.severity || 'moderate',
    }));
  }

  /**
   * Subscribe to real-time incident updates via Supabase Realtime.
   * Falls back to in-memory subscription when Supabase is not configured.
   */
  subscribeToRealtime(onInsert: (issue: Issue) => void, onUpdate: (issue: Issue) => void): (() => void) | null {
    if (!isSupabaseConfigured || !supabase) {
      return null;
    }

    const channel = supabase
      .channel('incidents-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'incidents' }, (payload) => {
        try {
          onInsert(rowToIssue(payload.new as IncidentRow));
        } catch (err) {
          console.error('[Realtime] INSERT error:', err);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'incidents' }, (payload) => {
        try {
          onUpdate(rowToIssue(payload.new as IncidentRow));
        } catch (err) {
          console.error('[Realtime] UPDATE error:', err);
        }
      })
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }

  /**
   * Subscribe to notifications for the current user.
   */
  subscribeToNotifications(userId: string, onNotification: (n: { title: string; message: string; type: string }) => void): (() => void) | null {
    if (!isSupabaseConfigured || !supabase) return null;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        try {
          onNotification({
            title: payload.new.title,
            message: payload.new.message,
            type: payload.new.type,
          });
        } catch {}
      })
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }

  /**
   * Upload an image to Supabase Storage.
   * Falls back to returning the original URL if storage is unavailable.
   */
  async uploadIncidentImage(file: File, incidentCode: string): Promise<string> {
    if (!isSupabaseConfigured || !supabase) {
      // Return a data URL for in-memory mode
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
      });
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `incidents/${incidentCode}/${Date.now()}.${ext}`;

    const { data, error } = await supabase.storage
      .from('incident-images')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('[SupabaseIncidentService] Image upload failed:', error.message);
      // Return data URL as fallback
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
    }

    const { data: urlData } = supabase.storage
      .from('incident-images')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  }

  /**
   * Get incidents within a geographic radius (meters) of a point.
   * Uses PostGIS ST_DWithin when available.
   */
  async getNearbyIncidents(lat: number, lon: number, radiusMeters: number): Promise<Issue[]> {
    if (!isSupabaseConfigured || !supabase) {
      const all = await this.getIssues();
      return all.filter((i) => {
        const dLat = (i.location.latitude - lat) * 111320;
        const dLon = (i.location.longitude - lon) * 111320 * Math.cos(lat * Math.PI / 180);
        return Math.sqrt(dLat * dLat + dLon * dLon) <= radiusMeters;
      });
    }

    const { data, error } = await supabase.rpc('incidents_within_radius', {
      p_lat: lat,
      p_lon: lon,
      p_radius_meters: radiusMeters,
    });

    if (error || !data) {
      // Fall back to client-side filtering
      const all = await this.getIssues();
      return all.filter((i) => {
        const dLat = (i.location.latitude - lat) * 111320;
        const dLon = (i.location.longitude - lon) * 111320 * Math.cos(lat * Math.PI / 180);
        return Math.sqrt(dLat * dLat + dLon * dLon) <= radiusMeters;
      });
    }

    return (data as IncidentRow[]).map(rowToIssue);
  }

  /**
   * Fetch lifecycle events for a specific incident.
   */
  async getIncidentLifecycle(incidentId: string): Promise<{
    id: string;
    toStatus: string;
    actorName: string;
    actorRole: string;
    notes?: string;
    timestamp: string;
    supportingImageUrl?: string;
  }[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    const { data, error } = await supabase
      .from('incident_lifecycle')
      .select('*')
      .eq('incident_id', incidentId)
      .order('created_at', { ascending: true });

    if (error || !data) return [];

    return data.map((row) => ({
      id: row.id,
      toStatus: row.to_status,
      actorName: row.actor_name,
      actorRole: row.actor_role,
      notes: row.notes,
      timestamp: row.created_at,
      supportingImageUrl: row.supporting_image_url,
    }));
  }

  /**
   * Submit a resolution verification with before/after photo.
   */
  async submitResolutionEvidence(
    incidentId: string,
    afterImageUrl: string,
    officerName: string,
    notes?: string
  ): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      await infrastructureService.updateIssueStatus(incidentId, 'resolved', notes, officerName);
      return;
    }

    await supabase.from('incidents').update({
      status: 'RESOLVED',
      updated_at: new Date().toISOString(),
    }).eq('id', incidentId);

    await supabase.from('incident_lifecycle').insert([{
      incident_id: incidentId,
      to_status: 'RESOLVED',
      actor_name: officerName,
      actor_role: 'OFFICIAL',
      notes: notes || 'Resolution verified with photographic evidence.',
      supporting_image_url: afterImageUrl,
    }]);

    this.notify();
  }

  /**
   * Get incidents owned by a specific reporter (citizen tracking).
   */
  async getMyIncidents(reporterId: string): Promise<Issue[]> {
    if (!isSupabaseConfigured || !supabase) {
      return infrastructureService.getIssues();
    }

    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('reporter_id', reporterId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return (data as IncidentRow[]).map(rowToIssue);
  }

  /**
   * Get real-time statistics from the database.
   */
  async getLiveStats(): Promise<{
    activeCount: number;
    p0Emergency: number;
    criticalCount: number;
    resolvedCount: number;
    reportedToday: number;
  }> {
    if (!isSupabaseConfigured || !supabase) {
      const issues = await this.getIssues();
      const active = issues.filter((i) => i.status !== 'resolved' && i.status !== 'dismissed');
      const today = new Date().toDateString();
      return {
        activeCount: active.length,
        p0Emergency: issues.filter((i) => i.priority === 'P0' && i.status !== 'resolved').length,
        criticalCount: issues.filter((i) => i.severity === 'critical' && i.status !== 'resolved').length,
        resolvedCount: issues.filter((i) => i.status === 'resolved').length,
        reportedToday: issues.filter((i) => new Date(i.createdAt).toDateString() === today).length,
      };
    }

    const { data, error } = await supabase.from('incident_stats').select('*').single();

    if (error || !data) {
      const issues = await this.getIssues();
      const active = issues.filter((i) => i.status !== 'resolved' && i.status !== 'dismissed');
      return {
        activeCount: active.length,
        p0Emergency: 0,
        criticalCount: 0,
        resolvedCount: 0,
        reportedToday: 0,
      };
    }

    return {
      activeCount: data.active_count || 0,
      p0Emergency: data.p0_emergency || 0,
      criticalCount: data.critical_count || 0,
      resolvedCount: data.resolved_count || 0,
      reportedToday: data.reported_today || 0,
    };
  }
}

export const supabaseIncidentService = new SupabaseIncidentServiceImpl();

/** Use GisEngine.lookupWard for coordinate → ward resolution */
export { GisEngine };
