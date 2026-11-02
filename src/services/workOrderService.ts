/**
 * InfraLens Work Order Management & Field Operations Service
 *
 * Decoupled institutional execution unit distinct from citizen complaint records.
 */

import { WorkOrder, WorkOrderStatus, InspectionTeam, BeforeAfterEvidenceRecord } from '../types/workOrder';
import { Severity, Priority } from '../types/infrastructure';

export class WorkOrderService {
  private static inspectionTeams: InspectionTeam[] = [
    {
      id: 'team-ndmc-alpha',
      name: 'NDMC Civil Rapid Response Alpha',
      chiefInspectorId: 'usr-chief-01',
      chiefInspectorName: 'Er. Arvind Mehta',
      members: [
        { userId: 'usr-insp-01', fullName: 'Vikram Rawat', role: 'LEAD', phone: '+91 98111 22334' },
        { userId: 'usr-insp-02', fullName: 'Suresh Kumar', role: 'INSPECTOR', phone: '+91 98111 22335' },
        { userId: 'usr-insp-03', fullName: 'Rajesh Meena', role: 'DRIVER', phone: '+91 98111 22336' },
      ],
      vehicleRegistration: 'DL-01-GA-4509 (Asphalt Patching Truck)',
      isActive: true,
      activeAssignmentsCount: 3,
    },
    {
      id: 'team-ndmc-bravo',
      name: 'NDMC Electrical Grid Unit Bravo',
      chiefInspectorId: 'usr-chief-02',
      chiefInspectorName: 'Smt. Sunita Rao',
      members: [
        { userId: 'usr-insp-04', fullName: 'Amit Sharma', role: 'LEAD', phone: '+91 98111 33441' },
        { userId: 'usr-insp-05', fullName: 'Manoj Tiwari', role: 'SPECIALIST', phone: '+91 98111 33442' },
      ],
      vehicleRegistration: 'DL-01-EE-8821 (Hydraulic Bucket Tower)',
      isActive: true,
      activeAssignmentsCount: 2,
    },
    {
      id: 'team-gp-rural',
      name: 'Chandirampur Gram Sadak Taskforce',
      chiefInspectorId: 'usr-chief-gp',
      chiefInspectorName: 'Debabrata Mondal (Nirman Sahayak)',
      members: [
        { userId: 'usr-insp-gp1', fullName: 'Subhash Biswas', role: 'LEAD', phone: '+91 94340 98765' },
        { userId: 'usr-insp-gp2', fullName: 'Kalyan Sarkar', role: 'INSPECTOR', phone: '+91 94340 98766' },
      ],
      vehicleRegistration: 'WB-52-K-1922 (Tractor-Trailer Repair Rig)',
      isActive: true,
      activeAssignmentsCount: 1,
    },
  ];

