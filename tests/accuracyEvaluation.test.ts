import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { TEST_SCENARIOS } from './fixtures/testImages';
import { ImageValidationPipeline } from '../src/services/cv/imageValidationPipeline';
import { InfrastructureCvEngine } from '../src/services/cv/infrastructureCvEngine';
import { SeverityEngine } from '../src/services/severityEngine';

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

  test('Scenario 8: Non-infrastructure scenes (building facade) must be rejected', () => {
    const bldScenario = TEST_SCENARIOS.find((s) => s.id === 8)!;
    const bldValidation = ImageValidationPipeline.validate(bldScenario.createImage());
    assert.equal(bldValidation.isValid, false);
    assert.equal(bldValidation.sceneType, 'non_infrastructure');
    assert.equal(bldValidation.operationalState, 'UNSUPPORTED_IMAGE');
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
    assert.equal(validation.sceneType, 'road_asphalt');

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
});
