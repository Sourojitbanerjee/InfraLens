import { ImagePixelBuffer } from './types';

export interface VehicleEnvelope {
  minX: number; // 0 - 100 percentage
  minY: number; // 0 - 100 percentage
  maxX: number; // 0 - 100 percentage
  maxY: number; // 0 - 100 percentage
  pixelBox: { minX: number; minY: number; maxX: number; maxY: number };
  colorType: 'orange_transit' | 'red_vehicle' | 'yellow_vehicle' | 'blue_vehicle' | 'metallic_panel';
  coveragePct: number;
}

export interface ContextAnalysisResult {
  isVehicleSuperstructure: boolean;
  isVehicleWheel: boolean;
  isVehicleWindowOrSeam: boolean;
  isVehicleGrille: boolean;
  isOnPlausibleRoadSurface: boolean;
  roadSurfaceConfidence: number; // 0 - 100%
  vehiclePaintRatio: number;      // 0 - 1 fraction of surrounding context that is vehicle paint
  asphaltRatio: number;           // 0 - 1 fraction of surrounding context that is neutral road
  rejectionReason?: string;
}

/**
 * Road Surface & Vehicle Superstructure Segmentation Module
 * Analyzes spatial scene context to establish navigable road ground plane
 * and delineate non-road objects (e.g. buses, cars, trucks) from true pavement.
 */
export class RoadSurfaceSegmenter {
  /**
   * Determine whether a pixel is characteristic of vehicle body paint
   * (e.g. municipal orange bus body, red car, blue truck, vivid metallic finish)
   */
  static isVehiclePaintPixel(r: number, g: number, b: number): boolean {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max === 0) return false;
    const sat = (max - min) / max;

    // 1. Vivid Municipal Orange Transit Bus (R >> B, G moderate, high saturation)
    // Common on San Francisco Muni, London/NYC commuter buses, etc.
    const isOrangeBus =
      r >= 170 &&
      g >= 50 &&
      g <= 160 &&
      b <= 65 &&
      r > g + 40 &&
      (r - b) >= 90 &&
      sat >= 0.52;

    // 2. Bright Red Vehicle Body
    const isRedVehicle = r >= 135 && g <= 90 && b <= 90 && (r - Math.max(g, b)) >= 45 && sat >= 0.35;

    // 3. Bright Yellow Vehicle Body (School bus, taxi)
    const isYellowVehicle = r >= 150 && g >= 130 && b <= 75 && (Math.min(r, g) - b) >= 65 && sat >= 0.35;

    // 4. Vivid Blue Vehicle Body
    const isBlueVehicle = b >= 125 && r <= 100 && (b - Math.max(r, g)) >= 30 && sat >= 0.30;

    // 5. Vivid Green Vehicle Body
    const isGreenVehicle = g >= 125 && b <= 105 && r <= 105 && (g - Math.max(r, b)) >= 30 && sat >= 0.30;

