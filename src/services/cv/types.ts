import { BoundingBox, Detection, DetectionClass, InfrastructureCategory, Severity } from '../../types/infrastructure';

export interface ImagePixelBuffer {
  width: number;
  height: number;
  // RGBA pixel buffer (4 bytes per pixel: R, G, B, A)
  data: Uint8ClampedArray | Uint8Array;
}

/**
 * Universal Operational Decision States (8 Canonical Outcomes)
 * Enforces strict decision policies with zero manufactured positive outcomes.
 */
export type UniversalOperationalDecisionState =
  | 'INFRASTRUCTURE_DAMAGE_VERIFIED'
  | 'NO_DAMAGE_DETECTED_WITHIN_SUPPORTED_SCOPE'
  | 'INFRASTRUCTURE_PRESENT_BUT_UNCERTAIN'
  | 'NO_RELEVANT_INFRASTRUCTURE_IDENTIFIED'
  | 'IMAGE_QUALITY_INSUFFICIENT'
  | 'UNSUPPORTED_INFRASTRUCTURE_CATEGORY'
  | 'MODEL_UNAVAILABLE'
  | 'INFERENCE_FAILED';

export type OperationalDecisionState =
  | UniversalOperationalDecisionState
  | 'DAMAGE_VERIFIED'             // Alias for INFRASTRUCTURE_DAMAGE_VERIFIED
  | 'NO_DAMAGE_DETECTED'           // Alias for NO_DAMAGE_DETECTED_WITHIN_SUPPORTED_SCOPE
  | 'UNCERTAIN'                    // Alias for INFRASTRUCTURE_PRESENT_BUT_UNCERTAIN
  | 'UNSUPPORTED_IMAGE'            // Alias for NO_RELEVANT_INFRASTRUCTURE_IDENTIFIED
  | 'ANALYSIS_FAILED';             // Alias for INFERENCE_FAILED

/**
 * Scene Taxonomy separating infrastructure presence from defects (Phase 2 Stage B)
 */
export type ScenePresenceStatus =
  | 'infrastructure_present'
  | 'infrastructure_absent'
  | 'infrastructure_uncertain'
  | 'infrastructure_present_with_potential_defect'
  | 'image_unsuitable';

export type ImageRejectionReason =
  | 'blank_white'
  | 'blank_black'
  | 'uniform_blank'
  | 'document_or_screenshot'
  | 'non_infrastructure'
  | 'blurry_unusable'
  | 'overexposed_or_underexposed'
  | 'corrupt_or_invalid_format'
  | 'dimension_out_of_bounds';

export type SceneClassification =
  | 'road_asphalt'
  | 'bridge_overpass'
  | 'building_structure'
  | 'railway_track'
  | 'concrete_sidewalk'
  | 'urban_street'
  | 'drainage_structure'
  | 'utility_corridor'
  | 'lighting_infrastructure'
  | 'traffic_infrastructure'
  | 'public_utility'
  | 'non_infrastructure'
  | 'blank'
  | 'ambiguous';

export interface SceneElement {
  label: string;
  confidence: number;
  coveragePct: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export interface SceneUnderstandingResult {
  visibleElements: SceneElement[];
  containsInfrastructure: boolean;
  detectedCategories: InfrastructureCategory[];
  primaryCategory: InfrastructureCategory | 'none';
  candidateDefectRegions: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    category: InfrastructureCategory;
    evidenceContrast: number;
    evidenceGradient: number;
  }>;
  hasSufficientVisualEvidence: boolean;
  appropriateModels: string[];
  distractingObjects: {
    hasVehicles: boolean;
    hasPedestrians: boolean;
    hasWaterReflections: boolean;
    hasHeavyShadows: boolean;
    vehicleEnvelopes: Array<{ minX: number; minY: number; maxX: number; maxY: number; type: string }>;
  };
  explanation: string;
}

export interface ImageValidationMetrics {
  meanLuminance: number;       // 0 - 255
  rmsContrast: number;         // Standard deviation of luminance
  dynamicRange: number;        // max(L) - min(L)
  edgeEnergy: number;          // Average gradient magnitude
  colorEntropy: number;        // Information entropy across color channels
  saturationMean: number;      // 0 - 1
  isUniform: boolean;
  isGrayscaleOrNeutral: boolean;
  aspectRatio: number;
}

export interface ImageValidationResult {
  isValid: boolean;
  operationalState: OperationalDecisionState;
  scenePresence: ScenePresenceStatus;
  status: 'valid_infrastructure' | 'valid_non_defect' | 'rejected' | 'ambiguous';
  sceneType: SceneClassification;
  rejectionReason?: ImageRejectionReason;
  rejectionMessage?: string;
  metrics: ImageValidationMetrics;
  sceneConfidence: number;      // 0 - 100%
  sceneUnderstanding?: SceneUnderstandingResult;
}

/**
 * Multi-Stage Crop Verification Schema
 * Evaluates candidate defect crops for supporting vs. contradictory evidence
 * (e.g. manhole covers, asphalt patches, shadows, painted stripes, building windows, rail reflections)
 */
export interface CropVerificationResult {
  isValidCrop: boolean;
  supportsPositiveFinding: boolean;
  isUncertain: boolean;
  supportingEvidence: string[];
  contradictoryEvidence: string[];
  isManholeCover: boolean;
  isRoadRepairPatch: boolean;
  isSurfaceShadow: boolean;
  isPaintedMarking: boolean;
  isWetSurfaceReflection: boolean;
  isVehicleSuperstructure: boolean;
  isVehicleWheel: boolean;
  isVehicleWindowOrSeam: boolean;
  isVehicleGrille: boolean;
  isBuildingWindowOrMortar?: boolean;
  isRailwaySpecularReflect?: boolean;
  isBridgeExpansionJoint?: boolean;
  isOnPlausibleRoadSurface: boolean;
  roadSurfaceConfidence: number; // 0 - 100%
  cropCalibratedConfidence: number; // 0 - 100
  evidenceExplanation: string;
}

export interface DefectEvidence {
  rawScore: number;            // 0 - 1
  calibratedConfidence: number;// 0 - 100%
  roadSurfaceConfidence?: number; // 0 - 100%
  areaPixels: number;
  frameCoveragePct: number;    // % of image area
  contrastDelta: number;       // difference in luminance from background
  edgeDensity: number;         // density of gradient edges in bounding box
  aspectRatio: number;
  boundingBox: {
    x: number;                 // % 0-100
    y: number;                 // % 0-100
    width: number;             // % 0-100
    height: number;            // % 0-100
  };
  pixelBox: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  cropVerification?: CropVerificationResult;
}

export interface RawDefectDetection {
  type: DetectionClass;
  category: InfrastructureCategory;
  label: string;
  evidence: DefectEvidence;
}

export interface ModelCapability {
  category: InfrastructureCategory;
  classes: DetectionClass[];
  modelName: string;
  isTrainedAndIntegrated: boolean;
  calibratedThreshold: number; // minimum confidence threshold (0-100)
  supportedFeatures: string[];
  knownLimitations: string;
}

/**
 * Backward-compatible alias for AnalysisOutcomeStatus mapped to OperationalDecisionState
 */
export type AnalysisOutcomeStatus =
  | 'in_progress'
  | 'defects_detected'
  | 'nominal_infrastructure'   // Valid infrastructure, no defects found
  | 'image_rejected'           // Blank, corrupt, or irrelevant
  | 'uncertain'                // Low confidence or ambiguous
  | 'service_unavailable';     // Backend offline
