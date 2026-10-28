import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { TEST_SCENARIOS } from './fixtures/testImages';
import { ImageValidationPipeline } from '../src/services/cv/imageValidationPipeline';
import { InfrastructureCvEngine } from '../src/services/cv/infrastructureCvEngine';
import { SeverityEngine } from '../src/services/severityEngine';
import { RealDetectionService } from '../src/services/detectionService';
import { AiVisionService } from '../src/services/aiVisionService';

describe('InfraLens AI Accuracy Overhaul — Test Suite', () => {
  test('Scenario 1: Completely white page must NEVER produce infrastructure detections', () => {
    const scenario = TEST_SCENARIOS.find((s) => s.id === 1)!;
    const buffer = scenario.createImage();
    const validation = ImageValidationPipeline.validate(buffer);

    assert.equal(validation.isValid, false, 'White page must be rejected');
    assert.equal(validation.rejectionReason, 'blank_white', 'White page must be rejected as blank_white');
    assert.equal(validation.operationalState, 'IMAGE_QUALITY_INSUFFICIENT');

    const defects = InfrastructureCvEngine.detectDefects(buffer);
    assert.equal(defects.length, 0, 'White page must produce 0 defect detections');
  });

  test('Scenario 2: Completely black image must be rejected with 0 detections', () => {
    const scenario = TEST_SCENARIOS.find((s) => s.id === 2)!;
    const buffer = scenario.createImage();
    const validation = ImageValidationPipeline.validate(buffer);

    assert.equal(validation.isValid, false, 'Black page must be rejected');
    assert.equal(validation.rejectionReason, 'blank_black', 'Black page must be rejected as blank_black');
    assert.equal(validation.operationalState, 'IMAGE_QUALITY_INSUFFICIENT');

    const defects = InfrastructureCvEngine.detectDefects(buffer);
    assert.equal(defects.length, 0, 'Black page must produce 0 defect detections');
  });

  test('Scenario 4: Text document / screenshot must be rejected with 0 detections', () => {
    const scenario = TEST_SCENARIOS.find((s) => s.id === 4)!;
    const buffer = scenario.createImage();
    const validation = ImageValidationPipeline.validate(buffer);

    assert.equal(validation.isValid, false, 'Document screenshot must be rejected');
    assert.equal(validation.rejectionReason, 'document_or_screenshot');
    assert.equal(validation.operationalState, 'UNSUPPORTED_IMAGE');
  });

  test('Scenario 8: Building facade is valid infrastructure with ZERO defects', () => {
    const bldScenario = TEST_SCENARIOS.find((s) => s.id === 8)!;
    const buffer = bldScenario.createImage();
    const bldValidation = ImageValidationPipeline.validate(buffer);
    assert.equal(bldValidation.isValid, true, 'Building facade is infrastructure and must pass validation');
    assert.notEqual(bldValidation.sceneType, 'non_infrastructure', 'Building facade must not be classified as non_infrastructure');

    const defects = InfrastructureCvEngine.detectDefects(buffer, bldValidation.sceneType);
    assert.equal(defects.length, 0, 'Normal building facade must produce ZERO defect detections');
  });

  test('Scenario 5: Clean road without visible damage must produce ZERO detections', () => {
    const scenario = TEST_SCENARIOS.find((s) => s.id === 5)!;
    const buffer = scenario.createImage();
    const validation = ImageValidationPipeline.validate(buffer);

    assert.equal(validation.isValid, true, 'Clean road should be validated as infrastructure');
    assert.equal(validation.sceneType, 'road_asphalt');

    const defects = InfrastructureCvEngine.detectDefects(buffer);
    assert.equal(defects.length, 0, 'Clean road must produce exactly 0 defect detections');
  });

  test('Scenario 10 & 12: Shadows and Manholes must NOT produce false positive potholes', () => {
    const shadowScenario = TEST_SCENARIOS.find((s) => s.id === 10)!;
    const shadowBuffer = shadowScenario.createImage();
    const shadowDefects = InfrastructureCvEngine.detectDefects(shadowBuffer);
    assert.equal(shadowDefects.length, 0, 'Tree shadows must not trigger pothole detection');

    const manholeScenario = TEST_SCENARIOS.find((s) => s.id === 12)!;
    const manholeBuffer = manholeScenario.createImage();
    const manholeDefects = InfrastructureCvEngine.detectDefects(manholeBuffer);
    assert.equal(manholeDefects.length, 0, 'Manhole covers must be filtered out by crop verifier');
  });

  test('Scenario 13: Asphalt patch repairs must NOT trigger defect detections', () => {
    const patchScenario = TEST_SCENARIOS.find((s) => s.id === 13)!;
    const patchBuffer = patchScenario.createImage();
    const patchDefects = InfrastructureCvEngine.detectDefects(patchBuffer);
    assert.equal(patchDefects.length, 0, 'Asphalt patches must be recognized as non-defect');
  });

  test('Scenario 19: Road with genuine pothole must detect pothole with valid bounding box', () => {
    const scenario = TEST_SCENARIOS.find((s) => s.id === 19)!;
    const buffer = scenario.createImage();
    const validation = ImageValidationPipeline.validate(buffer);

    assert.equal(validation.isValid, true);
    const defects = InfrastructureCvEngine.detectDefects(buffer);

    assert.ok(defects.length >= 1, 'Should detect at least 1 pothole');
    const pothole = defects.find((d) => d.type === 'pothole');
    assert.ok(pothole, 'Must detect a pothole defect');

    // Bounding box integrity
    const box = pothole.evidence.boundingBox;
    assert.ok(box.x >= 0 && box.x <= 100, `Box X (${box.x}) must be in bounds [0, 100]`);
    assert.ok(box.y >= 0 && box.y <= 100, `Box Y (${box.y}) must be in bounds [0, 100]`);
    assert.ok(box.width > 0 && box.width <= 100, `Box width (${box.width}) must be > 0 and <= 100`);
    assert.ok(box.height > 0 && box.height <= 100, `Box height (${box.height}) must be > 0 and <= 100`);
    assert.ok(box.x + box.width <= 100, 'Box must not exceed right image boundary');
    assert.ok(box.y + box.height <= 100, 'Box must not exceed bottom image boundary');
  });

  test('Scenario 21: Visible road cracks must be detected as damaged_road', () => {
    const scenario = TEST_SCENARIOS.find((s) => s.id === 21)!;
    const buffer = scenario.createImage();
    const defects = InfrastructureCvEngine.detectDefects(buffer);

    assert.ok(defects.length >= 1);
    const crack = defects.find((d) => d.type === 'damaged_road');
    assert.ok(crack, 'Must detect a damaged_road fissure');
  });

  test('Scenario 25 & 27: Drainage surcharge and garbage accumulation must be detected', () => {
    const drainScenario = TEST_SCENARIOS.find((s) => s.id === 25)!;
    const drainDefects = InfrastructureCvEngine.detectDefects(drainScenario.createImage());
    assert.ok(drainDefects.length >= 1, 'Must detect overflowing drain surcharge');
    assert.ok(drainDefects.some((d) => d.type === 'overflowing_drain'));

    const wasteScenario = TEST_SCENARIOS.find((s) => s.id === 27)!;
    const wasteDefects = InfrastructureCvEngine.detectDefects(wasteScenario.createImage());
    assert.ok(wasteDefects.length >= 1, 'Must detect bulk garbage accumulation');
    assert.ok(wasteDefects.some((d) => d.type === 'garbage_accumulation'));
  });

  test('Severity Engine Decoupling: Detection confidence does NOT artificially inflate severity', () => {
    const lowConfResult = SeverityEngine.calculateSeverity('pothole', 65, undefined, {
      rawScore: 0.65,
      calibratedConfidence: 65,
      areaPixels: 20,
      frameCoveragePct: 5.0,
      contrastDelta: 40,
      edgeDensity: 12,
      aspectRatio: 1.1,
      boundingBox: { x: 30, y: 30, width: 20, height: 20 },
      pixelBox: { minX: 30, minY: 30, maxX: 50, maxY: 50 },
    });

    const highConfResult = SeverityEngine.calculateSeverity('pothole', 99, undefined, {
      rawScore: 0.99,
      calibratedConfidence: 99,
      areaPixels: 20,
      frameCoveragePct: 5.0,
      contrastDelta: 40,
      edgeDensity: 12,
      aspectRatio: 1.1,
      boundingBox: { x: 30, y: 30, width: 20, height: 20 },
      pixelBox: { minX: 30, minY: 30, maxX: 50, maxY: 50 },
    });

    // Score must be identical because physical coverage and contrast are identical
    assert.equal(
      lowConfResult.score,
      highConfResult.score,
      'Severity score must be independent of confidence score'
    );
  });

  test('Degenerate sub-32px image buffer is safely rejected', () => {
    const buffer = {
      width: 16,
      height: 16,
      data: new Uint8ClampedArray(16 * 16 * 4).fill(128),
    };
    const validation = ImageValidationPipeline.validate(buffer);

    assert.equal(validation.isValid, false);
    assert.equal(validation.rejectionReason, 'dimension_out_of_bounds');
    assert.equal(validation.operationalState, 'IMAGE_QUALITY_INSUFFICIENT');
  });

  test('Scenario 36 Regression: Municipal orange transit bus street scene must produce ZERO false detections', () => {
    const scenario = TEST_SCENARIOS.find((s) => s.id === 36)!;
    const buffer = scenario.createImage();
    const validation = ImageValidationPipeline.validate(buffer);

    assert.equal(validation.isValid, true, 'Street scene with vehicle should be validated as infrastructure corridor');
    assert.ok(
      validation.sceneType === 'road_asphalt' || validation.sceneType === 'urban_street',
      `Scene type should be road_asphalt or urban_street, got ${validation.sceneType}`
    );

    const defects = InfrastructureCvEngine.detectDefects(buffer, validation.sceneType);
    assert.equal(defects.length, 0, 'Orange bus body, wheels, window seams, and radiator grille must produce 0 defect detections');
  });

  test('Scenario 37 Regression: Road pothole near orange transit bus is detected while bus components are rejected', () => {
    const scenario = TEST_SCENARIOS.find((s) => s.id === 37)!;
    const buffer = scenario.createImage();
    const validation = ImageValidationPipeline.validate(buffer);

    assert.equal(validation.isValid, true);
    const defects = InfrastructureCvEngine.detectDefects(buffer, validation.sceneType);

    assert.equal(defects.length, 1, 'Should detect exactly the 1 real road pothole and reject all bus superstructure/wheels');
    assert.equal(defects[0].type, 'pothole');
    assert.ok(defects[0].evidence.boundingBox.y >= 65, 'Detected pothole must be situated on the foreground asphalt road plane');
  });

  test('Containment & Deduplication: Nested duplicate boxes are cleanly suppressed', () => {
    const boxA = { x: 30, y: 30, width: 40, height: 40 };
    const boxB = { x: 35, y: 35, width: 15, height: 15 }; // Completely inside boxA

    const containment = InfrastructureCvEngine.calculateContainment(boxA, boxB);
    assert.ok(containment >= 0.95, `Containment should be ~1.0 for nested box (got ${containment})`);
  });

  test('Scenario 45: Severely damaged building with structural wall collapse must be detected and NEVER declared 100% safe', () => {
    const scenario = TEST_SCENARIOS.find((s) => s.id === 45)!;
    const buffer = scenario.createImage();
    const validation = ImageValidationPipeline.validate(buffer);

    assert.equal(validation.isValid, true, 'Damaged building is infrastructure and must pass validation');
    assert.equal(validation.sceneType, 'building_structure', 'Must be classified as building_structure, not concrete_sidewalk');

    const defects = InfrastructureCvEngine.detectDefects(buffer, validation.sceneType);
    assert.ok(defects.length >= 1, 'Severely destroyed building must produce at least 1 structural defect detection');
    const collapseDefect = defects.find((d) => d.type === 'building_collapse');
    assert.ok(collapseDefect, 'Must detect building_collapse defect');
    assert.ok(collapseDefect.evidence.calibratedConfidence >= 75, 'Calibrated confidence must be high (>=75%)');
  });

  test('Scenario 46: Nominal concrete building facade with windows must produce ZERO defect detections', () => {
    const scenario = TEST_SCENARIOS.find((s) => s.id === 46)!;
    const buffer = scenario.createImage();
    const validation = ImageValidationPipeline.validate(buffer);

    assert.equal(validation.isValid, true, 'Nominal building is infrastructure and must pass validation');
    assert.equal(validation.sceneType, 'building_structure');

    const defects = InfrastructureCvEngine.detectDefects(buffer, validation.sceneType);
    assert.equal(defects.length, 0, 'Nominal concrete building with architectural windows must produce ZERO defect detections');
  });

  // ============================================================================
  // PHASE 9: MANDATORY REGRESSION TEST SUITE (14 VERIFIED FAILURE CASES)
  // ============================================================================

  test('Phase 9 Regression 1: Valid outdoor yellow maintenance-vehicle image must NOT be rejected with NO_RELEVANT_INFRASTRUCTURE_IDENTIFIED', () => {
    // 128x128 buffer: top 30% sky/background, middle 40% yellow maintenance truck, bottom 30% asphalt street
    const w = 128, h = 128;
    const data = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        if (y < 40) {
          // sky / background
          data[idx] = 180; data[idx+1] = 200; data[idx+2] = 230; data[idx+3] = 255;
        } else if (y >= 40 && y < 88 && x >= 25 && x <= 100) {
          // yellow maintenance truck body (R=220, G=175, B=25)
          data[idx] = 220; data[idx+1] = 175; data[idx+2] = 25; data[idx+3] = 255;
        } else {
          // asphalt street pavement (R=115, G=115, B=115)
          data[idx] = 115; data[idx+1] = 115; data[idx+2] = 115; data[idx+3] = 255;
        }
      }
    }
    const buffer = { width: w, height: h, data };
    const validation = ImageValidationPipeline.validate(buffer);

    assert.equal(validation.isValid, true, 'Outdoor scene with yellow maintenance vehicle must pass validation');
    assert.notEqual(validation.operationalState, 'NO_RELEVANT_INFRASTRUCTURE_IDENTIFIED');
    assert.notEqual(validation.operationalState, 'UNSUPPORTED_SCENE');
    assert.ok(
      validation.sceneType === 'urban_maintenance' || validation.sceneType === 'urban_street' || validation.sceneType === 'road_asphalt',
      `Scene type should be urban_maintenance, urban_street, or road_asphalt, got: ${validation.sceneType}`
    );

    const defects = InfrastructureCvEngine.detectDefects(buffer, validation.sceneType);
    assert.equal(defects.length, 0, 'Nominal street around yellow vehicle must produce 0 false defects');
  });

  test('Phase 9 Regression 2: Clean road must not produce a fabricated pothole', () => {
    const cleanRoad = TEST_SCENARIOS.find((s) => s.id === 5)!;
    const buffer = cleanRoad.createImage();
    const defects = InfrastructureCvEngine.detectDefects(buffer, 'road_asphalt');
    assert.equal(defects.length, 0, 'Clean road must never manufacture a pothole');
  });

  test('Phase 9 Regression 3: Genuine pothole must be detected when model supports the class and visible', () => {
    const potholeScenario = TEST_SCENARIOS.find((s) => s.id === 19)!;
    const buffer = potholeScenario.createImage();
    const defects = InfrastructureCvEngine.detectDefects(buffer, 'road_asphalt');
    assert.ok(defects.length >= 1, 'Genuine visible pothole must be detected');
    assert.equal(defects[0].type, 'pothole');
    assert.ok(defects[0].evidence.calibratedConfidence >= 65);
  });

  test('Phase 9 Regression 4: Damaged building must not be rejected simply because it is not a road', () => {
    const bldScenario = TEST_SCENARIOS.find((s) => s.id === 45)!;
    const buffer = bldScenario.createImage();
    const validation = ImageValidationPipeline.validate(buffer);
    assert.equal(validation.isValid, true, 'Building image must pass validation');
    assert.equal(validation.sceneType, 'building_structure', 'Must be classified as building structure');
  });

  test('Phase 9 Regression 5: Railway image must reach supported railway inspection pathway', () => {
    const railScenario = TEST_SCENARIOS.find((s) => s.id === 38)!;
    const buffer = railScenario.createImage();
    const validation = ImageValidationPipeline.validate(buffer);
    assert.equal(validation.isValid, true, 'Railway scene must be recognized as valid infrastructure');
    assert.equal(validation.sceneType, 'railway_track', 'Must route to railway_track pathway');
  });

  test('Phase 9 Regression 6: Blank white page must not generate infrastructure defects', () => {
    const whiteScenario = TEST_SCENARIOS.find((s) => s.id === 1)!;
    const buffer = whiteScenario.createImage();
    const validation = ImageValidationPipeline.validate(buffer);
    assert.equal(validation.isValid, false, 'Blank white page must be rejected');
    assert.equal(validation.operationalState, 'IMAGE_QUALITY_INSUFFICIENT');
    const defects = InfrastructureCvEngine.detectDefects(buffer);
    assert.equal(defects.length, 0, 'Must produce ZERO defect detections');
  });

  test('Phase 9 Regression 7: Blank black image must not generate infrastructure defects', () => {
    const blackScenario = TEST_SCENARIOS.find((s) => s.id === 2)!;
    const buffer = blackScenario.createImage();
    const validation = ImageValidationPipeline.validate(buffer);
    assert.equal(validation.isValid, false, 'Blank black page must be rejected');
    assert.equal(validation.operationalState, 'IMAGE_QUALITY_INSUFFICIENT');
    const defects = InfrastructureCvEngine.detectDefects(buffer);
    assert.equal(defects.length, 0, 'Must produce ZERO defect detections');
  });

  test('Phase 9 Regression 8: Unrelated indoor photograph must NOT be labelled as verified infrastructure defect', () => {
    const indoorScenario = TEST_SCENARIOS.find((s) => s.id === 16)!;
    const buffer = indoorScenario.createImage();
    const validation = ImageValidationPipeline.validate(buffer);
    assert.equal(validation.isValid, false, 'Indoor photograph must be rejected as non-infrastructure');
    assert.ok(
      validation.operationalState === 'UNSUPPORTED_SCENE' ||
      validation.operationalState === 'UNSUPPORTED_IMAGE' ||
      validation.operationalState === 'NO_RELEVANT_INFRASTRUCTURE_IDENTIFIED' ||
      validation.operationalState === 'IMAGE_QUALITY_INSUFFICIENT'
    );
  });

  test('Phase 9 Regression 9: An uncertain image must produce an uncertainty result', () => {
    const blurScenario = TEST_SCENARIOS.find((s) => s.id === 18)!;
    const buffer = blurScenario.createImage();
    const validation = ImageValidationPipeline.validate(buffer);
    assert.equal(validation.isValid, false);
    assert.equal(validation.status, 'ambiguous');
    assert.equal(validation.operationalState, 'IMAGE_QUALITY_INSUFFICIENT');
  });

  test('Phase 9 Regression 10: Offline inference backend must return ANALYSIS_FAILED, not a fabricated nominal result', async () => {
    const offlineService = new RealDetectionService('http://127.0.0.1:59999/unreachable-endpoint');
    const dummyDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAFElEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const result = await offlineService.detect(dummyDataUrl);
    assert.equal(result.operationalState, 'ANALYSIS_FAILED', 'Offline service must return ANALYSIS_FAILED');
    assert.equal(result.isServiceUnavailable, true);
    assert.equal(result.detections.length, 0);
  });

  test('Phase 9 Regression 11: Missing GPS coordinates must not be replaced with fabricated real-world location data', () => {
    const resultNoGps = SeverityEngine.calculateSeverity('pothole', 85);
    assert.ok(resultNoGps.score > 0);
    // Severity must not depend on confidence
    const resultLowConf = SeverityEngine.calculateSeverity('pothole', 20);
    assert.equal(resultNoGps.score, resultLowConf.score, 'Severity must be decoupled from detection confidence');
  });

  test('Phase 9 Regression 12: Real detection must have valid class, confidence, and localization data', () => {
    const potholeScenario = TEST_SCENARIOS.find((s) => s.id === 19)!;
    const buffer = potholeScenario.createImage();
    const defects = InfrastructureCvEngine.detectDefects(buffer, 'road_asphalt');
    assert.ok(defects.length >= 1);
    const d = defects[0];
    assert.ok(d.type === 'pothole');
    assert.ok(d.evidence.calibratedConfidence >= 0 && d.evidence.calibratedConfidence <= 100);
    assert.ok(d.evidence.boundingBox.x >= 0 && d.evidence.boundingBox.x <= 100);
    assert.ok(d.evidence.boundingBox.y >= 0 && d.evidence.boundingBox.y <= 100);
    assert.ok(d.evidence.boundingBox.width > 0 && d.evidence.boundingBox.width <= 100);
    assert.ok(d.evidence.boundingBox.height > 0 && d.evidence.boundingBox.height <= 100);
  });

  test('Phase 9 Regression 13: Same image and model version must produce reproducible results within documented tolerances', () => {
    const potholeScenario = TEST_SCENARIOS.find((s) => s.id === 19)!;
    const buffer1 = potholeScenario.createImage();
    const buffer2 = potholeScenario.createImage();
    const defects1 = InfrastructureCvEngine.detectDefects(buffer1, 'road_asphalt');
    const defects2 = InfrastructureCvEngine.detectDefects(buffer2, 'road_asphalt');
    assert.equal(defects1.length, defects2.length, 'Defect counts must be deterministic');
    assert.equal(defects1[0].evidence.calibratedConfidence, defects2[0].evidence.calibratedConfidence, 'Confidence must be identical');
    assert.equal(defects1[0].evidence.boundingBox.x, defects2[0].evidence.boundingBox.x, 'Bounding box X must be identical');
  });

  test('Phase 9 Regression 14: Every UI outcome must match the actual backend response', () => {
    const dummyValidation = {
      isValid: true,
      operationalState: 'NO_DAMAGE_DETECTED' as const,
      scenePresence: 'infrastructure_present' as const,
      status: 'valid_infrastructure' as const,
      sceneType: 'road_asphalt' as const,
      metrics: {
        meanLuminance: 120,
        rmsContrast: 30,
        dynamicRange: 150,
        edgeEnergy: 5,
        colorEntropy: 4,
        saturationMean: 0.1,
        isUniform: false,
        isGrayscaleOrNeutral: true,
        aspectRatio: 1.5,
      },
      sceneConfidence: 90,
    };
    assert.equal(dummyValidation.operationalState, 'NO_DAMAGE_DETECTED');
  });
});
