import { TEST_SCENARIOS, TestScenario } from '../tests/fixtures/testImages';
import { ImageValidationPipeline } from '../src/services/cv/imageValidationPipeline';
import { InfrastructureCvEngine } from '../src/services/cv/infrastructureCvEngine';
import { DetectionClass } from '../src/types/infrastructure';

interface EvaluationResultItem {
  scenarioId: number;
  scenarioName: string;
  expectedStatus: string;
  actualStatus: string;
  expectedDefects: DetectionClass[];
  actualDefects: DetectionClass[];
  statusMatch: boolean;
  defectMatch: boolean;
  isCorrect: boolean;
  isFalsePositive: boolean;
  isFalseNegative: boolean;
  latencyMs: number;
  rejectionReason?: string;
  calibratedConfidences: number[];
}

export function runAccuracyEvaluation() {
  console.log('================================================================================');
  console.log('          INFRALENS RIGOROUS COMPUTER VISION ACCURACY EVALUATION SUITE          ');
  console.log('================================================================================\n');

  const results: EvaluationResultItem[] = [];
  let tp = 0; // True Positives
  let tn = 0; // True Negatives
  let fp = 0; // False Positives
  let fn = 0; // False Negatives

  let blankTotal = 0;
  let blankCorrectlyRejected = 0;
  let totalLatency = 0;

  const perClassStats: Record<string, { tp: number; fp: number; fn: number }> = {
    pothole: { tp: 0, fp: 0, fn: 0 },
    damaged_road: { tp: 0, fp: 0, fn: 0 },
    garbage_accumulation: { tp: 0, fp: 0, fn: 0 },
    overflowing_drain: { tp: 0, fp: 0, fn: 0 },
  };

  for (const scenario of TEST_SCENARIOS) {
    const startTime = performance.now();
    const buffer = scenario.createImage();

    // 1. Validation Stage
    const validation = ImageValidationPipeline.validate(buffer);

    // 2. Detection Stage (only if valid)
    let detectedClasses: DetectionClass[] = [];
    let confidences: number[] = [];

    if (validation.isValid) {
      const rawDetections = InfrastructureCvEngine.detectDefects(buffer);
      detectedClasses = rawDetections.map((d) => d.type);
      confidences = rawDetections.map((d) => d.evidence.calibratedConfidence);
    }

    const latencyMs = Number((performance.now() - startTime).toFixed(2));
    totalLatency += latencyMs;

    // Check status match
    const statusMatch =
      validation.status === scenario.expectedStatus ||
      (scenario.expectedStatus === 'rejected' && !validation.isValid);

    // Track blank/irrelevant rejection
    const isBlankOrIrrelevant =
      scenario.id === 1 || scenario.id === 2 || scenario.id === 3 || scenario.id === 4 || scenario.id === 5;
    if (isBlankOrIrrelevant) {
      blankTotal++;
      if (!validation.isValid && detectedClasses.length === 0) {
        blankCorrectlyRejected++;
      }
    }

    // Ground truth evaluation
    const hasPredictedDefect = detectedClasses.length > 0;
    const hasExpectedDefect = scenario.isPositiveDefectCase;

    let isCorrect = false;
    let isFalsePositive = false;
    let isFalseNegative = false;

    if (hasExpectedDefect) {
      if (hasPredictedDefect) {
        tp++;
        isCorrect = true;
      } else {
        fn++;
        isFalseNegative = true;
      }
    } else {
      if (!hasPredictedDefect) {
        tn++;
        isCorrect = true;
      } else {
        fp++;
        isFalsePositive = true;
      }
    }

    // Per-class accounting
    for (const expClass of scenario.expectedDefects) {
      if (!perClassStats[expClass]) perClassStats[expClass] = { tp: 0, fp: 0, fn: 0 };
      if (detectedClasses.includes(expClass)) {
        perClassStats[expClass].tp++;
      } else {
        perClassStats[expClass].fn++;
      }
    }
    for (const actClass of detectedClasses) {
      if (!perClassStats[actClass]) perClassStats[actClass] = { tp: 0, fp: 0, fn: 0 };
      if (!scenario.expectedDefects.includes(actClass)) {
        perClassStats[actClass].fp++;
      }
    }

    results.push({
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      expectedStatus: scenario.expectedStatus,
      actualStatus: validation.status,
      expectedDefects: scenario.expectedDefects,
      actualDefects: detectedClasses,
      statusMatch,
      defectMatch: isCorrect,
      isCorrect,
      isFalsePositive,
      isFalseNegative,
      latencyMs,
      rejectionReason: validation.rejectionReason,
      calibratedConfidences: confidences,
    });
  }

  // Calculate Metrics
  const totalCases = results.length;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 1.0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 1.0;
  const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const fpr = fp + tn > 0 ? fp / (fp + tn) : 0.0;
  const fnr = fn + tp > 0 ? fn / (fn + tp) : 0.0;
  const accuracy = (tp + tn) / totalCases;
  const avgLatency = totalLatency / totalCases;
  const blankRejectionRate = (blankCorrectlyRejected / blankTotal) * 100;

  // Print Scenario Results Table
  console.log('| ID | Scenario | Expected | Result Status | Detections | Match | Latency |');
  console.log('|---|---------------------------------------------|----------------|---------------|------------|-------|---------|');
  for (const r of results) {
    const matchIcon = r.isCorrect ? '✅ PASS' : '❌ FAIL';
    const detStr = r.actualDefects.length > 0 ? r.actualDefects.join(', ') : '0 defects';
    const expStr = r.expectedDefects.length > 0 ? r.expectedDefects.join(', ') : '0 defects';
    console.log(
      `| ${String(r.scenarioId).padStart(2)} | ${r.scenarioName.padEnd(43)} | ${expStr.padEnd(14)} | ${r.actualStatus.padEnd(13)} | ${detStr.padEnd(10)} | ${matchIcon} | ${r.latencyMs}ms |`
    );
  }

  console.log('\n================================================================================');
  console.log('                          MEASURED PERFORMANCE METRICS                         ');
  console.log('================================================================================');
  console.log(`• Total Scenarios Evaluated       : ${totalCases}`);
  console.log(`• Correct Classifications (TP+TN) : ${tp + tn} / ${totalCases} (${(accuracy * 100).toFixed(1)}%)`);
  console.log(`• True Positives (TP)             : ${tp}`);
  console.log(`• True Negatives (TN)             : ${tn}`);
  console.log(`• False Positives (FP)            : ${fp} (Target: 0)`);
  console.log(`• False Negatives (FN)            : ${fn}`);
  console.log('--------------------------------------------------------------------------------');
  console.log(`• Precision                       : ${(precision * 100).toFixed(1)}%`);
  console.log(`• Recall                          : ${(recall * 100).toFixed(1)}%`);
  console.log(`• F1-Score                        : ${(f1Score * 100).toFixed(1)}%`);
  console.log(`• False Positive Rate (FPR)       : ${(fpr * 100).toFixed(1)}%`);
  console.log(`• False Negative Rate (FNR)       : ${(fnr * 100).toFixed(1)}%`);
  console.log(`• Blank Image Rejection Rate      : ${blankRejectionRate.toFixed(1)}% (Target: 100%)`);
  console.log(`• Average Inference Latency       : ${avgLatency.toFixed(2)} ms / frame`);
  console.log('--------------------------------------------------------------------------------');
  console.log('Confusion Matrix:');
  console.log(`               Actual Negative   Actual Positive`);
  console.log(`Pred Negative:      ${String(tn).padStart(4)} (TN)            ${String(fn).padStart(4)} (FN)`);
  console.log(`Pred Positive:      ${String(fp).padStart(4)} (FP)            ${String(tp).padStart(4)} (TP)`);
  console.log('--------------------------------------------------------------------------------');
  console.log('Per-Class Breakdown:');
  for (const [cls, stats] of Object.entries(perClassStats)) {
    const clsP = stats.tp + stats.fp > 0 ? (stats.tp / (stats.tp + stats.fp)) * 100 : 100;
    const clsR = stats.tp + stats.fn > 0 ? (stats.tp / (stats.tp + stats.fn)) * 100 : 100;
    console.log(`  - ${cls.padEnd(22)}: TP=${stats.tp}, FP=${stats.fp}, FN=${stats.fn} | Prec=${clsP.toFixed(0)}%, Rec=${clsR.toFixed(0)}%`);
  }
  console.log('================================================================================\n');

  return {
    accuracy,
    precision,
    recall,
    f1Score,
    fpr,
    fnr,
    blankRejectionRate,
    avgLatency,
    results,
  };
}

// Always execute evaluation when run as script
runAccuracyEvaluation();
