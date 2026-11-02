/**
 * InfraLens Citizen Portal Service
 *
 * Citizen reporting, privacy radius management, and community corroboration.
 */

import { CitizenProfile, CitizenReport, CitizenReportStatus, CommunityConfirmation } from '../types/citizen';
import { InfrastructureCategory, Severity, BoundingBox } from '../types/infrastructure';
import { AuthorityResolver } from './authorityResolver';

export class CitizenService {
  private static profile: CitizenProfile = {
    id: 'cit-prof-001',
    userId: 'usr-cit-001',
    fullName: 'Pooja Sharma',
    email: 'pooja.sharma@gmail.com',
    phone: '+91 98102 34567',
    state: 'Delhi',
    district: 'New Delhi',
    cityOrVillage: 'New Delhi',
    locality: 'Connaught Place & Barakhamba Road',
    pincode: '110001',
    preferredPrivacyRadiusMeters: 3000,
    reputationScore: 115,
    totalReportsSubmitted: 3,
    totalResolvedCount: 2,
  };

  private static reports: CitizenReport[] = [
    {
      id: 'rep-001',
      trackingCode: 'INF-2026-000142',
      reporterId: 'usr-cit-001',
      reporterName: 'Pooja Sharma',
      isAnonymous: false,
      category: 'road_damage',
      categoryLabel: 'Road Damage & Potholes',
      detectionType: 'pothole',
      title: 'Deep Hazardous Pothole near Radial Road 2',
      description: 'Dangerous pothole formed after heavy monsoon rain right near the bus shelter. Causing traffic disruption and risk to two-wheelers.',
      landmarkNotes: 'Opposite State Bank Bhavan, Radial Road 2',
      location: {
        latitude: 28.6315,
        longitude: 77.2167,
        address: 'Radial Road 2, Inner Circle, Connaught Place, New Delhi',
        pincode: '110001',
        wardOrVillage: 'Ward 1 - Connaught Place',
        district: 'New Delhi',
        state: 'Delhi',
      },
      imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
      detections: [
        { id: 'box-1', x: 28, y: 35, width: 44, height: 38, label: 'Pothole Defect', category: 'road_damage', confidence: 94, severity: 'critical', severityScore: 92 },
      ],
      severity: 'critical',
      severityScore: 92,
      hazardScore: 88,
      status: 'REPAIR_IN_PROGRESS',
      communityConfirmationsCount: 14,
      hasUserConfirmed: true,
      isDuplicate: false,
      assignedInstitutionId: 'inst-ndmc-001',
      assignedInstitutionName: 'New Delhi Municipal Council',
      assignedDepartmentName: 'Civil Engineering (Roads & Bridges)',
      workOrderId: 'wo-2026-001',
      createdAt: '2026-02-28T09:30:00Z',
      updatedAt: '2026-03-01T14:15:00Z',
    },
    {
      id: 'rep-002',
      trackingCode: 'INF-2026-000143',
      reporterId: 'usr-cit-001',
      reporterName: 'Pooja Sharma',
      isAnonymous: false,
      category: 'electrical_hazard',
      categoryLabel: 'Electrical Hazard',
      detectionType: 'exposed_electrical_wire',
      title: 'Exposed High-Voltage Cable on Footpath',
      description: 'Breached underground conduit with exposed bare copper wires adjacent to the primary school pedestrian route.',
      landmarkNotes: 'Near Sarojini Nagar Market Gate 3',
      location: {
        latitude: 28.5742,
        longitude: 77.1989,
        address: 'Brigadier Hoshiar Singh Marg, Sarojini Nagar, New Delhi',
        pincode: '110023',
        wardOrVillage: 'Ward 3 - Sarojini Nagar',
        district: 'New Delhi',
        state: 'Delhi',
      },
      imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80',
      detections: [
        { id: 'box-2', x: 32, y: 40, width: 36, height: 42, label: 'Exposed Wire Hazard', category: 'electrical_hazard', confidence: 96, severity: 'critical', severityScore: 98 },
      ],
      severity: 'critical',
      severityScore: 98,
      hazardScore: 95,
      status: 'REPAIR_IN_PROGRESS',
      communityConfirmationsCount: 22,
      hasUserConfirmed: true,
      isDuplicate: false,
      assignedInstitutionId: 'inst-ndmc-001',
      assignedInstitutionName: 'New Delhi Municipal Council',
      assignedDepartmentName: 'Electricity Distribution & Street Lighting',
      workOrderId: 'wo-2026-002',
      createdAt: '2026-03-01T11:20:00Z',
      updatedAt: '2026-03-01T15:45:00Z',
    },
    {
      id: 'rep-003',
      trackingCode: 'INF-2026-000144',
      reporterId: 'usr-cit-001',
      reporterName: 'Pooja Sharma',
      isAnonymous: false,
      category: 'drainage_overflow',
      categoryLabel: 'Drainage & Sewage Overflow',
      detectionType: 'overflowing_drain',
      title: 'Cracked Stormwater Culvert Slab',
      description: 'Culvert slab cracked under vehicle impact with foul blackwater spilling onto pedestrian crosswalk.',
      landmarkNotes: 'Corner of Shanti Path & Niti Marg',
      location: {
        latitude: 28.5912,
        longitude: 77.1856,
        address: 'Shanti Path, Chanakyapuri, New Delhi',
        pincode: '110021',
        wardOrVillage: 'Ward 2 - Chanakyapuri',
        district: 'New Delhi',
        state: 'Delhi',
      },
      imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80',
      detections: [
        { id: 'box-3', x: 22, y: 25, width: 55, height: 50, label: 'Drainage Breach', category: 'drainage_overflow', confidence: 91, severity: 'high', severityScore: 82 },
      ],
      severity: 'high',
      severityScore: 82,
      hazardScore: 78,
      status: 'WORK_ORDER_CREATED',
      communityConfirmationsCount: 8,
      hasUserConfirmed: false,
      isDuplicate: false,
      assignedInstitutionId: 'inst-ndmc-001',
      assignedInstitutionName: 'New Delhi Municipal Council',
      assignedDepartmentName: 'Civil Engineering (Roads & Bridges)',
      workOrderId: 'wo-2026-003',
      createdAt: '2026-03-02T16:00:00Z',
      updatedAt: '2026-03-02T17:30:00Z',
    },
    {
      id: 'rep-004',
      trackingCode: 'INF-2026-000145',
      reporterId: 'usr-cit-002',
      reporterName: 'Subhasish Sen',
      isAnonymous: false,
      category: 'waste_accumulation',
      categoryLabel: 'Solid Waste & Sanitation',
      detectionType: 'garbage_accumulation',
      title: 'Illegal Commercial Debris Dump on Side Verge',
      description: 'Construction rubble and domestic plastic waste dumped along canal edge.',
      landmarkNotes: 'Behind Chandirampur Primary Health Centre',
      location: {
        latitude: 23.0140,
        longitude: 88.5435,
        address: 'Kharjumla Road, Chandirampur, Nadia 741249',
        pincode: '741249',
        wardOrVillage: 'Sansad 3 - Kharjumla',
        district: 'Nadia',
        state: 'West Bengal',
      },
      imageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80',
      detections: [
        { id: 'box-4', x: 20, y: 30, width: 60, height: 55, label: 'Waste Accumulation', category: 'waste_accumulation', confidence: 92, severity: 'moderate', severityScore: 64 },
      ],
      severity: 'moderate',
      severityScore: 64,
      hazardScore: 55,
      status: 'COMMUNITY_VERIFIED',
      communityConfirmationsCount: 5,
      hasUserConfirmed: false,
      isDuplicate: false,
      assignedInstitutionId: 'inst-gp-chandi-003',
      assignedInstitutionName: 'Chandirampur Gram Panchayat',
      assignedDepartmentName: 'Gram Sadak & Drainage Maintenance',
      createdAt: '2026-03-02T10:15:00Z',
      updatedAt: '2026-03-02T12:00:00Z',
    },
  ];

