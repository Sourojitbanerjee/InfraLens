import { AnalyticsSummary, CategoryDistribution, DepartmentPerformance, TemporalTrendPoint, WardHealth } from '../types/infrastructure';

export const MOCK_TRENDS: TemporalTrendPoint[] = [
  { date: 'Oct 01', detected: 42, resolved: 38, critical: 12, backlog: 140 },
  { date: 'Oct 02', detected: 56, resolved: 49, critical: 16, backlog: 147 },
  { date: 'Oct 03', detected: 61, resolved: 58, critical: 18, backlog: 150 },
  { date: 'Oct 04', detected: 48, resolved: 52, critical: 14, backlog: 146 },
  { date: 'Oct 05', detected: 73, resolved: 65, critical: 22, backlog: 154 },
  { date: 'Oct 06', detected: 68, resolved: 71, critical: 17, backlog: 151 },
  { date: 'Oct 07', detected: 82, resolved: 74, critical: 26, backlog: 159 },
  { date: 'Oct 08', detected: 54, resolved: 48, critical: 19, backlog: 165 },
];

export const MOCK_CATEGORIES: CategoryDistribution[] = [
  { category: 'road_damage', label: 'Roads & Asphalt', count: 68, percentage: 38.2, healthScore: 68, color: '#EF4444' },
  { category: 'drainage_overflow', label: 'Storm Drainage', count: 34, percentage: 19.1, healthScore: 74, color: '#38BDF8' },
  { category: 'lighting_failure', label: 'Grid & Lighting', count: 29, percentage: 16.3, healthScore: 82, color: '#F59E0B' },
  { category: 'sidewalk_hazard', label: 'Sidewalks & Walkways', count: 26, percentage: 14.6, healthScore: 71, color: '#F97316' },
  { category: 'waste_accumulation', label: 'Solid Waste Debris', count: 15, percentage: 8.4, healthScore: 89, color: '#10B981' },
  { category: 'traffic_signage', label: 'Traffic & Signage', count: 6, percentage: 3.4, healthScore: 92, color: '#A855F7' },
];

export const MOCK_WARDS: WardHealth[] = [
  {
    wardId: 'ward-6',
    name: 'Ward 6 — Mission & SOMA',
    healthScore: 64,
    criticalCount: 14,
    activeIssues: 58,
    population: 82400,
    supervisor: 'Comm. Michael Chang',
  },
  {
    wardId: 'ward-3',
    name: 'Ward 3 — Financial & Waterfront',
    healthScore: 79,
    criticalCount: 6,
    activeIssues: 32,
    population: 64200,
    supervisor: 'Comm. Sarah Jenkins',
  },
  {
    wardId: 'ward-9',
    name: 'Ward 9 — Mission & Bernal Heights',
    healthScore: 69,
    criticalCount: 9,
    activeIssues: 41,
    population: 71500,
    supervisor: 'Comm. Javier Mendez',
  },
  {
    wardId: 'ward-5',
    name: 'Ward 5 — Western Addition & Panhandle',
    healthScore: 83,
    criticalCount: 4,
    activeIssues: 24,
    population: 58900,
    supervisor: 'Comm. Rachel Green',
  },
  {
    wardId: 'ward-1',
    name: 'Ward 1 — Richmond & Presidio',
    healthScore: 91,
    criticalCount: 2,
    activeIssues: 13,
    population: 53100,
    supervisor: 'Comm. David Walsh',
  },
];

export const MOCK_DEPARTMENTS: DepartmentPerformance[] = [
  {
    departmentId: 'auth-roads',
    name: 'Municipal Roads Dept',
    resolvedCount: 312,
    avgTimeHours: 28.4,
    slaMetPercentage: 91.8,
  },
  {
    departmentId: 'auth-drainage',
    name: 'Water & Drainage Board',
    resolvedCount: 184,
    avgTimeHours: 14.2,
    slaMetPercentage: 94.5,
  },
  {
    departmentId: 'auth-lighting',
    name: 'Public Street Lighting',
    resolvedCount: 142,
    avgTimeHours: 36.0,
    slaMetPercentage: 88.2,
  },
  {
    departmentId: 'auth-waste',
    name: 'Clean Env & Solid Waste',
    resolvedCount: 420,
    avgTimeHours: 8.5,
    slaMetPercentage: 97.1,
  },
  {
    departmentId: 'auth-sidewalk',
    name: 'Pedestrian Walkways',
    resolvedCount: 98,
    avgTimeHours: 42.0,
    slaMetPercentage: 84.6,
  },
];

export const MOCK_ANALYTICS_SUMMARY: AnalyticsSummary = {
  totalIssues: 178,
  activeIssues: 92,
  criticalIssues: 19,
  activeClusters: 14,
  resolvedIssues: 86,
  systemHealthIndex: 76.4,
  averageMttrHours: 24.8,
  cityPopulationProtected: 330100,
  trends: MOCK_TRENDS,
  categories: MOCK_CATEGORIES,
  wards: MOCK_WARDS,
  departmentPerformance: MOCK_DEPARTMENTS,
  cityHealthMetrics: {
    overallScore: 76.4,
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
      id: 'ward-6',
      name: 'Ward 6 — Mission & SOMA',
      score: 64,
    },
    mostImprovedWard: {
      id: 'ward-3',
      name: 'Ward 3 — Civic & Financial',
      score: 79,
      improvement: 4.8,
    },
  },
};
