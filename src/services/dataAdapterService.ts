/**
 * InfraLens Data Adapter Service
 *
 * Bridges the decoupled CitizenReport and WorkOrder domain entities with
 * the unified operational Issue representation for GIS mapping and command center display.
 */

import { Issue, Severity, Priority, ResolutionStatus, InfrastructureCategory } from '../types/infrastructure';
import { CitizenReport } from '../types/citizen';
import { WorkOrder } from '../types/workOrder';

export class DataAdapterService {
  /**
   * Convert a CitizenReport to a unified operational Issue
   */
  static citizenReportToIssue(report: CitizenReport): Issue {
    return {
      id: report.id,
      issueCode: report.trackingCode,
      title: report.title,
      category: report.category,
      categoryLabel: report.categoryLabel,
      detectionType: report.detectionType,
      severity: report.severity,
      severityScore: report.severityScore,
      priority: report.severityScore >= 80 ? 'P0' : report.severityScore >= 60 ? 'P1' : report.severityScore >= 40 ? 'P2' : 'P3',
      confidence: 94,
      location: {
        latitude: report.location.latitude,
        longitude: report.location.longitude,
        address: report.location.address,
        ward: report.location.wardOrVillage || 'Ward 1',
        zone: report.location.district || 'Urban Zone',
      },
      imageUrl: report.imageUrl,
      status: this.mapCitizenStatusToIssueStatus(report.status),
      clusterId: report.clusterId,
      authorityId: report.assignedInstitutionId || 'auth-roads',
      authorityName: report.assignedInstitutionName || 'Municipal Authority',
      departmentName: report.assignedDepartmentName || 'Civil Works Department',
      impact: {
        affectedUsersPerDay: 5000,
        safetyIndexScore: 100 - report.hazardScore,
        economicImpactRating: report.severity === 'critical' ? 'severe' : report.severity === 'high' ? 'moderate' : 'low',
        nearbyRisks: [],
        recommendedAction: 'Citizen Report Pending Field Verification & Work Order Creation',
        slaDeadlineHours: report.severity === 'critical' ? 12 : report.severity === 'high' ? 24 : 48,
        trafficImportance: 'high',
        sensitiveLocationScore: 70,
        isLocationProvided: true,
        geographicProximityStatus: 'verified',
      },
      lifecycle: [
        {
          status: 'pending',
          timestamp: report.createdAt,
          actor: report.isAnonymous ? 'Citizen Reporter (Anonymous)' : (report.reporterName || 'Citizen Reporter'),
          role: 'CITIZEN',
          notes: report.description,
        },
      ],
      detections: report.detections || [],
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
      reportedBy: 'CITIZEN_FEEDBACK',
      notes: report.description,
    };
  }

  /**
   * Convert a WorkOrder to a unified operational Issue
   */
  static workOrderToIssue(order: WorkOrder): Issue {
    return {
      id: order.id,
      issueCode: order.workOrderCode,
      title: order.title,
      category: order.category as InfrastructureCategory,
      categoryLabel: order.category.replace('_', ' ').toUpperCase(),
      severity: order.severity,
      severityScore: order.priorityScore,
      priority: order.priority,
      confidence: 96,
      location: {
        latitude: order.location.latitude,
        longitude: order.location.longitude,
        address: order.location.address,
        ward: order.wardName || 'Ward 1',
        zone: order.institutionName,
      },
      imageUrl: order.beforeAfterEvidence?.beforeImageUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80',
      status: this.mapWorkOrderStatusToIssueStatus(order.status),
      clusterId: order.clusterId,
      authorityId: order.institutionId,
      authorityName: order.institutionName,
      departmentName: order.departmentName,
      impact: {
        affectedUsersPerDay: 12000,
        safetyIndexScore: Math.max(10, 100 - order.priorityScore),
        economicImpactRating: order.priority === 'P0' ? 'severe' : 'moderate',
        nearbyRisks: [],
        recommendedAction: order.assignedTeamName ? `Dispatched to ${order.assignedTeamName}` : 'Work Order In Progress',
        slaDeadlineHours: order.slaRemainingHours || 24,
        trafficImportance: 'critical',
        sensitiveLocationScore: 85,
        isLocationProvided: true,
        geographicProximityStatus: 'verified',
      },
      lifecycle: [
        {
          status: 'dispatched',
          timestamp: order.createdAt,
          actor: order.assignedSupervisorName || 'Department Operations Supervisor',
          role: 'DEPARTMENT_SUPERVISOR',
          notes: `Work order dispatched. Assigned team: ${order.assignedTeamName || 'Unassigned'}`,
        },
      ],
      detections: [],
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      reportedBy: 'MUNICIPAL_PATROL',
      notes: order.description,
      resolutionComparison: order.beforeAfterEvidence ? {
        beforeSeverityScore: order.priorityScore,
        afterSeverityScore: 5,
        beforeSeverity: order.severity,
        afterSeverity: 'healthy' as Severity,
        resolutionTimeDays: 1.2,
        commutersProtected: 8500,
        beforeImageUrl: order.beforeAfterEvidence.beforeImageUrl,
        afterImageUrl: order.beforeAfterEvidence.afterImageUrl,
        repairedByDepartment: order.departmentName,
        notes: order.beforeAfterEvidence.resolutionSummary,
      } : undefined,
    };
  }

  private static mapCitizenStatusToIssueStatus(status: string): ResolutionStatus {
    switch (status) {
      case 'SUBMITTED':
      case 'AI_ANALYZED':
        return 'pending';
      case 'JURISDICTION_ASSIGNED':
      case 'COMMUNITY_VERIFIED':
        return 'triaged';
      case 'WORK_ORDER_CREATED':
        return 'assigned';
      case 'REPAIR_IN_PROGRESS':
        return 'in_progress';
      case 'RESOLVED':
        return 'resolved';
      default:
        return 'pending';
    }
  }

  private static mapWorkOrderStatusToIssueStatus(status: string): ResolutionStatus {
    switch (status) {
      case 'CREATED':
        return 'assigned';
      case 'INSPECTION_SCHEDULED':
      case 'FIELD_VERIFIED':
      case 'REPAIR_DISPATCHED':
      case 'CREW_ON_SITE':
      case 'REPAIR_COMPLETED':
      case 'EVIDENCE_SUBMITTED':
        return 'in_progress';
      case 'INSPECTION_APPROVED':
      case 'CLOSED_RESOLVED':
        return 'resolved';
      default:
        return 'in_progress';
    }
  }
}
