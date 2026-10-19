import { ImagePixelBuffer, ImageValidationMetrics, ImageValidationResult, SceneClassification, SceneUnderstandingResult } from './types';
import { UniversalSceneUnderstandingEngine } from './sceneUnderstandingEngine';

/**
 * Strict Image Validation Pipeline
 * Evaluates image integrity, blank/unusable images, luminance, RMS contrast,
 * edge gradient energy, color entropy, and infrastructure relevance.
 */
export class ImageValidationPipeline {
  /**
   * Run full validation pipeline on decoded image pixel buffer
   */
  static validate(buffer: ImagePixelBuffer): ImageValidationResult {
    const { width, height, data } = buffer;

    // 1. Dimension & Integrity Checks
    if (width < 32 || height < 32) {
      return {
        isValid: false,
        operationalState: 'IMAGE_QUALITY_INSUFFICIENT',
        scenePresence: 'image_unsuitable',
        status: 'rejected',
        sceneType: 'blank',
        rejectionReason: 'dimension_out_of_bounds',
        rejectionMessage: `Image resolution (${width}x${height}px) is below minimum inspection requirement (32x32px).`,
        metrics: this.computeEmptyMetrics(),
        sceneConfidence: 0,
      };
    }

    const aspectRatio = width / height;
    if (aspectRatio > 20 || aspectRatio < 0.05) {
      return {
        isValid: false,
        operationalState: 'IMAGE_QUALITY_INSUFFICIENT',
        scenePresence: 'image_unsuitable',
        status: 'rejected',
        sceneType: 'ambiguous',
        rejectionReason: 'dimension_out_of_bounds',
        rejectionMessage: `Extreme aspect ratio (${aspectRatio.toFixed(2)}) is incompatible with spatial road inspection.`,
        metrics: this.computeEmptyMetrics(),
        sceneConfidence: 0,
      };
    }

    // 2. Compute Physical Visual Metrics
    const metrics = this.computeMetrics(buffer);

    // 3. Blank & Extreme Uniformity Rejection
    // A completely white page (e.g. meanLuminance > 240, RMS contrast < 14, edge energy < 2.5)
    if (metrics.meanLuminance > 238 && metrics.rmsContrast < 18 && metrics.edgeEnergy < 2.5) {
      return {
        isValid: false,
        operationalState: 'IMAGE_QUALITY_INSUFFICIENT',
        scenePresence: 'image_unsuitable',
        status: 'rejected',
        sceneType: 'blank',
        rejectionReason: 'blank_white',
        rejectionMessage: 'Image is a blank or near-blank white page. No infrastructure content detected.',
        metrics,
        sceneConfidence: 99.8,
      };
    }

    // Completely black or dark unilluminated page
    if (metrics.meanLuminance < 14 && metrics.rmsContrast < 12 && metrics.edgeEnergy < 2.0) {
      return {
        isValid: false,
        operationalState: 'IMAGE_QUALITY_INSUFFICIENT',
        scenePresence: 'image_unsuitable',
        status: 'rejected',
        sceneType: 'blank',
        rejectionReason: 'blank_black',
        rejectionMessage: 'Image is completely dark or underexposed. Insufficient ambient illumination for computer vision.',
        metrics,
        sceneConfidence: 99.5,
      };
    }

    // Uniform solid color or empty canvas
    if (metrics.rmsContrast < 3.5 && metrics.edgeEnergy < 1.0) {
      return {
        isValid: false,
        operationalState: 'IMAGE_QUALITY_INSUFFICIENT',
        scenePresence: 'image_unsuitable',
        status: 'rejected',
        sceneType: 'blank',
        rejectionReason: 'uniform_blank',
        rejectionMessage: 'Image lacks textural variation and surface structure (pure solid/uniform canvas).',
        metrics,
        sceneConfidence: 99.0,
      };
    }

    // High-key document or text screenshot detection
    if (metrics.meanLuminance > 215 && metrics.saturationMean < 0.08 && metrics.rmsContrast < 45 && metrics.colorEntropy < 3.2) {
      return {
        isValid: false,
        operationalState: 'UNSUPPORTED_IMAGE',
        scenePresence: 'infrastructure_absent',
        status: 'rejected',
        sceneType: 'non_infrastructure',
        rejectionReason: 'document_or_screenshot',
        rejectionMessage: 'Image resembles a digital document, text screenshot, or synthetic vector graphic rather than an outdoor street scene.',
        metrics,
        sceneConfidence: 94.0,
      };
    }

    // Severe blur or completely out-of-focus capture
    if (metrics.edgeEnergy < 1.8 && metrics.rmsContrast > 8 && metrics.dynamicRange > 30) {
      return {
        isValid: false,
        operationalState: 'IMAGE_QUALITY_INSUFFICIENT',
        scenePresence: 'infrastructure_uncertain',
        status: 'ambiguous',
        sceneType: 'ambiguous',
        rejectionReason: 'blurry_unusable',
        rejectionMessage: 'Optical capture is severely out of focus or motion-blurred. Surface textures cannot be reliably resolved.',
        metrics,
        sceneConfidence: 85.0,
      };
    }

    // 4. Infrastructure Relevance & Scene Understanding
    const sceneUnderstanding = UniversalSceneUnderstandingEngine.analyze(buffer);
    const sceneAnalysis = this.classifyScene(buffer, metrics, sceneUnderstanding);

    if (sceneAnalysis.sceneType === 'non_infrastructure' || !sceneUnderstanding.containsInfrastructure) {
      return {
        isValid: false,
        operationalState: 'NO_RELEVANT_INFRASTRUCTURE_IDENTIFIED',
        scenePresence: 'infrastructure_absent',
        status: 'rejected',
        sceneType: 'non_infrastructure',
        rejectionReason: 'non_infrastructure',
        rejectionMessage: sceneAnalysis.reason || sceneUnderstanding.explanation || 'Image does not contain outdoor road, building, bridge, railway, pavement, or municipal civil infrastructure.',
        metrics,
        sceneConfidence: sceneAnalysis.confidence,
        sceneUnderstanding,
      };
    }

    return {
      isValid: true,
      operationalState: 'NO_DAMAGE_DETECTED_WITHIN_SUPPORTED_SCOPE',
      scenePresence: 'infrastructure_present',
      status: 'valid_infrastructure',
      sceneType: sceneAnalysis.sceneType,
      metrics,
      sceneConfidence: sceneAnalysis.confidence,
      sceneUnderstanding,
    };
  }

