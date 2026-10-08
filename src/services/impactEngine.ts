import { ImpactAssessment, InfrastructureCategory, NearbyRiskFactor } from '../types/infrastructure';
import { GisEngine } from './gisEngine';

export interface ImpactAnalysisResult extends ImpactAssessment {
  nearbySchoolsCount: number;
  nearbyHospitalsCount: number;
  sensitiveLocationScore: number; // 0 - 100
}

export class ImpactEngine {
  /**
   * Evaluate multi-factor civic and commuter impact
   */
  static assessImpact(
    latitude: number,
    longitude: number,
    category: InfrastructureCategory,
    severityScore: number
  ): ImpactAnalysisResult {
    const nearbyPOIs = GisEngine.findNearbyPOIs(latitude, longitude, 800);

    const schools = nearbyPOIs.filter((p) => p.type === 'school');
    const hospitals = nearbyPOIs.filter((p) => p.type === 'hospital');
    const transits = nearbyPOIs.filter((p) => p.type === 'transit');
    const arterialRoads = nearbyPOIs.filter((p) => p.type === 'arterial_road');

    // 1. Sensitive Location Score (0 - 100)
    // Proximity to school (<250m) or hospital (<250m) greatly elevates vulnerability
    let sensitiveScore = 15;
    for (const s of schools) {
      if (s.distanceMeters <= 200) sensitiveScore += 35;
      else if (s.distanceMeters <= 400) sensitiveScore += 20;
    }
    for (const h of hospitals) {
      if (h.distanceMeters <= 200) sensitiveScore += 40;
      else if (h.distanceMeters <= 400) sensitiveScore += 25;
    }
    for (const t of transits) {
      if (t.distanceMeters <= 150) sensitiveScore += 20;
    }
    const finalSensitiveScore = Math.min(100, Math.max(10, sensitiveScore));

    // 2. Traffic Importance Rating
    let trafficImportance: 'critical' | 'high' | 'moderate' | 'low' = 'moderate';
    if (arterialRoads.length > 0 || transits.length >= 2 || (transits.length > 0 && transits[0].distanceMeters <= 100)) {
      trafficImportance = 'critical';
    } else if (transits.length > 0 || schools.length > 0) {
      trafficImportance = 'high';
    } else if (nearbyPOIs.length > 0) {
      trafficImportance = 'moderate';
    } else {
      trafficImportance = 'low';
    }

    // 3. Estimated Affected Daily Commuters
    let baseCommuters = 850;
    if (trafficImportance === 'critical') baseCommuters += 2600;
    else if (trafficImportance === 'high') baseCommuters += 1400;

    baseCommuters += transits.length * 750;
    baseCommuters += schools.length * 600;
    baseCommuters += hospitals.length * 500;
    const affectedPopulation = Math.min(12500, Math.round(baseCommuters));

    // 4. SLA Calculation based on severity and sensitivity
    let slaHours = 48;
    if (severityScore >= 80 || finalSensitiveScore >= 75) {
      slaHours = 12;
    } else if (severityScore >= 65 || finalSensitiveScore >= 50) {
      slaHours = 24;
    } else if (severityScore <= 35) {
      slaHours = 72;
    }

    // 5. Recommended repair action
    let recommendedAction = 'INSPECT AND REMEDIATE HAZARD';
    if (category === 'road_damage') {
      recommendedAction = severityScore > 80 ? 'EMERGENCY MILLING & TACK-COAT ASPHALT REPAIR' : 'SURFACE COLD-PATCH APPLICATION';
    } else if (category === 'drainage_overflow') {
      recommendedAction = 'HIGH-PRESSURE JETTING & CULVERT CLEARANCE';
    } else if (category === 'lighting_failure') {
      recommendedAction = 'ELECTRICAL ISOLATION & LUMINAIRE REPLACEMENT';
    } else if (category === 'electrical_hazard') {
      recommendedAction = 'IMMEDIATE HIGH-VOLTAGE POWER GRID ISOLATION';
    } else if (category === 'sidewalk_hazard') {
      recommendedAction = 'HYDRAULIC SLAB LEVELING & ROOT SHAVING';
    } else if (category === 'waste_accumulation') {
      recommendedAction = 'RAPID COMPACTOR TRUCK HAZMAT CLEARANCE';
    } else if (category === 'traffic_signage') {
      recommendedAction = 'OVERHEAD GANTRY SIGN RE-ANCHORING';
    }

    // Nearby risks representation
    const nearbyRisks: NearbyRiskFactor[] = nearbyPOIs.slice(0, 4).map((p) => ({
      name: p.name,
      type: p.type,
      distanceMeters: p.distanceMeters,
    }));

    return {
      affectedUsersPerDay: affectedPopulation,
      safetyIndexScore: Math.round((severityScore * 0.6) + (finalSensitiveScore * 0.4)),
      economicImpactRating: affectedPopulation > 3000 ? 'severe' : affectedPopulation > 1500 ? 'moderate' : 'low',
      nearbyRisks,
      recommendedAction,
      slaDeadlineHours: slaHours,
      trafficImportance,
      sensitiveLocationScore: finalSensitiveScore,
      nearbySchoolsCount: schools.length,
      nearbyHospitalsCount: hospitals.length,
    };
  }
}
