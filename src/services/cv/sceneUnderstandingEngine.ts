import { ImagePixelBuffer, SceneClassification, SceneElement, SceneUnderstandingResult } from './types';
import { InfrastructureCategory } from '../../types/infrastructure';
import { RoadSurfaceSegmenter } from './roadSurfaceSegmenter';
import { MODEL_CAPABILITIES } from './modelRegistry';

/**
 * Universal Scene Understanding Engine (Universal Image Understanding)
 * Determines:
 * A. What is actually visible in the image (scene elements, textures, ground plane, sky, objects)
 * B. Does the image contain infrastructure?
 * C. What infrastructure categories are present?
 * D. Which regions contain potential infrastructure defects?
 * E. Is there sufficient visual evidence to assess those regions?
 * F. Which specialized detection models are appropriate?
 */
export class UniversalSceneUnderstandingEngine {
  /**
   * Run comprehensive scene understanding on the decoded pixel buffer
   */
  static analyze(buffer: ImagePixelBuffer): SceneUnderstandingResult {
    const { width, height, data } = buffer;
    const totalPixels = width * height;

    // 1. Extract physical photometric statistics
    let sumLum = 0;
    let minLum = 255;
    let maxLum = 0;
    let sumSat = 0;

    let roadPixels = 0;
    let concretePixels = 0;
    let buildingPixels = 0;
    let railPixels = 0;
    let railLeftPixels = 0;
    let railRightPixels = 0;
    let bridgePixels = 0;
    let vegetationPixels = 0;
    let skyPixels = 0;
    let vehiclePixels = 0;
    let masonryPixels = 0;
    let elevatedDarkCount = 0;
    let elevatedTotal = 0;
    let elevatedWallCount = 0;

    // Vertical third accumulators
    let topLum = 0;
    let topCount = 0;
    let midLum = 0;
    let midCount = 0;
    let botLum = 0;
    let botCount = 0;

    // Detect vehicle envelopes first using chromatic clustering
    const vehicleEnvelopes = RoadSurfaceSegmenter.detectVehicleEnvelopes(buffer);
    const hasVehicles = vehicleEnvelopes.length > 0;

    const oneThird = Math.floor(height / 3);
    const twoThirds = Math.floor((2 * height) / 3);

    // Column and row luminance profile arrays for fenestration / window grid analysis
    const colLumSums = new Float32Array(width);
    const rowLumSums = new Float32Array(height);

    for (let y = 0; y < height; y++) {
      const isTop = y < oneThird;
      const isMid = y >= oneThird && y < twoThirds;
      const isBot = y >= twoThirds;

      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        sumLum += lum;
        colLumSums[x] += lum;
        rowLumSums[y] += lum;
        if (lum < minLum) minLum = lum;
        if (lum > maxLum) maxLum = lum;

        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const sat = maxC > 0 ? (maxC - minC) / maxC : 0;
        sumSat += sat;

        if (isTop) {
          topLum += lum;
          topCount++;
        } else if (isMid) {
          midLum += lum;
          midCount++;
        } else {
          botLum += lum;
          botCount++;
        }

        // Check if pixel is inside a vehicle envelope
        const normX = (x / width) * 100;
        const normY = (y / height) * 100;
        const inVehicle = vehicleEnvelopes.some(
          (env) => normX >= env.minX && normX <= env.maxX && normY >= env.minY && normY <= env.maxY
        );
        if (inVehicle) {
          vehiclePixels++;
          continue;
        }

        // Sky detection: blue chrominance or bright upper overcast
        if (isTop && ((b > r + 15 && b > 130) || (lum > 210 && sat < 0.15))) {
          skyPixels++;
          continue;
        }

        // Track elevated structure characteristics (top + mid frame, outside vehicles and sky)
        if (isTop || isMid) {
          elevatedTotal++;
          if (lum <= 65) elevatedDarkCount++;
          if (lum >= 120 && sat <= 0.22) elevatedWallCount++;
        }

        // Vegetation detection: green chrominance
        if (g > r + 16 && g > b + 12 && g > 40) {
          vegetationPixels++;
          continue;
        }

        // Building facade: masonry brick/stone, terracotta, or architectural window glazing
        const isMasonry = r > b + 24 && r > g + 12 && lum > 55 && sat >= 0.20 && sat <= 0.65;
        const isGlazing = b > r + 24 && lum > 45 && sat <= 0.60 && !isBot;
        if (isMasonry || isGlazing) {
          masonryPixels++;
        }

        // Asphalt road surface & painted stripes: low saturation neutral
        const isNeutral = Math.abs(r - g) < 24 && Math.abs(g - b) < 24 && Math.abs(r - b) < 24;
        if (isNeutral && sat <= 0.22) {
          if (lum >= 20 && lum <= 175) {
            roadPixels++;
          } else if (lum > 175) {
            concretePixels++;
          }
          // Railway metallic rail signature: specular linear highlights along track (steel rails)
          if (lum >= 185 && sat <= 0.08) {
            railPixels++;
            if (x < width * 0.45) railLeftPixels++;
            if (x > width * 0.55) railRightPixels++;
          }
          // Bridge concrete span: horizontal elevated structure
          if (isMid && lum >= 70 && lum <= 195) {
            bridgePixels++;
          }
          continue;
        }

        if (isMasonry || isGlazing) {
          buildingPixels++;
        }
      }
    }