  /**
   * Calculate luminance, RMS contrast, gradient edge energy, and color statistics
   */
  static computeMetrics(buffer: ImagePixelBuffer): ImageValidationMetrics {
    const { width, height, data } = buffer;
    const totalPixels = width * height;

    let sumLuminance = 0;
    let minLuminance = 255;
    let maxLuminance = 0;
    let sumSaturation = 0;

    // Grayscale luminance array for spatial gradients
    const luminanceArray = new Float32Array(totalPixels);

    // Color channel histograms for entropy calculation
    const histR = new Uint32Array(256);
    const histG = new Uint32Array(256);
    const histB = new Uint32Array(256);

    for (let i = 0; i < totalPixels; i++) {
      const idx = i * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      histR[r]++;
      histG[g]++;
      histB[b]++;

      // ITU-R BT.601 standard photometric luminance
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      luminanceArray[i] = lum;
      sumLuminance += lum;

      if (lum < minLuminance) minLuminance = lum;
      if (lum > maxLuminance) maxLuminance = lum;

      // Saturation in HSV: (max - min) / max
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const sat = maxC === 0 ? 0 : (maxC - minC) / maxC;
      sumSaturation += sat;
    }

    const meanLuminance = sumLuminance / totalPixels;
    const saturationMean = sumSaturation / totalPixels;

    // RMS Contrast: standard deviation of luminance
    let sumVariance = 0;
    for (let i = 0; i < totalPixels; i++) {
      const diff = luminanceArray[i] - meanLuminance;
      sumVariance += diff * diff;
    }
    const rmsContrast = Math.sqrt(sumVariance / totalPixels);

    // Edge energy using Sobel gradient magnitude
    let sumEdgeMagnitude = 0;
    let edgeSampleCount = 0;

    // Sample across grid to measure high-frequency textural energy
    const step = Math.max(1, Math.floor(Math.sqrt(totalPixels / 10000)));

    for (let y = 1; y < height - 1; y += step) {
      for (let x = 1; x < width - 1; x += step) {
        // Sobel kernels
        // Gx: [-1, 0, 1; -2, 0, 2; -1, 0, 1]
        // Gy: [-1, -2, -1; 0, 0, 0; 1, 2, 1]
        const p00 = luminanceArray[(y - 1) * width + (x - 1)];
        const p01 = luminanceArray[(y - 1) * width + x];
        const p02 = luminanceArray[(y - 1) * width + (x + 1)];

        const p10 = luminanceArray[y * width + (x - 1)];
        const p12 = luminanceArray[y * width + (x + 1)];

        const p20 = luminanceArray[(y + 1) * width + (x - 1)];
        const p21 = luminanceArray[(y + 1) * width + x];
        const p22 = luminanceArray[(y + 1) * width + (x + 1)];

        const gx = -p00 + p02 - 2 * p10 + 2 * p12 - p20 + p22;
        const gy = -p00 - 2 * p01 - p02 + p20 + 2 * p21 + p22;

        const mag = Math.sqrt(gx * gx + gy * gy) / 4.0;
        sumEdgeMagnitude += mag;
        edgeSampleCount++;
      }
    }

    const edgeEnergy = edgeSampleCount > 0 ? sumEdgeMagnitude / edgeSampleCount : 0;

    // Color channel Shannon entropy
    let entropyR = 0;
    let entropyG = 0;
    let entropyB = 0;

    for (let c = 0; c < 256; c++) {
      if (histR[c] > 0) {
        const p = histR[c] / totalPixels;
        entropyR -= p * Math.log2(p);
      }
      if (histG[c] > 0) {
        const p = histG[c] / totalPixels;
        entropyG -= p * Math.log2(p);
      }
      if (histB[c] > 0) {
        const p = histB[c] / totalPixels;
        entropyB -= p * Math.log2(p);
      }
    }
    const colorEntropy = (entropyR + entropyG + entropyB) / 3.0;

    // Check if grayscale or neutral road-tone palette
    const isGrayscaleOrNeutral = saturationMean < 0.22;
    const isUniform = rmsContrast < 5.0 && edgeEnergy < 1.5;

    return {
      meanLuminance,
      rmsContrast,
      dynamicRange: maxLuminance - minLuminance,
      edgeEnergy,
      colorEntropy,
      saturationMean,
      isUniform,
      isGrayscaleOrNeutral,
      aspectRatio: width / height,
    };
  }

