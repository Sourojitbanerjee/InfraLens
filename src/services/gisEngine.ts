import { POI, NearbyRiskFactor, RoadSegment } from '../types/infrastructure';

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude] - PostGIS standard
}

export interface POIWithDistance extends POI {
  distanceMeters: number;
}

export interface WardDefinition {
  id: string;
  name: string;
  zone: string;
  center: [number, number]; // [lat, lon]
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
}

export const METRO_WARDS: WardDefinition[] = [
  {
    id: 'ward-6',
    name: 'Ward 6 — Mission & SOMA',
    zone: 'Transit & Commercial Core',
    center: [37.7770, -122.4140],
    bounds: { minLat: 37.768, maxLat: 37.788, minLon: -122.425, maxLon: -122.395 },
  },
  {
    id: 'ward-3',
    name: 'Ward 3 — Civic & Financial',
    zone: 'Central Financial Core',
    center: [37.7910, -122.4050],
    bounds: { minLat: 37.785, maxLat: 37.805, minLon: -122.415, maxLon: -122.390 },
  },
  {
    id: 'ward-9',
    name: 'Ward 9 — Mission District',
    zone: 'Dense Pedestrian Arterial',
    center: [37.7580, -122.4180],
    bounds: { minLat: 37.745, maxLat: 37.768, minLon: -122.428, maxLon: -122.405 },
  },
  {
    id: 'ward-5',
    name: 'Ward 5 — Western Addition',
    zone: 'Medical & Historic Corridor',
    center: [37.7820, -122.4350],
    bounds: { minLat: 37.765, maxLat: 37.795, minLon: -122.455, maxLon: -122.425 },
  },
  {
    id: 'ward-1',
    name: 'Ward 1 — Richmond & Presidio',
    zone: 'Residential & Park District',
    center: [37.7790, -122.4750],
    bounds: { minLat: 37.760, maxLat: 37.805, minLon: -122.510, maxLon: -122.455 },
  },
];

export const METRO_POIS: POI[] = [
  {
    id: 'poi-lincoln',
    name: 'Lincoln High School',
    type: 'school',
    latitude: 37.7801,
    longitude: -122.4178,
    trafficLoad: 'critical',
  },
  {
    id: 'poi-bessie',
    name: 'Bessie Carmichael Elementary Academy',
    type: 'school',
    latitude: 37.7780,
    longitude: -122.4095,
    trafficLoad: 'high',
  },
  {
    id: 'poi-mission-high',
    name: 'Mission High School',
    type: 'school',
    latitude: 37.7625,
    longitude: -122.4265,
    trafficLoad: 'high',
  },
  {
    id: 'poi-st-mary',
    name: 'St. Mary Medical Center Pavilion',
    type: 'hospital',
    latitude: 37.7840,
    longitude: -122.4345,
    trafficLoad: 'critical',
  },
  {
    id: 'poi-mission-clinic',
    name: 'Mission Community Public Clinic',
    type: 'hospital',
    latitude: 37.7640,
    longitude: -122.4185,
    trafficLoad: 'high',
  },
  {
    id: 'poi-st-francis',
    name: 'St. Francis Memorial Hospital',
    type: 'hospital',
    latitude: 37.7895,
    longitude: -122.4175,
    trafficLoad: 'critical',
  },
  {
    id: 'poi-16th-bart',
    name: '16th St BART Transit Hub',
    type: 'transit',
    latitude: 37.7650,
    longitude: -122.4195,
    trafficLoad: 'critical',
  },
  {
    id: 'poi-civic-center',
    name: 'Civic Center Subway Terminal',
    type: 'transit',
    latitude: 37.7795,
    longitude: -122.4135,
    trafficLoad: 'critical',
  },
  {
    id: 'poi-muni-bryant',
    name: 'Muni Rapid Bus Station #402',
    type: 'transit',
    latitude: 37.7798,
    longitude: -122.4185,
    trafficLoad: 'high',
  },
  {
    id: 'poi-market-hall',
    name: 'Civic Central Market',
    type: 'market',
    latitude: 37.7775,
    longitude: -122.4165,
    trafficLoad: 'high',
  },
  {
    id: 'poi-calle24',
    name: 'Calle 24 Commercial Stores',
    type: 'market',
    latitude: 37.7535,
    longitude: -122.4185,
    trafficLoad: 'high',
  },
  {
    id: 'poi-bryant-artery',
    name: 'Bryant Boulevard Arterial Route',
    type: 'arterial_road',
    latitude: 37.7788,
    longitude: -122.4180,
    trafficLoad: 'critical',
  },
];

