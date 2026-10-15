import { DetectionClass, DetectionMetadata, Severity } from '../types/infrastructure';
import { CLASS_TO_CATEGORY } from './detectionService';
import { DefectEvidence } from './cv/types';

export interface SeverityEngineConfig {
  typeWeight: number;       // default 0.40 (intrinsic civil engineering hazard)
  coverageWeight: number;   // default 0.35 (measured % of visual frame/road lane)
  depthContrastWeight: number; // default 0.25 (photometric gradient/cavity depth)
}

export interface SeverityCalculationResult {
  score: number;             // 0 - 100
  severity: Severity;        // healthy (low) | moderate | high | critical
  isUncertain: boolean;
  factorBreakdown: {
    threatScoreContribution: number;
    visualCoverageContribution: number;
    depthContrastContribution: number;
  };
  rationale: string;
}

export class SeverityEngine {
  // Confidence is deliberately EXCLUDED from severity calculation (Phase 4-C)
  // Confidence = certainty that defect exists; Severity = physical/structural hazard
  private static config: SeverityEngineConfig = {
    typeWeight: 0.40,
    coverageWeight: 0.35,
    depthContrastWeight: 0.25,
  };

  static configure(customConfig: Partial<SeverityEngineConfig>): void {
    this.config = { ...this.config, ...customConfig };
  }

  static getConfig(): SeverityEngineConfig {
    return { ...this.config };
  }

  /**
   * Calculate severity based on genuine visual evidence and physical hazard
   * Does NOT inflate severity from detection confidence.
   */
  static calculateSeverity(
    issueType: DetectionClass,
    confidence: number,
    metadata?: DetectionMetadata,
    evidence?: DefectEvidence
  ): SeverityCalculationResult {
    const { typeWeight, coverageWeight, depthContrastWeight } = this.config;

    // 1. Intrinsic Category Hazard Rating (0 - 100)
    const baseThreat = CLASS_TO_CATEGORY[issueType]?.baseThreatScore ?? 60;

    // 2. Visually Observed Frame Coverage Score (0 - 100)
    // 20% or more of the road frame occupied by defect is considered severe
    let observedCoveragePct = 0;
    let isUncertain = false;

    if (evidence?.frameCoveragePct !== undefined) {
      observedCoveragePct = evidence.frameCoveragePct;
    } else if (metadata?.roadCoveragePct !== undefined) {
      observedCoveragePct = metadata.roadCoveragePct;
    } else {
      isUncertain = true;
      observedCoveragePct = 5.0; // conservative nominal default
    }

    const coverageScore = Math.min(100, Math.max(5, (observedCoveragePct / 20.0) * 100));

    // 3. Photometric Cavity Depth / Edge Disruption Score (0 - 100)
    let depthScore = 50;
    if (evidence?.contrastDelta !== undefined) {
      depthScore = Math.min(100, Math.max(10, (evidence.contrastDelta / 60.0) * 100));
    } else if (metadata?.damageExtentMm !== undefined) {
      depthScore = Math.min(100, Math.max(10, (metadata.damageExtentMm / 100.0) * 100));
    } else {
      isUncertain = true;
    }

    // Weighted physical evidence combination
    const threatScoreContribution = baseThreat * typeWeight;
    const visualCoverageContribution = coverageScore * coverageWeight;
    const depthContrastContribution = depthScore * depthContrastWeight;

    const rawScore =
      threatScoreContribution +
      visualCoverageContribution +
      depthContrastContribution;

    const finalScore = Math.round(Math.min(100, Math.max(1, rawScore)));

    // Categorization:
    // 0–30: HEALTHY (nominal / minor wear)
    // 31–60: MODERATE (scheduled routine maintenance)
    // 61–80: HIGH (accelerated deterioration / rapid repair)
    // 81–100: CRITICAL (immediate structural hazard / emergency dispatch)
    let severity: Severity = 'moderate';
    if (finalScore <= 30) severity = 'healthy';
    else if (finalScore <= 60) severity = 'moderate';
    else if (finalScore <= 80) severity = 'high';
    else severity = 'critical';

    const rationale = `Severity ${finalScore}/100 (${severity.toUpperCase()}): Intrinsic hazard ${baseThreat}/100, visual coverage ${observedCoveragePct.toFixed(1)}% of frame, contrast index ${Math.round(depthScore)}/100.${isUncertain ? ' (Note: Limited optical depth data, marked uncertain).' : ''}`;

    return {
      score: finalScore,
      severity,
      isUncertain,
      factorBreakdown: {
        threatScoreContribution: Math.round(threatScoreContribution),
        visualCoverageContribution: Math.round(visualCoverageContribution),
        depthContrastContribution: Math.round(depthContrastContribution),
      },
      rationale,
    };
  }
}