  static getProfile(): CitizenProfile {
    return { ...this.profile };
  }

  static updatePrivacyRadius(radiusMeters: number): void {
    this.profile.preferredPrivacyRadiusMeters = radiusMeters;
  }

  static getCitizenReports(userId?: string): CitizenReport[] {
    if (!userId) return [...this.reports];
    return this.reports.filter((r) => r.reporterId === userId);
  }

  static getAllReports(): CitizenReport[] {
    return [...this.reports];
  }

  static getReportByTrackingCode(code: string): CitizenReport | undefined {
    return this.reports.find(
      (r) => r.trackingCode.toLowerCase() === code.trim().toLowerCase() || r.id === code.trim()
    );
  }

  /**
   * Search nearby issues within configured radius with spatial privacy jitter
   */
  static getNearbyReports(
    userLat: number,
    userLon: number,
    radiusMeters: number
  ): Array<CitizenReport & { distanceMeters: number; maskedCoordinates: { latitude: number; longitude: number } }> {
    return this.reports
      .map((report) => {
        const dLat = (report.location.latitude - userLat) * (Math.PI / 180);
        const dLon = (report.location.longitude - userLon) * (Math.PI / 180);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(userLat * (Math.PI / 180)) *
          Math.cos(report.location.latitude * (Math.PI / 180)) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceM = Math.round(6371e3 * c);

        // Grid snapping for citizen public privacy
        const maskedLat = Math.round(report.location.latitude * 1000) / 1000;
        const maskedLon = Math.round(report.location.longitude * 1000) / 1000;

        return {
          ...report,
          distanceMeters: distanceM,
          maskedCoordinates: { latitude: maskedLat, longitude: maskedLon },
        };
      })
      .filter((r) => r.distanceMeters <= radiusMeters)
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  /**
   * Submit a new citizen report
   */
  static submitReport(payload: {
    category: InfrastructureCategory;
    categoryLabel: string;
    detectionType?: any;
    title: string;
    description: string;
    landmarkNotes?: string;
    location: {
      latitude: number;
      longitude: number;
      address: string;
      pincode: string;
      wardOrVillage?: string;
    };
    imageUrl: string;
    detections: BoundingBox[];
    severity: Severity;
    severityScore: number;
    hazardScore: number;
    isAnonymous: boolean;
  }): { report: CitizenReport; isDuplicate: boolean; duplicateWarning?: string } {
    const trackingCode = `INF-2026-${String(Date.now()).slice(-6)}`;

    // Hierarchical Authority Resolution
    const authRoute = AuthorityResolver.resolve(
      {
        latitude: payload.location.latitude,
        longitude: payload.location.longitude,
        address: payload.location.address,
        ward: payload.location.wardOrVillage || 'Ward 1',
        zone: 'Civic Zone',
      },
      payload.category,
      payload.severity
    );

    // Check duplicate proximity (< 80 meters with matching category)
    const nearbySameCategory = this.reports.find((r) => {
      if (r.category !== payload.category) return false;
      const dLat = (r.location.latitude - payload.location.latitude) * (Math.PI / 180);
      const dLon = (r.location.longitude - payload.location.longitude) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(payload.location.latitude * (Math.PI / 180)) *
        Math.cos(r.location.latitude * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const dist = 6371e3 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return dist <= 80;
    });

    const isDuplicate = Boolean(nearbySameCategory);

    const newReport: CitizenReport = {
      id: `rep-${Date.now()}`,
      trackingCode,
      reporterId: payload.isAnonymous ? undefined : this.profile.userId,
      reporterName: payload.isAnonymous ? undefined : this.profile.fullName,
      isAnonymous: payload.isAnonymous,
      category: payload.category,
      categoryLabel: payload.categoryLabel,
      detectionType: payload.detectionType,
      title: payload.title,
      description: payload.description,
      landmarkNotes: payload.landmarkNotes,
      location: {
        ...payload.location,
        state: authRoute.state || 'Delhi',
        district: authRoute.district || 'New Delhi',
      },
      imageUrl: payload.imageUrl,
      detections: payload.detections,
      severity: payload.severity,
      severityScore: payload.severityScore,
      hazardScore: payload.hazardScore,
      status: isDuplicate ? 'DUPLICATE_MERGED' : 'SUBMITTED',
      communityConfirmationsCount: 1,
      hasUserConfirmed: true,
      isDuplicate,
      masterReportId: nearbySameCategory?.id,
      assignedInstitutionId: authRoute.jurisdictionCode || 'inst-ndmc-001',
      assignedInstitutionName: authRoute.localBodyName || 'New Delhi Municipal Council',
      assignedDepartmentName: authRoute.departmentName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isDuplicate && nearbySameCategory) {
      nearbySameCategory.communityConfirmationsCount += 1;
      nearbySameCategory.updatedAt = new Date().toISOString();
    }

    this.reports.unshift(newReport);
    this.profile.totalReportsSubmitted += 1;
    this.profile.reputationScore += 10;

    return {
      report: newReport,
      isDuplicate,
      duplicateWarning: isDuplicate
        ? `Similar ${payload.categoryLabel} defect is already logged 40m away (${nearbySameCategory?.trackingCode}). Your submission has been linked to bolster municipal priority.`
        : undefined,
    };
  }

  /**
   * Citizen "Confirm Still Present" or "I am also affected" action
   */
  static confirmOrSupportReport(
    reportId: string,
    confirmationType: 'STILL_PRESENT' | 'ALSO_AFFECTED' = 'STILL_PRESENT'
  ): CitizenReport | null {
    const report = this.reports.find((r) => r.id === reportId || r.trackingCode === reportId);
    if (!report) return null;

    if (!report.hasUserConfirmed) {
      report.communityConfirmationsCount += 1;
      report.hasUserConfirmed = true;
      report.status = report.status === 'SUBMITTED' ? 'COMMUNITY_VERIFIED' : report.status;
      report.updatedAt = new Date().toISOString();
      this.profile.reputationScore += 5;
    }

    return { ...report };
  }
}