    return isOrangeBus || isRedVehicle || isYellowVehicle || isBlueVehicle || isGreenVehicle;
  }

  /**
   * Determine whether a pixel is neutral road asphalt / concrete pavement
   */
  static isNeutralRoadPixel(r: number, g: number, b: number): boolean {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max === 0) return true; // Black bitumen is neutral
    const sat = (max - min) / max;

    // Asphalt / concrete is monochromatic with very low saturation (S <= 0.22)
    // and balanced chromatic components (|R-G| <= 20, |G-B| <= 20)
    const isLowSat = sat <= 0.22;
    const isBalanced = Math.abs(r - g) <= 22 && Math.abs(g - b) <= 22 && Math.abs(r - b) <= 25;

    return isLowSat && isBalanced;
  }

  /**
   * Detect vehicle bounding envelopes in the image
   */
  static detectVehicleEnvelopes(buffer: ImagePixelBuffer): VehicleEnvelope[] {
    const { width, height, data } = buffer;
    const gridCols = Math.min(64, width);
    const gridRows = Math.min(64, height);
    const cellW = width / gridCols;
    const cellH = height / gridRows;

    // Map grid of vehicle paint density
    const paintGrid = new Uint8Array(gridCols * gridRows);

    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const startX = Math.floor(c * cellW);
        const endX = Math.min(width, Math.floor((c + 1) * cellW));
        const startY = Math.floor(r * cellH);
        const endY = Math.min(height, Math.floor((r + 1) * cellH));

        let paintCount = 0;
        let totalCount = 0;

        for (let y = startY; y < endY; y += 2) {
          for (let x = startX; x < endX; x += 2) {
            const idx = (y * width + x) * 4;
            if (this.isVehiclePaintPixel(data[idx], data[idx + 1], data[idx + 2])) {
              paintCount++;
            }
            totalCount++;
          }
        }

        if (totalCount > 0 && paintCount / totalCount >= 0.30) {
          paintGrid[r * gridCols + c] = 1;
        }
      }
    }

    // Connected components of vehicle paint
    const visited = new Uint8Array(gridCols * gridRows);
    const envelopes: VehicleEnvelope[] = [];

    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const idx = r * gridCols + c;
        if (!paintGrid[idx] || visited[idx]) continue;

        // Flood fill vehicle body
        const queue: [number, number][] = [[c, r]];
        visited[idx] = 1;
        let minC = c, maxC = c, minR = r, maxR = r;
        let cellCount = 0;

        while (queue.length > 0) {
          const [qc, qr] = queue.pop()!;
          cellCount++;
          if (qc < minC) minC = qc;
          if (qc > maxC) maxC = qc;
          if (qr < minR) minR = qr;
          if (qr > maxR) maxR = qr;

          const neighbors: [number, number][] = [
            [qc + 1, qr], [qc - 1, qr], [qc, qr + 1], [qc, qr - 1],
            [qc + 1, qr + 1], [qc - 1, qr - 1], [qc + 1, qr - 1], [qc - 1, qr + 1]
          ];

          for (const [nc, nr] of neighbors) {
            if (nc >= 0 && nc < gridCols && nr >= 0 && nr < gridRows) {
              const nIdx = nr * gridCols + nc;
              if (paintGrid[nIdx] && !visited[nIdx]) {
                visited[nIdx] = 1;
                queue.push([nc, nr]);
              }
            }
          }
        }

        // A vehicle body covers a significant spatial cluster (at least 6 grid cells, but less than 65% of frame)
        if (cellCount >= 6 && cellCount <= gridCols * gridRows * 0.65) {
          // Expand bounding envelope to encompass full vehicle superstructure
          // (including tinted windows above body and wheel wells / tires directly below)
          const spanW = maxC - minC + 1;
          const spanH = maxR - minR + 1;

          // Expand vertically down to ground contact plane (wheels/shadow extend ~25% below lower body)
          const expandedMaxR = Math.min(gridRows - 1, Math.round(maxR + spanH * 0.28));
          // Expand vertically up to roofline (windows extend ~20% above mid-beltline)
          const expandedMinR = Math.max(0, Math.round(minR - spanH * 0.20));

          const minX = Math.round((minC / gridCols) * 100);
          const maxX = Math.round(((maxC + 1) / gridCols) * 100);
          const minY = Math.round((expandedMinR / gridRows) * 100);
          const maxY = Math.round(((expandedMaxR + 1) / gridRows) * 100);

          const coveragePct = Number(((cellCount / (gridCols * gridRows)) * 100).toFixed(1));

          envelopes.push({
            minX,
            minY,
            maxX,
            maxY,
            pixelBox: {
              minX: Math.round(minC * cellW),
              minY: Math.round(expandedMinR * cellH),
              maxX: Math.round((maxC + 1) * cellW),
              maxY: Math.round((expandedMaxR + 1) * cellH),
            },
            colorType: 'orange_transit',
            coveragePct,
          });
        }
      }
    }

    return envelopes;
  }

  /**
   * Inspect the surroundings and internal structure of a candidate defect crop
   * to determine if it is on a genuine road surface or belongs to a vehicle.
   */
  static inspectCandidateContext(
    buffer: ImagePixelBuffer,
    box: { minX: number; minY: number; maxX: number; maxY: number },
    vehicleEnvelopes: VehicleEnvelope[]
  ): ContextAnalysisResult {
    const { width: imgW, height: imgH, data } = buffer;

    const cropW = box.maxX - box.minX + 1;
    const cropH = box.maxY - box.minY + 1;

    // Check overlap with vehicle envelopes
    const boxNormX = (box.minX / imgW) * 100;
    const boxNormY = (box.minY / imgH) * 100;
    const boxNormMaxX = (box.maxX / imgW) * 100;
    const boxNormMaxY = (box.maxY / imgH) * 100;

    let isInsideVehicleEnvelope = false;
    for (const env of vehicleEnvelopes) {
      const centerX = (boxNormX + boxNormMaxX) / 2;
      const centerY = (boxNormY + boxNormMaxY) / 2;

      const interX1 = Math.max(boxNormX, env.minX);
      const interY1 = Math.max(boxNormY, env.minY);
      const interX2 = Math.min(boxNormMaxX, env.maxX);
      const interY2 = Math.min(boxNormMaxY, env.maxY);
      const interW = Math.max(0, interX2 - interX1);
      const interH = Math.max(0, interY2 - interY1);
      const interArea = interW * interH;
      const boxArea = Math.max(1, (boxNormMaxX - boxNormX) * (boxNormMaxY - boxNormY));
      const overlapFraction = interArea / boxArea;

      if (
        (centerX >= env.minX && centerX <= env.maxX && centerY >= env.minY && centerY <= env.maxY) ||
        overlapFraction >= 0.45
      ) {
        isInsideVehicleEnvelope = true;
        break;
      }
    }

    // Context sampling: inspect a ring of pixels immediately surrounding the candidate box
    // (halo of 3 to 8 pixels outside the candidate box)
    const haloSize = Math.max(3, Math.min(10, Math.round(Math.min(cropW, cropH) * 0.25)));
    const haloMinX = Math.max(0, box.minX - haloSize);
    const haloMinY = Math.max(0, box.minY - haloSize);
    const haloMaxX = Math.min(imgW - 1, box.maxX + haloSize);
    const haloMaxY = Math.min(imgH - 1, box.maxY + haloSize);

    let vehiclePaintCount = 0;
    let asphaltCount = 0;
    let totalHaloCount = 0;

    for (let y = haloMinY; y <= haloMaxY; y += 1) {
      for (let x = haloMinX; x <= haloMaxX; x += 1) {
        // Only count pixels in the perimeter halo, not inside the candidate box itself
        const isInsideBox = x >= box.minX && x <= box.maxX && y >= box.minY && y <= box.maxY;
        if (isInsideBox) continue;

        const idx = (y * imgW + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        if (this.isVehiclePaintPixel(r, g, b)) {
          vehiclePaintCount++;
        } else if (this.isNeutralRoadPixel(r, g, b)) {
          asphaltCount++;
        }
        totalHaloCount++;
      }
    }

    const vehiclePaintRatio = totalHaloCount > 0 ? vehiclePaintCount / totalHaloCount : 0;
    const asphaltRatio = totalHaloCount > 0 ? asphaltCount / totalHaloCount : 0;

    // Wheel analysis:
    // A wheel has dark outer tire ring (L < 55) but a lighter metallic hub/rim center (L_center > L_outer + 12),
    // OR candidate is in lower quadrant of a vehicle envelope adjacent to vehicle body/fender
    let isVehicleWheel = false;
    if (cropW >= 4 && cropH >= 4) {
      const cropAspect = cropW / cropH;
      const isWheelAspect = cropAspect >= 0.65 && cropAspect <= 1.45;

      const centerX = Math.floor((box.minX + box.maxX) / 2);
      const centerY = Math.floor((box.minY + box.maxY) / 2);
      const radiusX = Math.max(1, cropW / 2);
      const radiusY = Math.max(1, cropH / 2);

      let centerLumSum = 0;
      let centerCount = 0;
      let outerTireLumSum = 0;
      let outerTireCount = 0;

      for (let y = box.minY; y <= box.maxY; y++) {
        for (let x = box.minX; x <= box.maxX; x++) {
          const dx = (x - centerX) / radiusX;
          const dy = (y - centerY) / radiusY;
          const rDist = Math.hypot(dx, dy);

          const idx = (y * imgW + x) * 4;
          const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];

          if (rDist <= 0.35) {
            centerLumSum += lum;
            centerCount++;
          } else if (rDist >= 0.65 && rDist <= 0.98) {
            outerTireLumSum += lum;
            outerTireCount++;
          }
        }
      }

      const avgCenter = centerCount > 0 ? centerLumSum / centerCount : 0;
      const avgOuter = outerTireCount > 0 ? outerTireLumSum / outerTireCount : 0;

      // Wheel signature:
      // 1. Hubcap profile: dark outer tire with lighter metallic hub center (>= 12ΔL)
      const hasHubcapProfile = isWheelAspect && avgOuter < 60 && avgCenter > avgOuter + 12;
      // 2. Wheel well position: inside or at base of vehicle envelope, touching vehicle paint
      const isAtVehicleChassis = isInsideVehicleEnvelope && (vehiclePaintRatio >= 0.08 || vehiclePaintCount >= 2);

      if (hasHubcapProfile || (isAtVehicleChassis && (boxNormY >= 45 || isWheelAspect))) {
        isVehicleWheel = true;
      }
    }

    // Vehicle superstructure check
    const isVehicleSuperstructure =
      (isInsideVehicleEnvelope && vehiclePaintRatio >= 0.08) ||
      vehiclePaintRatio >= 0.20;

    // Vehicle window or body seam:
    // Dark linear/rectangular feature on or adjacent to vehicle body
    const isVehicleWindowOrSeam =
      isInsideVehicleEnvelope && (vehiclePaintRatio >= 0.10 || vehiclePaintCount >= 2);

    // Vehicle grille:
    // Located on front/rear face of vehicle envelope (radiator / vent)
    const isVehicleGrille =
      isInsideVehicleEnvelope && (vehiclePaintRatio >= 0.06 || boxNormY <= 75);

    // Plausible road surface decision
    const isOnPlausibleRoadSurface =
      !isVehicleSuperstructure &&
      !isVehicleWheel &&
      !isVehicleWindowOrSeam &&
      !isVehicleGrille &&
      asphaltRatio >= 0.30 &&
      vehiclePaintRatio < 0.10;

    let roadSurfaceConfidence = Math.round(
      Math.min(100, Math.max(5, asphaltRatio * 100 - vehiclePaintRatio * 120))
    );

    let rejectionReason: string | undefined;
    if (isVehicleWheel) {
      rejectionReason = 'Region exhibits wheel-hub geometry resting on vehicle chassis, consistent with a vehicle wheel/tire rather than a road cavity.';
      roadSurfaceConfidence = Math.min(15, roadSurfaceConfidence);
    } else if (isVehicleSuperstructure) {
      rejectionReason = 'Candidate region is located on vehicle bodywork (detected high-saturation vehicle paint/panel), not on plausible road surface.';
      roadSurfaceConfidence = Math.min(10, roadSurfaceConfidence);
    } else if (isVehicleWindowOrSeam) {
      rejectionReason = 'Linear feature is embedded in vehicle bodywork (window gasket, glass reflection, or panel seam), not a road surface fracture.';
      roadSurfaceConfidence = Math.min(15, roadSurfaceConfidence);
    } else if (isVehicleGrille) {
      rejectionReason = 'Candidate exhibits periodic metallic ventilation grating on vehicle chassis (radiator / engine intake), not a street stormwater culvert.';
      roadSurfaceConfidence = Math.min(10, roadSurfaceConfidence);
    } else if (asphaltRatio < 0.25) {
      rejectionReason = 'Candidate surroundings lack characteristic neutral road aggregate texture.';
      roadSurfaceConfidence = Math.min(30, roadSurfaceConfidence);
    }

    return {
      isVehicleSuperstructure,
      isVehicleWheel,
      isVehicleWindowOrSeam,
      isVehicleGrille,
      isOnPlausibleRoadSurface,
      roadSurfaceConfidence,
      vehiclePaintRatio: Number(vehiclePaintRatio.toFixed(2)),
      asphaltRatio: Number(asphaltRatio.toFixed(2)),
      rejectionReason,
    };
  }
}
