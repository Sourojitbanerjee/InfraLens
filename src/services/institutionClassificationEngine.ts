/**
 * InfraLens Institutional Classification Engine
 *
 * Algorithmic sizing tiering (SMALL, MEDIUM, LARGE) for Urban Local Bodies (ULBs)
 * and Rural Panchayati Raj Institutions (PRIs).
 */

import { InstitutionSize, InstitutionType } from '../types/institution';

export interface ClassificationInput {
  institutionType: InstitutionType;
  wardCount: number;
  populationEstimate: number;
  inspectionTeamCount: number;
  adminOverrideSize?: InstitutionSize;
  overrideReason?: string;
}

export interface ClassificationFactorScore {
  name: string;
  weight: number;
  rawMetric: number;
  metricLabel: string;
  normalizedScore: number; // 0 - 100
  tierContribution: InstitutionSize;
}

export interface ClassificationResult {
  computedTier: InstitutionSize;
  effectiveTier: InstitutionSize;
  isOverridden: boolean;
  overrideReason?: string;
  compositeScore: number; // 0 - 100
  tierBreakdown: ClassificationFactorScore[];
  rationale: string;
  recommendedQuotas: {
    maxActiveInspectors: number;
    maxConcurrentWorkOrders: number;
    gisTileCacheMb: number;
    priorityAiThroughputPerHour: number;
  };
}

export class InstitutionClassificationEngine {
  /**
   * Evaluate institutional scale based on civic parameters
   */
  static classify(input: ClassificationInput): ClassificationResult {
    const { institutionType, wardCount, populationEstimate, inspectionTeamCount, adminOverrideSize, overrideReason } = input;

    // 1. Population factor (40% weight)
    // Small: < 100,000 | Medium: 100,000 - 1,000,000 | Large: > 1,000,000
    let popScore = Math.min(100, Math.max(5, (populationEstimate / 1_500_000) * 100));
    let popTier: InstitutionSize = 'SMALL';
    if (populationEstimate > 1_000_000) {
      popTier = 'LARGE';
      popScore = Math.min(100, 80 + (populationEstimate / 10_000_000) * 20);
    } else if (populationEstimate >= 100_000) {
      popTier = 'MEDIUM';
      popScore = 40 + ((populationEstimate - 100_000) / 900_000) * 35;
    } else {
      popTier = 'SMALL';
      popScore = Math.min(39, Math.max(5, (populationEstimate / 100_000) * 38));
    }

    // 2. Ward / Village Count factor (35% weight)
    // Small: < 25 wards | Medium: 25 - 75 wards | Large: > 75 wards
    let wardScore = Math.min(100, (wardCount / 100) * 100);
    let wardTier: InstitutionSize = 'SMALL';
    if (wardCount > 75) {
      wardTier = 'LARGE';
      wardScore = Math.min(100, 80 + ((wardCount - 75) / 100) * 20);
    } else if (wardCount >= 25) {
      wardTier = 'MEDIUM';
      wardScore = 40 + ((wardCount - 25) / 50) * 35;
    } else {
      wardTier = 'SMALL';
      wardScore = Math.min(39, (wardCount / 25) * 38);
    }

    // 3. Inspection Team Capacity factor (25% weight)
    // Small: < 5 teams | Medium: 5 - 20 teams | Large: > 20 teams
    let teamScore = Math.min(100, (inspectionTeamCount / 30) * 100);
    let teamTier: InstitutionSize = 'SMALL';
    if (inspectionTeamCount > 20) {
      teamTier = 'LARGE';
      teamScore = Math.min(100, 80 + ((inspectionTeamCount - 20) / 30) * 20);
    } else if (inspectionTeamCount >= 5) {
      teamTier = 'MEDIUM';
      teamScore = 40 + ((inspectionTeamCount - 5) / 15) * 35;
    } else {
      teamTier = 'SMALL';
      teamScore = Math.min(39, (inspectionTeamCount / 5) * 38);
    }

    // Baseline type bias
    let typeBonus = 0;
    if (institutionType === 'municipal_corporation') typeBonus = 15;
    else if (institutionType === 'gram_panchayat' || institutionType === 'municipal_board') typeBonus = -10;

    // Weighted Composite Score
    const compositeScore = Math.round(
      Math.min(100, Math.max(0, popScore * 0.40 + wardScore * 0.35 + teamScore * 0.25 + typeBonus))
    );

    // Determine algorithmic tier
    let computedTier: InstitutionSize = 'SMALL';
    if (compositeScore >= 70) {
      computedTier = 'LARGE';
    } else if (compositeScore >= 40) {
      computedTier = 'MEDIUM';
    } else {
      computedTier = 'SMALL';
    }

    const effectiveTier = adminOverrideSize || computedTier;
    const isOverridden = Boolean(adminOverrideSize && adminOverrideSize !== computedTier);

    // Rationale construction
    let rationale = `Calculated score of ${compositeScore}/100 places this institution in ${computedTier} tier.`;
    if (isOverridden) {
      rationale += ` Administratively overridden to ${adminOverrideSize}. Reason: ${overrideReason || 'Super Admin executive discretion'}.`;
    } else {
      rationale += ` Driven by ${populationEstimate.toLocaleString()} citizen population (${popTier}), ${wardCount} administrative wards/villages (${wardTier}), and ${inspectionTeamCount} field inspection teams (${teamTier}).`;
    }

    // Quotas based on effective tier
    const quotas = {
      SMALL: {
        maxActiveInspectors: 25,
        maxConcurrentWorkOrders: 150,
        gisTileCacheMb: 500,
        priorityAiThroughputPerHour: 500,
      },
      MEDIUM: {
        maxActiveInspectors: 100,
        maxConcurrentWorkOrders: 750,
        gisTileCacheMb: 2000,
        priorityAiThroughputPerHour: 2000,
      },
      LARGE: {
        maxActiveInspectors: 500,
        maxConcurrentWorkOrders: 5000,
        gisTileCacheMb: 8000,
        priorityAiThroughputPerHour: 10000,
      },
    }[effectiveTier];

    const tierBreakdown: ClassificationFactorScore[] = [
      {
        name: 'Jurisdiction Population',
        weight: 0.40,
        rawMetric: populationEstimate,
        metricLabel: `${populationEstimate.toLocaleString()} citizens`,
        normalizedScore: Math.round(popScore),
        tierContribution: popTier,
      },
      {
        name: 'Wards / Gram Sansads',
        weight: 0.35,
        rawMetric: wardCount,
        metricLabel: `${wardCount} administrative zones`,
        normalizedScore: Math.round(wardScore),
        tierContribution: wardTier,
      },
      {
        name: 'Inspection Team Fleet',
        weight: 0.25,
        rawMetric: inspectionTeamCount,
        metricLabel: `${inspectionTeamCount} field teams`,
        normalizedScore: Math.round(teamScore),
        tierContribution: teamTier,
      },
    ];

    return {
      computedTier,
      effectiveTier,
      isOverridden,
      overrideReason: isOverridden ? overrideReason : undefined,
      compositeScore,
      tierBreakdown,
      rationale,
      recommendedQuotas: quotas,
    };
  }
}