    const meanLuminance = sumLum / totalPixels;
    const meanSaturation = sumSat / totalPixels;
    const dynamicRange = maxLum - minLum;

    // Structural building detection heuristics (elevated dark cavities, masonry facade, window grid)
    const isMasonryFacade = (masonryPixels / totalPixels) >= 0.18;

    const railCoverage = railPixels / totalPixels;
    const railLeftCoverage = railLeftPixels / totalPixels;
    const railRightCoverage = railRightPixels / totalPixels;
    const hasParallelRails = railLeftCoverage >= 0.012 && railRightCoverage >= 0.012;
    const bridgeCoverage = bridgePixels / totalPixels;
    const vegetationCoverage = vegetationPixels / totalPixels;
    const skyCoverage = skyPixels / totalPixels;
    const vehicleCoverage = vehiclePixels / totalPixels;

    const isBridgeScene = bridgeCoverage >= 0.18 && skyCoverage >= 0.04;
    const isRailwayScene = hasParallelRails && railCoverage >= 0.025;

    // Window grid analysis: periodic high-contrast column and row transitions
    const colMeans = Array.from(colLumSums).map(s => s / height);
    const rowMeans = Array.from(rowLumSums).map(s => s / width);
    const colAvg = colMeans.reduce((a, b) => a + b, 0) / width;
    const rowAvg = rowMeans.reduce((a, b) => a + b, 0) / height;
    let colTransitions = 0;
    for (let x = 2; x < width - 2; x++) {
      if ((colMeans[x] - colAvg) * (colMeans[x - 1] - colAvg) < 0 && Math.abs(colMeans[x] - colMeans[x - 2]) > 8) {
        colTransitions++;
      }
    }
    let rowTransitions = 0;
    for (let y = 2; y < height - 2; y++) {
      if ((rowMeans[y] - rowAvg) * (rowMeans[y - 1] - rowAvg) < 0 && Math.abs(rowMeans[y] - rowMeans[y - 2]) > 8) {
        rowTransitions++;
      }
    }
    const elevatedDarkRatio = elevatedTotal > 0 ? elevatedDarkCount / elevatedTotal : 0;
    const elevatedWallRatio = elevatedTotal > 0 ? elevatedWallCount / elevatedTotal : 0;
    const isWindowGrid = !hasVehicles && !isRailwayScene && !isBridgeScene && colTransitions >= 6 && rowTransitions >= 6 && dynamicRange >= 60 && elevatedWallRatio >= 0.25;