  private static workOrders: WorkOrder[] = [
    {
      id: 'wo-2026-001',
      workOrderCode: 'WO-2026-00089',
      institutionId: 'inst-ndmc-001',
      institutionName: 'New Delhi Municipal Council',
      departmentId: 'dept-roads',
      departmentName: 'Civil Engineering (Roads & Bridges)',
      wardId: 'ward-01',
      wardName: 'Connaught Place & Barakhamba',
      primaryReportId: 'rep-001',
      trackingCode: 'INF-2026-000142',
      title: 'Structural Pothole Excavation & Bitumen Resurfacing',
      description: 'Severe structural crater spanning 1.4m x 0.8m on Inner Circle radial road. Immediate milling and asphalt infill required.',
      category: 'road_damage',
      severity: 'critical' as Severity,
      priority: 'P0' as Priority,
      priorityScore: 94,
      status: 'REPAIR_DISPATCHED' as WorkOrderStatus,
      location: {
        latitude: 28.6315,
        longitude: 77.2167,
        address: 'Radial Road 2, Inner Circle, Connaught Place, New Delhi',
        ward: 'Ward 1',
      },
      assignedSupervisorId: 'usr-sup-01',
      assignedSupervisorName: 'Praveen Saxena (AEE Civil)',
      assignedTeamId: 'team-ndmc-alpha',
      assignedTeamName: 'NDMC Civil Rapid Response Alpha',
      assignedContractor: 'Shree Balaji Roadworks Ltd.',
      estimatedCostInr: 45000,
      slaDeadline: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
      slaRemainingHours: 18,
      isSlaViolated: false,
      fieldVerification: {
        id: 'fv-001',
        workOrderId: 'wo-2026-001',
        inspectorId: 'usr-insp-01',
        inspectorName: 'Vikram Rawat',
        checkInCoordinates: { latitude: 28.63148, longitude: 77.21672 },
        gpsAccuracyMeters: 4.2,
        isDefectConfirmed: true,
        measuredDimensions: { lengthMeters: 1.45, widthMeters: 0.85, depthCm: 9.5 },
        fieldNotes: 'Sub-base erosion confirmed due to recent monsoon runoff. Asphalt milling crew scheduled.',
        verifiedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      },
      createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'wo-2026-002',
      workOrderCode: 'WO-2026-00090',
      institutionId: 'inst-ndmc-001',
      institutionName: 'New Delhi Municipal Council',
      departmentId: 'dept-electric',
      departmentName: 'Electricity Distribution & Street Lighting',
      wardId: 'ward-03',
      wardName: 'Sarojini Nagar & Safdarjung',
      primaryReportId: 'rep-002',
      trackingCode: 'INF-2026-000143',
      title: 'Exposed High-Voltage Cable Conduit Re-insulation',
      description: 'Underground feeder cable breached adjacent to pedestrian walkway near market gate 3.',
      category: 'electrical_hazard',
      severity: 'critical' as Severity,
      priority: 'P0' as Priority,
      priorityScore: 98,
      status: 'CREW_ON_SITE' as WorkOrderStatus,
      location: {
        latitude: 28.5742,
        longitude: 77.1989,
        address: 'Brigadier Hoshiar Singh Marg, Sarojini Nagar, New Delhi',
        ward: 'Ward 3',
      },
      assignedSupervisorId: 'usr-sup-02',
      assignedSupervisorName: 'Kavita Chawla (EE Electrical)',
      assignedTeamId: 'team-ndmc-bravo',
      assignedTeamName: 'NDMC Electrical Grid Unit Bravo',
      estimatedCostInr: 28000,
      slaDeadline: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
      slaRemainingHours: 6,
      isSlaViolated: false,
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'wo-2026-003',
      workOrderCode: 'WO-2026-00091',
      institutionId: 'inst-ndmc-001',
      institutionName: 'New Delhi Municipal Council',
      departmentId: 'dept-roads',
      departmentName: 'Civil Engineering (Roads & Bridges)',
      wardId: 'ward-02',
      wardName: 'Chanakyapuri Diplomatic Enclave',
      primaryReportId: 'rep-003',
      trackingCode: 'INF-2026-000144',
      title: 'Stormwater Culvert Clearing & Cover Slab Replacement',
      description: 'Cracked concrete slab and silt accumulation along Shanti Path arterial channel.',
      category: 'drainage_overflow',
      severity: 'high' as Severity,
      priority: 'P1' as Priority,
      priorityScore: 78,
      status: 'EVIDENCE_SUBMITTED' as WorkOrderStatus,
      location: {
        latitude: 28.5912,
        longitude: 77.1856,
        address: 'Shanti Path, Chanakyapuri, New Delhi',
        ward: 'Ward 2',
      },
      assignedSupervisorId: 'usr-sup-01',
      assignedSupervisorName: 'Praveen Saxena (AEE Civil)',
      assignedTeamId: 'team-ndmc-alpha',
      assignedTeamName: 'NDMC Civil Rapid Response Alpha',
      estimatedCostInr: 32000,
      actualCostInr: 31200,
      slaDeadline: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      slaRemainingHours: 24,
      isSlaViolated: false,
      beforeAfterEvidence: {
        id: 'ev-001',
        workOrderId: 'wo-2026-003',
        beforeImageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80',
        afterImageUrl: 'https://images.unsplash.com/photo-1578874691223-a49267d3419e?w=800&auto=format&fit=crop&q=80',
        resolutionSummary: 'Culvert desilted using hydraulic suction. Reinforced precast RCC cover slab installed with sealant.',
        materialsUsed: 'Grade M30 RCC slab (2 units), Bituminous sealing compound, Hydro-jet clearance',
        submittedByCrewLeader: 'Vikram Rawat (Team Alpha)',
        submittedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
        status: 'PENDING_APPROVAL',
      },
      createdAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'wo-2026-004',
      workOrderCode: 'WO-2026-00092',
      institutionId: 'inst-gp-chandi-003',
      institutionName: 'Chandirampur Gram Panchayat',
      departmentId: 'dept-rural-works',
      departmentName: 'Gram Sadak & Drainage Maintenance',
      wardId: 'sansad-02',
      wardName: 'Mondal Para & Station Road',
      primaryReportId: 'rep-004',
      trackingCode: 'INF-2026-000145',
      title: 'Brick-Soling Rural Pathway Repair',
      description: 'Monsoon washout of brick soling along Krishak Samiti approach path.',
      category: 'road_damage',
      severity: 'moderate' as Severity,
      priority: 'P2' as Priority,
      priorityScore: 62,
      status: 'INSPECTION_SCHEDULED' as WorkOrderStatus,
      location: {
        latitude: 23.0125,
        longitude: 88.5412,
        address: 'Mondal Para Village Road, Chandirampur, Nadia 741249',
        ward: 'Sansad 2',
      },
      assignedSupervisorId: 'usr-chief-gp',
      assignedSupervisorName: 'Debabrata Mondal',
      assignedTeamId: 'team-gp-rural',
      assignedTeamName: 'Chandirampur Gram Sadak Taskforce',
      estimatedCostInr: 15000,
      slaDeadline: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
      slaRemainingHours: 72,
      isSlaViolated: false,
      createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  static getAllWorkOrders(institutionId?: string): WorkOrder[] {
    if (!institutionId) return [...this.workOrders];
    return this.workOrders.filter((wo) => wo.institutionId === institutionId);
  }

  static getWorkOrderById(id: string): WorkOrder | undefined {
    return this.workOrders.find((wo) => wo.id === id || wo.workOrderCode === id);
  }

  static getInspectionTeams(institutionId?: string): InspectionTeam[] {
    if (!institutionId) return [...this.inspectionTeams];
    return this.inspectionTeams.filter((t) => t.id.includes(institutionId.replace('inst-', '')) || institutionId === 'inst-ndmc-001');
  }

  static createWorkOrder(order: Partial<WorkOrder>): WorkOrder {
    const code = `WO-2026-${String(this.workOrders.length + 100).padStart(5, '0')}`;
    const newWo: WorkOrder = {
      id: `wo-${Date.now()}`,
      workOrderCode: code,
      institutionId: order.institutionId || 'inst-ndmc-001',
      institutionName: order.institutionName || 'New Delhi Municipal Council',
      departmentId: order.departmentId || 'dept-roads',
      departmentName: order.departmentName || 'Civil Engineering (Roads & Bridges)',
      wardId: order.wardId,
      wardName: order.wardName,
      primaryReportId: order.primaryReportId,
      trackingCode: order.trackingCode || `INF-2026-${String(Date.now()).slice(-6)}`,
      title: order.title || 'Civic Infrastructure Remediation',
      description: order.description || '',
      category: order.category || 'road_damage',
      severity: order.severity || 'high',
      priority: order.priority || 'P1',
      priorityScore: order.priorityScore || 75,
      status: 'CREATED',
      location: order.location || {
        latitude: 28.6139,
        longitude: 77.2090,
        address: 'New Delhi Operational Area',
      },
      assignedSupervisorId: order.assignedSupervisorId,
      assignedSupervisorName: order.assignedSupervisorName,
      assignedTeamId: order.assignedTeamId,
      assignedTeamName: order.assignedTeamName,
      assignedContractor: order.assignedContractor,
      estimatedCostInr: order.estimatedCostInr || 25000,
      slaDeadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      slaRemainingHours: 48,
      isSlaViolated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.workOrders.unshift(newWo);
    return newWo;
  }

  static assignTeam(workOrderId: string, teamId: string, teamName: string, supervisorName?: string): WorkOrder | null {
    const wo = this.workOrders.find((w) => w.id === workOrderId || w.workOrderCode === workOrderId);
    if (!wo) return null;

    wo.assignedTeamId = teamId;
    wo.assignedTeamName = teamName;
    if (supervisorName) wo.assignedSupervisorName = supervisorName;
    wo.status = 'REPAIR_DISPATCHED';
    wo.updatedAt = new Date().toISOString();
    return { ...wo };
  }

  static submitFieldVerification(
    workOrderId: string,
    verification: {
      inspectorId: string;
      inspectorName: string;
      checkInCoords: { latitude: number; longitude: number };
      accuracyMeters: number;
      isConfirmed: boolean;
      dimensions?: { lengthMeters: number; widthMeters: number; depthCm?: number };
      notes: string;
    }
  ): WorkOrder | null {
    const wo = this.workOrders.find((w) => w.id === workOrderId || w.workOrderCode === workOrderId);
    if (!wo) return null;

    wo.fieldVerification = {
      id: `fv-${Date.now()}`,
      workOrderId: wo.id,
      inspectorId: verification.inspectorId,
      inspectorName: verification.inspectorName,
      checkInCoordinates: verification.checkInCoords,
      gpsAccuracyMeters: verification.accuracyMeters,
      isDefectConfirmed: verification.isConfirmed,
      measuredDimensions: verification.dimensions,
      fieldNotes: verification.notes,
      verifiedAt: new Date().toISOString(),
    };
    wo.status = 'FIELD_VERIFIED';
    wo.updatedAt = new Date().toISOString();
    return { ...wo };
  }

  static submitBeforeAfterEvidence(
    workOrderId: string,
    evidence: {
      beforeImageUrl: string;
      afterImageUrl: string;
      summary: string;
      materialsUsed?: string;
      crewLeader: string;
    }
  ): WorkOrder | null {
    const wo = this.workOrders.find((w) => w.id === workOrderId || w.workOrderCode === workOrderId);
    if (!wo) return null;

    wo.beforeAfterEvidence = {
      id: `ev-${Date.now()}`,
      workOrderId: wo.id,
      beforeImageUrl: evidence.beforeImageUrl,
      afterImageUrl: evidence.afterImageUrl,
      resolutionSummary: evidence.summary,
      materialsUsed: evidence.materialsUsed,
      submittedByCrewLeader: evidence.crewLeader,
      submittedAt: new Date().toISOString(),
      status: 'PENDING_APPROVAL',
    };
    wo.status = 'EVIDENCE_SUBMITTED';
    wo.updatedAt = new Date().toISOString();
    return { ...wo };
  }

  static approveResolution(
    workOrderId: string,
    chiefInspectorId: string,
    chiefInspectorName: string
  ): WorkOrder | null {
    const wo = this.workOrders.find((w) => w.id === workOrderId || w.workOrderCode === workOrderId);
    if (!wo) return null;

    if (wo.beforeAfterEvidence) {
      wo.beforeAfterEvidence.status = 'APPROVED';
      wo.beforeAfterEvidence.signedOffByChiefInspectorId = chiefInspectorId;
      wo.beforeAfterEvidence.signedOffByChiefInspectorName = chiefInspectorName;
      wo.beforeAfterEvidence.signedOffAt = new Date().toISOString();
    }
    wo.status = 'CLOSED_RESOLVED';
    wo.resolvedAt = new Date().toISOString();
    wo.updatedAt = new Date().toISOString();
    return { ...wo };
  }
}