  /**
   * Scene Classification based on spectral, spatial, textural distributions, and scene understanding
   */
  private static classifyScene(
    buffer: ImagePixelBuffer,
    metrics: ImageValidationMetrics,
    sceneUnderstanding: SceneUnderstandingResult
  ): { sceneType: SceneClassification; confidence: number; reason?: string } {
    const { width, height, data } = buffer;
    const totalPixels = width * height;

    // Check spatial ground-plane characteristics (typical outdoor road has ground in bottom 60%)
    let bottomLuminanceSum = 0;
    let topLuminanceSum = 0;
    let bottomPixels = 0;
    let topPixels = 0;

    let roadColorPixelCount = 0; // asphalt/bitumen: neutral low-saturation tones
    let vegetationPixelCount = 0; // foliage/grass: high G > R and G > B
    let skyPixelCount = 0; // high B > R and high luminance

    const halfHeight = Math.floor(height / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        if (y >= halfHeight) {
          bottomLuminanceSum += lum;
          bottomPixels++;
        } else {
          topLuminanceSum += lum;
          topPixels++;
        }

        // Neutral asphalt / concrete chromatic signature
        const isNeutral = Math.abs(r - g) < 26 && Math.abs(g - b) < 26 && Math.abs(r - b) < 26;
        if (isNeutral && lum > 25 && lum < 225) {
          roadColorPixelCount++;
        }

        // Foliage check: green dominance
        if (g > r + 20 && g > b + 15 && g > 45) {
          vegetationPixelCount++;
        }

        // Sky check: blue dominance or very high top luminance
        if (b > r + 15 && b > 140 && y < height * 0.4) {
          skyPixelCount++;
        }
      }
    }

    const roadRatio = roadColorPixelCount / totalPixels;
    const vegetationRatio = vegetationPixelCount / totalPixels;
    const skyRatio = skyPixelCount / totalPixels;

    // Non-infrastructure: Pure nature/vegetation (e.g. dense forest, green lawn without road)
    if (vegetationRatio > 0.75 && roadRatio < 0.10 && sceneUnderstanding.primaryCategory !== 'building_damage' && sceneUnderstanding.primaryCategory !== 'bridge_damage') {
      return {
        sceneType: 'non_infrastructure',
        confidence: 91.0,
        reason: 'Image depicts natural vegetation or landscape without visible paved road, sidewalk, or municipal infrastructure.',
      };
    }

