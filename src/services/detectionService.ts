import { Detection, DetectionClass, InfrastructureCategory, Severity } from '../types/infrastructure';
import { SAMPLE_STREET_IMAGES } from '../data/sampleStreetImages';
import { ImageDecoder } from './cv/imageDecoder';
import { ImageValidationPipeline } from './cv/imageValidationPipeline';
import { InfrastructureCvEngine } from './cv/infrastructureCvEngine';
import { ImageValidationResult, OperationalDecisionState, CropVerificationResult } from './cv/types';
import { SeverityEngine } from './severityEngine';

export interface DetectionServiceResult {
  detections: Detection[];
  validation: ImageValidationResult;
  operationalState: OperationalDecisionState;
  modelEngineName: string;
  isSimulated: boolean;
  isServiceUnavailable?: boolean;
  errorMessage?: string;
  cropVerifications?: CropVerificationResult[];
}

export interface IDetectionService {
  name: string;
  isSimulated: boolean;
  detect(imageSource: string, presetId?: string): Promise<DetectionServiceResult>;
}

/**
 * Maps vision defect classes to municipal infrastructure categories and baseline hazard ratings
 */
export const CLASS_TO_CATEGORY: Record<
  DetectionClass,
  { category: InfrastructureCategory; label: string; baseThreatScore: number }
> = {
  pothole: { category: 'road_damage', label: 'Pothole & Cavity', baseThreatScore: 78 },
  damaged_road: { category: 'road_damage', label: 'Asphalt Delamination & Fissure', baseThreatScore: 70 },
  garbage_accumulation: { category: 'waste_accumulation', label: 'Bulk Solid Refuse', baseThreatScore: 55 },
  overflowing_drain: { category: 'drainage_overflow', label: 'Stormwater Surcharge', baseThreatScore: 84 },
  broken_streetlight: { category: 'lighting_failure', label: 'Unlit / Damaged Luminaire', baseThreatScore: 62 },
  exposed_electrical_wire: { category: 'electrical_hazard', label: 'Exposed High-Voltage Line', baseThreatScore: 95 },
  damaged_sidewalk: { category: 'sidewalk_hazard', label: 'Displaced Paving / Trip Hazard', baseThreatScore: 65 },
  missing_road_sign: { category: 'traffic_signage', label: 'Missing / Dislodged Traffic Sign', baseThreatScore: 50 },
  structural_crack: { category: 'building_damage', label: 'Structural Masonry Fracture', baseThreatScore: 82 },
  building_collapse: { category: 'building_damage', label: 'Structural Wall Collapse & Breach', baseThreatScore: 98 },
  rubble_debris: { category: 'building_damage', label: 'Rubble & Masonry Debris Accumulation', baseThreatScore: 86 },
  spalling_concrete: { category: 'bridge_damage', label: 'Concrete Spalling & Exposed Rebar', baseThreatScore: 85 },
  bridge_expansion_defect: { category: 'bridge_damage', label: 'Bridge Expansion Joint Failure', baseThreatScore: 76 },
  railway_defect: { category: 'railway_damage', label: 'Defective / Fractured Rail Head', baseThreatScore: 92 },
  utility_mast_damage: { category: 'public_utility', label: 'Severed / Damaged Utility Mast', baseThreatScore: 88 },
};

/**
 * Local Computer Vision Detection Service
 * Runs verified computer vision directly in the client (or Node test runner)
 * using ImageValidationPipeline and InfrastructureCvEngine.
 * Analyzes actual pixel content for every image without hardcoded shortcuts.
 */
export class LocalCvDetectionService implements IDetectionService {
  name = 'InfraLens Local Vision Engine (Client-Side CV)';
  isSimulated = false;

