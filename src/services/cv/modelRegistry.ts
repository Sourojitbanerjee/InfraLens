import { InfrastructureCategory, DetectionClass } from '../../types/infrastructure';
import { ModelCapability } from './types';

/**
 * Model Capability Matrix & Category Evaluation
 * Explicitly distinguishes supported categories with trained/evaluated visual detectors
 * from specialized categories that require dedicated external weights.
 */
export const MODEL_CAPABILITIES: Record<InfrastructureCategory, ModelCapability> = {
  road_damage: {
    category: 'road_damage',
    classes: ['pothole', 'damaged_road'],
    modelName: 'InfraLens-RoadCV-v2 (Surface Anomaly & Cavity Segmenter)',
    isTrainedAndIntegrated: true,
    calibratedThreshold: 65.0, // Calibrated to eliminate road shadow false positives
    supportedFeatures: [
      'Dark surface cavity localization',
      'Fractured perimeter gradient analysis',
      'Longitudinal and alligator fissure line extraction',
      'Road surface texture differential'
    ],
    knownLimitations: 'Very low-light scenes or heavy rain puddles can reduce contrast. Calibrated threshold of 65% prevents shadow misclassifications.'
  },
  drainage_overflow: {
    category: 'drainage_overflow',
    classes: ['overflowing_drain'],
    modelName: 'InfraLens-DrainCV-v1 (Culvert & Standing Water Segmenter)',
    isTrainedAndIntegrated: true,
    calibratedThreshold: 68.0,
    supportedFeatures: [
      'Stormwater grating pattern detection',
      'Specular ponding and localized standing water detection',
      'Sediment blockage surrounding storm drain frames'
    ],
    knownLimitations: 'Requires visible drainage structure or distinct pooling contrast; dry nominal drains are classified as nominal infrastructure.'
  },
  waste_accumulation: {
    category: 'waste_accumulation',
    classes: ['garbage_accumulation'],
    modelName: 'InfraLens-WasteCV-v1 (Refuse & Debris Cluster Segmenter)',
    isTrainedAndIntegrated: true,
    calibratedThreshold: 70.0,
    supportedFeatures: [
      'Multi-spectral chromatic variance on asphalt/curb',
      'High-frequency irregular contour grouping',
      'Bulk debris spatial clustering'
    ],
    knownLimitations: 'Small scattered litter items below 3% image frame are suppressed to avoid false positives; requires bulk refuse accumulation.'
  },
  sidewalk_hazard: {
    category: 'sidewalk_hazard',
    classes: ['damaged_sidewalk'],
    modelName: 'InfraLens-PavementCV-v1 (Concrete Slab Discontinuity Detector)',
    isTrainedAndIntegrated: true,
    calibratedThreshold: 65.0,
    supportedFeatures: [
      'Horizontal concrete joint displacement',
      'Elevation lip step edge detection',
      'Buckled paving flagstone detection'
    ],
    knownLimitations: 'Decorative expansion joints can resemble cracks if threshold is too low; calibrated threshold separates true displacements from expansion lines.'
  },
  electrical_hazard: {
    category: 'electrical_hazard',
    classes: ['exposed_electrical_wire'],
    modelName: 'InfraLens-Specialized-Electrical (External Model Required)',
    isTrainedAndIntegrated: false,
    calibratedThreshold: 80.0,
    supportedFeatures: [
      'Linear conduit tracking'
    ],
    knownLimitations: 'Sub-pixel electrical wires require high-resolution aerial utility sensors or dedicated multi-spectral cameras. Generic street photos without clear high-contrast dangling conductors will return zero detections rather than fabricating hazardous wire predictions.'
  },
  lighting_failure: {
    category: 'lighting_failure',
    classes: ['broken_streetlight'],
    modelName: 'InfraLens-Specialized-Luminaire (External Model Required)',
    isTrainedAndIntegrated: false,
    calibratedThreshold: 75.0,
    supportedFeatures: [
      'Mast arm vertical structure verification'
    ],
    knownLimitations: 'Streetlight daytime luminaire mechanical faults require specialized pole anchor models; nominal upright light posts will not be flagged as broken.'
  },
  traffic_signage: {
    category: 'traffic_signage',
    classes: ['missing_road_sign'],
    modelName: 'InfraLens-Specialized-Signage (External Model Required)',
    isTrainedAndIntegrated: false,
    calibratedThreshold: 75.0,
    supportedFeatures: [
      'Geometric regulatory sign contour recognition'
    ],
    knownLimitations: 'Determining that a sign is "missing" without geospatial municipal baseline asset inventory is non-trivial. Pure image analysis only flags visibly dislodged or heavily warped signs.'
  },
  bridge_damage: {
    category: 'bridge_damage',
    classes: ['spalling_concrete', 'bridge_expansion_defect', 'structural_crack'],
    modelName: 'InfraLens-BridgeCV-v1 (Concrete Spalling & Joint Defect Segmenter)',
    isTrainedAndIntegrated: true,
    calibratedThreshold: 67.0,
    supportedFeatures: [
      'Concrete spalling and delamination void localization',
      'Exposed reinforcing rebar contour extraction',
      'Structural bridge beam shear crack tracing',
      'Expansion joint gap failure detection'
    ],
    knownLimitations: 'Intentional bridge expansion joints and shadows from bridge railings are filtered out using geometric rectilinearity and periodicity analysis.'
  },
  building_damage: {
    category: 'building_damage',
    classes: ['structural_crack', 'building_collapse', 'rubble_debris', 'spalling_concrete'],
    modelName: 'InfraLens-BuildingCV-v1 (Structural Integrity & Wall Collapse Segmenter)',
    isTrainedAndIntegrated: true,
    calibratedThreshold: 68.0,
    supportedFeatures: [
      'Diagonal masonry shear fracture detection',
      'Structural wall collapse and envelope breach localization',
      'Exposed interior space and cavity recognition',
      'Volumetric rubble and shattered concrete debris analysis',
      'Concrete spalling and reinforcement delamination tracking',
      'Architectural glazing and standard window aperture exclusion'
    ],
    knownLimitations: 'Standard window apertures, brick mortar lines, and decorative moldings are filtered out through periodicity, rectilinearity, and symmetry filters.'
  },
  railway_damage: {
    category: 'railway_damage',
    classes: ['railway_defect'],
    modelName: 'InfraLens-RailCV-v1 (Rail Head Discontinuity & Obstruction Segmenter)',
    isTrainedAndIntegrated: true,
    calibratedThreshold: 70.0,
    supportedFeatures: [
      'Parallel steel rail linear specular tracking',
      'Rail head fracture notch and continuity break detection',
      'Track corridor foreign obstruction identification',
      'Ballast bed displacement analysis'
    ],
    knownLimitations: 'Specular rail reflections and uniform wooden/concrete cross-ties are verified as nominal rail elements; defects require physical line discontinuity.'
  },
  public_utility: {
    category: 'public_utility',
    classes: ['utility_mast_damage', 'broken_streetlight'],
    modelName: 'InfraLens-UtilityCV-v1 (Utility Mast & Structural Failure Segmenter)',
    isTrainedAndIntegrated: true,
    calibratedThreshold: 66.0,
    supportedFeatures: [
      'Vertical utility pole axis deviation & fracture detection',
      'Severed structural mast identification on roadway corridor',
      'Damaged roadside cabinet and utility housing inspection'
    ],
    knownLimitations: 'Requires visible structural tilt or transverse fracture; nominal vertical upright utility poles are classified as nominal infrastructure.'
  }
};

/**
 * Validates whether a predicted class has a calibrated model
 */
export function getModelCapabilityForClass(detectionClass: DetectionClass): ModelCapability | undefined {
  for (const capability of Object.values(MODEL_CAPABILITIES)) {
    if (capability.classes.includes(detectionClass)) {
      return capability;
    }
  }
  return undefined;
}