    // Non-infrastructure: Indoor room or living space
    if (metrics.saturationMean > 0.45 && roadRatio < 0.12 && !sceneUnderstanding.containsInfrastructure && !metrics.isGrayscaleOrNeutral) {
      return {
        sceneType: 'non_infrastructure',
        confidence: 88.0,
        reason: 'Image contains domestic or indoor environment (high saturation/indoor palette) lacking civil infrastructure.',
      };
    }

    // If scene understanding identified infrastructure, map category
    if (sceneUnderstanding.containsInfrastructure) {
      if (sceneUnderstanding.primaryCategory === 'building_damage') {
        return {
          sceneType: 'building_structure',
          confidence: 92.0,
        };
      }
      if (sceneUnderstanding.primaryCategory === 'bridge_damage') {
        return {
          sceneType: 'bridge_overpass',
          confidence: 90.0,
        };
      }
      if (sceneUnderstanding.primaryCategory === 'railway_damage') {
        return {
          sceneType: 'railway_track',
          confidence: 91.0,
        };
      }
      if (sceneUnderstanding.primaryCategory === 'sidewalk_hazard') {
        return {
          sceneType: 'concrete_sidewalk',
          confidence: 88.0,
        };
      }
      if (sceneUnderstanding.primaryCategory === 'drainage_overflow') {
        return {
          sceneType: 'drainage_structure',
          confidence: 85.0,
        };
      }
      if (sceneUnderstanding.primaryCategory === 'lighting_failure') {
        return {
          sceneType: 'lighting_infrastructure',
          confidence: 85.0,
        };
      }
      if (sceneUnderstanding.primaryCategory === 'public_utility') {
        return {
          sceneType: 'public_utility',
          confidence: 85.0,
        };
      }
      if (sceneUnderstanding.primaryCategory === 'road_damage') {
        if (roadRatio >= 0.35 && metrics.edgeEnergy >= 2.0 && skyRatio < 0.05) {
          return {
            sceneType: 'road_asphalt',
            confidence: Math.min(98, Math.round(50 + roadRatio * 50)),
          };
        }
        return {
          sceneType: 'urban_street',
          confidence: 85.0,
        };
      }
    }

    // Asphalt Road Scene fallback
    if (roadRatio >= 0.35 && metrics.edgeEnergy >= 2.0) {
      return {
        sceneType: 'road_asphalt',
        confidence: Math.min(98, Math.round(50 + roadRatio * 50)),
      };
    }

    // Concrete Sidewalk / Pavement Scene fallback
    if (metrics.isGrayscaleOrNeutral && metrics.meanLuminance >= 90 && metrics.meanLuminance <= 210 && metrics.edgeEnergy >= 2.5) {
      return {
        sceneType: 'concrete_sidewalk',
        confidence: 86.0,
      };
    }

    // Urban Street Scene fallback
    if (roadRatio >= 0.20 || (skyRatio > 0.05 && roadRatio >= 0.15)) {
      return {
        sceneType: 'urban_street',
        confidence: 82.0,
      };
    }

    // Drainage or civil concrete structure fallback
    if (metrics.rmsContrast >= 25 && metrics.dynamicRange >= 100 && metrics.edgeEnergy >= 3.0) {
      return {
        sceneType: 'drainage_structure',
        confidence: 76.0,
      };
    }

    // If moderate neutral content exists, mark as ambiguous rather than outright rejected
    if (roadRatio >= 0.15 || metrics.isGrayscaleOrNeutral) {
      return {
        sceneType: 'urban_street',
        confidence: 65.0,
      };
    }

    return {
      sceneType: 'non_infrastructure',
      confidence: 78.0,
      reason: sceneUnderstanding.explanation || 'Image does not exhibit recognizable civil or public right-of-way infrastructure patterns.',
    };
  }

  private static computeEmptyMetrics(): ImageValidationMetrics {
    return {
      meanLuminance: 0,
      rmsContrast: 0,
      dynamicRange: 0,
      edgeEnergy: 0,
      colorEntropy: 0,
      saturationMean: 0,
      isUniform: true,
      isGrayscaleOrNeutral: false,
      aspectRatio: 1,
    };
  }
}
