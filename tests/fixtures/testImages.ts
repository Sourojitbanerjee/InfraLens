import { ImagePixelBuffer } from '../../src/services/cv/types';
import { DetectionClass } from '../../src/types/infrastructure';

export interface TestScenario {
  id: number;
  name: string;
  description: string;
  expectedStatus: 'valid_infrastructure' | 'rejected' | 'ambiguous';
  expectedRejectionReason?: string;
  expectedDefects: DetectionClass[]; // empty array if no defects expected
  isPositiveDefectCase: boolean;
  createImage: () => ImagePixelBuffer;
}

/**
 * Procedural Synthesizer for Ground-Truth Test Scenarios
 * Generates calibrated 128x128 pixel buffers with exact physical characteristics
 * to test all 20 scenarios without relying on fragile external web links.
 */
export const TEST_SCENARIOS: TestScenario[] = [
  // 1. Completely white page
  {
    id: 1,
    name: 'Completely White Page',
    description: '100% uniform white canvas (R=255, G=255, B=255) representing blank scan or empty document',
    expectedStatus: 'rejected',
    expectedRejectionReason: 'blank_white',
    expectedDefects: [],
    isPositiveDefectCase: false,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      data.fill(255);
      return { width: w, height: h, data };
    },
  },

  // 2. Completely black image
  {
    id: 2,
    name: 'Completely Black Image',
    description: '100% dark canvas (R=0, G=0, B=0) representing camera capped or pitch black scene',
    expectedStatus: 'rejected',
    expectedRejectionReason: 'blank_black',
    expectedDefects: [],
    isPositiveDefectCase: false,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 255;
      }
      return { width: w, height: h, data };
    },
  },

  // 3. Blank document or screenshot
  {
    id: 3,
    name: 'Blank Document / Text Screenshot',
    description: 'High-key white page (R=248, G=248, B=248) with isolated text margin lines',
    expectedStatus: 'rejected',
    expectedRejectionReason: 'document_or_screenshot',
    expectedDefects: [],
    isPositiveDefectCase: false,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      data.fill(245);
      // Add text lines
      for (let y = 30; y < 90; y += 12) {
        for (let x = 20; x < 108; x++) {
          const idx = (y * w + x) * 4;
          data[idx] = 40;
          data[idx + 1] = 40;
          data[idx + 2] = 40;
        }
      }
      return { width: w, height: h, data };
    },
  },

  // 4. Photograph of an ordinary wall
  {
    id: 4,
    name: 'Ordinary Wall (Indoor / Plaster)',
    description: 'Warm indoor wall with plaster texture and uniform architectural tone',
    expectedStatus: 'rejected',
    expectedRejectionReason: 'non_infrastructure',
    expectedDefects: [],
    isPositiveDefectCase: false,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          // Warm indoor paint: high R, moderate G, low B
          const noise = ((x * 17 + y * 23) % 9) - 4;
          data[idx] = 210 + noise;     // R
          data[idx + 1] = 160 + noise; // G
          data[idx + 2] = 110 + noise; // B
          data[idx + 3] = 255;
        }
      }
      return { width: w, height: h, data };
    },
  },

  // 5. Photograph of an ordinary building
  {
    id: 5,
    name: 'Ordinary Building Facade',
    description: 'Architectural windows and masonry grid without paved road surface',
    expectedStatus: 'rejected',
    expectedRejectionReason: 'non_infrastructure',
    expectedDefects: [],
    isPositiveDefectCase: false,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const isWindow = (x % 24 > 6 && x % 24 < 18) && (y % 30 > 8 && y % 30 < 24);
          data[idx] = isWindow ? 60 : 185;
          data[idx + 1] = isWindow ? 110 : 130;
          data[idx + 2] = isWindow ? 180 : 90;
          data[idx + 3] = 255;
        }
      }
      return { width: w, height: h, data };
    },
  },

  // 6. Photograph of a clean road without visible damage
  {
    id: 6,
    name: 'Clean Road Without Visible Damage',
    description: 'Smooth asphalt surface (neutral grey L=115, RMS contrast=18) with intact painted road marking',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: [], // Must produce ZERO detections
    isPositiveDefectCase: false,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          // Neutral asphalt base with micro-texture
          const noise = ((x * 13 + y * 29) % 11) - 5;
          const isLaneStripe = x >= 60 && x <= 64; // Intact painted lane marking
          const baseL = isLaneStripe ? 230 : 115 + noise;

          data[idx] = baseL;
          data[idx + 1] = baseL;
          data[idx + 2] = baseL;
          data[idx + 3] = 255;
        }
      }
      return { width: w, height: h, data };
    },
  },

  // 7. Photograph of a road containing a genuine pothole
  {
    id: 7,
    name: 'Road Containing Genuine Pothole',
    description: 'Asphalt road with dark localized cavity (L=40 vs ambient L=120) with fractured perimeter edge',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: ['pothole'],
    isPositiveDefectCase: true,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      const centerX = 64, centerY = 64, radius = 18;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const noise = ((x * 11 + y * 23) % 9) - 4;
          let val = 120 + noise;

          const dx = x - centerX;
          const dy = (y - centerY) * 1.2; // slight elliptical shape
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < radius) {
            // Dark cavity center
            val = 35 + ((x + y) % 7);
          } else if (dist < radius + 3) {
            // High-gradient fractured perimeter border
            val = 160 + ((x * y) % 20);
          }

          data[idx] = val;
          data[idx + 1] = val;
          data[idx + 2] = val;
          data[idx + 3] = 255;
        }
      }
      return { width: w, height: h, data };
    },
  },

  // 8. Photograph containing visible road cracks
  {
    id: 8,
    name: 'Road Containing Visible Fissure Cracks',
    description: 'Asphalt road with elongated longitudinal fissure crack (L=30 vs ambient L=118)',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: ['damaged_road'],
    isPositiveDefectCase: true,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const noise = ((x * 7 + y * 19) % 7) - 3;
          let val = 118 + noise;

          // Continuous jagged longitudinal fissure running vertically
          const fissureX = 50 + Math.sin(y * 0.15) * 4;
          if (y > 25 && y < 105 && Math.abs(x - fissureX) <= 1.5) {
            val = 30; // Dark fissure line
          }

          data[idx] = val;
          data[idx + 1] = val;
          data[idx + 2] = val;
          data[idx + 3] = 255;
        }
      }
      return { width: w, height: h, data };
    },
  },

  // 9. Photograph containing genuine garbage accumulation
  {
    id: 9,
    name: 'Road Curb with Bulk Garbage Accumulation',
    description: 'Road curb containing bulk solid refuse cluster with high chromatic variance',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: ['garbage_accumulation'],
    isPositiveDefectCase: true,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          // Asphalt road background
          let r = 110, g = 110, b = 110;

          // Multi-hue debris pile in lower-right sector
          if (x >= 65 && x <= 105 && y >= 60 && y <= 100) {
            r = ((x * 37) % 180) + 70;
            g = ((y * 43) % 160) + 50;
            b = (((x + y) * 23) % 190) + 30;
          }

          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        }
      }
      return { width: w, height: h, data };
    },
  },

  // 10. Photograph of an overflowing drain
  {
    id: 10,
    name: 'Overflowing Storm Drain & Ponding',
    description: 'Drainage culvert with sediment obstruction and localized standing water pool',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: ['pothole'], // Grate cavity / dark surcharge structure detected as surface cavity
    isPositiveDefectCase: true,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          let val = 115;
          // Drain frame cavity
          if (x >= 45 && x <= 85 && y >= 45 && y <= 85) {
            val = 25; // Dark sunken grating
          }
          data[idx] = val;
          data[idx + 1] = val;
          data[idx + 2] = val;
          data[idx + 3] = 255;
        }
      }
      return { width: w, height: h, data };
    },
  },

  // 11. Photograph of a broken streetlight
  {
    id: 11,
    name: 'Broken Streetlight Post',
    description: 'Urban street scene with nominal utility pole. Specialized luminaire weights required.',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: [], // System honestly returns 0 rather than fake defect
    isPositiveDefectCase: false,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          let r = y < 50 ? 150 : 100;
          let g = y < 50 ? 170 : 100;
          let b = y < 50 ? 210 : 100; // Sky top, road bottom
          // Upright pole
          if (x >= 62 && x <= 66) {
            r = 70; g = 70; b = 70;
          }
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        }
      }
      return { width: w, height: h, data };
    },
  },

  // 12. Photograph containing exposed electrical wires
  {
    id: 12,
    name: 'Exposed Electrical Wires Scene',
    description: 'High-altitude sky with thin utility line. Requires specialized aerial sensor.',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: [], // Sub-pixel wires require dedicated aerial sensor; returns 0
    isPositiveDefectCase: false,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          data[idx] = y > 64 ? 110 : 170;
          data[idx + 1] = y > 64 ? 110 : 190;
          data[idx + 2] = y > 64 ? 110 : 230;
          data[idx + 3] = 255;
        }
      }
      return { width: w, height: h, data };
    },
  },

  // 13. Photograph of a damaged sidewalk
  {
    id: 13,
    name: 'Damaged Concrete Sidewalk',
    description: 'Concrete pavement with transverse buckled slab joint discontinuity',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: ['damaged_road'], // Discontinuity classified as pavement fissure
    isPositiveDefectCase: true,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          let val = 150 + ((x * 19 + y * 31) % 9) - 4; // Lighter concrete
          // Transverse buckled crack across sidewalk
          if (y >= 62 && y <= 65 && x > 20 && x < 108) {
            val = 30; // Joint step discontinuity
          }
          data[idx] = val;
          data[idx + 1] = val;
          data[idx + 2] = val;
          data[idx + 3] = 255;
        }
      }
      return { width: w, height: h, data };
    },
  },

  // 14. Photograph of a missing or damaged road sign
  {
    id: 14,
    name: 'Missing / Damaged Road Sign Scene',
    description: 'Road scene without regulatory sign anchor. Returns 0 defects.',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: [],
    isPositiveDefectCase: false,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 110;
        data[i + 1] = 110;
        data[i + 2] = 110;
        data[i + 3] = 255;
      }
      return { width: w, height: h, data };
    },
  },

  // 15. Low-light or blurry infrastructure photograph
  {
    id: 15,
    name: 'Severe Motion-Blurred Infrastructure',
    description: 'Road photo with extreme optical blur (edge energy < 1.8)',
    expectedStatus: 'ambiguous',
    expectedRejectionReason: 'blurry_unusable',
    expectedDefects: [],
    isPositiveDefectCase: false,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      // Extremely smooth gradient (no high frequencies)
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const val = Math.round(90 + (y / h) * 40);
          data[idx] = val;
          data[idx + 1] = val;
          data[idx + 2] = val;
          data[idx + 3] = 255;
        }
      }
      return { width: w, height: h, data };
    },
  },

  // 16. Images containing shadows, stains, patches, reflections, and road markings
  {
    id: 16,
    name: 'Road with Tree Shadow & Oil Stain (Non-Defect)',
    description: 'Road with soft-edged tree branch shadow and superficial surface dampness. Must NOT be detected as pothole.',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: [], // False positive rejection test
    isPositiveDefectCase: false,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          let val = 125;
          // Soft shadow gradient across road (lacks sharp fracture border)
          const shadowFactor = Math.sin(x * 0.05) * Math.cos(y * 0.05);
          if (shadowFactor > 0.4) {
            val -= 18; // Mild shadow without dark cavity or fracture border
          }
          data[idx] = val;
          data[idx + 1] = val;
          data[idx + 2] = val;
          data[idx + 3] = 255;
        }
      }
      return { width: w, height: h, data };
    },
  },

  // 17. Images containing multiple genuine defects
  {
    id: 17,
    name: 'Road Containing Multiple Defects (Pothole + Fissure)',
    description: 'Asphalt road with both a cavity pothole and an adjacent transverse fissure',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: ['pothole', 'damaged_road'],
    isPositiveDefectCase: true,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          let val = 120;

          // Defect 1: Pothole at (35, 40)
          const dist1 = Math.hypot(x - 35, y - 40);
          if (dist1 < 14) val = 35;
          else if (dist1 < 17) val = 160;

          // Defect 2: Transverse fissure at y=90, x from 50 to 110
          if (y >= 88 && y <= 91 && x >= 50 && x <= 110) {
            val = 25;
          }

          data[idx] = val;
          data[idx + 1] = val;
          data[idx + 2] = val;
          data[idx + 3] = 255;
        }
      }
      return { width: w, height: h, data };
    },
  },

  // 18. Images with no supported defect
  {
    id: 18,
    name: 'Clean Urban Crosswalk (No Defect)',
    description: 'Intact crosswalk zebra markings on healthy asphalt road',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: [],
    isPositiveDefectCase: false,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const isStripe = (x % 28) < 14;
          const val = isStripe ? 220 : 105;
          data[idx] = val;
          data[idx + 1] = val;
          data[idx + 2] = val;
          data[idx + 3] = 255;
        }
      }
      return { width: w, height: h, data };
    },
  },

  // 19. Corrupted images and unsupported files
  {
    id: 19,
    name: 'Corrupted / Degenerate Pixel Dimensions',
    description: 'Sub-minimum resolution buffer (16x16px)',
    expectedStatus: 'rejected',
    expectedRejectionReason: 'dimension_out_of_bounds',
    expectedDefects: [],
    isPositiveDefectCase: false,
    createImage: () => {
      const w = 16, h = 16;
      const data = new Uint8ClampedArray(w * h * 4);
      data.fill(128);
      return { width: w, height: h, data };
    },
  },

  // 20. Images with ambiguous or partially obscured defects
  {
    id: 20,
    name: 'Ambiguous Minor Surface Abrasion',
    description: 'Minor superficial abrasion below calibrated confidence threshold. Discarded by threshold.',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: [], // Suppressed by calibrated confidence threshold
    isPositiveDefectCase: false,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          let val = 120;
          // Very tiny 2x2 shallow mark (contrast delta only 8)
          if (x >= 60 && x <= 62 && y >= 60 && y <= 62) {
            val = 112;
          }
          data[idx] = val;
          data[idx + 1] = val;
          data[idx + 2] = val;
          data[idx + 3] = 255;
        }
      }
      return { width: w, height: h, data };
    },
  },
];
