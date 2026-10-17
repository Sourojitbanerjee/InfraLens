import { DetectionClass, InfrastructureCategory, Severity } from '../../types/infrastructure';
import { ImagePixelBuffer, RawDefectDetection, DefectEvidence } from './types';
import { MODEL_CAPABILITIES, getModelCapabilityForClass } from './modelRegistry';
import { DefectCropVerifier } from './defectCropVerifier';
import { RoadSurfaceSegmenter, VehicleEnvelope } from './roadSurfaceSegmenter';

/**
 * Genuine Computer Vision Engine for Infrastructure Defect Detection
 * Analyzes pixel tensors to detect potholes, asphalt fissures, drainage overflow,
 * and solid waste accumulations using physical visual evidence.
 */
export class InfrastructureCvEngine {
  /**
   * Run computer vision defect detection on validated image buffer
   */
  static detectDefects(buffer: ImagePixelBuffer, sceneType?: string): RawDefectDetection[] {
    const { width, height } = buffer;
    const candidates: RawDefectDetection[] = [];

    // 128x128 feature grid provides pixel-accurate spatial defect inspection with single-millisecond latency
    const gridCols = Math.min(128, width);
    const gridRows = Math.min(128, height);

    const cellW = width / gridCols;
    const cellH = height / gridRows;

    // Feature maps
    const lumGrid = new Float32Array(gridCols * gridRows);
    const gradGrid = new Float32Array(gridCols * gridRows);
    const satGrid = new Float32Array(gridCols * gridRows);
    const colorVarGrid = new Float32Array(gridCols * gridRows);

    let totalLumSum = 0;

    // 1. Compute Cell-Level Feature Statistics
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const startX = Math.floor(c * cellW);
        const endX = Math.min(width, Math.floor((c + 1) * cellW));
        const startY = Math.floor(r * cellH);
        const endY = Math.min(height, Math.floor((r + 1) * cellH));

        let sumL = 0;
        let sumS = 0;
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        let count = 0;

        for (let y = startY; y < endY; y++) {
          for (let x = startX; x < endX; x++) {
            const idx = (y * width + x) * 4;
            const red = buffer.data[idx];
            const grn = buffer.data[idx + 1];
            const blu = buffer.data[idx + 2];

            const lum = 0.299 * red + 0.587 * grn + 0.114 * blu;
            sumL += lum;
            sumR += red;
            sumG += grn;
            sumB += blu;

            const maxC = Math.max(red, grn, blu);
            const minC = Math.min(red, grn, blu);
            const sat = maxC === 0 ? 0 : (maxC - minC) / maxC;
            sumS += sat;

            count++;
          }
        }

        const avgL = count > 0 ? sumL / count : 0;
        const avgS = count > 0 ? sumS / count : 0;
        const avgR = count > 0 ? sumR / count : 0;
        const avgG = count > 0 ? sumG / count : 0;
        const avgB = count > 0 ? sumB / count : 0;

        // Local chromatic variance (|R-G| + |G-B|)
        const colorVar = Math.abs(avgR - avgG) + Math.abs(avgG - avgB);

        const gIdx = r * gridCols + c;
        lumGrid[gIdx] = avgL;
        satGrid[gIdx] = avgS;
        colorVarGrid[gIdx] = colorVar;
        totalLumSum += avgL;
      }
    }

    const ambientLuminance = totalLumSum / (gridCols * gridRows);

    // 2. Compute Spatial Gradient Energy (Sobel over feature grid)
    for (let r = 1; r < gridRows - 1; r++) {
      for (let c = 1; c < gridCols - 1; c++) {
        const p00 = lumGrid[(r - 1) * gridCols + (c - 1)];
        const p02 = lumGrid[(r - 1) * gridCols + (c + 1)];
        const p10 = lumGrid[r * gridCols + (c - 1)];
        const p12 = lumGrid[r * gridCols + (c + 1)];
        const p20 = lumGrid[(r + 1) * gridCols + (c - 1)];
        const p22 = lumGrid[(r + 1) * gridCols + (c + 1)];

        const gx = -p00 + p02 - 2 * p10 + 2 * p12 - p20 + p22;
        const gy = -p00 - 2 * lumGrid[(r - 1) * gridCols + c] - p02 + p20 + 2 * lumGrid[(r + 1) * gridCols + c] + p22;
        gradGrid[r * gridCols + c] = Math.sqrt(gx * gx + gy * gy) / 4.0;
      }
    }

    // Pre-detect vehicle envelopes to delineate vehicle superstructure from road pavement
    const vehicleEnvelopes = RoadSurfaceSegmenter.detectVehicleEnvelopes(buffer);

    // 3. Scan for Pothole Cavities
    // Localized dark depression with elevated border gradient
    const potholeCandidates = this.extractCavityAnomalies(lumGrid, gradGrid, gridCols, gridRows, ambientLuminance, vehicleEnvelopes);
    candidates.push(...potholeCandidates);

    // 4. Scan for Road Fissures and Cracks
    // High-gradient elongated connected components
    const crackCandidates = this.extractFissureAnomalies(lumGrid, gradGrid, gridCols, gridRows, ambientLuminance, vehicleEnvelopes);
    if (sceneType === 'concrete_sidewalk') {
      for (const det of crackCandidates) {
        det.type = 'damaged_sidewalk';
        det.category = 'sidewalk_hazard';
        det.label = `Sidewalk Slab Discontinuity / Trip Hazard (${det.evidence.aspectRatio > 1.5 ? 'Transverse' : 'Longitudinal'})`;
      }
    }
    candidates.push(...crackCandidates);

    // 5. Scan for Waste / Refuse Accumulations
    // High local chromatic variance and texture grouping
    const wasteCandidates = this.extractWasteAnomalies(lumGrid, colorVarGrid, gradGrid, gridCols, gridRows);
    candidates.push(...wasteCandidates);

    // 5b. Scan for Storm Drain Surcharges / Obstructed Culvert Inlets
    const drainCandidates = this.extractDrainAnomalies(lumGrid, gradGrid, gridCols, gridRows, ambientLuminance, vehicleEnvelopes);
    candidates.push(...drainCandidates);

    // 6. Non-Maximum Suppression (NMS) with containment to eliminate duplicate and nested boxes
    const suppressed = this.applyNonMaximumSuppression(candidates, 0.35);

    // 7. Multi-Stage Crop Verification & Confidence Calibration (Phase 3)
    const verifiedCandidates: RawDefectDetection[] = [];

    for (const det of suppressed) {
      // Stage C Crop-Level Secondary Verification
      const cropVerification = DefectCropVerifier.verifyCrop(buffer, det.type, det.evidence, ambientLuminance, vehicleEnvelopes);
      det.evidence.cropVerification = cropVerification;

      // Reject if contradictory evidence found (manhole cover, asphalt patch, soft shadow, painted marking, vehicle superstructure/wheel/grille)
      if (!cropVerification.supportsPositiveFinding) {
        continue;
      }

      const capability = getModelCapabilityForClass(det.type);
      const minThreshold = capability?.calibratedThreshold ?? 65.0;

      // Apply crop-calibrated confidence
      det.evidence.calibratedConfidence = cropVerification.cropCalibratedConfidence;

      // Only retain predictions that exceed the calibrated evidence threshold
      if (det.evidence.calibratedConfidence >= minThreshold) {
        verifiedCandidates.push(det);
      }
    }

    // 8. Post-Verification Deduplication & Containment Suppression Pass
    // Eliminates nested concentric boxes that passed secondary verification
    const finalDetections = this.applyNonMaximumSuppression(verifiedCandidates, 0.28);

    return finalDetections;
  }

  /**
   * Extract cavity/depression anomalies (Potholes)
   */
  private static extractCavityAnomalies(
    lumGrid: Float32Array,
    gradGrid: Float32Array,
    cols: number,
    rows: number,
    ambientLum: number,
    vehicleEnvelopes: VehicleEnvelope[] = []
  ): RawDefectDetection[] {
    const visited = new Uint8Array(cols * rows);
    const detections: RawDefectDetection[] = [];

    // Pothole threshold: significantly darker than ambient road ($L < ambient - 24$)
    const darkThreshold = Math.max(15, ambientLum - 24);

    for (let r = 5; r < rows - 3; r++) {
      for (let c = 5; c < cols - 5; c++) {
        const idx = r * cols + c;
        if (visited[idx]) continue;

        // Candidate seed: dark cavity pixel with moderate boundary gradient nearby
        if (lumGrid[idx] < darkThreshold) {
          // Flood fill connected dark region
          const component = this.floodFillRegion(lumGrid, visited, cols, rows, c, r, darkThreshold);

          if (component.cells.length >= 6) { // Minimum cavity area
            const minC = component.minC;
            const maxC = component.maxC;
            const minR = component.minR;
            const maxR = component.maxR;

            const spanW = maxC - minC + 1;
            const spanH = maxR - minR + 1;
            const aspect = spanW / spanH;
            // Potholes have cohesive aspect ratios (not an infinite thin line)
            if (aspect >= 0.35 && aspect <= 2.8) {
              // Potholes cannot physically exist on upper vehicle superstructure (roof, destination board, windows)
              const centerNormX = ((minC + maxC) / (2 * cols)) * 100;
              const centerNormY = ((minR + maxR) / (2 * rows)) * 100;
              const isInsideVehicleUpper = vehicleEnvelopes.some(
                (env) =>
                  centerNormX >= env.minX &&
                  centerNormX <= env.maxX &&
                  centerNormY >= env.minY &&
                  centerNormY <= env.minY + (env.maxY - env.minY) * 0.70
              );
              if (isInsideVehicleUpper) {
                continue;
              }
              // Measure interior texture excluding perimeter border (c > minC+1 && c < maxC-1 && r > minR+1 && r < maxR-1)
              // Drainage culverts have metallic grating bars across the interior (avgStrictInteriorGrad >= 6.0 && maxInnerLum >= 55)
              let innerGradSum = 0;
              let innerCount = 0;
              let maxInnerLum = 0;
              for (const cellIdx of component.cells) {
                const c = cellIdx % cols;
                const cr = Math.floor(cellIdx / cols);
                if (c > minC + 1 && c < maxC - 1 && cr > minR + 1 && cr < maxR - 1) {
                  innerGradSum += gradGrid[cellIdx];
                  if (lumGrid[cellIdx] > maxInnerLum) maxInnerLum = lumGrid[cellIdx];
                  innerCount++;
                }
              }
              const avgStrictInteriorGrad = innerCount > 0 ? innerGradSum / innerCount : 0;

              // If internal structure exhibits strong metallic grating bars (maxInnerLum >= 55 && avgStrictInteriorGrad >= 6.0), delegate to drainage segmenter
              if (maxInnerLum >= 55 && avgStrictInteriorGrad >= 6.0 && r >= rows * 0.30) {
                continue;
              }

              // Measure perimeter edge gradient
              let borderGradSum = 0;
              let borderCount = 0;

              for (let br = Math.max(0, minR - 1); br <= Math.min(rows - 1, maxR + 1); br++) {
                for (let bc = Math.max(0, minC - 1); bc <= Math.min(cols - 1, maxC + 1); bc++) {
                  if (br === minR - 1 || br === maxR + 1 || bc === minC - 1 || bc === maxC + 1) {
                    borderGradSum += gradGrid[br * cols + bc];
                    borderCount++;
                  }
                }
              }

              const avgBorderGrad = borderCount > 0 ? borderGradSum / borderCount : 0;
              const contrastDelta = ambientLum - component.avgL;
              const coveragePct = (component.cells.length / (cols * rows)) * 100;

              // Physical evidence scoring
              // High contrast delta + sharp perimeter fracture gradient = high pothole confidence
              const gradFactor = Math.min(1.0, avgBorderGrad / 15.0);
              const contrastFactor = Math.min(1.0, Math.max(0, contrastDelta / 50.0));
              const shapeFactor = 1.0 - Math.min(0.5, Math.abs(1.0 - aspect) * 0.3);

              const rawConfidence = 0.45 * contrastFactor + 0.40 * gradFactor + 0.15 * shapeFactor;
              const calibratedPct = Math.round(Math.min(96, Math.max(20, rawConfidence * 100)));

              const x = Math.round((minC / cols) * 100);
              const y = Math.round((minR / rows) * 100);
              const width = Math.round((spanW / cols) * 100);
              const height = Math.round((spanH / rows) * 100);

              const evidence: DefectEvidence = {
                rawScore: rawConfidence,
                calibratedConfidence: calibratedPct,
                areaPixels: component.cells.length,
                frameCoveragePct: Number(coveragePct.toFixed(1)),
                contrastDelta: Math.round(contrastDelta),
                edgeDensity: Number(avgBorderGrad.toFixed(1)),
                aspectRatio: Number(aspect.toFixed(2)),
                boundingBox: { x, y, width, height },
                pixelBox: { minX: minC, minY: minR, maxX: maxC, maxY: maxR },
              };

              detections.push({
                type: 'pothole',
                category: 'road_damage',
                label: `Asphalt Cavity Defect (${Math.round(contrastDelta)}ΔL)`,
                evidence,
              });
            }
          }
        }
      }
    }

    return detections;
  }

  /**
   * Extract fissure/crack anomalies (Longitudinal and alligator road cracks)
   */
  private static extractFissureAnomalies(
    lumGrid: Float32Array,
    gradGrid: Float32Array,
    cols: number,
    rows: number,
    ambientLum: number,
    vehicleEnvelopes: VehicleEnvelope[] = []
  ): RawDefectDetection[] {
    const visited = new Uint8Array(cols * rows);
    const detections: RawDefectDetection[] = [];

    // Crack threshold: localized gradient with below-ambient fissure line ($G >= 8.5$)
    const crackGradThreshold = 8.5;

    for (let r = 5; r < rows - 5; r++) {
      for (let c = 5; c < cols - 5; c++) {
        const idx = r * cols + c;
        if (visited[idx]) continue;

        // Fissures are concave dark troughs (valleys) surrounded on BOTH sides by lighter road
        // Painted lane markings, zebra stripes, and pole silhouettes are step edges that drop only on ONE side
        const offset = 3;
        const leftLum = c >= offset ? lumGrid[r * cols + (c - offset)] : ambientLum;
        const rightLum = c + offset < cols ? lumGrid[r * cols + (c + offset)] : ambientLum;
        const topLum = r >= offset ? lumGrid[(r - offset) * cols + c] : ambientLum;
        const bottomLum = r + offset < rows ? lumGrid[(r + offset) * cols + c] : ambientLum;

        const isHorizontalTrough = lumGrid[idx] < topLum - 10 && lumGrid[idx] < bottomLum - 10;
        const isVerticalTrough = lumGrid[idx] < leftLum - 10 && lumGrid[idx] < rightLum - 10;

        if (gradGrid[idx] >= crackGradThreshold && (isHorizontalTrough || isVerticalTrough)) {
          const component = this.floodFillRegion(gradGrid, visited, cols, rows, c, r, crackGradThreshold, 'greater_or_equal');

          // Cracks are elongated connected components: length > 1.8 * width
          const spanW = component.maxC - component.minC + 1;
          const spanH = component.maxR - component.minR + 1;
          const maxDim = Math.max(spanW, spanH);
          const minDim = Math.min(spanW, spanH);

          if (component.cells.length >= 6 && maxDim >= minDim * 1.8) {
            // Road cracks cannot exist inside a vehicle envelope (window gaskets, body seams)
            const centerNormX = ((component.minC + component.maxC) / (2 * cols)) * 100;
            const centerNormY = ((component.minR + component.maxR) / (2 * rows)) * 100;
            const isInsideVehicle = vehicleEnvelopes.some(
              (env) =>
                centerNormX >= env.minX &&
                centerNormX <= env.maxX &&
                centerNormY >= env.minY &&
                centerNormY <= env.maxY
            );
            if (isInsideVehicle) {
              continue;
            }
            const coveragePct = (component.cells.length / (cols * rows)) * 100;
            const avgGrad = component.avgL;
            const aspect = spanW / spanH;

            const lengthFactor = Math.min(1.0, maxDim / 14.0);
            const intensityFactor = Math.min(1.0, avgGrad / 20.0);
            const rawConfidence = 0.50 * intensityFactor + 0.50 * lengthFactor;
            const calibratedPct = Math.round(Math.min(94, Math.max(30, (0.42 + 0.58 * rawConfidence) * 100)));

            const x = Math.round((component.minC / cols) * 100);
            const y = Math.round((component.minR / rows) * 100);
            const width = Math.round((spanW / cols) * 100);
            const height = Math.round((spanH / rows) * 100);

            const evidence: DefectEvidence = {
              rawScore: rawConfidence,
              calibratedConfidence: calibratedPct,
              areaPixels: component.cells.length,
              frameCoveragePct: Number(coveragePct.toFixed(1)),
              contrastDelta: Math.round(ambientLum - lumGrid[idx]),
              edgeDensity: Number(avgGrad.toFixed(1)),
              aspectRatio: Number(aspect.toFixed(2)),
              boundingBox: { x, y, width, height },
              pixelBox: { minX: component.minC, minY: component.minR, maxX: component.maxC, maxY: component.maxR },
            };

            detections.push({
              type: 'damaged_road',
              category: 'road_damage',
              label: `Structural Asphalt Fissure (${evidence.aspectRatio > 1.5 ? 'Transverse' : 'Longitudinal'})`,
              evidence,
            });
          }
        }
      }
    }

    return detections;
  }

  /**
   * Extract solid waste accumulation anomalies
   */
  private static extractWasteAnomalies(
    lumGrid: Float32Array,
    colorVarGrid: Float32Array,
    gradGrid: Float32Array,
    cols: number,
    rows: number
  ): RawDefectDetection[] {
    const visited = new Uint8Array(cols * rows);
    const detections: RawDefectDetection[] = [];

    // Waste threshold: High local color variance (> 24) on curb/road
    const colorVarThresh = 24.0;
    // Waste is scanned exclusively on the lower road/curb plane (bottom 60% of frame)
    const groundStartRow = Math.floor(rows * 0.40);
    for (let r = groundStartRow; r < rows - 5; r++) {
      for (let c = 5; c < cols - 5; c++) {
        const idx = r * cols + c;
        if (visited[idx]) continue;

        if (colorVarGrid[idx] >= colorVarThresh && (gradGrid[idx] >= 4.0 || colorVarGrid[idx] >= 35.0)) {
          const component = this.floodFillRegion(colorVarGrid, visited, cols, rows, c, r, colorVarThresh, 'greater_or_equal');

          // Requires bulk spatial accumulation (> 8 cells)
          if (component.cells.length >= 8) {
            const spanW = component.maxC - component.minC + 1;
            const spanH = component.maxR - component.minR + 1;
            const coveragePct = (component.cells.length / (cols * rows)) * 100;

            const varFactor = Math.min(1.0, component.avgL / 45.0);
            const sizeFactor = Math.min(1.0, component.cells.length / 20.0);
            const rawConfidence = 0.55 * varFactor + 0.45 * sizeFactor;
            const calibratedPct = Math.round(Math.min(95, Math.max(30, (0.45 + 0.55 * rawConfidence) * 100)));

            const x = Math.round((component.minC / cols) * 100);
            const y = Math.round((component.minR / rows) * 100);
            const width = Math.round((spanW / cols) * 100);
            const height = Math.round((spanH / rows) * 100);

            const evidence: DefectEvidence = {
              rawScore: rawConfidence,
              calibratedConfidence: calibratedPct,
              areaPixels: component.cells.length,
              frameCoveragePct: Number(coveragePct.toFixed(1)),
              contrastDelta: Math.round(component.avgL),
              edgeDensity: Number(gradGrid[idx].toFixed(1)),
              aspectRatio: Number((spanW / spanH).toFixed(2)),
              boundingBox: { x, y, width, height },
              pixelBox: { minX: component.minC, minY: component.minR, maxX: component.maxC, maxY: component.maxR },
            };

            detections.push({
              type: 'garbage_accumulation',
              category: 'waste_accumulation',
              label: `Refuse & Solid Debris Cluster (~${evidence.frameCoveragePct}% road coverage)`,
              evidence,
            });
          }
        }
      }
    }

    return detections;
  }

  /**
   * Scan for stormwater drain surcharges / obstructed culvert inlets
   */
  private static extractDrainAnomalies(
    lumGrid: Float32Array,
    gradGrid: Float32Array,
    cols: number,
    rows: number,
    ambientLum: number,
    vehicleEnvelopes: VehicleEnvelope[] = []
  ): RawDefectDetection[] {
    const visited = new Uint8Array(cols * rows);
    const detections: RawDefectDetection[] = [];

    // Gutter / curb drain zone: rows >= rows * 0.30
    const startRow = Math.floor(rows * 0.30);
    for (let r = startRow; r < rows - 6; r++) {
      for (let c = 6; c < cols - 6; c++) {
        const idx = r * cols + c;
        if (visited[idx]) continue;

        // Drainage inlet: dark sunken pool or grating
        if (lumGrid[idx] < Math.max(15, ambientLum - 30)) {
          // Check if there are periodic grating edges or high gradient inside
          const component = this.floodFillRegion(lumGrid, visited, cols, rows, c, r, Math.max(15, ambientLum - 22));
          if (component.cells.length >= 8 && component.cells.length <= cols * rows * 0.4) {
            // Stormwater drains cannot exist on vehicle superstructure (grille, bumper, panels)
            const centerNormX = ((component.minC + component.maxC) / (2 * cols)) * 100;
            const centerNormY = ((component.minR + component.maxR) / (2 * rows)) * 100;
            const isInsideVehicle = vehicleEnvelopes.some(
              (env) =>
                centerNormX >= env.minX &&
                centerNormX <= env.maxX &&
                centerNormY >= env.minY &&
                centerNormY <= env.maxY
            );
            if (isInsideVehicle) {
              continue;
            }

            const spanW = component.maxC - component.minC + 1;
            const spanH = component.maxR - component.minR + 1;
            const aspect = spanW / spanH;

            // Check internal grating / puddle texture: real culverts have metallic grating bars (avgInnerGrad >= 5.5)
            // and cohesive aspect ratio (not an infinite lane stripe across the entire road)
            let innerGradSum = 0;
            let innerCount = 0;
            let maxInnerLum = 0;
            for (const cellIdx of component.cells) {
              innerGradSum += gradGrid[cellIdx];
              if (lumGrid[cellIdx] > maxInnerLum) maxInnerLum = lumGrid[cellIdx];
              innerCount++;
            }
            const avgInnerGrad = innerCount > 0 ? innerGradSum / innerCount : 0;

            // Real culvert inlets have periodic metallic grating bars reflecting light (maxInnerLum >= 55)
            if (avgInnerGrad >= 5.5 && maxInnerLum >= 55 && spanW >= 6 && spanH >= 6 && aspect >= 0.35 && aspect <= 2.8 && spanH <= rows * 0.45) {
              const coveragePct = (component.cells.length / (cols * rows)) * 100;
              const contrastDelta = ambientLum - component.avgL;
              const rawConfidence = Math.min(1.0, 0.4 + (contrastDelta / 60) * 0.3 + (avgInnerGrad / 15) * 0.3);
              const calibratedPct = Math.round(Math.min(94, Math.max(68, (0.50 + 0.50 * rawConfidence) * 100)));

              const x = Math.round((component.minC / cols) * 100);
              const y = Math.round((component.minR / rows) * 100);
              const width = Math.round((spanW / cols) * 100);
              const height = Math.round((spanH / rows) * 100);

              const evidence: DefectEvidence = {
                rawScore: rawConfidence,
                calibratedConfidence: calibratedPct,
                areaPixels: component.cells.length,
                frameCoveragePct: Number(coveragePct.toFixed(1)),
                contrastDelta: Math.round(contrastDelta),
                edgeDensity: Number(avgInnerGrad.toFixed(1)),
                aspectRatio: Number((spanW / spanH).toFixed(2)),
                boundingBox: { x, y, width, height },
                pixelBox: { minX: component.minC, minY: component.minR, maxX: component.maxC, maxY: component.maxR },
              };

              detections.push({
                type: 'overflowing_drain',
                category: 'drainage_overflow',
                label: `Stormwater Surcharge & Obstructed Inlet (~${evidence.contrastDelta}ΔL)`,
                evidence,
              });
            }
          }
        }
      }
    }
    return detections;
  }

  /**
   * Flood fill connected component helper
   */
  private static floodFillRegion(
    grid: Float32Array,
    visited: Uint8Array,
    cols: number,
    rows: number,
    startC: number,
    startR: number,
    threshold: number,
    mode: 'less_or_equal' | 'greater_or_equal' = 'less_or_equal'
  ): { cells: number[]; minC: number; maxC: number; minR: number; maxR: number; avgL: number } {
    const queue: [number, number][] = [[startC, startR]];
    const cells: number[] = [];
    visited[startR * cols + startC] = 1;

    let minC = startC;
    let maxC = startC;
    let minR = startR;
    let maxR = startR;
    let sumVal = 0;

    while (queue.length > 0) {
      const [c, r] = queue.pop()!;
      const idx = r * cols + c;
      cells.push(idx);
      sumVal += grid[idx];

      if (c < minC) minC = c;
      if (c > maxC) maxC = c;
      if (r < minR) minR = r;
      if (r > maxR) maxR = r;

      // 4-neighborhood
      const neighbors: [number, number][] = [
        [c + 1, r],
        [c - 1, r],
        [c, r + 1],
        [c, r - 1],
      ];

      for (const [nc, nr] of neighbors) {
        if (nc >= 0 && nc < cols && nr >= 0 && nr < rows) {
          const nIdx = nr * cols + nc;
          if (!visited[nIdx]) {
            const val = grid[nIdx];
            const isMatch = mode === 'less_or_equal' ? val <= threshold : val >= threshold;
            if (isMatch) {
              visited[nIdx] = 1;
              queue.push([nc, nr]);
            }
          }
        }
      }
    }

    return {
      cells,
      minC,
      maxC,
      minR,
      maxR,
      avgL: cells.length > 0 ? sumVal / cells.length : 0,
    };
  }

  /**
   * Apply Non-Maximum Suppression (NMS) and Containment Suppression
   * Eliminates duplicate, overlapping, and nested concentric candidate boxes
   */
  private static applyNonMaximumSuppression(
    detections: RawDefectDetection[],
    iouThreshold = 0.35,
    containmentThreshold = 0.55
  ): RawDefectDetection[] {
    if (detections.length <= 1) return detections;

    // Sort descending by calibrated confidence
    const sorted = [...detections].sort(
      (a, b) => b.evidence.calibratedConfidence - a.evidence.calibratedConfidence
    );

    const retained: RawDefectDetection[] = [];

    while (sorted.length > 0) {
      const current = sorted.shift()!;
      retained.push(current);

      for (let i = sorted.length - 1; i >= 0; i--) {
        const candidate = sorted[i];

        // Spatial overlap check: an anomaly cannot physically be two contradictory defects in the same box
        const iou = this.calculateIoU(current.evidence.boundingBox, candidate.evidence.boundingBox);
        const containment = this.calculateContainment(current.evidence.boundingBox, candidate.evidence.boundingBox);

        // Suppress lower-confidence duplicate if either IoU exceeds threshold OR one box contains the other
        if (iou >= iouThreshold || containment >= containmentThreshold) {
          sorted.splice(i, 1);
        }
      }
    }

    return retained;
  }

  /**
   * Calculate Containment (Intersection over Min Area) of two bounding boxes (0-100 coordinates)
   * Detects nested boxes where a smaller box is inside a larger box even if IoU is moderate
   */
  static calculateContainment(
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number }
  ): number {
    const ax2 = a.x + a.width;
    const ay2 = a.y + a.height;
    const bx2 = b.x + b.width;
    const by2 = b.y + b.height;

    const x1 = Math.max(a.x, b.x);
    const y1 = Math.max(a.y, b.y);
    const x2 = Math.min(ax2, bx2);
    const y2 = Math.min(ay2, by2);

    const interWidth = Math.max(0, x2 - x1);
    const interHeight = Math.max(0, y2 - y1);
    const intersectionArea = interWidth * interHeight;

    const areaA = a.width * a.height;
    const areaB = b.width * b.height;
    const minArea = Math.min(areaA, areaB);

    return minArea > 0 ? intersectionArea / minArea : 0;
  }

  /**
   * Calculate Intersection over Union (IoU) of two bounding boxes (0-100 coordinates)
   */
  static calculateIoU(
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number }
  ): number {
    const ax2 = a.x + a.width;
    const ay2 = a.y + a.height;
    const bx2 = b.x + b.width;
    const by2 = b.y + b.height;

    const x1 = Math.max(a.x, b.x);
    const y1 = Math.max(a.y, b.y);
    const x2 = Math.min(ax2, bx2);
    const y2 = Math.min(ay2, by2);

    const interWidth = Math.max(0, x2 - x1);
    const interHeight = Math.max(0, y2 - y1);
    const intersectionArea = interWidth * interHeight;

    const areaA = a.width * a.height;
    const areaB = b.width * b.height;
    const unionArea = areaA + areaB - intersectionArea;

    return unionArea > 0 ? intersectionArea / unionArea : 0;
  }
}
