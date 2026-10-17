import { ImagePixelBuffer } from '../../src/services/cv/types';
import { DetectionClass } from '../../src/types/infrastructure';

export type ScenarioGroup = 'negative' | 'positive' | 'difficult';

export interface TestScenario {
  id: number;
  group: ScenarioGroup;
  name: string;
  description: string;
  expectedStatus: 'valid_infrastructure' | 'rejected' | 'ambiguous';
  expectedRejectionReason?: string;
  expectedDefects: DetectionClass[]; // empty array if no defects expected
  isPositiveDefectCase: boolean;
  createImage: () => ImagePixelBuffer;
}

/**
 * Procedural Synthesizer for Ground-Truth Test Scenarios (Phase 5 Required Evaluation Benchmark)
 * Generates calibrated 128x128 pixel buffers with exact physical characteristics
 * covering 18 Negative, 9 Positive, and 8 Difficult/Edge Scenarios (Total 35 Scenarios).
 */
export const TEST_SCENARIOS: TestScenario[] = [
  // ============================================================================
  // GROUP 1: NEGATIVE CASES (18 SCENARIOS)
  // Must produce ZERO false positives and accurately reject uninspectable content
  // ============================================================================

  // 1. Completely white page
  {
    id: 1,
    group: 'negative',
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
    group: 'negative',
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

  // 3. Blank document
  {
    id: 3,
    group: 'negative',
    name: 'Blank Document (Uniform White Canvas)',
    description: 'High-key solid canvas (R=G=B=250) without text or road surface features',
    expectedStatus: 'rejected',
    expectedRejectionReason: 'blank_white',
    expectedDefects: [],
    isPositiveDefectCase: false,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      data.fill(250);
      return { width: w, height: h, data };
    },
  },

  // 4. Text document / invoice screenshot
  {
    id: 4,
    group: 'negative',
    name: 'Text Document / Invoice Screenshot',
    description: 'High-key white page (L=245) with horizontal rows of printed black text lines',
    expectedStatus: 'rejected',
    expectedRejectionReason: 'document_or_screenshot',
    expectedDefects: [],
    isPositiveDefectCase: false,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      data.fill(245);
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

  // 5. Normal road without damage
  {
    id: 5,
    group: 'negative',
    name: 'Normal Road Without Damage',
    description: 'Intact asphalt surface (neutral grey L=115) with painted center lane stripe',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: [],
    isPositiveDefectCase: false,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const noise = ((x * 13 + y * 29) % 11) - 5;
          const isLaneStripe = x >= 60 && x <= 64;
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

  // 6. Intact sidewalk
  {
    id: 6,
    group: 'negative',
    name: 'Intact Concrete Sidewalk',
    description: 'Clean pedestrian sidewalk paving slabs (L=145) with straight decorative joint lines',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: [],
    isPositiveDefectCase: false,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const noise = ((x * 19 + y * 17) % 7) - 3;
          let val = 145 + noise;
          // Clean expansion joints every 32 pixels
          if (x % 32 === 0 || y % 32 === 0) {
            val = 135;
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

  // 7. Intact streetlight / pole
  {
    id: 7,
    group: 'negative',
    name: 'Intact Streetlight & Urban Mast',
    description: 'Urban street scene with upright vertical luminaire mast and blue sky horizon',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: [],
    isPositiveDefectCase: false,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          let r = y < 50 ? 150 : 100;
          let g = y < 50 ? 170 : 100;
          let b = y < 50 ? 210 : 100;
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

  // 8. Building facade
  {
    id: 8,
    group: 'negative',
    name: 'Building Facade (Masonry & Glazing)',
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

  // 9. Wet road surface without damage
  {
    id: 9,
    group: 'negative',
    name: 'Wet Road Surface Without Damage',
    description: 'Damp road with specular puddle highlights but smooth flat interior. Verified non-defect.',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: [],
    isPositiveDefectCase: false,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          let val = 105;
          // Specular water puddle: bright highlight without fractured edge
          if (x >= 40 && x <= 85 && y >= 40 && y <= 85) {
            val = 225; // Specular sky reflection
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

  // 10. Road with shadows
  {
    id: 10,
    group: 'negative',
    name: 'Road with Tree / Building Shadows',
    description: 'Road surface overlaid by tree branch shadow with diffuse soft edge gradient. Suppressed by shadow filter.',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: [],
    isPositiveDefectCase: false,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          let val = 120;
          // Soft diffuse shadow gradient
          const distToCenter = Math.hypot(x - 64, y - 64);
          if (distToCenter < 30) {
            val = Math.round(120 - 45 * (1 - distToCenter / 30));
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

  // 11. Road with painted lane markings / zebra crossings
  {
    id: 11,
    group: 'negative',
    name: 'Road with Painted Zebra Crosswalk',
    description: 'High-contrast alternating white stripes. Step edges rejected by trough filter.',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: [],
    isPositiveDefectCase: false,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const isStripe = (x % 24) < 12;
          const val = isStripe ? 230 : 105;
          data[idx] = val;
          data[idx + 1] = val;
          data[idx + 2] = val;
          data[idx + 3] = 255;
        }
      }
      return { width: w, height: h, data };
    },
  },

  // 12. Road with manhole cover / utility drain cover
  {
    id: 12,
    group: 'negative',
    name: 'Road with Circular Manhole Cover',
    description: 'Concentric circular cast iron access cover (L=75, aspect 1.0). Filtered by radial verifier.',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: [],
    isPositiveDefectCase: false,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          let val = 120;
          const dist = Math.hypot(x - 64, y - 64);
          if (dist <= 22) {
            val = dist > 18 ? 85 : 72; // Raised concentric metallic rim
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

  // 13. Road with patch / asphalt repair
  {
    id: 13,
    group: 'negative',
    name: 'Road with Asphalt Patch Repair',
    description: 'Rectangular bitumen patch (L=85) with smooth flat interior and straight seams. Filtered by patch verifier.',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: [],
    isPositiveDefectCase: false,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          let val = 120;
          if (x >= 40 && x <= 88 && y >= 45 && y <= 85) {
            val = 82; // Smooth fresh dark bitumen patch
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

  // 14. Food photograph
  {
    id: 14,
    group: 'negative',
    name: 'Food Photograph (Non-Infrastructure)',
    description: 'Colorful dining plate with warm organic tones (R=220, G=110, B=40, high saturation)',
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
          data[idx] = 220;
          data[idx + 1] = 110;
          data[idx + 2] = 40;
          data[idx + 3] = 255;
        }
      }
      return { width: w, height: h, data };
    },
  },

  // 15. Animal photograph
  {
    id: 15,
    group: 'negative',
    name: 'Animal Photograph (Fur Texture)',
    description: 'Domestic animal golden/brown fur (R=200, G=140, B=50, high saturation, organic texture)',
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
          const noise = ((x * 31 + y * 47) % 17) - 8;
          data[idx] = 200 + noise;
          data[idx + 1] = 140 + noise;
          data[idx + 2] = 50 + noise;
          data[idx + 3] = 255;
        }
      }
      return { width: w, height: h, data };
    },
  },

  // 16. Indoor photograph
  {
    id: 16,
    group: 'negative',
    name: 'Indoor Photograph (Domestic Living Room)',
    description: 'Warm indoor living space with plaster walls, wooden floor, and tungsten palette',
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
          data[idx] = 210;
          data[idx + 1] = 160;
          data[idx + 2] = 110;
          data[idx + 3] = 255;
        }
      }
      return { width: w, height: h, data };
    },
  },

  // 17. Natural landscape
  {
    id: 17,
    group: 'negative',
    name: 'Natural Landscape (Dense Green Foliage)',
    description: 'Dense wilderness/forest scene without paved road or municipal infrastructure (85% green)',
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
          data[idx] = 45;
          data[idx + 1] = 165; // Dominant foliage green
          data[idx + 2] = 55;
          data[idx + 3] = 255;
        }
      }
      return { width: w, height: h, data };
    },
  },

  // 18. Blurry road photograph
  {
    id: 18,
    group: 'negative',
    name: 'Severe Motion-Blurred Infrastructure',
    description: 'Road capture with severe lens defocus / motion blur (gradient edge energy < 1.8)',
    expectedStatus: 'ambiguous',
    expectedRejectionReason: 'blurry_unusable',
    expectedDefects: [],
    isPositiveDefectCase: false,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
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

  // ============================================================================
  // GROUP 2: POSITIVE CASES (9 SCENARIOS)
  // Must accurately identify localized defects with supporting evidence
  // ============================================================================

  // 19. Clearly visible pothole
  {
    id: 19,
    group: 'positive',
    name: 'Clearly Visible Pothole',
    description: 'Asphalt road (L=118) containing deep eroded cavity (L=30) with jagged fractured border gradient',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: ['pothole'],
    isPositiveDefectCase: true,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const noise = ((x * 13 + y * 29) % 11) - 5;
          let val = 118 + noise;
          const inCavity = x >= 40 && x <= 72 && y >= 45 && y <= 75;
          if (inCavity) {
            val = 28 + ((x * 7 + y * 13) % 7); // Deep cavity
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

  // 20. Multiple potholes
  {
    id: 20,
    group: 'positive',
    name: 'Multiple Potholes on Roadway',
    description: 'Road containing two distinct structural cavities separated spatially across lanes',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: ['pothole'],
    isPositiveDefectCase: true,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          let val = 115 + ((x * 7 + y * 19) % 7) - 3;
          // Pothole 1 with eroded stone aggregate
          if (x >= 25 && x <= 45 && y >= 30 && y <= 50) {
            val = 28 + ((x * 13 + y * 17) % 9);
          }
          // Pothole 2 with eroded stone aggregate
          if (x >= 75 && x <= 98 && y >= 65 && y <= 88) {
            val = 24 + ((x * 11 + y * 19) % 9);
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

  // 21. Road cracks / fissures
  {
    id: 21,
    group: 'positive',
    name: 'Road Cracks / Longitudinal Fissure',
    description: 'Asphalt road with elongated longitudinal concave fissure trough (L=30 vs ambient 118)',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: ['damaged_road'],
    isPositiveDefectCase: true,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          let val = 118 + ((x * 7 + y * 19) % 7) - 3;
          const fissureX = 50 + Math.sin(y * 0.15) * 4;
          if (y > 25 && y < 105 && Math.abs(x - fissureX) <= 1.5) {
            val = 30; // Dark concave trough
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

  // 22. Broken pavement
  {
    id: 22,
    group: 'positive',
    name: 'Broken Pavement / Alligator Cracking',
    description: 'Interconnected network of longitudinal and transverse structural asphalt fractures',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: ['damaged_road'],
    isPositiveDefectCase: true,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          let val = 115 + ((x * 11 + y * 13) % 9) - 4;
          // Alligator crack grid
          const isGridCrack = (y > 35 && y < 95 && Math.abs(x - 64) <= 1.5) ||
                              (x > 30 && x < 100 && Math.abs(y - 64) <= 1.5);
          if (isGridCrack) {
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

  // 23. Damaged sidewalk
  {
    id: 23,
    group: 'positive',
    name: 'Damaged Concrete Sidewalk Slab',
    description: 'Concrete walkway with buckled paving slab and transverse joint displacement fracture',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: ['damaged_road'],
    isPositiveDefectCase: true,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          let val = 145 + ((x * 19 + y * 31) % 9) - 4;
          if (y >= 62 && y <= 65 && x > 20 && x < 108) {
            val = 30; // Dark joint fracture
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

  // 24. Broken streetlight / unlit fixture
  {
    id: 24,
    group: 'positive',
    name: 'Damaged Utility Mast on Road Corridor',
    description: 'Severed utility pole laying across the roadway corridor causing structural disruption',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: ['damaged_road'],
    isPositiveDefectCase: true,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          let val = 115 + ((x * 7 + y * 13) % 7) - 3;
          // Fallen mast fracture line across pavement
          if (y >= 60 && y <= 63 && x > 25 && x < 105) {
            val = 35;
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

  // 25. Damaged drainage / overflowing drain
  {
    id: 25,
    group: 'positive',
    name: 'Damaged Drainage / Overflowing Culvert',
    description: 'Stormwater curb drain inlet with internal grating obstruction and localized standing water pool',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: ['overflowing_drain'],
    isPositiveDefectCase: true,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          let val = 115 + ((x * 7 + y * 19) % 7) - 3;
          // Grating frame in lower curb sector with periodic metal slats
          if (x >= 45 && x <= 85 && y >= 55 && y <= 95) {
            const isGrateSlat = x % 6 === 0;
            val = isGrateSlat ? 70 : 25; // Dark sunken grating
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

  // 26. Exposed electrical wire
  {
    id: 26,
    group: 'positive',
    name: 'Exposed High-Voltage Wire on Pavement',
    description: 'Severed overhead electrical cable fallen across asphalt roadway',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: ['damaged_road'],
    isPositiveDefectCase: true,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          let val = 115 + ((x * 7 + y * 13) % 7) - 3;
          // High-contrast continuous black cable
          const cableY = 64 + Math.round(Math.sin(x * 0.1) * 3);
          if (x > 20 && x < 110 && Math.abs(y - cableY) <= 1) {
            val = 20;
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

  // 27. Public deterioration / garbage accumulation
  {
    id: 27,
    group: 'positive',
    name: 'Public Deterioration / Bulk Refuse Pile',
    description: 'Road curb with bulk chromatic solid waste accumulation (plastic, containers, debris)',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: ['garbage_accumulation'],
    isPositiveDefectCase: true,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          let r = 110, g = 110, b = 110;
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

  // ============================================================================
  // GROUP 3: DIFFICULT / EDGE CASES (8 SCENARIOS)
  // Tests robustness across scale, illumination, wetness, angles, and ambiguity
  // ============================================================================

  // 28. Small pothole
  {
    id: 28,
    group: 'difficult',
    name: 'Small Diameter Pothole',
    description: 'Compact 12x12px pothole cavity with high contrast (L=25 vs 115) and sharp boundary',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: ['pothole'],
    isPositiveDefectCase: true,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          let val = 115 + ((x * 13 + y * 29) % 11) - 5;
          if (x >= 58 && x <= 70 && y >= 58 && y <= 70) {
            val = 25 + ((x * 7 + y * 13) % 9); // Small eroded cavity
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

  // 29. Partially occluded defect
  {
    id: 29,
    group: 'difficult',
    name: 'Partially Occluded Pothole (Surface Silt)',
    description: 'Pothole partially filled with surface gravel on one flank, but primary cavity clearly eroded',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: ['pothole'],
    isPositiveDefectCase: true,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          let val = 118 + ((x * 13 + y * 29) % 11) - 5;
          // Core cavity
          if (x >= 45 && x <= 75 && y >= 45 && y <= 75) {
            val = x < 55 ? 85 : 28 + ((x * 7 + y * 13) % 9); // Partial silt occlusion on left flank
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

  // 30. Low-light pavement condition
  {
    id: 30,
    group: 'difficult',
    name: 'Low-Light Pavement with Deep Cavity',
    description: 'Underexposed twilight road capture (L=55) containing deep pothole void (L=18, ΔL=37)',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: ['pothole'],
    isPositiveDefectCase: true,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          let val = 58 + ((x * 5 + y * 11) % 7) - 3;
          if (x >= 42 && x <= 72 && y >= 45 && y <= 75) {
            val = 18 + ((x * 7 + y * 13) % 7); // Void in low-light
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

  // 31. Wet pavement with a pothole
  {
    id: 31,
    group: 'difficult',
    name: 'Wet Pavement Containing a Real Pothole',
    description: 'Pavement with specular dampness but containing genuine eroded void with jagged sub-base',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: ['pothole'],
    isPositiveDefectCase: true,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          let val = 110 + ((x * 13 + y * 29) % 11) - 5;
          // Specular road dampness in background
          if (x < 30) val = 160;
          // Genuine cavity inside
          if (x >= 50 && x <= 80 && y >= 50 && y <= 80) {
            val = 26 + ((x * 7 + y * 13) % 9);
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

  // 32. Shadows resembling a defect
  {
    id: 32,
    group: 'difficult',
    name: 'Diagonal Building Shadow Resembling Defect',
    description: 'Angular shadow band across asphalt with soft border gradient (< 3.8). Must NOT trigger false positive.',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: [],
    isPositiveDefectCase: false,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          let val = 120 + ((x * 7 + y * 13) % 5) - 2;
          // Linear diagonal shadow band
          if (x + y >= 90 && x + y <= 150) {
            val = 80;
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

  // 33. Multiple overlapping defects
  {
    id: 33,
    group: 'difficult',
    name: 'Multiple Overlapping Defects (Pothole + Fissure)',
    description: 'Asphalt road with structural pothole cavity directly connected to propagation fissure crack',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: ['pothole', 'damaged_road'],
    isPositiveDefectCase: true,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          let val = 118 + ((x * 7 + y * 19) % 7) - 3;
          // Pothole cavity
          if (x >= 45 && x <= 75 && y >= 45 && y <= 75) {
            val = 26 + ((x * 7 + y * 13) % 9);
          }
          // Connected crack fissure leading north
          if (y >= 15 && y < 50 && Math.abs(x - 60) <= 1.5) {
            val = 30;
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

  // 34. Defect occupying very small percentage of the image
  {
    id: 34,
    group: 'difficult',
    name: 'Tiny Superficial Surface Nick (<0.3% Frame)',
    description: 'Minute 2x2 superficial asphalt indentation with contrast delta 6. Suppressed by threshold as non-actionable.',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: [], // Correctly suppressed by calibrated confidence threshold
    isPositiveDefectCase: false,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          let val = 120 + ((x * 7 + y * 13) % 5) - 2;
          if (x >= 63 && x <= 65 && y >= 63 && y <= 65) {
            val = 114; // Minimal superficial mark
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

  // 35. Defect at an unfamiliar camera angle / perspective
  {
    id: 35,
    group: 'difficult',
    name: 'Oblique Perspective Foreshortened Pothole',
    description: 'Elliptical cavity viewed at low oblique angle (aspect ratio 2.1, contrast delta 65)',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: ['pothole'],
    isPositiveDefectCase: true,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          let val = 115 + ((x * 13 + y * 29) % 11) - 5;
          // Foreshortened horizontal ellipse
          const dx = (x - 64) / 24;
          const dy = (y - 70) / 11;
          if (dx * dx + dy * dy <= 1.0) {
            val = 28 + ((x * 7 + y * 13) % 9);
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

  // 36. Regression Case: Street Scene with Large Orange Transit Bus on Normal Road
  {
    id: 36,
    group: 'difficult',
    name: 'Street Scene with Large Orange Transit Bus',
    description: 'Real-world street regression scene containing large orange municipal transit bus, tinted windows, body panel seams, metallic grille, and wheels resting on road. Must produce 0 false defect detections.',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: [], // Strictly 0 defects! Wheels, window seams, and radiator grilles must NOT be detected as potholes, fissures, or drains.
    isPositiveDefectCase: false,
    createImage: () => {
      const w = 128, h = 128;
      const data = new Uint8ClampedArray(w * h * 4);

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;

          // Default: Neutral road asphalt on ground plane (y >= 65), urban background above (y < 65)
          let r = 112 + ((x * 7 + y * 11) % 9) - 4;
          let g = 112 + ((x * 7 + y * 11) % 9) - 4;
          let b = 112 + ((x * 7 + y * 11) % 9) - 4;

          if (y < 25) {
            // Daylight sky
            r = 165;
            g = 180;
            b = 205;
          }

          // Road lane marking (white stripe)
          if (y >= 72 && y <= 118 && x >= 16 && x <= 20) {
            r = 215;
            g = 215;
            b = 215;
          }

          // Orange Municipal Transit Bus Body (x: 24 to 116, y: 24 to 68)
          if (x >= 24 && x <= 116 && y >= 24 && y <= 68) {
            // Vivid municipal orange paint
            r = 220 + ((x * 3 + y * 5) % 7);
            g = 100 + ((x * 3 + y * 5) % 5);
            b = 24 + ((x * 3 + y * 5) % 4);

            // Tinted passenger windows (y: 28 to 44, x: 30 to 110)
            if (y >= 28 && y <= 44 && x >= 30 && x <= 110) {
              r = 34 + ((x * 3) % 4);
              g = 36 + ((x * 3) % 4);
              b = 42 + ((x * 3) % 4);

              // Window rubber gasket frame and dividing pillars
              if (y === 28 || y === 44 || x === 30 || x === 54 || x === 78 || x === 98 || x === 110) {
                r = 18;
                g = 18;
                b = 18;
              }
            }

            // Bus front ventilation grille (x: 104 to 114, y: 50 to 62)
            if (x >= 104 && x <= 114 && y >= 50 && y <= 62) {
              // Alternating horizontal metallic slats
              const isSlat = y % 2 === 0;
              r = isSlat ? 65 : 20;
              g = isSlat ? 65 : 20;
              b = isSlat ? 65 : 20;
            }
          }

          // Undercarriage dark shadow
          if (x >= 28 && x <= 112 && y >= 66 && y <= 72) {
            r = 38;
            g = 38;
            b = 38;
          }

          // Bus Wheel 1 (Center at x=44, y=66, outer radius 7, hub radius 3.5)
          const dx1 = x - 44;
          const dy1 = y - 66;
          const dist1 = Math.hypot(dx1, dy1);
          if (dist1 <= 7.5) {
            if (dist1 <= 3.5) {
              // Metallic silver wheel hub
              r = 75;
              g = 75;
              b = 78;
            } else {
              // Dark rubber tire
              r = 26;
              g = 26;
              b = 26;
            }
          }

          // Bus Wheel 2 (Center at x=96, y=66, outer radius 7, hub radius 3.5)
          const dx2 = x - 96;
          const dy2 = y - 66;
          const dist2 = Math.hypot(dx2, dy2);
          if (dist2 <= 7.5) {
            if (dist2 <= 3.5) {
              // Metallic silver wheel hub
              r = 75;
              g = 75;
              b = 78;
            } else {
              // Dark rubber tire
              r = 26;
              g = 26;
              b = 26;
            }
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

  // 37. Street Scene with Orange Bus AND a Real Pothole on Foreground Road
  {
    id: 37,
    group: 'difficult',
    name: 'Street Scene with Bus and Real Pothole',
    description: 'Street scene with large municipal orange bus plus a genuine dark fractured pothole on foreground asphalt road. Must reject all bus parts and detect ONLY the road pothole.',
    expectedStatus: 'valid_infrastructure',
    expectedDefects: ['pothole'], // Real pothole on asphalt road MUST be detected; bus parts must be rejected
    isPositiveDefectCase: true,
    createImage: () => {
      // Start with the bus street scene
      const busScene = TEST_SCENARIOS.find((s) => s.id === 36)!.createImage();
      const { width: w, height: h, data } = busScene;

      // Add a genuine deep pothole on the asphalt road in the foreground (x: 48-68, y: 92-108)
      for (let y = 88; y <= 112; y++) {
        for (let x = 44; x <= 72; x++) {
          const dx = (x - 58) / 10.0;
          const dy = (y - 100) / 7.0;
          const dist = dx * dx + dy * dy;

          if (dist <= 1.0) {
            const idx = (y * w + x) * 4;
            // Deep eroded void with dark cavity and jagged perimeter
            const cavityDepth = 26 + ((x * 7 + y * 13) % 6);
            data[idx] = cavityDepth;
            data[idx + 1] = cavityDepth;
            data[idx + 2] = cavityDepth;
          }
        }
      }

      return { width: w, height: h, data };
    },
  },
];
