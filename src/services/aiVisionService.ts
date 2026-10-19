import { 
  BoundingBox, 
  Detection, 
  DetectionClass, 
  ImpactAssessment, 
  InfrastructureCategory, 
  PriorityExplainability, 
  Severity 
} from '../types/infrastructure';
import { DetectionServiceFactory, CLASS_TO_CATEGORY } from './detectionService';
import { SeverityEngine } from './severityEngine';
import { ImpactEngine } from './impactEngine';
import { PriorityEngine } from './priorityEngine';
import { AuthorityResolver } from './authorityResolver';
import { 
  AnalysisOutcomeStatus, 
  ImageValidationResult, 
  OperationalDecisionState, 
  CropVerificationResult 
} from './cv/types';

export type AnalysisStage = 
  | 'idle' 
  | 'upload' 
  | 'processing' 
  | 'scanning' 
  | 'object_detection' 
  | 'severity_analysis' 
  | 'geolocation' 
  | 'impact_analysis' 
  | 'priority_generated' 
  | 'completed' 
  | 'error';

export interface AiInferenceResult {
  imageUrl: string;
  detections: BoundingBox[];
  structuredDetections: Detection[];
  dominantCategory: InfrastructureCategory;
  dominantSeverity: Severity;
  severityScore: number;
  confidence: number;
  impact: ImpactAssessment | null;
  priorityExplainability: PriorityExplainability | null;
  recommendedAction: string;
  suggestedAuthorityId: string;
  departmentName: string;
  modelEngineName: string;

  // Evidence-based validation & outcome statuses (Phase 2 & Phase 4 & Phase 6)
  outcomeStatus: AnalysisOutcomeStatus;
  operationalState: OperationalDecisionState;
  validationResult: ImageValidationResult;
  isActionable: boolean;
  statusExplanation: string;
  cropVerifications?: CropVerificationResult[];
}

