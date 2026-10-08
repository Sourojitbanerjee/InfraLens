import { DetectionClass, DetectionMetadata, Severity } from '../types/infrastructure';
import { CLASS_TO_CATEGORY } from './detectionService';

export interface SeverityEngineConfig {
  typeWeight: number;         // default 0.35
  extentWeight: number;       // default 0.25
  coverageWeight: number;     // default 0.25
  confidenceWeight: number;   // default 0.15
}

export interface SeverityCalculationResult {
  score: number;       // 0 - 100
  severity: Severity;  // healthy (low) | moderate | high | critical
  factorBreakdown: {
    baseThreatContribution: number;
    extentContribution: number;
    coverageContribution: number;
    confidenceContribution: number;
  };
}

export class SeverityEngine {
  private static config: SeverityEngineConfig = {
    typeWeight: 0.35,
    extentWeight: 0.25,
    coverageWeight: 0.25,
    confidenceWeight: 0.15,
  };

  static configure(customConfig: Partial<SeverityEngineConfig>): void {
    this.config = { ...this.config, ...customConfig };
  }

  static getConfig(): SeverityEngineConfig {
    return { ...this.config };
  }

  /**
   * Calculate severity = f(damage extent, confidence, road coverage, issue type)
   */
  static calculateSeverity(
    issueType: DetectionClass,
    confidence: number,
    metadata?: DetectionMetadata
  ): SeverityCalculationResult {
    const { typeWeight, extentWeight, coverageWeight, confidenceWeight } = this.config;

    // 1. Issue type base threat score (0 - 100)
    const baseThreat = CLASS_TO_CATEGORY[issueType]?.baseThreatScore ?? 60;

    // 2. Damage extent normalization (0 - 100, where 120mm+ depth/fissure is 100%)
    const extentMm = metadata?.damageExtentMm ?? metadata?.depthEstimateMm ?? 40;
    const extentScore = Math.min(100, Math.max(10, (extentMm / 100) * 100));

    // 3. Road coverage percentage (0 - 100, where 25% of visual frame is maximum severity)
    const coveragePct = metadata?.roadCoveragePct ?? 10;
    const coverageScore = Math.min(100, Math.max(10, (coveragePct / 25) * 100));

    // 4. Model confidence (0 - 100)
    const confScore = Math.min(100, Math.max(0, confidence));

    // Weighted combination
    const baseThreatContribution = baseThreat * typeWeight;
    const extentContribution = extentScore * extentWeight;
    const coverageContribution = coverageScore * coverageWeight;
    const confidenceContribution = confScore * confidenceWeight;

    const rawScore =
      baseThreatContribution +
      extentContribution +
      coverageContribution +
      confidenceContribution;

    const finalScore = Math.round(Math.min(100, Math.max(1, rawScore)));

    // Classification boundaries:
    // 0–30: LOW (healthy/minimal)
    // 31–60: MODERATE
    // 61–80: HIGH
    // 81–100: CRITICAL
    let severity: Severity = 'moderate';
    if (finalScore <= 30) severity = 'healthy';
    else if (finalScore <= 60) severity = 'moderate';
    else if (finalScore <= 80) severity = 'high';
    else severity = 'critical';

    return {
      score: finalScore,
      severity,
      factorBreakdown: {
        baseThreatContribution: Math.round(baseThreatContribution),
        extentContribution: Math.round(extentContribution),
        coverageContribution: Math.round(coverageContribution),
        confidenceContribution: Math.round(confidenceContribution),
      },
    };
  }
}
