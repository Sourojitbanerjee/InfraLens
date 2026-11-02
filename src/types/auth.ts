/**
 * InfraLens Authentication & Role-Based Access Control (RBAC) Types
 */

export type UserRole =
  | 'CITIZEN'
  | 'INFRALENS_SUPER_ADMIN'
  | 'MUNICIPAL_ADMIN'
  | 'PANCHAYAT_ADMIN'
  | 'DIRECTOR_OF_OPERATIONS'
  | 'CHIEF_FIELD_INSPECTOR'
  | 'DEPARTMENT_SUPERVISOR'
  | 'FIELD_INSPECTOR';

export type PortalType = 'PUBLIC_CITIZEN' | 'GOVERNMENT_OPERATIONS' | 'SUPER_ADMIN';

export interface UserSession {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  portal: PortalType;
  officialTitle?: string;
  departmentId?: string;
  departmentName?: string;
  institutionId?: string;
  institutionName?: string;
  institutionType?: string;
  jurisdictionCode?: string;
  assignedWard?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  preferredLanguage: string; // 'en' | 'hi' | 'bn' | 'ta' | 'te' | 'mr' | 'gu' | 'kn' | 'ml'
  avatarUrl?: string;
  permissions: PermissionKey[];
}

export type PermissionKey =
  | 'report:create'
  | 'report:read_public'
  | 'report:upvote_nearby'
  | 'report:track_own'
  | 'inspection:schedule'
  | 'inspection:assign_team'
  | 'inspection:verify_field'
  | 'workorder:create'
  | 'workorder:assign_crew'
  | 'workorder:update_progress'
  | 'workorder:upload_after_evidence'
  | 'workorder:approve_closure'
  | 'institution:manage_settings'
  | 'institution:configure_wards'
  | 'institution:verify_onboarding'
  | 'superadmin:manage_tenants'
  | 'superadmin:view_all_telemetry';

export interface CitizenRegistrationPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  state: string;
  district: string;
  cityOrVillage: string;
  locality: string;
  pincode: string;
  preferredLanguage: string;
  homeCoordinates?: {
    latitude: number;
    longitude: number;
  };
  preferredPrivacyRadiusMeters: number; // 500, 1000, 3000, 5000, 10000
}

export interface OfficialLoginCredentials {
  email: string;
  password: string;
  institutionCode?: string;
  role?: UserRole;
}
