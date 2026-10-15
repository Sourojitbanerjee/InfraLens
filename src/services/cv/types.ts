import { BoundingBox, Detection, DetectionClass, InfrastructureCategory, Severity } from '../../types/infrastructure';

export interface ImagePixelBuffer {
  width: number;
  height: number;
  // RGBA pixel buffer (4 bytes per pixel: R, G, B, A)
  data: Uint8ClampedArray | Uint8Array;
}

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
  status: 'valid_infrastructure' | 'valid_non_defect' | 'rejected' | 'ambiguous';
  sceneType: SceneClassification;
  rejectionReason?: ImageRejectionReason;
  rejectionMessage?: string;
  metrics: ImageValidationMetrics;
  sceneConfidence: number;      // 0 - 100%
}

export interface DefectEvidence {
  rawScore: number;            // 0 - 1
  calibratedConfidence: number;// 0 - 100%
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

export type AnalysisOutcomeStatus =
  | 'in_progress'
  | 'defects_detected'
  | 'nominal_infrastructure'   // Valid infrastructure, no defects found
  | 'image_rejected'           // Blank, corrupt, or irrelevant
  | 'uncertain'                // Low confidence or ambiguous
  | 'service_unavailable';     // Backend offline
