export type Severity = 'healthy' | 'moderate' | 'high' | 'critical';

export type Priority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';

export type ResolutionStatus = 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'detected' | 'triaged' | 'dispatched' | 'dismissed';

export type DetectionClass =
  | 'pothole'
  | 'damaged_road'
  | 'garbage_accumulation'
  | 'overflowing_drain'
  | 'broken_streetlight'
  | 'exposed_electrical_wire'
  | 'damaged_sidewalk'
  | 'missing_road_sign';

export type InfrastructureCategory = 
  | 'road_damage' 
  | 'drainage_overflow' 
  | 'lighting_failure' 
  | 'waste_accumulation' 
  | 'sidewalk_hazard'
  | 'traffic_signage'
  | 'electrical_hazard';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  address: string;
  ward: string;
  zone: string;
  timestamp?: string;
  accuracyMeters?: number;
}

export interface DetectionMetadata {
  damageExtentMm?: number;
  roadCoveragePct: number;
  depthEstimateMm?: number;
  hazardMultiplier?: number;
  surfaceType?: 'asphalt' | 'concrete' | 'paver' | 'gravel';
  notes?: string;
}

export interface BoundingBox {
  id: string;
  x: number;      // percentage [0, 100]
  y: number;      // percentage [0, 100]
  width: number;  // percentage [0, 100]
  height: number; // percentage [0, 100]
  label: string;
  category: InfrastructureCategory;
  confidence: number; // percentage [0, 100]
  severity: Severity;
  metadata?: DetectionMetadata;
}

export interface Detection {
  id: string;
  type: DetectionClass;
  typeLabel: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  severity: Severity;
  severityScore: number;
  metadata: DetectionMetadata;
}

export interface NearbyRiskFactor {
  name: string;
  type: 'school' | 'hospital' | 'transit' | 'market' | 'residential' | 'elderly_center' | 'arterial_road';
  distanceMeters: number;
}

export interface POI {
  id: string;
  name: string;
  type: 'school' | 'hospital' | 'transit' | 'market' | 'residential' | 'elderly_center' | 'arterial_road';
  latitude: number;
  longitude: number;
  trafficLoad: 'critical' | 'high' | 'moderate' | 'low';
}

export interface ImpactAssessment {
  affectedUsersPerDay: number;
  safetyIndexScore: number; // 0 - 100
  economicImpactRating: 'low' | 'moderate' | 'severe';
  nearbyRisks: NearbyRiskFactor[];
  recommendedAction: string;
  slaDeadlineHours: number;
  trafficImportance: 'critical' | 'high' | 'moderate' | 'low';
  sensitiveLocationScore: number; // 0 - 100
}

export interface PriorityExplainability {
  score: number; // 0 - 100
  priority: Priority;
  priorityLabel: string;
  reasons: string[];
  factorScores: {
    severityScore: number;           // 30%
    complaintDensityScore: number;   // 20%
    populationImpactScore: number;   // 15%
    trafficImportanceScore: number;  // 15%
    sensitiveLocationScore: number;  // 10%
    timeUnresolvedScore: number;     // 10%
  };
}

export interface LifecycleEntry {
  status: ResolutionStatus;
  timestamp: string;
  actor: string;
  role: string;
  notes?: string;
  durationHoursSinceReported?: number;
}

export interface DBSCANCluster {
  clusterId: string;
  name: string;
  issueType: InfrastructureCategory | string;
  reportCount: number;
  radiusMeters: number;
  center: {
    latitude: number;
    longitude: number;
  };
  severityScore: number;
  dominantSeverity: Severity;
  status: ResolutionStatus;
  issueIds: string[];
}

export interface Authority {
  id: string;
  name: string;
  shortCode: string;
  category: InfrastructureCategory;
  headOfDepartment: string;
  phone: string;
  email: string;
  activeWorkOrders: number;
  averageResolutionHours: number;
  fieldCrewsDeployed: number;
  totalFleetUnits: number;
  slaComplianceRate: number; // percentage
}

export interface Issue {
  id: string;
  issueCode: string; // e.g. INF-2026-891
  title: string;
  category: InfrastructureCategory;
  categoryLabel: string;
  detectionType?: DetectionClass;
  severity: Severity;
  severityScore: number; // 0 - 100
  priority: Priority;
  confidence: number; // 0 - 100
  location: GeoLocation;
  imageUrl: string;
  status: ResolutionStatus;
  clusterId?: string;
  clusterRadiusMeters?: number;
  clusterCount?: number;
  authorityId: string;
  authorityName: string;
  departmentName?: string;
  impact: ImpactAssessment;
  priorityExplainability?: PriorityExplainability;
  lifecycle: LifecycleEntry[];
  detections: BoundingBox[];
  createdAt: string;
  updatedAt: string;
  reportedBy: 'AI_SURVEILLANCE' | 'MUNICIPAL_PATROL' | 'CITIZEN_FEEDBACK' | 'UAV_SCAN';
  notes?: string;
  resolutionComparison?: ResolutionComparison;
}

export interface ResolutionComparison {
  beforeSeverityScore: number;
  afterSeverityScore: number;
  beforeSeverity: Severity;
  afterSeverity: Severity;
  resolutionTimeDays: number;
  commutersProtected: number;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  repairedByDepartment: string;
  notes: string;
}

export interface RoadSegment {
  id: string;
  name: string;
  wardId: string;
  category: string;
  health: 'healthy' | 'moderate' | 'high-risk' | 'critical';
  healthScore: number; // 0 - 100
  dailyTraffic: number;
  activeDefects: number;
  coordinates: [number, number][]; // [lat, lon]
}

export interface WardHealth {
  wardId: string;
  name: string;
  healthScore: number; // 0 - 100 (100 is pristine)
  criticalCount: number;
  activeIssues: number;
  population: number;
  supervisor: string;
  deltaPercentage?: number;
}

export interface CityHealthMetrics {
  overallScore: number;
  categoryScores: {
    roads: number;
    drainage: number;
    waste: number;
    lighting: number;
    sidewalks: number;
    signage: number;
  };
  trend: 'improving' | 'declining' | 'stable';
  worstPerformingWard: {
    id: string;
    name: string;
    score: number;
  };
  mostImprovedWard: {
    id: string;
    name: string;
    score: number;
    improvement: number;
  };
}

export interface CategoryDistribution {
  category: InfrastructureCategory;
  label: string;
  count: number;
  percentage: number;
  healthScore: number;
  color: string;
}

export interface TemporalTrendPoint {
  date: string;
  detected: number;
  resolved: number;
  critical: number;
  backlog: number;
}

export interface DepartmentPerformance {
  departmentId: string;
  name: string;
  resolvedCount: number;
  avgTimeHours: number;
  slaMetPercentage: number;
}

export interface AnalyticsSummary {
  totalIssues: number;
  activeIssues: number;
  criticalIssues: number;
  activeClusters: number;
  resolvedIssues: number;
  systemHealthIndex: number;
  averageMttrHours: number;
  cityPopulationProtected: number;
  trends: TemporalTrendPoint[];
  categories: CategoryDistribution[];
  wards: WardHealth[];
  departmentPerformance: DepartmentPerformance[];
  cityHealthMetrics: CityHealthMetrics;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  issueId: string;
  issueCode: string;
  action: 'DETECTED' | 'ASSIGNED' | 'STATUS_CHANGED' | 'RESOLVED' | 'ESCALATED' | 'DISMISSED';
  actorName: string;
  actorRole: string;
  details: string;
  severity: Severity;
}
