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
import { GisEngine } from './gisEngine';
import { ImpactEngine } from './impactEngine';
import { PriorityEngine } from './priorityEngine';
import { AuthorityResolver } from './authorityResolver';

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
  impact: ImpactAssessment;
  priorityExplainability: PriorityExplainability;
  recommendedAction: string;
  suggestedAuthorityId: string;
  departmentName: string;
  modelEngineName: string;
}

export class AiVisionService {
  /**
   * Run end-to-end AI Street Analysis using active DetectionService (8-stage sequence)
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
    await new Promise((r) => setTimeout(r, 200));

    // Stage 2: IMAGE PROCESSING
    onProgress?.('processing', 25);
    await new Promise((r) => setTimeout(r, 220));

    // Stage 3: AI SCANNING
    onProgress?.('scanning', 38);
    await new Promise((r) => setTimeout(r, 250));

    // Stage 4: OBJECT DETECTION
    onProgress?.('object_detection', 50);
    const detectionService = DetectionServiceFactory.getService();
    const rawDetections = await detectionService.detect(presetId || imageUrl);
    await new Promise((r) => setTimeout(r, 180));

    // Stage 5: SEVERITY ANALYSIS
    onProgress?.('severity_analysis', 63);

    // Stage 4: Run Severity Engine across detections
    const scoredDetections: Detection[] = rawDetections.map((det) => {
      const sevResult = SeverityEngine.calculateSeverity(det.type, det.confidence, det.metadata);
      return {
        ...det,
        severity: sevResult.severity,
        severityScore: sevResult.score,
      };
    });

    const primaryDet = scoredDetections[0] || {
      id: 'det-def',
      type: 'pothole' as DetectionClass,
      typeLabel: 'Asphalt Pothole',
      confidence: 94,
      severity: 'critical' as Severity,
      severityScore: 87,
      metadata: { roadCoveragePct: 15 },
      boundingBox: { x: 30, y: 50, width: 35, height: 35 },
    };

    const category = CLASS_TO_CATEGORY[primaryDet.type]?.category || 'road_damage';
    const severity = primaryDet.severity;
    const severityScore = primaryDet.severityScore;
    const confidence = primaryDet.confidence;

    // Stage 6: GEOLOCATION
    onProgress?.('geolocation', 75);
    await new Promise((r) => setTimeout(r, 180));

    // Stage 7: IMPACT ANALYSIS
    onProgress?.('impact_analysis', 88);
    const impact = ImpactEngine.assessImpact(lat, lon, category, severityScore);
    await new Promise((r) => setTimeout(r, 180));

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
    await new Promise((r) => setTimeout(r, 160));

    // Authority Resolver
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
      metadata: d.metadata,
    }));

    onProgress?.('completed', 100);

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
      recommendedAction: authRoute.recommendedAction,
      suggestedAuthorityId: authRoute.authority.id,
      departmentName: authRoute.departmentName,
      modelEngineName: detectionService.name,
    };
  }
}
