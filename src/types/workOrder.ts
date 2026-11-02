/**
 * InfraLens Institutional Work Order & Field Operations Types
 */

import { Severity, Priority } from './infrastructure';

export type WorkOrderStatus =
  | 'CREATED'
  | 'INSPECTION_SCHEDULED'
  | 'FIELD_VERIFIED'
  | 'REPAIR_DISPATCHED'
  | 'CREW_ON_SITE'
  | 'REPAIR_COMPLETED'
  | 'EVIDENCE_SUBMITTED'
  | 'INSPECTION_APPROVED'
  | 'CLOSED_RESOLVED'
  | 'REJECTED_REOPENED';

export interface InspectionTeamMember {
  userId: string;
  fullName: string;
  role: 'LEAD' | 'INSPECTOR' | 'DRIVER' | 'SPECIALIST';
  phone: string;
}

export interface InspectionTeam {
  id: string;
  name: string;
  chiefInspectorId: string;
  chiefInspectorName: string;
  members: InspectionTeamMember[];
  vehicleRegistration?: string;
  isActive: boolean;
  activeAssignmentsCount: number;
}

export interface FieldVerificationReport {
  id: string;
  workOrderId: string;
  inspectorId: string;
  inspectorName: string;
  checkInCoordinates: {
    latitude: number;
    longitude: number;
  };
  gpsAccuracyMeters: number;
  isDefectConfirmed: boolean;
  measuredDimensions?: {
    lengthMeters: number;
    widthMeters: number;
    depthCm?: number;
  };
  fieldNotes: string;
  verifiedAt: string;
}

export interface BeforeAfterEvidenceRecord {
  id: string;
  workOrderId: string;
  beforeImageUrl: string;
  afterImageUrl: string;
  resolutionSummary: string;
  materialsUsed?: string;
  submittedByCrewLeader: string;
  submittedAt: string;
  signedOffByChiefInspectorId?: string;
  signedOffByChiefInspectorName?: string;
  signedOffAt?: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
}

export interface WorkOrder {
  id: string;
  workOrderCode: string; // e.g. 'WO-2026-00089'
  institutionId: string;
  institutionName: string;
  departmentId: string;
  departmentName: string;
  wardId?: string;
  wardName?: string;
  primaryReportId?: string;
  trackingCode?: string;
  clusterId?: string;
  title: string;
  description: string;
  category: string;
  severity: Severity;
  priority: Priority;
  priorityScore: number; // 0 - 100
  status: WorkOrderStatus;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    ward?: string;
  };
  assignedSupervisorId?: string;
  assignedSupervisorName?: string;
  assignedTeamId?: string;
  assignedTeamName?: string;
  assignedContractor?: string;
  estimatedCostInr?: number;
  actualCostInr?: number;
  slaDeadline: string;
  slaRemainingHours?: number;
  isSlaViolated?: boolean;
  fieldVerification?: FieldVerificationReport;
  beforeAfterEvidence?: BeforeAfterEvidenceRecord;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}
