import { 
  InfrastructureCategory, 
  NearbyRiskFactor, 
  Priority, 
  PriorityExplainability 
} from '../types/infrastructure';

export interface PriorityEvaluationParams {
  severityScore: number;
  complaintDensityCount: number;
  affectedPopulation: number;
  trafficImportance: 'critical' | 'high' | 'moderate' | 'low';
  sensitiveLocationScore: number;
  createdAt: string;
  nearbyRisks: NearbyRiskFactor[];
  category: InfrastructureCategory;
}

export class PriorityEngine {
  /**
   * Transparent 6-factor prioritization ranking with human-readable explainability
   */
  static evaluatePriority(params: PriorityEvaluationParams): PriorityExplainability {
    const reasons: string[] = [];

    // Factor 1: Severity (30% weight)
    const severityFactor = Math.min(100, Math.max(0, params.severityScore));
    if (severityFactor >= 80) {
      reasons.push(`Critical physical severity (${severityFactor}/100)`);
    } else if (severityFactor >= 60) {
      reasons.push(`High surface degradation (${severityFactor}/100)`);
    }

    // Factor 2: Complaint density & cluster reports (20% weight)
    const reports = params.complaintDensityCount;
    let densityFactor = 25;
    if (reports >= 30) {
      densityFactor = 100;
      reasons.push(`${reports} aggregated citizen & sensor reports in cluster`);
    } else if (reports >= 15) {
      densityFactor = 80;
      reasons.push(`Multi-report cluster (${reports} verified sightings)`);
    } else if (reports >= 5) {
      densityFactor = 55;
      reasons.push(`${reports} correlated defect reports`);
    }

    // Factor 3: Population impact (15% weight)
    const pop = params.affectedPopulation;
    let popFactor = 30;
    if (pop >= 4000) {
      popFactor = 100;
      reasons.push(`Affects ~${pop.toLocaleString()} daily commuters`);
    } else if (pop >= 2000) {
      popFactor = 75;
      reasons.push(`High commuter footfall (~${pop.toLocaleString()} users/day)`);
    } else if (pop >= 1000) {
      popFactor = 50;
    }

    // Factor 4: Traffic importance (15% weight)
    let trafficFactor = 40;
    if (params.trafficImportance === 'critical') {
      trafficFactor = 100;
      reasons.push('Key arterial route / critical public transit corridor');
    } else if (params.trafficImportance === 'high') {
      trafficFactor = 75;
      reasons.push('Primary municipal bus & vehicular corridor');
    } else if (params.trafficImportance === 'moderate') {
      trafficFactor = 50;
    }

    // Factor 5: Sensitive locations (10% weight)
    const sensitiveFactor = Math.min(100, Math.max(10, params.sensitiveLocationScore));
    const closestRisk = params.nearbyRisks.find((r) => r.distanceMeters <= 250);
    if (closestRisk) {
      reasons.push(`${closestRisk.name} only ${closestRisk.distanceMeters}m away`);
    } else if (sensitiveFactor >= 70) {
      reasons.push('Proximity to vulnerable demographic zone');
    }

    // Factor 6: Time unresolved (10% weight)
    const ageMs = Date.now() - new Date(params.createdAt).getTime();
    const ageDays = Math.max(0, Math.floor(ageMs / (1000 * 60 * 60 * 24)));
    let agingFactor = 20;
    if (ageDays >= 7) {
      agingFactor = 100;
      reasons.push(`Unresolved for ${ageDays} days (SLA breached)`);
    } else if (ageDays >= 3) {
      agingFactor = 70;
      reasons.push(`Pending dispatch for ${ageDays} days`);
    } else if (ageDays >= 1) {
      agingFactor = 45;
    }

    // Special trigger for immediate emergency
    if (params.category === 'electrical_hazard') {
      reasons.unshift('IMMEDIATE LIFE-SAFETY HAZARD (Live Electrical Conduit)');
    }

    // Weighted Formula
    const rawScore =
      severityFactor * 0.30 +
      densityFactor * 0.20 +
      popFactor * 0.15 +
      trafficFactor * 0.15 +
      sensitiveFactor * 0.10 +
      agingFactor * 0.10;

    const score = Math.round(Math.min(100, Math.max(1, rawScore)));

    // Categorization
    let priority: Priority = 'P3';
    let priorityLabel = 'MEDIUM';

    if (params.category === 'electrical_hazard' || score >= 88) {
      priority = 'P0';
      priorityLabel = 'EMERGENCY';
    } else if (score >= 70) {
      priority = 'P1';
      priorityLabel = 'CRITICAL';
    } else if (score >= 50) {
      priority = 'P2';
      priorityLabel = 'HIGH';
    } else if (score >= 30) {
      priority = 'P3';
      priorityLabel = 'MEDIUM';
    } else {
      priority = 'P4';
      priorityLabel = 'LOW';
    }

    if (reasons.length === 0) {
      reasons.push('Standard defect priority based on sensor telemetry');
    }

    return {
      score,
      priority,
      priorityLabel,
      reasons,
      factorScores: {
        severityScore: Math.round(severityFactor),
        complaintDensityScore: Math.round(densityFactor),
        populationImpactScore: Math.round(popFactor),
        trafficImportanceScore: Math.round(trafficFactor),
        sensitiveLocationScore: Math.round(sensitiveFactor),
        timeUnresolvedScore: Math.round(agingFactor),
      },
    };
  }
}