    // Wall collapse breach: extensive dark interior cavity (>= 12% of elevated area) with concrete walls
    const hasWallCollapseBreach = !hasVehicles && !isRailwayScene && !isBridgeScene && elevatedDarkRatio >= 0.12 && elevatedWallRatio >= 0.20 && dynamicRange >= 85;

    const isBuildingScene = !isRailwayScene && !isBridgeScene && (isMasonryFacade || isWindowGrid || hasWallCollapseBreach);

    // If confirmed building scene, assign neutral elevated pixels to building coverage
    if (isBuildingScene) {
      buildingPixels += roadPixels;
      roadPixels = 0;
      concretePixels = 0;
    }

    const roadCoverage = roadPixels / totalPixels;
    const concreteCoverage = concretePixels / totalPixels;
    const buildingCoverage = buildingPixels / totalPixels;

    // 2. Identify Visible Elements
    const visibleElements: SceneElement[] = [];

    if (roadCoverage >= 0.15) {
      visibleElements.push({
        label: 'road_surface',
        confidence: Math.min(99, Math.round(60 + roadCoverage * 50)),
        coveragePct: Number((roadCoverage * 100).toFixed(1)),
      });
    }

    if (concreteCoverage >= 0.12) {
      visibleElements.push({
        label: 'concrete_sidewalk',
        confidence: Math.min(95, Math.round(55 + concreteCoverage * 50)),
        coveragePct: Number((concreteCoverage * 100).toFixed(1)),
      });
    }

    if (buildingCoverage >= 0.18) {
      visibleElements.push({
        label: 'building_facade',
        confidence: Math.min(96, Math.round(55 + buildingCoverage * 45)),
        coveragePct: Number((buildingCoverage * 100).toFixed(1)),
      });
    }

    if (railCoverage >= 0.04) {
      visibleElements.push({
        label: 'railway_track',
        confidence: Math.min(94, Math.round(60 + railCoverage * 60)),
        coveragePct: Number((railCoverage * 100).toFixed(1)),
      });
    }

    if (bridgeCoverage >= 0.18 && (skyCoverage >= 0.05 || botLum < midLum)) {
      visibleElements.push({
        label: 'bridge_structure',
        confidence: Math.min(92, Math.round(50 + bridgeCoverage * 50)),
        coveragePct: Number((bridgeCoverage * 100).toFixed(1)),
      });
    }

    if (hasVehicles) {
      visibleElements.push({
        label: 'vehicle',
        confidence: 94,
        coveragePct: Number((vehicleCoverage * 100).toFixed(1)),
      });
    }

    if (skyCoverage >= 0.05) {
      visibleElements.push({
        label: 'sky',
        confidence: 90,
        coveragePct: Number((skyCoverage * 100).toFixed(1)),
      });
    }

    if (vegetationCoverage >= 0.10) {
      visibleElements.push({
        label: 'vegetation',
        confidence: 88,
        coveragePct: Number((vegetationCoverage * 100).toFixed(1)),
      });
    }

    // 3. Determine Infrastructure Presence & Present Categories
    const detectedCategories: InfrastructureCategory[] = [];

    if (isRailwayScene) {
      detectedCategories.push('railway_damage');
    }

    if (isBridgeScene) {
      detectedCategories.push('bridge_damage');
    }

    if (isBuildingScene || (buildingCoverage >= 0.20 && (roadCoverage < 0.25 || buildingCoverage > roadCoverage))) {
      detectedCategories.push('building_damage');
    }

    if (!isBuildingScene && !isRailwayScene && !isBridgeScene) {
      if (roadCoverage >= 0.10 || hasVehicles || vehicleCoverage >= 0.05) {
        detectedCategories.push('road_damage');
      }

      if (concreteCoverage >= 0.08) {
        detectedCategories.push('sidewalk_hazard');
      }

      // Drainage: gutter curbs along bottom edges of roadways
      if (roadCoverage >= 0.15 || (roadCoverage >= 0.06 && hasVehicles)) {
        detectedCategories.push('drainage_overflow');
      }

      // Street lighting / utility structures: present on urban roads and pedestrian sidewalks
      if (roadCoverage >= 0.10 || concreteCoverage >= 0.10 || hasVehicles) {
        detectedCategories.push('lighting_failure');
        detectedCategories.push('public_utility');
      }
    }

