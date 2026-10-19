import { ImagePixelBuffer, CropVerificationResult, DefectEvidence } from './types';
import { DetectionClass } from '../../types/infrastructure';
import { RoadSurfaceSegmenter, VehicleEnvelope } from './roadSurfaceSegmenter';

/**
 * Multi-Stage Defect Crop Verifier (Phase 3 Requirement)
 * Extracts the proposed candidate region from the raw image pixel buffer
 * and evaluates localized physical evidence to eliminate false positives:
 * - Differentiates real potholes from manhole covers, asphalt patches, wet surfaces, and shadows
 * - Differentiates real fissures from painted road markings and zebra stripes
 * - Differentiates real defects from vehicle bodywork, wheels, window trim, and grilles
 * - Differentiates intact infrastructure from broken infrastructure
 */
export class DefectCropVerifier {
  /**
   * Run crop-level verification on a candidate defect
   */
  static verifyCrop(
    buffer: ImagePixelBuffer,
    defectType: DetectionClass,
    evidence: DefectEvidence,
    ambientLuminance: number,
    vehicleEnvelopes?: VehicleEnvelope[]
  ): CropVerificationResult {
    const { width: imgW, height: imgH, data } = buffer;
    const box = evidence.pixelBox;

    // 1. Boundary & Dimension Sanity
    const cropX = Math.max(0, Math.min(imgW - 1, box.minX));
    const cropY = Math.max(0, Math.min(imgH - 1, box.minY));
    const cropMaxX = Math.max(cropX + 1, Math.min(imgW, box.maxX + 1));
    const cropMaxY = Math.max(cropY + 1, Math.min(imgH, box.maxY + 1));

    const cropW = cropMaxX - cropX;
    const cropH = cropMaxY - cropY;

    if (cropW < 2 || cropH < 2) {
      return {
        isValidCrop: false,
        supportsPositiveFinding: false,
        isUncertain: true,
        supportingEvidence: [],
        contradictoryEvidence: ['Proposed candidate crop has degenerate sub-pixel dimensions.'],
        isManholeCover: false,
        isRoadRepairPatch: false,
        isSurfaceShadow: false,
        isPaintedMarking: false,
        isWetSurfaceReflection: false,
        isVehicleSuperstructure: false,
        isVehicleWheel: false,
        isVehicleWindowOrSeam: false,
        isVehicleGrille: false,
        isOnPlausibleRoadSurface: false,
        roadSurfaceConfidence: 0,
        cropCalibratedConfidence: 0,
        evidenceExplanation: 'Candidate region is too small to resolve optical defect structure.',
      };
    }

    // 2. Extract Crop Pixel Statistics
    const totalCropPixels = cropW * cropH;
    let sumL = 0;
    let minL = 255;
    let maxL = 0;
    let sumR = 0;
    let sumG = 0;
    let sumB = 0;

    const cropLuminance = new Float32Array(totalCropPixels);

    for (let y = 0; y < cropH; y++) {
      for (let x = 0; x < cropW; x++) {
        const srcIdx = ((cropY + y) * imgW + (cropX + x)) * 4;
        const r = data[srcIdx];
        const g = data[srcIdx + 1];
        const b = data[srcIdx + 2];

        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        cropLuminance[y * cropW + x] = lum;

        sumL += lum;
        sumR += r;
        sumG += g;
        sumB += b;

        if (lum < minL) minL = lum;
        if (lum > maxL) maxL = lum;
      }
    }

    const meanL = sumL / totalCropPixels;
    const avgR = sumR / totalCropPixels;
    const avgG = sumG / totalCropPixels;
    const avgB = sumB / totalCropPixels;

    // 3. Measure Crop Gradient Magnitude (Interior vs. Perimeter)
    let perimeterGradSum = 0;
    let perimeterCount = 0;
    let interiorGradSum = 0;
    let interiorCount = 0;

    for (let y = 1; y < cropH - 1; y++) {
      for (let x = 1; x < cropW - 1; x++) {
        const gx =
          -cropLuminance[(y - 1) * cropW + (x - 1)] +
          cropLuminance[(y - 1) * cropW + (x + 1)] -
          2 * cropLuminance[y * cropW + (x - 1)] +
          2 * cropLuminance[y * cropW + (x + 1)] -
          cropLuminance[(y + 1) * cropW + (x - 1)] +
          cropLuminance[(y + 1) * cropW + (x + 1)];

        const gy =
          -cropLuminance[(y - 1) * cropW + (x - 1)] -
          2 * cropLuminance[(y - 1) * cropW + x] -
          cropLuminance[(y - 1) * cropW + (x + 1)] +
          cropLuminance[(y + 1) * cropW + (x - 1)] +
          2 * cropLuminance[(y + 1) * cropW + x] +
          cropLuminance[(y + 1) * cropW + (x + 1)];

        const grad = Math.sqrt(gx * gx + gy * gy) / 4.0;

        const isPerimeter = x <= 2 || x >= cropW - 3 || y <= 2 || y >= cropH - 3;
        if (isPerimeter) {
          perimeterGradSum += grad;
          perimeterCount++;
        } else {
          interiorGradSum += grad;
          interiorCount++;
        }
      }
    }

    const meanPerimeterGrad = perimeterCount > 0 ? perimeterGradSum / perimeterCount : 0;
    const meanInteriorGrad = interiorCount > 0 ? interiorGradSum / interiorCount : 0;

    const supportingEvidence: string[] = [];
    const contradictoryEvidence: string[] = [];

    let isManholeCover = false;
    let isRoadRepairPatch = false;
    let isSurfaceShadow = false;
    let isPaintedMarking = false;
    let isWetSurfaceReflection = false;

    // 3b. Road Surface & Vehicle Superstructure Context Analysis
    const context = RoadSurfaceSegmenter.inspectCandidateContext(
      buffer,
      box,
      vehicleEnvelopes || RoadSurfaceSegmenter.detectVehicleEnvelopes(buffer)
    );

    const isVehicleSuperstructure = context.isVehicleSuperstructure;
    const isVehicleWheel = context.isVehicleWheel;
    const isVehicleWindowOrSeam = context.isVehicleWindowOrSeam;
    const isVehicleGrille = context.isVehicleGrille;
    const isOnPlausibleRoadSurface = context.isOnPlausibleRoadSurface;
    const roadSurfaceConfidence = context.roadSurfaceConfidence;

    const isRoadDefect = defectType === 'pothole' || defectType === 'damaged_road' || defectType === 'damaged_sidewalk' || defectType === 'overflowing_drain';

    if (context.rejectionReason) {
      // Pavement aggregate texture requirement strictly applies to road defects; structural masonry, bridges, and railways have their own substrate
      if (isRoadDefect || !context.rejectionReason.includes('road aggregate texture')) {
        contradictoryEvidence.push(context.rejectionReason);
      }
    }
    if (defectType === 'overflowing_drain' && (isVehicleGrille || isVehicleSuperstructure || isVehicleWheel)) {
      contradictoryEvidence.push('Periodic metallic grating bars belong to a vehicle front radiator grille / ventilation intake, not a roadway stormwater culvert.');
    }
    if (isRoadDefect && isOnPlausibleRoadSurface && roadSurfaceConfidence >= 45) {
      supportingEvidence.push('Plausible road surface verified: candidate is embedded in contiguous neutral asphalt/concrete pavement.');
    }

    // 4. Manhole Cover Discriminator
    // Manhole covers have balanced aspect ratio (0.8 - 1.2), metallic/iron tone, and circular boundary
    const cropAspect = cropW / cropH;
    const isCircularAspect = cropAspect >= 0.82 && cropAspect <= 1.22;

    if (defectType === 'pothole' && isCircularAspect && totalCropPixels >= 60) {
      // Check radial uniformity from crop center
      const centerX = cropW / 2;
      const centerY = cropH / 2;
      let centerLum = 0;
      let centerCount = 0;
      let midRingLum = 0;
      let midRingCount = 0;

      for (let y = 0; y < cropH; y++) {
        for (let x = 0; x < cropW; x++) {
          const rDist = Math.hypot((x - centerX) / (cropW / 2), (y - centerY) / (cropH / 2));
          const val = cropLuminance[y * cropW + x];

          if (rDist < 0.35) {
            centerLum += val;
            centerCount++;
          } else if (rDist >= 0.65 && rDist <= 0.95) {
            midRingLum += val;
            midRingCount++;
          }
        }
      }

      const avgCenter = centerCount > 0 ? centerLum / centerCount : meanL;
      const avgRing = midRingCount > 0 ? midRingLum / midRingCount : meanL;

      // Manholes typically have a raised metallic ring with concentric patterns rather than a deep void
      if (Math.abs(avgCenter - avgRing) < 14 && meanPerimeterGrad > 8.0 && meanL > 65) {
        // Metallic cast iron / circular utility structure
        isManholeCover = true;
        contradictoryEvidence.push('Circular radial geometry and uniform concentric density consistent with a utility manhole cover or access hatch.');
      }
    }

    // 5. Road Repair Patch Discriminator
    // Bitumen asphalt repairs have straight rectangular/polygonal edges, flat smooth interior (L=60-90),
    // moderate contrast (15-55ΔL), but lack fractured perimeter break or deep eroded cavity
    if (
      (defectType === 'pothole' || defectType === 'overflowing_drain') &&
      meanInteriorGrad < 2.5 &&
      meanPerimeterGrad < 7.0 &&
      evidence.contrastDelta >= 15 &&
      evidence.contrastDelta <= 55 &&
      meanL >= 55
    ) {
      isRoadRepairPatch = true;
      contradictoryEvidence.push('Uniform smooth bitumen surface texture with linear perimeter joints consistent with completed asphalt patch repair.');
    }

    // 6. Surface Shadow Discriminator
    // Shadows lack sharp jagged fractured edges and exhibit soft diffuse transitions with moderate contrast
    if (
      (defectType === 'pothole' || defectType === 'overflowing_drain') &&
      evidence.edgeDensity < 4.0 &&
      evidence.contrastDelta < 40
    ) {
      isSurfaceShadow = true;
      contradictoryEvidence.push('Soft diffuse gradient boundary lacking fractured asphalt perimeter or sub-base depth erosion (consistent with optical shadow).');
    }

    // 7. Painted Marking Discriminator
    if (defectType === 'damaged_road' || defectType === 'pothole' || defectType === 'overflowing_drain') {
      if (meanL > ambientLuminance + 25 || maxL > 210) {
        isPaintedMarking = true;
        contradictoryEvidence.push('High-luminance reflective surface consistent with painted lane marking, zebra stripe, or traffic symbol.');
      }
    }

    // 8. Wet Road / Standing Water Reflection Discriminator
    // Specular highlights: high dynamic range inside crop (maxL > 220 while minL < 40)
    if (defectType === 'pothole' && maxL > 220 && minL < 50 && meanInteriorGrad < 3.0) {
      isWetSurfaceReflection = true;
      contradictoryEvidence.push('High specular reflectance dynamic range consistent with wet road puddle reflection.');
    }

    // 8b. Building Window / Architectural Opening Discriminator
    let isBuildingWindowOrMortar = false;
    const isWindowCandidate =
      defectType === 'structural_crack' ||
      defectType === 'building_collapse' ||
      defectType === 'rubble_debris';
    if (isWindowCandidate) {
      // Normal windows: planar smooth interior glass (optically flat: maxL - minL < 25, meanInteriorGrad < 2.5)
      const isSmoothPlanar = (defectType === 'building_collapse' || defectType === 'rubble_debris' || defectType === 'structural_crack') &&
                             meanInteriorGrad < 2.5 && (maxL - minL) < 25 && totalCropPixels >= 40;
      const isRectangular = (cropAspect >= 0.60 && cropAspect <= 1.50) || (cropAspect >= 1.75 && cropAspect <= 2.25);
      if (isSmoothPlanar || (isRectangular && meanInteriorGrad < 2.2 && (meanPerimeterGrad > 4.5 || (maxL - minL) < 30) && totalCropPixels >= 40 && evidence.frameCoveragePct <= 7.0)) {
        isBuildingWindowOrMortar = true;
        contradictoryEvidence.push('Planar uniform interior with low dynamic range consistent with architectural glazed window opening.');
      }
    }

    // 8c. Railway Specular Reflection Discriminator
    let isRailwaySpecularReflect = false;
    if (defectType === 'railway_defect') {
      // Intact steel rail has continuous specular highlight (high maxL, straight line)
      if (maxL >= 210 && meanPerimeterGrad < 4.0 && cropAspect > 3.0) {
        isRailwaySpecularReflect = true;
        contradictoryEvidence.push('Continuous linear specular reflectance consistent with intact steel rail running surface.');
      }
    }

    // 8d. Bridge Expansion Joint Discriminator
    let isBridgeExpansionJoint = false;
    if (defectType === 'bridge_expansion_defect' || defectType === 'spalling_concrete') {
      // Engineered expansion joints have perfectly uniform straight width across the crop
      if (cropAspect > 3.5 && meanInteriorGrad < 2.2 && Math.abs(avgR - avgG) < 8) {
        isBridgeExpansionJoint = true;
        contradictoryEvidence.push('Uniform linear joint width consistent with normal engineered bridge deck expansion joint.');
      }
    }

    // 9. Evaluate Supporting Evidence based on defect class
    const contrastDiff = ambientLuminance - meanL;

    if (defectType === 'building_collapse') {
      if (contrastDiff >= 18 || evidence.contrastDelta >= 18) {
        supportingEvidence.push(`Structural wall breach: cavity void is ${Math.round(contrastDiff)}ΔL darker than surrounding facade.`);
      }
      if (meanPerimeterGrad >= 3.0 || evidence.edgeDensity >= 2.5) {
        supportingEvidence.push('Fractured concrete perimeter border confirms envelope breach and structural wall collapse.');
      }
      if (evidence.frameCoveragePct >= 1.0) {
        supportingEvidence.push(`Breach scale: covers ${evidence.frameCoveragePct}% of building frame, representing major architectural collapse.`);
      }
    } else if (defectType === 'rubble_debris') {
      if (meanInteriorGrad >= 2.2 || evidence.edgeDensity >= 2.8) {
        supportingEvidence.push(`Volumetric rubble texture: multi-scale gradient magnitude ${evidence.edgeDensity} confirms crushed concrete/masonry debris.`);
      }
      if (evidence.frameCoveragePct >= 0.8) {
        supportingEvidence.push(`Spatial debris accumulation: covers ${evidence.frameCoveragePct}% of inspection frame.`);
      }
      if (evidence.contrastDelta >= 8 || Math.abs(contrastDiff) >= 8) {
        supportingEvidence.push('Photometric contrast confirms textured debris pile against adjacent structural substrate.');
      }
    } else if (defectType === 'structural_crack') {
      if (evidence.edgeDensity >= 3.8 || meanPerimeterGrad >= 3.5) {
        supportingEvidence.push(`Structural shear crack: edge gradient magnitude ${evidence.edgeDensity} confirms non-rectilinear fracture traversing structural masonry/concrete.`);
      }
      if (evidence.aspectRatio >= 1.4 || evidence.aspectRatio <= 0.7) {
        supportingEvidence.push(`Diagonal shear propagation: aspect ratio ${evidence.aspectRatio} confirms mechanical stress fracture.`);
      }
      if (evidence.contrastDelta >= 10 || Math.abs(contrastDiff) >= 10) {
        supportingEvidence.push(`Optical crack trough: fracture depth depression is ${evidence.contrastDelta}ΔL darker than surrounding facade.`);
      }
    } else if (defectType === 'spalling_concrete') {
      if (contrastDiff >= 12 || Math.abs(contrastDiff) >= 12) {
        supportingEvidence.push(`Concrete spalling void: cavity is ${Math.round(contrastDiff)}ΔL darker than intact concrete deck/pier.`);
      }
      if (meanPerimeterGrad >= 4.0 || evidence.edgeDensity >= 3.5) {
        supportingEvidence.push('Irregular spalled perimeter border confirms mechanical delamination and concrete loss.');
      }
      if (evidence.frameCoveragePct >= 0.4) {
        supportingEvidence.push(`Spalling extent: occupies ${evidence.frameCoveragePct}% of visual inspection frame.`);
      }
    } else if (defectType === 'railway_defect') {
      if (contrastDiff >= 14 || evidence.contrastDelta >= 14) {
        supportingEvidence.push(`Rail head fracture notch: localized cavity depression (${evidence.contrastDelta}ΔL) breaks rail continuity.`);
      }
      if (meanPerimeterGrad >= 4.5 || evidence.edgeDensity >= 4.0) {
        supportingEvidence.push('High-gradient fracture border confirms severed rail cross-section or foreign track obstruction.');
      }
      if (evidence.frameCoveragePct >= 0.3) {
        supportingEvidence.push(`Defect scale occupies ${evidence.frameCoveragePct}% of railway corridor frame.`);
      }
    } else if (defectType === 'garbage_accumulation') {
      const chromaticVar = Math.abs(avgR - avgG) + Math.abs(avgG - avgB);
      if (chromaticVar > 14 || evidence.contrastDelta > 15) {
        supportingEvidence.push(`Multi-hue chromatic debris cluster distinguishable from neutral road asphalt (${chromaticVar.toFixed(1)} chromatic delta).`);
      }
      if (meanInteriorGrad >= 2.0 || meanPerimeterGrad >= 2.5 || evidence.edgeDensity >= 2.5) {
        supportingEvidence.push('Irregular volumetric texture and cluster contours consistent with solid waste accumulation.');
      }
      if (evidence.frameCoveragePct >= 0.4 && evidence.frameCoveragePct <= 60.0) {
        supportingEvidence.push(`Spatial cluster scale: covers ${evidence.frameCoveragePct}% of visual frame.`);
      }
    } else if (defectType === 'damaged_road' || defectType === 'damaged_sidewalk') {
      if (evidence.edgeDensity >= 4.5 || meanPerimeterGrad >= 3.8) {
        supportingEvidence.push(`Structural crack boundary: edge gradient magnitude ${evidence.edgeDensity} confirms continuous fissure.`);
      }
      if (evidence.aspectRatio >= 1.3 || evidence.aspectRatio <= 0.77) {
        supportingEvidence.push(`Elongated fissure morphology: aspect ratio ${evidence.aspectRatio} confirms fracture propagation.`);
      }
      if (evidence.contrastDelta >= 7 || Math.abs(contrastDiff) >= 7) {
        supportingEvidence.push(`Photometric surface depression: fissure trough is ${evidence.contrastDelta}ΔL darker than surrounding pavement.`);
      }
    } else if (defectType === 'overflowing_drain') {
      if (contrastDiff > 10 || meanL < ambientLuminance - 10) {
        supportingEvidence.push(`Drainage surcharge or pooling depression (${Math.round(contrastDiff)}ΔL).`);
      }
      if (meanPerimeterGrad >= 3.5 || meanInteriorGrad >= 1.8) {
        supportingEvidence.push('Stormwater culvert/grate structural boundaries verified.');
      }
      if (evidence.frameCoveragePct >= 0.4) {
        supportingEvidence.push(`Surcharge pooling covering ~${evidence.frameCoveragePct}% of frame.`);
      }
    } else {
      // Default / Pothole
      if (contrastDiff > 15) {
        supportingEvidence.push(`Localized photometric depression: defect is ${Math.round(contrastDiff)}ΔL darker than surrounding road surface.`);
      }
      if (meanPerimeterGrad >= 4.8) {
        supportingEvidence.push(`Fractured perimeter border: edge gradient intensity ${meanPerimeterGrad.toFixed(1)} confirms physical surface disruption.`);
      }
      if (evidence.frameCoveragePct >= 0.4 && evidence.frameCoveragePct <= 45.0) {
        supportingEvidence.push(`Spatial defect scale: covers ${evidence.frameCoveragePct}% of visual frame, consistent with road-grade structural damage.`);
      }
    }

    // 10. Multi-Stage Decision Policy
    const hasContradictions = contradictoryEvidence.length > 0;
    const hasSufficientEvidence = supportingEvidence.length >= 2;

    const isUncertain = !hasContradictions && supportingEvidence.length === 1;
    const supportsPositiveFinding = !hasContradictions && hasSufficientEvidence;

    // Calibrated Confidence
    let calibratedConfidence = evidence.calibratedConfidence;
    if (hasContradictions) {
      calibratedConfidence = Math.max(10, Math.round(calibratedConfidence * 0.25));
    } else if (isUncertain) {
      calibratedConfidence = Math.min(60, Math.max(45, calibratedConfidence));
    }

    let evidenceExplanation = '';
    if (supportsPositiveFinding) {
      evidenceExplanation = `Verified ${defectType.replace('_', ' ')}: ${supportingEvidence.join(' ')}`;
    } else if (hasContradictions) {
      evidenceExplanation = `Rejected candidate defect: ${contradictoryEvidence.join(' ')}`;
    } else {
      evidenceExplanation = 'Uncertain finding: Candidate region exhibits minor surface variance but lacks conclusive fractured boundary evidence.';
    }

    return {
      isValidCrop: true,
      supportsPositiveFinding,
      isUncertain,
      supportingEvidence,
      contradictoryEvidence,
      isManholeCover,
      isRoadRepairPatch,
      isSurfaceShadow,
      isPaintedMarking,
      isWetSurfaceReflection,
      isVehicleSuperstructure,
      isVehicleWheel,
      isVehicleWindowOrSeam,
      isVehicleGrille,
      isBuildingWindowOrMortar,
      isRailwaySpecularReflect,
      isBridgeExpansionJoint,
      isOnPlausibleRoadSurface,
      roadSurfaceConfidence,
      cropCalibratedConfidence: calibratedConfidence,
      evidenceExplanation,
    };
  }
}
