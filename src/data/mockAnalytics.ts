import { 
  AnalyticsSummary, 
  TemporalTrendPoint, 
  CategoryDistribution, 
  WardHealth, 
  DepartmentPerformance 
} from '../types/infrastructure';

export const MOCK_TRENDS: TemporalTrendPoint[] = [
  { date: 'Day -6', detected: 18, resolved: 14, critical: 5, backlog: 42 },
  { date: 'Day -5', detected: 24, resolved: 19, critical: 7, backlog: 47 },
  { date: 'Day -4', detected: 31, resolved: 22, critical: 9, backlog: 56 },
  { date: 'Day -3', detected: 22, resolved: 26, critical: 4, backlog: 52 },
  { date: 'Day -2', detected: 29, resolved: 28, critical: 6, backlog: 53 },
  { date: 'Yesterday', detected: 35, resolved: 31, critical: 8, backlog: 57 },
  { date: 'Today', detected: 19, resolved: 16, critical: 4, backlog: 60 },
];

export const MOCK_CATEGORIES: CategoryDistribution[] = [
  { category: 'road_damage', label: 'Roads & Asphalt', count: 68, percentage: 38.2, healthScore: 68, color: '#EF4444' },
  { category: 'drainage_overflow', label: 'Drainage & Flooding', count: 34, percentage: 19.1, healthScore: 74, color: '#06B6D4' },
  { category: 'lighting_failure', label: 'Street Lighting & Power', count: 28, percentage: 15.7, healthScore: 82, color: '#F59E0B' },
  { category: 'waste_accumulation', label: 'Solid Waste & Sanitation', count: 24, percentage: 13.5, healthScore: 89, color: '#10B981' },
  { category: 'sidewalk_hazard', label: 'Sidewalks & Walkways', count: 18, percentage: 10.1, healthScore: 71, color: '#F97316' },
  { category: 'traffic_signage', label: 'Traffic & Signage', count: 6, percentage: 3.4, healthScore: 92, color: '#A855F7' },
];

export const MOCK_WARDS: WardHealth[] = [
  {
    wardId: 'ward-cp',
    name: 'Ward 1 — Connaught Place & Barakhamba',
    healthScore: 79,
    criticalCount: 5,
    activeIssues: 28,
    population: 88400,
    supervisor: 'Er. Rajesh Bansal (AEE NDMC)',
  },
  {
    wardId: 'ward-chanakya',
    name: 'Ward 2 — Chanakyapuri Diplomatic Enclave',
    healthScore: 92,
    criticalCount: 1,
    activeIssues: 11,
    population: 52100,
    supervisor: 'Er. Sunita Rao (EE NDMC)',
  },
  {
    wardId: 'ward-sarojini',
    name: 'Ward 3 — Sarojini Nagar & Safdarjung',
    healthScore: 64,
    criticalCount: 12,
    activeIssues: 46,
    population: 76500,
    supervisor: 'Er. Praveen Saxena (AE Roads)',
  },
  {
    wardId: 'ward-gole',
    name: 'Ward 4 — Gole Market & Mandir Marg',
    healthScore: 74,
    criticalCount: 4,
    activeIssues: 22,
    population: 64200,
    supervisor: 'Er. Devendra Singh (NDMC Civil)',
  },
  {
    wardId: 'ward-sansad',
    name: 'Ward 5 — Parliament & Sansad Marg',
    healthScore: 88,
    criticalCount: 2,
    activeIssues: 14,
    population: 49800,
    supervisor: 'Er. Arvind Mehta (Chief Inspector)',
  },
  {
    wardId: 'ward-indiagate',
    name: 'Ward 6 — India Gate & Tilak Marg Corridor',
    healthScore: 85,
    criticalCount: 3,
    activeIssues: 18,
    population: 59100,
    supervisor: 'Er. Vikram Rawat (Senior AE)',
  },
];

export const MOCK_DEPARTMENTS: DepartmentPerformance[] = [
  {
    departmentId: 'auth-roads',
    name: 'NDMC Civil Roads & Infrastructure',
    resolvedCount: 312,
    avgTimeHours: 24.4,
    slaMetPercentage: 93.8,
  },
  {
    departmentId: 'auth-drainage',
    name: 'DJB & NDMC Public Health Drainage',
    resolvedCount: 184,
    avgTimeHours: 14.2,
    slaMetPercentage: 94.5,
  },
  {
    departmentId: 'auth-lighting',
    name: 'NDMC Electricity & Street Lighting',
    resolvedCount: 142,
    avgTimeHours: 18.0,
    slaMetPercentage: 91.2,
  },
  {
    departmentId: 'auth-waste',
    name: 'NDMC Clean City & Solid Waste',
    resolvedCount: 420,
    avgTimeHours: 8.5,
    slaMetPercentage: 97.1,
  },
  {
    departmentId: 'auth-sidewalk',
    name: 'NDMC Pedestrian Walkways & Horticulture',
    resolvedCount: 98,
    avgTimeHours: 32.0,
    slaMetPercentage: 88.6,
  },
];

export const MOCK_ANALYTICS_SUMMARY: AnalyticsSummary = {
  totalIssues: 178,
  activeIssues: 92,
  criticalIssues: 19,
  activeClusters: 14,
  resolvedIssues: 86,
  systemHealthIndex: 78.4,
  averageMttrHours: 22.8,
  cityPopulationProtected: 390100,
  trends: MOCK_TRENDS,
  categories: MOCK_CATEGORIES,
  wards: MOCK_WARDS,
  departmentPerformance: MOCK_DEPARTMENTS,
  cityHealthMetrics: {
    overallScore: 78.4,
    categoryScores: {
      roads: 68,
      drainage: 74,
      lighting: 82,
      sidewalks: 71,
      waste: 89,
      signage: 92,
    },
    trend: 'improving',
    worstPerformingWard: {
      id: 'ward-sarojini',
      name: 'Ward 3 — Sarojini Nagar & Safdarjung',
      score: 64,
    },
    mostImprovedWard: {
      id: 'ward-cp',
      name: 'Ward 1 — Connaught Place & Barakhamba',
      score: 79,
      improvement: 4.8,
    },
  },
};
