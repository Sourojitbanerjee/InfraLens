import { BoundingBox, Detection, DetectionClass, InfrastructureCategory, Severity } from '../../types/infrastructure';

export interface ImagePixelBuffer {
  width: number;
  height: number;
  // RGBA pixel buffer (4 bytes per pixel: R, G, B, A)
  data: Uint8ClampedArray | Uint8Array;
}

/**
 * Operational Decision States (Phase 4 Required States)
 * Enforces strict decision policies with zero manufactured positive outcomes.
 */
export type OperationalDecisionState =
  | 'DAMAGE_VERIFIED'             // Supported defect passed strict multi-stage verification
  | 'NO_DAMAGE_DETECTED'           // Suitable infrastructure scene, no actionable defect
  | 'UNCERTAIN'                    // Evidence present but ambiguous or partially obscured
  | 'UNSUPPORTED_IMAGE'            // Non-infrastructure, indoor, animals, food, documents
  | 'IMAGE_QUALITY_INSUFFICIENT'   // Severe blur, pitch black, overexposed, corrupt
  | 'ANALYSIS_FAILED';             // Engine/Backend failure or unreachable network

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
  | 'concrete_sidewalk'
  | 'urban_street'
  | 'drainage_structure'
  | 'utility_corridor'
  | 'non_infrastructure'
  | 'blank'
  | 'ambiguous';

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
}

/**
 * Multi-Stage Crop Verification Schema (Phase 3)
 * Evaluates candidate defect crops for supporting vs. contradictory evidence
 * (e.g. manhole covers, asphalt patches, shadows, painted stripes)
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
