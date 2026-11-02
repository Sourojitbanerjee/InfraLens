/**
 * InfraLens Institutional Onboarding & Multi-Tenant Types
 */

export type InstitutionType =
  | 'municipal_corporation' // Large ULB (e.g. BMC, NDMC, GHMC)
  | 'municipality'          // Medium ULB (e.g. Siliguri, Asansol)
  | 'municipal_board'       // Small ULB / Town Council
  | 'gram_panchayat'        // Rural Local Body (Village level)
  | 'panchayat_samiti'      // Rural Local Body (Block level)
  | 'zilla_parishad'        // Rural Local Body (District level)
  | 'state_highway_dept'    // State PWD / Highway Authority
  | 'discom_utility';       // Electricity Distribution Utility

export type InstitutionSize = 'SMALL' | 'MEDIUM' | 'LARGE';

export type VerificationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'DOCUMENT_REVIEW'
  | 'FIELD_VERIFIED'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED';

export interface InstitutionDocument {
  id: string;
  documentType: 'GOVERNMENT_GAZETTE' | 'DISTRICT_COLLECTOR_NOC' | 'AUTHORISATION_LETTER' | 'PAN_GST';
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  rejectionReason?: string;
}

export interface WardOrVillage {
  id: string;
  code: string;
  name: string;
  zone?: string;
  populationEstimate: number;
  areaSqKm: number;
  assignedSupervisorId?: string;
  assignedSupervisorName?: string;
}

export interface DepartmentConfig {
  id: string;
  code: string;
  name: string;
  slaHours: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  isActive: boolean;
  activeWorkOrdersCount?: number;
}

export interface Institution {
  id: string;
  officialCode: string;
  name: string;
  institutionType: InstitutionType;
  sizeTier: InstitutionSize;
  sizeRationale?: string;
  state: string;
  district: string;
  headquartersAddress: string;
  officialEmail: string;
  officialPhone: string;
  nodalOfficer: {
    name: string;
    designation: string;
    phone: string;
    email: string;
  };
  verificationStatus: VerificationStatus;
  verificationNotes?: string;
  documents: InstitutionDocument[];
  wards: WardOrVillage[];
  departments: DepartmentConfig[];
  subscriptionTier: 'STARTER' | 'STANDARD' | 'ENTERPRISE';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InstitutionRegistrationPayload {
  name: string;
  officialCode: string;
  institutionType: InstitutionType;
  state: string;
  district: string;
  headquartersAddress: string;
  officialEmail: string;
  officialPhone: string;
  nodalOfficerName: string;
  nodalOfficerDesignation: string;
  nodalOfficerPhone: string;
  nodalOfficerEmail: string;
  wardCountEstimate: number;
  populationEstimate: number;
  inspectionTeamCountEstimate: number;
  documentGazetteFile?: File | string;
  documentAuthorisationFile?: File | string;
}