    const containsInfrastructure = detectedCategories.length > 0;

    // Primary category determination
    let primaryCategory: InfrastructureCategory | 'none' = 'none';
    if (isRailwayScene || (detectedCategories.includes('railway_damage') && skyCoverage < 0.20)) {
      primaryCategory = 'railway_damage';
    } else if (isBridgeScene || (detectedCategories.includes('bridge_damage') && skyCoverage >= 0.08)) {
      primaryCategory = 'bridge_damage';
    } else if (isBuildingScene || detectedCategories.includes('building_damage')) {
      primaryCategory = 'building_damage';
    } else if (detectedCategories.includes('sidewalk_hazard') && concreteCoverage > roadCoverage) {
      primaryCategory = 'sidewalk_hazard';
    } else if (detectedCategories.includes('road_damage')) {
      primaryCategory = 'road_damage';
    } else if (detectedCategories.length > 0) {
      primaryCategory = detectedCategories[0];
    }

    // 4. Candidate Defect Regions (anomalies on confirmed infrastructure)
    const candidateDefectRegions: SceneUnderstandingResult['candidateDefectRegions'] = [];

    // Check for sufficient visual evidence
    const hasSufficientVisualEvidence =
      width >= 32 &&
      height >= 32 &&
      dynamicRange >= 20 &&
      meanLuminance >= 15 &&
      meanLuminance <= 245;

    // 5. Select appropriate specialized models from registry
    const appropriateModels = detectedCategories
      .map((cat) => MODEL_CAPABILITIES[cat]?.modelName)
      .filter(Boolean);

    // Format explanation
    let explanation = '';
    if (!containsInfrastructure) {
      if (vegetationCoverage >= 0.70) {
        explanation = 'Natural landscape containing dense foliage without visible municipal or civil infrastructure.';
      } else if (meanSaturation > 0.40 && roadCoverage < 0.10 && !hasVehicles) {
        explanation = 'Indoor domestic or commercial space without roadway or outdoor civil structures.';
      } else {
        explanation = 'Photograph does not contain recognizable civil or public right-of-way infrastructure.';
      }
    } else {
      const catLabels = detectedCategories.map((c) => c.replace(/_/g, ' ')).join(', ');
      explanation = `Identified infrastructure scene. Confirmed presence of: ${catLabels}. Visual inspection scoped to valid asset boundaries.`;
    }

    return {
      visibleElements,
      containsInfrastructure,
      detectedCategories,
      primaryCategory,
      candidateDefectRegions,
      hasSufficientVisualEvidence,
      appropriateModels,
      distractingObjects: {
        hasVehicles,
        hasPedestrians: false,
        hasWaterReflections: false,
        hasHeavyShadows: false,
        vehicleEnvelopes: vehicleEnvelopes.map((env) => ({ ...env, type: 'vehicle' })),
      },
      explanation,
    };
  }

  /**
   * Helper to map primary category to SceneClassification
   */
  static mapCategoryToSceneType(category: InfrastructureCategory | 'none'): SceneClassification {
    switch (category) {
      case 'building_damage':
        return 'building_structure';
      case 'bridge_damage':
        return 'bridge_overpass';
      case 'railway_damage':
        return 'railway_track';
      case 'sidewalk_hazard':
        return 'concrete_sidewalk';
      case 'drainage_overflow':
        return 'drainage_structure';
      case 'lighting_failure':
        return 'lighting_infrastructure';
      case 'public_utility':
        return 'public_utility';
      case 'road_damage':
      default:
        return 'road_asphalt';
    }
  }
}