export class GisEngine {
  /**
   * PostGIS Haversine Distance in metres
   */
  static calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }

  /**
   * PostGIS GeoJSON Point conversion
   */
  static toGeoPoint(lat: number, lon: number): GeoPoint {
    return {
      type: 'Point',
      coordinates: [lon, lat],
    };
  }

  /**
   * Search nearby POIs within radius
   */
  static findNearbyPOIs(lat: number, lon: number, radiusMeters: number = 600): POIWithDistance[] {
    return METRO_POIS.map((poi) => {
      const distance = this.calculateDistanceMeters(lat, lon, poi.latitude, poi.longitude);
      return { ...poi, distanceMeters: distance };
    })
      .filter((poi) => poi.distanceMeters <= radiusMeters)
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  /**
   * Convert POIs into NearbyRiskFactor array for impact analysis
   */
  static extractNearbyRisks(lat: number, lon: number, radiusMeters: number = 500): NearbyRiskFactor[] {
    const pois = this.findNearbyPOIs(lat, lon, radiusMeters);
    if (pois.length === 0) {
      // Default to general urban corridor risks if remote
      return [
        { name: 'Pedestrian Crossing', type: 'transit', distanceMeters: 140 },
        { name: 'Residential Zone Corridor', type: 'residential', distanceMeters: 80 },
      ];
    }

    return pois.slice(0, 4).map((p) => ({
      name: p.name,
      type: p.type as any,
      distanceMeters: p.distanceMeters,
    }));
  }

  /**
   * Ward lookup abstraction using spatial containment / nearest centroid
   */
  static lookupWard(lat: number, lon: number): { wardId: string; wardName: string; zone: string } {
    // Check bounding boxes first
    for (const ward of METRO_WARDS) {
      if (
        lat >= ward.bounds.minLat &&
        lat <= ward.bounds.maxLat &&
        lon >= ward.bounds.minLon &&
        lon <= ward.bounds.maxLon
      ) {
        return {
          wardId: ward.id,
          wardName: ward.name,
          zone: ward.zone,
        };
      }
    }

    // Centroid proximity fallback
    let closestWard = METRO_WARDS[0];
    let minDistance = Infinity;

    for (const ward of METRO_WARDS) {
      const dist = this.calculateDistanceMeters(lat, lon, ward.center[0], ward.center[1]);
      if (dist < minDistance) {
        minDistance = dist;
        closestWard = ward;
      }
    }

    return {
      wardId: closestWard.id,
      wardName: closestWard.name,
      zone: closestWard.zone,
    };
  }

  /**
   * Get all arterial road segments across the metro area (Rule 3)
   */
  static getArterialRoads(): RoadSegment[] {
    return METRO_ROADS;
  }
}

export const METRO_ROADS: RoadSegment[] = [
  {
    id: 'road-market',
    name: 'Market Street Transit Spine',
    wardId: 'ward-6',
    category: 'Transit & Arterial Corridor',
    health: 'high-risk',
    healthScore: 48,
    dailyTraffic: 42000,
    activeDefects: 4,
    coordinates: [
      [37.7940, -122.3955],
      [37.7890, -122.4015],
      [37.7830, -122.4100],
      [37.7788, -122.4162],
      [37.7735, -122.4215],
      [37.7680, -122.4310],
    ],
  },
  {
    id: 'road-bryant',
    name: '4th & Bryant SOMA Freight Corridor (CL-027)',
    wardId: 'ward-6',
    category: 'Commercial Highway Feed',
    health: 'critical',
    healthScore: 22,
    dailyTraffic: 31000,
    activeDefects: 9,
    coordinates: [
      [37.7820, -122.4010],
      [37.7792, -122.4045],
      [37.7765, -122.4090],
      [37.7730, -122.4140],
    ],
  },
  {
    id: 'road-mission',
    name: 'Mission Street Pedestrian & Bus Trunk',
    wardId: 'ward-9',
    category: 'High-Density Pedestrian Zone',
    health: 'critical',
    healthScore: 34,
    dailyTraffic: 28500,
    activeDefects: 5,
    coordinates: [
      [37.7660, -122.4190],
      [37.7620, -122.4200],
      [37.7580, -122.4190],
      [37.7520, -122.4180],
    ],
  },
  {
    id: 'road-vanness',
    name: 'Van Ness Rapid Transit BRT',
    wardId: 'ward-3',
    category: 'Rapid Transit Median',
    health: 'moderate',
    healthScore: 66,
    dailyTraffic: 36000,
    activeDefects: 2,
    coordinates: [
      [37.7750, -122.4195],
      [37.7810, -122.4210],
      [37.7870, -122.4225],
      [37.7950, -122.4240],
    ],
  },
  {
    id: 'road-embarcadero',
    name: 'The Embarcadero Waterfront Promenade',
    wardId: 'ward-3',
    category: 'Multi-Modal Boulevard',
    health: 'healthy',
    healthScore: 92,
    dailyTraffic: 22000,
    activeDefects: 0,
    coordinates: [
      [37.8010, -122.4010],
      [37.7955, -122.3935],
      [37.7900, -122.3895],
      [37.7840, -122.3880],
    ],
  },
  {
    id: 'road-columbus',
    name: 'Columbus Avenue Heritage Parkway',
    wardId: 'ward-3',
    category: 'Historic Commercial Arterial',
    health: 'healthy',
    healthScore: 88,
    dailyTraffic: 16500,
    activeDefects: 1,
    coordinates: [
      [37.7970, -122.4045],
      [37.8010, -122.4090],
      [37.8060, -122.4150],
    ],
  },
];
