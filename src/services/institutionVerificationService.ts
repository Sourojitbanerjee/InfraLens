/**
 * InfraLens Institutional Verification & Onboarding Service
 */

import {
  Institution,
  InstitutionDocument,
  InstitutionRegistrationPayload,
  VerificationStatus,
} from '../types/institution';
import { InstitutionClassificationEngine } from './institutionClassificationEngine';

export class InstitutionVerificationService {
  private static institutions: Institution[] = [
    {
      id: 'inst-ndmc-001',
      officialCode: 'ULB-DEL-NDMC',
      name: 'New Delhi Municipal Council',
      institutionType: 'municipal_corporation',
      sizeTier: 'LARGE',
      sizeRationale: 'High-density capital metropolitan zone with 14 administrative circles and 24 field teams.',
      state: 'Delhi',
      district: 'New Delhi',
      headquartersAddress: 'Palika Kendra, Sansad Marg, New Delhi 110001',
      officialEmail: 'operations@ndmc.gov.in',
      officialPhone: '+91 11 2336 0001',
      nodalOfficer: {
        name: 'Dr. Rameshwar Sharma, IAS',
        designation: 'Director of Municipal Operations',
        phone: '+91 98110 12345',
        email: 'rameshwar.sharma@ndmc.gov.in',
      },
      verificationStatus: 'APPROVED',
      verificationNotes: 'Gazette notification ND-2018-912 verified with Ministry of Home Affairs.',
      documents: [
        {
          id: 'doc-ndmc-01',
          documentType: 'GOVERNMENT_GAZETTE',
          fileName: 'Gazette_Notification_NDMC_Act.pdf',
          fileSize: 4200000,
          uploadedAt: '2026-01-15T10:00:00Z',
          status: 'ACCEPTED',
        },
        {
          id: 'doc-ndmc-02',
          documentType: 'AUTHORISATION_LETTER',
          fileName: 'Nodal_Officer_MHA_Appointment.pdf',
          fileSize: 1850000,
          uploadedAt: '2026-01-15T10:05:00Z',
          status: 'ACCEPTED',
        },
      ],
      wards: [
        { id: 'ward-01', code: 'W-01', name: 'Connaught Place & Barakhamba', populationEstimate: 85000, areaSqKm: 4.2 },
        { id: 'ward-02', code: 'W-02', name: 'Chanakyapuri Diplomatic Enclave', populationEstimate: 62000, areaSqKm: 6.8 },
        { id: 'ward-03', code: 'W-03', name: 'Sarojini Nagar & Safdarjung', populationEstimate: 110000, areaSqKm: 5.1 },
        { id: 'ward-04', code: 'W-04', name: 'Gole Market & Mandir Marg', populationEstimate: 74000, areaSqKm: 3.5 },
      ],
      departments: [
        { id: 'dept-roads', code: 'ROADS', name: 'Civil Engineering (Roads & Bridges)', slaHours: { critical: 12, high: 24, medium: 72, low: 168 }, isActive: true, activeWorkOrdersCount: 18 },
        { id: 'dept-water', code: 'WATER', name: 'Public Health Engineering (Water & Sewerage)', slaHours: { critical: 8, high: 18, medium: 48, low: 120 }, isActive: true, activeWorkOrdersCount: 9 },
        { id: 'dept-electric', code: 'ELECTRICAL', name: 'Electricity Distribution & Street Lighting', slaHours: { critical: 6, high: 12, medium: 36, low: 96 }, isActive: true, activeWorkOrdersCount: 14 },
        { id: 'dept-sanitation', code: 'SANITATION', name: 'Solid Waste & Vector Control', slaHours: { critical: 12, high: 24, medium: 48, low: 72 }, isActive: true, activeWorkOrdersCount: 22 },
      ],
      subscriptionTier: 'ENTERPRISE',
      isActive: true,
      createdAt: '2026-01-15T09:30:00Z',
      updatedAt: '2026-02-01T14:20:00Z',
    },
    {
      id: 'inst-bmc-002',
      officialCode: 'ULB-MH-BMC',
      name: 'Brihanmumbai Municipal Corporation',
      institutionType: 'municipal_corporation',
      sizeTier: 'LARGE',
      sizeRationale: 'Mega-city corporation overseeing 24 administrative wards and over 12 million residents.',
      state: 'Maharashtra',
      district: 'Mumbai Suburban',
      headquartersAddress: 'Mahapalika Marg, Fort, Mumbai 400001',
      officialEmail: 'commissioner@mcgm.gov.in',
      officialPhone: '+91 22 2262 0251',
      nodalOfficer: {
        name: 'Sunil Patil, IAS',
        designation: 'Additional Municipal Commissioner (Projects)',
        phone: '+91 98200 54321',
        email: 'sunil.patil@mcgm.gov.in',
      },
      verificationStatus: 'APPROVED',
      verificationNotes: 'Standard verified state municipal corporation.',
      documents: [
        {
          id: 'doc-bmc-01',
          documentType: 'GOVERNMENT_GAZETTE',
          fileName: 'BMC_Gazette_Verification.pdf',
          fileSize: 3100000,
          uploadedAt: '2026-02-10T11:00:00Z',
          status: 'ACCEPTED',
        },
      ],
      wards: [
        { id: 'ward-a', code: 'WARD-A', name: 'Colaba, Fort & Churchgate', populationEstimate: 210000, areaSqKm: 12.5 },
        { id: 'ward-k-west', code: 'WARD-KW', name: 'Andheri West & Juhu', populationEstimate: 740000, areaSqKm: 23.4 },
      ],
      departments: [
        { id: 'dept-roads-bmc', code: 'ROADS', name: 'Roads & Traffic Department', slaHours: { critical: 12, high: 24, medium: 72, low: 168 }, isActive: true, activeWorkOrdersCount: 31 },
        { id: 'dept-storm-bmc', code: 'STORM_DRAIN', name: 'Storm Water Drainage (SWD)', slaHours: { critical: 6, high: 16, medium: 48, low: 96 }, isActive: true, activeWorkOrdersCount: 15 },
      ],
      subscriptionTier: 'ENTERPRISE',
      isActive: true,
      createdAt: '2026-02-10T10:00:00Z',
      updatedAt: '2026-02-15T11:30:00Z',
    },
    {
      id: 'inst-gp-chandi-003',
      officialCode: 'GP-WB-NAD-04',
      name: 'Chandirampur Gram Panchayat',
      institutionType: 'gram_panchayat',
      sizeTier: 'SMALL',
      sizeRationale: 'Rural panchayat with 12 Gram Sansads and 2 mobile rural inspection units.',
      state: 'West Bengal',
      district: 'Nadia',
      headquartersAddress: 'Panchayat Bhavan, Chandirampur, Nadia 741249',
      officialEmail: 'pradhan.chandirampur@wbpanchayat.gov.in',
      officialPhone: '+91 3473 252100',
      nodalOfficer: {
        name: 'Debabrata Mondal',
        designation: 'Panchayat Secretary (Nirman Sahayak)',
        phone: '+91 94340 76543',
        email: 'debabrata.mondal@wbpanchayat.gov.in',
      },
      verificationStatus: 'APPROVED',
      verificationNotes: 'Verified via Nadia Zilla Parishad District Collectorate NOC.',
      documents: [
        {
          id: 'doc-gp-01',
          documentType: 'DISTRICT_COLLECTOR_NOC',
          fileName: 'DM_NOC_Panchayat_Authorization.pdf',
          fileSize: 1200000,
          uploadedAt: '2026-03-01T08:00:00Z',
          status: 'ACCEPTED',
        },
      ],
      wards: [
        { id: 'sansad-01', code: 'SANSAD-01', name: 'Chandirampur Paschim Para', populationEstimate: 2400, areaSqKm: 1.8 },
        { id: 'sansad-02', code: 'SANSAD-02', name: 'Mondal Para & Station Road', populationEstimate: 3100, areaSqKm: 2.1 },
        { id: 'sansad-03', code: 'SANSAD-03', name: 'Kharjumla Krishak Samiti', populationEstimate: 1950, areaSqKm: 3.4 },
      ],
      departments: [
        { id: 'dept-rural-works', code: 'RURAL_WORKS', name: 'Gram Sadak & Drainage Maintenance', slaHours: { critical: 24, high: 48, medium: 120, low: 240 }, isActive: true, activeWorkOrdersCount: 4 },
        { id: 'dept-tube-well', code: 'TUBE_WELLS', name: 'Rural Drinking Water & Tube Wells', slaHours: { critical: 12, high: 24, medium: 72, low: 120 }, isActive: true, activeWorkOrdersCount: 2 },
      ],
      subscriptionTier: 'STARTER',
      isActive: true,
      createdAt: '2026-03-01T08:00:00Z',
      updatedAt: '2026-03-05T09:15:00Z',
    },
    {
      id: 'inst-siliguri-004',
      officialCode: 'ULB-WB-SMC',
      name: 'Siliguri Municipal Corporation',
      institutionType: 'municipality',
      sizeTier: 'MEDIUM',
      sizeRationale: 'Medium regional commercial hub with 47 wards and 11 zonal maintenance units.',
      state: 'West Bengal',
      district: 'Darjeeling',
      headquartersAddress: 'Baghajatin Park Road, Siliguri 734001',
      officialEmail: 'commissioner@siligurismc.in',
      officialPhone: '+91 353 243 2888',
      nodalOfficer: {
        name: 'Sourav Roy',
        designation: 'Executive Engineer (Civil)',
        phone: '+91 94340 11223',
        email: 'sourav.roy@siligurismc.in',
      },
      verificationStatus: 'DOCUMENT_REVIEW',
      verificationNotes: 'Authorisation documents under Super Admin review.',
      documents: [
        {
          id: 'doc-smc-01',
          documentType: 'AUTHORISATION_LETTER',
          fileName: 'SMC_Nodal_Appointment_Gazette.pdf',
          fileSize: 2150000,
          uploadedAt: '2026-03-10T14:00:00Z',
          status: 'PENDING',
        },
      ],
      wards: [
        { id: 'smc-ward-01', code: 'WARD-01', name: 'Pradhan Nagar', populationEstimate: 18500, areaSqKm: 2.1 },
        { id: 'smc-ward-10', code: 'WARD-10', name: 'Sevoke Road Commercial Belt', populationEstimate: 24000, areaSqKm: 3.4 },
      ],
      departments: [
        { id: 'dept-civil-smc', code: 'CIVIL_WORKS', name: 'Civil Infrastructure Division', slaHours: { critical: 18, high: 36, medium: 96, low: 192 }, isActive: true, activeWorkOrdersCount: 11 },
      ],
      subscriptionTier: 'STANDARD',
      isActive: true,
      createdAt: '2026-03-10T13:45:00Z',
      updatedAt: '2026-03-10T14:15:00Z',
    },
  ];

