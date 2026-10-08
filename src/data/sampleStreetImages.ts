import { BoundingBox, InfrastructureCategory, Severity } from '../types/infrastructure';

export interface SampleStreetPreset {
  id: string;
  title: string;
  description: string;
  location: string;
  imageUrl: string;
  detections: BoundingBox[];
  dominantCategory: InfrastructureCategory;
  dominantSeverity: Severity;
  nearbyRisks: { name: string; distanceMeters: number; type: 'school' | 'hospital' | 'transit' | 'market' | 'residential' | 'elderly_center' }[];
  affectedDailyCommuters: number;
  recommendedAction: string;
  responsibleAuthorityId: string;
}

export const SAMPLE_STREET_IMAGES: SampleStreetPreset[] = [
  {
    id: 'preset-pothole-school',
    title: 'Severe Asphalt Cavity & Structural Fracture',
    description: 'Deep road depression with structural sub-base erosion along high-speed municipal bus lane.',
    location: '4th Street & Bryant Blvd (near Lincoln High School)',
    imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80',
    dominantCategory: 'road_damage',
    dominantSeverity: 'critical',
    affectedDailyCommuters: 2450,
    recommendedAction: 'EMERGENCY MILLING & TACK-COAT ASPHALT REPAIR',
    responsibleAuthorityId: 'auth-roads',
    nearbyRisks: [
      { name: 'Lincoln High School', distanceMeters: 180, type: 'school' },
      { name: 'Muni Transit Bus Stop #402', distanceMeters: 90, type: 'transit' },
      { name: 'Civic Central Market', distanceMeters: 310, type: 'market' },
    ],
    detections: [
      {
        id: 'box-1',
        x: 32,
        y: 52,
        width: 38,
        height: 36,
        label: 'DEEP POTHOLE CLUSTER (87mm depth)',
        category: 'road_damage',
        confidence: 94.8,
        severity: 'critical',
      },
      {
        id: 'box-2',
        x: 18,
        y: 44,
        width: 19,
        height: 24,
        label: 'LONGITUDINAL SURFACE FISSURE',
        category: 'road_damage',
        confidence: 89.2,
        severity: 'high',
      },
    ],
  },
  {
    id: 'preset-drainage-market',
    title: 'Blocked Stormwater Catch Basin & Urban Runoff',
    description: 'Sediment buildup and municipal stormwater drain blockage threatening sidewalk inundation.',
    location: 'Mission & 16th Street Commercial Corridor',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=1200&q=80',
    dominantCategory: 'drainage_overflow',
    dominantSeverity: 'critical',
    affectedDailyCommuters: 3800,
    recommendedAction: 'HIGH-PRESSURE JETTING & CULVERT CLEARANCE',
    responsibleAuthorityId: 'auth-drainage',
    nearbyRisks: [
      { name: '16th St BART Transit Hub', distanceMeters: 120, type: 'transit' },
      { name: 'Mission Community Clinic', distanceMeters: 240, type: 'hospital' },
      { name: 'Farmers Indoor Market', distanceMeters: 150, type: 'market' },
    ],
    detections: [
      {
        id: 'box-3',
        x: 42,
        y: 58,
        width: 32,
        height: 32,
        label: 'CLOGGED DRAINAGE GRATE (OVERFLOW)',
        category: 'drainage_overflow',
        confidence: 96.1,
        severity: 'critical',
      },
      {
        id: 'box-4',
        x: 12,
        y: 70,
        width: 25,
        height: 20,
        label: 'STANDING WATER PUDDLE (>5cm)',
        category: 'drainage_overflow',
        confidence: 91.5,
        severity: 'high',
      },
    ],
  },
  {
    id: 'preset-sidewalk-elderly',
    title: 'Buckled Concrete Slab & Root Intrusion',
    description: 'Displaced sidewalk paving slab with a 50mm elevation trip hazard in designated pedestrian zone.',
    location: 'Sutter & Steiner St (Near St. Mary Medical Center)',
    imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
    dominantCategory: 'sidewalk_hazard',
    dominantSeverity: 'high',
    affectedDailyCommuters: 1650,
    recommendedAction: 'TREE-ROOT TRIMMING & SLAB LEVELING',
    responsibleAuthorityId: 'auth-sidewalk',
    nearbyRisks: [
      { name: 'St. Mary Senior Care Pavilion', distanceMeters: 85, type: 'elderly_center' },
      { name: 'Pedestrian Crosswalk', distanceMeters: 45, type: 'transit' },
    ],
    detections: [
      {
        id: 'box-5',
        x: 28,
        y: 48,
        width: 44,
        height: 38,
        label: 'TRIP HAZARD (BUCKLED SLAB)',
        category: 'sidewalk_hazard',
        confidence: 88.4,
        severity: 'high',
      },
      {
        id: 'box-6',
        x: 68,
        y: 35,
        width: 22,
        height: 25,
        label: 'EXPOSED SUB-SURFACE CONDUIT',
        category: 'sidewalk_hazard',
        confidence: 82.0,
        severity: 'moderate',
      },
    ],
  },
  {
    id: 'preset-waste-corridor',
    title: 'Illegal Solid Waste & Bulk Debris Dumping',
    description: 'Bulk municipal refuse obstruction blocking vehicular clearance and stormwater egress.',
    location: 'Folsom Street at 8th Avenue Service Alley',
    imageUrl: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=1200&q=80',
    dominantCategory: 'waste_accumulation',
    dominantSeverity: 'moderate',
    affectedDailyCommuters: 920,
    recommendedAction: 'RAPID COMPACTOR TRUCK CLEARANCE & CITATION REVIEW',
    responsibleAuthorityId: 'auth-waste',
    nearbyRisks: [
      { name: 'SOMA Elementary Academy', distanceMeters: 310, type: 'school' },
      { name: 'Residential Apartments', distanceMeters: 40, type: 'residential' },
    ],
    detections: [
      {
        id: 'box-7',
        x: 25,
        y: 38,
        width: 50,
        height: 48,
        label: 'COMMERCIAL DEBRIS PILE (~4.2 cu.m)',
        category: 'waste_accumulation',
        confidence: 95.3,
        severity: 'high',
      },
      {
        id: 'box-8',
        x: 72,
        y: 55,
        width: 22,
        height: 30,
        label: 'DISCARDED CHEMICAL SOLVENT DRUM',
        category: 'waste_accumulation',
        confidence: 89.1,
        severity: 'critical',
      },
    ],
  },
  {
    id: 'preset-lighting-corridor',
    title: 'Fallen High-Intensity Luminaire & Exposed Wiring',
    description: 'Structural mast-arm mechanical failure causing complete blackout on primary transit arterial.',
    location: 'Van Ness Avenue & Geary Boulevard',
    imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb325?auto=format&fit=crop&w=1200&q=80',
    dominantCategory: 'lighting_failure',
    dominantSeverity: 'critical',
    affectedDailyCommuters: 4100,
    recommendedAction: 'IMMEDIATE ELECTRICAL ISOLATION & MAST REPLACEMENT',
    responsibleAuthorityId: 'auth-lighting',
    nearbyRisks: [
      { name: 'Rapid Transit Station', distanceMeters: 70, type: 'transit' },
      { name: 'Night Market Entrance', distanceMeters: 190, type: 'market' },
    ],
    detections: [
      {
        id: 'box-9',
        x: 35,
        y: 20,
        width: 34,
        height: 60,
        label: 'DAMAGED LIGHT POLE & VOLTAGE RISK',
        category: 'lighting_failure',
        confidence: 97.4,
        severity: 'critical',
      },
    ],
  },
];