  async detect(imageSource: string, _presetId?: string): Promise<DetectionServiceResult> {
    // 1. Decode the incoming image to raw pixel buffer
    let buffer;
    try {
      buffer = await ImageDecoder.decode(imageSource);
    } catch (err: any) {
      return {
        detections: [],
        validation: {
          isValid: false,
          operationalState: 'IMAGE_QUALITY_INSUFFICIENT',
          scenePresence: 'image_unsuitable',
          status: 'rejected',
          sceneType: 'blank',
          rejectionReason: 'corrupt_or_invalid_format',
          rejectionMessage: `Image could not be decoded: ${err?.message || 'Unsupported format'}`,
          metrics: {
            meanLuminance: 0,
            rmsContrast: 0,
            dynamicRange: 0,
            edgeEnergy: 0,
            colorEntropy: 0,
            saturationMean: 0,
            isUniform: true,
            isGrayscaleOrNeutral: false,
            aspectRatio: 1,
          },
          sceneConfidence: 0,
        },
        operationalState: 'IMAGE_QUALITY_INSUFFICIENT',
        modelEngineName: this.name,
        isSimulated: false,
      };
    }

    // 3. Stage A: Run Strict Image Validation
    const validation = ImageValidationPipeline.validate(buffer);

    if (!validation.isValid) {
      // Rejection: Blank white/black page, uniform tone, document, or non-infrastructure
      // Strictly returns ZERO detections. Never manufactures a defect!
      return {
        detections: [],
        validation,
        operationalState: validation.operationalState,
        modelEngineName: this.name,
        isSimulated: false,
      };
    }

    // 4. Stage B: Run Genuine Computer Vision Defect Detection
    const rawDetections = InfrastructureCvEngine.detectDefects(buffer, validation.sceneType);

    // 5. Convert to Structured Detections with Evidence-Based Severity
    const detections: Detection[] = rawDetections.map((det, idx) => {
      const sevResult = SeverityEngine.calculateSeverity(
        det.type,
        det.evidence.calibratedConfidence,
        undefined,
        det.evidence
      );

      return {
        id: `cv-det-${Date.now()}-${idx}`,
        type: det.type,
        typeLabel: det.label,
        confidence: det.evidence.calibratedConfidence,
        boundingBox: det.evidence.boundingBox,
        severity: sevResult.severity,
        severityScore: sevResult.score,
        metadata: {
          roadCoveragePct: det.evidence.frameCoveragePct,
          surfaceType: validation.sceneType === 'concrete_sidewalk' ? 'concrete' : 'asphalt',
          notes: sevResult.rationale,
          measurementMode: 'pixel_based_uncalibrated',
          estimatedPixelArea: det.evidence.areaPixels,
          damageExtentEstimateLabel: 'Pixel-based extent. Metric mm requires metric camera/LiDAR calibration.',
        },
      };
    });

    const cropVerifications = rawDetections
      .map((d) => d.evidence.cropVerification)
      .filter(Boolean) as CropVerificationResult[];

    let operationalState: OperationalDecisionState = 'NO_DAMAGE_DETECTED';
    if (detections.length > 0) {
      const hasHighConfidence = detections.some((d) => d.confidence >= 65);
      operationalState = hasHighConfidence ? 'DAMAGE_VERIFIED' : 'UNCERTAIN_REQUIRES_REVIEW';
    }

    return {
      detections,
      validation,
      operationalState,
      cropVerifications,
      modelEngineName: this.name,
      isSimulated: false,
    };
  }
}

/**
 * Real Backend Inference Service Adapter
 * Connects to a dedicated inference server (REST API / ONNX Runtime).
 * If the service is unreachable, it NEVER silently manufactures fake detections!
 */
export class RealDetectionService implements IDetectionService {
  name = 'Production Inference Backend (REST / ONNX API)';
  isSimulated = false;

  private endpointUrl: string;

  constructor(endpointUrl: string = 'http://localhost:3001/api/v1/detect') {
    this.endpointUrl = endpointUrl;
  }

  async detect(imageSource: string, presetId?: string): Promise<DetectionServiceResult> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(this.endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageSource, presetId }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Inference server responded with HTTP ${response.status}`);
      }

      const data = await response.json();

      const validation: ImageValidationResult = data.validation || {
        isValid: data.status !== 'rejected',
        operationalState: data.operationalState || (data.status === 'rejected' ? 'IMAGE_QUALITY_INSUFFICIENT' : 'NO_DAMAGE_DETECTED'),
        scenePresence: data.status === 'rejected' ? 'image_unsuitable' : 'infrastructure_present',
        status: data.status === 'rejected' ? 'rejected' : 'valid_infrastructure',
        sceneType: data.sceneType || 'road_asphalt',
        rejectionReason: data.rejectionReason,
        rejectionMessage: data.message,
        metrics: data.metrics || {
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

      const dets = data.detections || [];
      const operationalState: OperationalDecisionState = data.operationalState || (
        !validation.isValid ? validation.operationalState :
        dets.length > 0 ? 'DAMAGE_VERIFIED' : 'NO_DAMAGE_DETECTED'
      );

      return {
        detections: dets,
        validation,
        operationalState,
        cropVerifications: data.cropVerifications,
        modelEngineName: data.modelName || this.name,
        isSimulated: false,
      };
    } catch (err: any) {
      // Phase 3 & Phase 4 requirement:
      // Do NOT silently substitute mock predictions when the backend fails!
      console.warn('[InfraLens Vision] Real inference backend is offline at', this.endpointUrl, err?.message);

      return {
        detections: [],
        validation: {
          isValid: false,
          operationalState: 'ANALYSIS_FAILED',
          scenePresence: 'image_unsuitable',
          status: 'rejected',
          sceneType: 'ambiguous',
          rejectionReason: 'corrupt_or_invalid_format',
          rejectionMessage: 'Inference backend service is currently unreachable.',
          metrics: {
            meanLuminance: 0,
            rmsContrast: 0,
            dynamicRange: 0,
            edgeEnergy: 0,
            colorEntropy: 0,
            saturationMean: 0,
            isUniform: true,
            isGrayscaleOrNeutral: false,
            aspectRatio: 1,
          },
          sceneConfidence: 0,
        },
        operationalState: 'ANALYSIS_FAILED',
        modelEngineName: this.name,
        isSimulated: false,
        isServiceUnavailable: true,
        errorMessage: `Inference backend offline at ${this.endpointUrl}. Start the backend server with 'npm run server' or switch to the Local Vision Engine.`,
      };
    }
  }
}

/**
 * Backward compatibility alias for legacy mock service:
 * Points to LocalCvDetectionService so no fake mock detections are ever produced.
 */
export class MockDetectionService extends LocalCvDetectionService {
  override name = 'InfraLens Local Vision Engine (Deterministic Mode)';
}

export class DetectionServiceFactory {
  // Default to LocalCvDetectionService which runs genuine CV without external server dependencies
  private static instance: IDetectionService = new LocalCvDetectionService();

  static getService(): IDetectionService {
    return this.instance;
  }

  static setService(service: IDetectionService): void {
    this.instance = service;
  }
}