export class AiVisionService {
  /**
   * Run end-to-end AI Street Analysis using active DetectionService with strict validation
   */
  static async analyzeStreetImage(
    imageUrl: string,
    presetId?: string,
    onProgress?: (stage: AnalysisStage, percent: number) => void,
    coordinateOverride?: { latitude: number; longitude: number }
  ): Promise<AiInferenceResult> {
    const lat = coordinateOverride?.latitude ?? 37.7792;
    const lon = coordinateOverride?.longitude ?? -122.4191;

    // Stage 1: UPLOAD
    onProgress?.('upload', 12);
    await new Promise((r) => setTimeout(r, 120));

    // Stage 2: IMAGE PROCESSING & INTEGRITY VALIDATION
    onProgress?.('processing', 25);
    const detectionService = DetectionServiceFactory.getService();
    const serviceResult = await detectionService.detect(imageUrl, presetId);
    await new Promise((r) => setTimeout(r, 120));

    // Check for Service Unavailable
    if (serviceResult.isServiceUnavailable) {
      onProgress?.('completed', 100);
      return {
        imageUrl,
        detections: [],
        structuredDetections: [],
        dominantCategory: 'road_damage',
        dominantSeverity: 'healthy',
        severityScore: 0,
        confidence: 0,
        impact: null,
        priorityExplainability: null,
        recommendedAction: 'INFERENCE BACKEND OFFLINE',
        suggestedAuthorityId: 'none',
        departmentName: 'Service Offline',
        modelEngineName: serviceResult.modelEngineName,
        outcomeStatus: 'service_unavailable',
        operationalState: 'ANALYSIS_FAILED',
        validationResult: serviceResult.validation,
        isActionable: false,
        statusExplanation: serviceResult.errorMessage || 'Inference backend service is currently unreachable.',
        cropVerifications: [],
      };
    }

    // Check for Rejected Image (Blank White, Blank Black, Non-Infrastructure, Corrupt)
    if (!serviceResult.validation.isValid) {
      onProgress?.('completed', 100);
      const reasonMsg = serviceResult.validation.rejectionMessage || 'Image does not meet infrastructure inspection criteria.';

      return {
        imageUrl,
        detections: [],
        structuredDetections: [],
        dominantCategory: 'road_damage',
        dominantSeverity: 'healthy',
        severityScore: 0,
        confidence: 0,
        impact: null,
        priorityExplainability: null,
        recommendedAction: 'IMAGE REJECTED — NO ACTION REQUIRED',
        suggestedAuthorityId: 'none',
        departmentName: 'Unassigned',
        modelEngineName: serviceResult.modelEngineName,
        outcomeStatus: 'image_rejected',
        operationalState: serviceResult.operationalState || serviceResult.validation.operationalState,
        validationResult: serviceResult.validation,
        isActionable: false,
        statusExplanation: reasonMsg,
        cropVerifications: [],
      };
    }

    // Stage 3: AI SCANNING
    onProgress?.('scanning', 40);
    await new Promise((r) => setTimeout(r, 150));

    // Stage 4: OBJECT DETECTION
    onProgress?.('object_detection', 55);
    const rawDetections = serviceResult.detections;
    await new Promise((r) => setTimeout(r, 120));

    // Stage 5: SEVERITY ANALYSIS
    onProgress?.('severity_analysis', 68);

    // If zero defects were detected on valid infrastructure (e.g. clean road without damage):
    if (rawDetections.length === 0) {
      onProgress?.('completed', 100);

      return {
        imageUrl,
        detections: [],
        structuredDetections: [],
        dominantCategory: (serviceResult.validation.sceneUnderstanding?.primaryCategory && serviceResult.validation.sceneUnderstanding.primaryCategory !== 'none')
          ? serviceResult.validation.sceneUnderstanding.primaryCategory
          : 'road_damage',
        dominantSeverity: 'healthy',
        severityScore: 0,
        confidence: Math.min(serviceResult.validation.sceneConfidence || 88, 88),
        impact: null,
        priorityExplainability: null,
        recommendedAction: 'NOMINAL INFRASTRUCTURE — NO ACTIONABLE DEFECTS DETECTED',
        suggestedAuthorityId: 'none',
        departmentName: 'Civil Infrastructure Surveillance (Nominal)',
        modelEngineName: serviceResult.modelEngineName,
        outcomeStatus: 'nominal_infrastructure',
        operationalState: 'NO_DAMAGE_DETECTED_WITHIN_SUPPORTED_SCOPE',
        validationResult: serviceResult.validation,
        isActionable: false,
        statusExplanation: 'Nominal Infrastructure: Visual inspection verified intact infrastructure with no actionable defects within supported inspection scope.',
        cropVerifications: serviceResult.cropVerifications || [],
      };
    }

    // Valid defects detected: Run physical severity engine
    const scoredDetections: Detection[] = rawDetections.map((det) => {
      const sevResult = SeverityEngine.calculateSeverity(det.type, det.confidence, det.metadata);
      return {
        ...det,
        severity: sevResult.severity,
        severityScore: sevResult.score,
      };
    });

    // Sort descending by severity score
    scoredDetections.sort((a, b) => b.severityScore - a.severityScore);
    const primaryDet = scoredDetections[0];

    const category = CLASS_TO_CATEGORY[primaryDet.type]?.category || 'road_damage';
    const severity = primaryDet.severity;
    const severityScore = primaryDet.severityScore;
    const confidence = primaryDet.confidence;

    // Stage 6: GEOLOCATION
    onProgress?.('geolocation', 78);
    await new Promise((r) => setTimeout(r, 100));

    // Stage 7: IMPACT ANALYSIS
    onProgress?.('impact_analysis', 88);
    const impact = ImpactEngine.assessImpact(lat, lon, category, severityScore);
    await new Promise((r) => setTimeout(r, 100));

    // Stage 8: PRIORITY GENERATED
    onProgress?.('priority_generated', 96);
    const priorityExplainability = PriorityEngine.evaluatePriority({
      severityScore,
      complaintDensityCount: 1,
      affectedPopulation: impact.affectedUsersPerDay,
      trafficImportance: impact.trafficImportance,
      sensitiveLocationScore: impact.sensitiveLocationScore,
      createdAt: new Date().toISOString(),
      nearbyRisks: impact.nearbyRisks,
      category,
    });
    await new Promise((r) => setTimeout(r, 100));

    // Route Authority
    const authRoute = AuthorityResolver.resolve(
      { latitude: lat, longitude: lon, address: 'Detected Location', ward: 'Ward 6', zone: 'Urban Arterial' },
      category,
      severity
    );

    const boundingBoxes: BoundingBox[] = scoredDetections.map((d) => ({
      id: d.id,
      x: d.boundingBox.x,
      y: d.boundingBox.y,
      width: d.boundingBox.width,
      height: d.boundingBox.height,
      label: d.typeLabel,
      category,
      confidence: d.confidence,
      severity: d.severity,
      severityScore: d.severityScore,
      metadata: d.metadata,
    }));

    onProgress?.('completed', 100);

    const isVerified = serviceResult.operationalState === 'DAMAGE_VERIFIED';

    return {
      imageUrl,
      detections: boundingBoxes,
      structuredDetections: scoredDetections,
      dominantCategory: category,
      dominantSeverity: severity,
      severityScore,
      confidence,
      impact: {
        ...impact,
        recommendedAction: authRoute.recommendedAction,
        slaDeadlineHours: authRoute.slaHours,
      },
      priorityExplainability,
      recommendedAction: isVerified ? authRoute.recommendedAction : 'MANUAL INSPECTION REQUIRED (UNCERTAIN FINDING)',
      suggestedAuthorityId: authRoute.authority.id,
      departmentName: authRoute.departmentName,
      modelEngineName: serviceResult.modelEngineName,
      outcomeStatus: isVerified ? 'defects_detected' : 'uncertain',
      operationalState: serviceResult.operationalState,
      validationResult: serviceResult.validation,
      isActionable: isVerified,
      statusExplanation: isVerified
        ? `Actionable defect detected: ${primaryDet.typeLabel} with severity ${severityScore}/100.`
        : `Potential defect detected with ambiguous visual evidence. Manual engineer verification required.`,
      cropVerifications: serviceResult.cropVerifications || [],
    };
  }
}
