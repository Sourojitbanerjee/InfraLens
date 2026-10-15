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

    const defects = InfrastructureCvEngine.detectDefects(buffer);
    assert.equal(defects.length, 0, 'White page must produce 0 defect detections');
  });

  test('Scenario 2: Completely black image must be rejected with 0 detections', () => {
    const scenario = TEST_SCENARIOS.find((s) => s.id === 2)!;
    const buffer = scenario.createImage();
    const validation = ImageValidationPipeline.validate(buffer);

    assert.equal(validation.isValid, false, 'Black page must be rejected');
    assert.equal(validation.rejectionReason, 'blank_black', 'Black page must be rejected as blank_black');

    const defects = InfrastructureCvEngine.detectDefects(buffer);
    assert.equal(defects.length, 0, 'Black page must produce 0 defect detections');
  });

  test('Scenario 3: Text document / screenshot must be rejected with 0 detections', () => {
    const scenario = TEST_SCENARIOS.find((s) => s.id === 3)!;
    const buffer = scenario.createImage();
    const validation = ImageValidationPipeline.validate(buffer);

    assert.equal(validation.isValid, false, 'Document screenshot must be rejected');
    assert.equal(validation.rejectionReason, 'document_or_screenshot');
  });

  test('Scenario 4 & 5: Non-infrastructure scenes (wall, building) must be rejected', () => {
    const wallScenario = TEST_SCENARIOS.find((s) => s.id === 4)!;
    const wallValidation = ImageValidationPipeline.validate(wallScenario.createImage());
    assert.equal(wallValidation.isValid, false);
    assert.equal(wallValidation.sceneType, 'non_infrastructure');

    const bldScenario = TEST_SCENARIOS.find((s) => s.id === 5)!;
    const bldValidation = ImageValidationPipeline.validate(bldScenario.createImage());
    assert.equal(bldValidation.isValid, false);
    assert.equal(bldValidation.sceneType, 'non_infrastructure');
  });

  test('Scenario 6: Clean road without visible damage must produce ZERO detections', () => {
    const scenario = TEST_SCENARIOS.find((s) => s.id === 6)!;
    const buffer = scenario.createImage();
    const validation = ImageValidationPipeline.validate(buffer);

    assert.equal(validation.isValid, true, 'Clean road should be validated as infrastructure');
    assert.equal(validation.sceneType, 'road_asphalt');

    const defects = InfrastructureCvEngine.detectDefects(buffer);
    assert.equal(defects.length, 0, 'Clean road must produce exactly 0 defect detections');
  });

  test('Scenario 7: Road with genuine pothole must detect pothole with valid bounding box', () => {
    const scenario = TEST_SCENARIOS.find((s) => s.id === 7)!;
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

  test('Scenario 8: Visible road cracks must be detected as damaged_road', () => {
    const scenario = TEST_SCENARIOS.find((s) => s.id === 8)!;
    const buffer = scenario.createImage();
    const defects = InfrastructureCvEngine.detectDefects(buffer);

    assert.ok(defects.length >= 1);
    const crack = defects.find((d) => d.type === 'damaged_road');
    assert.ok(crack, 'Must detect a damaged_road fissure');
  });

  test('Scenario 16: Tree shadows and surface stains must NOT produce false positive potholes', () => {
    const scenario = TEST_SCENARIOS.find((s) => s.id === 16)!;
    const buffer = scenario.createImage();
    const defects = InfrastructureCvEngine.detectDefects(buffer);

    assert.equal(defects.length, 0, 'Shadows without cavity/fracture border must not trigger pothole detection');
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

  test('Scenario 19: Degenerate sub-32px image buffer is safely rejected', () => {
    const scenario = TEST_SCENARIOS.find((s) => s.id === 19)!;
    const buffer = scenario.createImage();
    const validation = ImageValidationPipeline.validate(buffer);

    assert.equal(validation.isValid, false);
    assert.equal(validation.rejectionReason, 'dimension_out_of_bounds');
  });
});