  static getAllInstitutions(): Institution[] {
    return [...this.institutions];
  }

  static getInstitutionById(id: string): Institution | undefined {
    return this.institutions.find((i) => i.id === id);
  }

  static getInstitutionByCode(code: string): Institution | undefined {
    return this.institutions.find((i) => i.officialCode.toLowerCase() === code.toLowerCase());
  }

  /**
   * Register a new ULB or Panchayat
   */
  static registerInstitution(payload: InstitutionRegistrationPayload): {
    institution: Institution;
    message: string;
  } {
    // Algorithmic size tiering
    const classification = InstitutionClassificationEngine.classify({
      institutionType: payload.institutionType,
      wardCount: payload.wardCountEstimate || 15,
      populationEstimate: payload.populationEstimate || 50000,
      inspectionTeamCount: payload.inspectionTeamCountEstimate || 4,
    });

    const newInst: Institution = {
      id: `inst-${Date.now()}`,
      officialCode: payload.officialCode.toUpperCase(),
      name: payload.name,
      institutionType: payload.institutionType,
      sizeTier: classification.effectiveTier,
      sizeRationale: classification.rationale,
      state: payload.state,
      district: payload.district,
      headquartersAddress: payload.headquartersAddress,
      officialEmail: payload.officialEmail,
      officialPhone: payload.officialPhone,
      nodalOfficer: {
        name: payload.nodalOfficerName,
        designation: payload.nodalOfficerDesignation,
        phone: payload.nodalOfficerPhone,
        email: payload.nodalOfficerEmail,
      },
      verificationStatus: 'DOCUMENT_REVIEW',
      verificationNotes: 'Submitted for verification by platform administrator.',
      documents: [
        {
          id: `doc-${Date.now()}-1`,
          documentType: 'GOVERNMENT_GAZETTE',
          fileName: 'Gazette_Notification_Uploaded.pdf',
          fileSize: 2450000,
          uploadedAt: new Date().toISOString(),
          status: 'PENDING',
        },
        {
          id: `doc-${Date.now()}-2`,
          documentType: 'AUTHORISATION_LETTER',
          fileName: 'Nodal_Officer_Letter.pdf',
          fileSize: 1150000,
          uploadedAt: new Date().toISOString(),
          status: 'PENDING',
        },
      ],
      wards: Array.from({ length: Math.min(payload.wardCountEstimate || 5, 5) }).map((_, idx) => ({
        id: `w-${idx + 1}`,
        code: `W-${idx + 1}`,
        name: `Ward / Sector ${idx + 1}`,
        populationEstimate: Math.round((payload.populationEstimate || 50000) / (payload.wardCountEstimate || 5)),
        areaSqKm: 2.5,
      })),
      departments: [
        { id: 'dept-roads', code: 'ROADS', name: 'Roads & Surface Infrastructure', slaHours: { critical: 12, high: 24, medium: 72, low: 168 }, isActive: true, activeWorkOrdersCount: 0 },
        { id: 'dept-drainage', code: 'DRAINAGE', name: 'Drainage & Water Utilities', slaHours: { critical: 8, high: 18, medium: 48, low: 120 }, isActive: true, activeWorkOrdersCount: 0 },
        { id: 'dept-electrical', code: 'ELECTRICAL', name: 'Public Electrical & Lighting', slaHours: { critical: 6, high: 12, medium: 36, low: 96 }, isActive: true, activeWorkOrdersCount: 0 },
      ],
      subscriptionTier: classification.effectiveTier === 'LARGE' ? 'ENTERPRISE' : classification.effectiveTier === 'MEDIUM' ? 'STANDARD' : 'STARTER',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.institutions.unshift(newInst);

    return {
      institution: newInst,
      message: `Registration submitted successfully for ${payload.name}. Classified as ${classification.effectiveTier} institution.`,
    };
  }

  /**
   * Super Admin Verification Review Action
   */
  static updateVerificationStatus(
    institutionId: string,
    newStatus: VerificationStatus,
    adminNotes: string
  ): Institution | null {
    const inst = this.institutions.find((i) => i.id === institutionId);
    if (!inst) return null;

    inst.verificationStatus = newStatus;
    inst.verificationNotes = adminNotes;
    inst.updatedAt = new Date().toISOString();

    if (newStatus === 'APPROVED') {
      inst.documents.forEach((doc) => {
        doc.status = 'ACCEPTED';
      });
    } else if (newStatus === 'REJECTED') {
      inst.documents.forEach((doc) => {
        doc.status = 'REJECTED';
        doc.rejectionReason = adminNotes;
      });
    }

    return { ...inst };
  }
}
