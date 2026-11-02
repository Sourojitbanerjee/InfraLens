/**
 * InfraLens Citizen Complaint & Reporting Types
 */

import { InfrastructureCategory, Severity, DetectionClass, BoundingBox } from './infrastructure';

export type CitizenReportStatus =
  | 'SUBMITTED'
  | 'AI_ANALYZED'
  | 'JURISDICTION_ASSIGNED'
  | 'COMMUNITY_VERIFIED'
  | 'WORK_ORDER_CREATED'
  | 'REPAIR_IN_PROGRESS'
  | 'RESOLVED'
  | 'REJECTED_INVALID'
  | 'DUPLICATE_MERGED';

export interface CitizenLocation {
  latitude: number;
  longitude: number;
  address: string;
  pincode: string;
  wardOrVillage?: string;
  district?: string;
  state?: string;
  accuracyMeters?: number;
}

export interface CitizenReport {
  id: string;
  trackingCode: string; // e.g. 'INF-2026-000142'
  reporterId?: string;
  reporterName?: string;
  isAnonymous: boolean;
  category: InfrastructureCategory;
  categoryLabel: string;
  detectionType?: DetectionClass;
  title: string;
  description: string;
  landmarkNotes?: string;
  location: CitizenLocation;
  imageUrl: string;
  detections: BoundingBox[];
  severity: Severity;
  severityScore: number; // 0 - 100
  hazardScore: number;   // 0 - 100
  status: CitizenReportStatus;
  communityConfirmationsCount: number;
  hasUserConfirmed?: boolean;
  isDuplicate: boolean;
  masterReportId?: string;
  clusterId?: string;
  assignedInstitutionId?: string;
  assignedInstitutionName?: string;
  assignedDepartmentName?: string;
  workOrderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CitizenProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  state: string;
  district: string;
  cityOrVillage: string;
  locality: string;
  pincode: string;
  preferredPrivacyRadiusMeters: number; // 500, 1000, 3000, 5000, 10000
  reputationScore: number;
  totalReportsSubmitted: number;
  totalResolvedCount: number;
}

export interface CommunityConfirmation {
  reportId: string;
  userId: string;
  confirmationType: 'STILL_PRESENT' | 'ALSO_AFFECTED' | 'REPAIRED';
  timestamp: string;
  comment?: string;
}
