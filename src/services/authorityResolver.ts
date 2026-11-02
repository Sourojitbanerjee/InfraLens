import { Authority, GeoLocation, InfrastructureCategory, Severity } from '../types/infrastructure';
import { MOCK_AUTHORITIES } from '../data/mockAuthorities';
import { GisEngine } from './gisEngine';

export interface AuthorityResolutionResult {
  authority: Authority;
  departmentName: string;
  ward: string;
  slaHours: number;
  recommendedAction: string;
  dispatchPriority: 'immediate' | 'expedited' | 'scheduled';
  // Hierarchical Civic Jurisdictional Routing (Pan-Indian & Global)
  state?: string;
  district?: string;
  localBodyType?: 'MUNICIPAL_CORPORATION' | 'MUNICIPALITY' | 'GRAM_PANCHAYAT' | 'SPECIAL_AGENCY';
  localBodyName?: string;
  jurisdictionCode?: string;
  isAuthorityReviewRequired?: boolean;
  reviewReason?: string;
}

export class AuthorityResolver {
  private static authorities: Authority[] = [...MOCK_AUTHORITIES];

  static setAuthorities(customAuthorities: Authority[]): void {
    this.authorities = customAuthorities;
  }

  /**
   * Route an infrastructure incident to the correct municipal authority, local body, and ward
   */
  static resolve(
    location: GeoLocation,
    category: InfrastructureCategory,
    severity: Severity
  ): AuthorityResolutionResult {
    // 1. Spatially resolve ward if not populated
    const wardLookup = GisEngine.lookupWard(location.latitude, location.longitude);
    const resolvedWard = location.ward || wardLookup.wardName;

    // 2. Map category to authority ID and base department
    let targetId = 'auth-roads';
    let deptName = 'Municipal Roads & Pavements Department';
    let action = 'DISPATCH ROAD PAVING BRIGADE';

    switch (category) {
      case 'road_damage':
        targetId = 'auth-roads';
        deptName = 'Municipal Roads & Pavements Department';
        action = 'EMERGENCY MILLING & TACK-COAT ASPHALT REPAIR';
        break;
      case 'drainage_overflow':
        targetId = 'auth-drainage';
        deptName = 'Water Resources & Storm Drainage Board';
        action = 'HIGH-PRESSURE JETTING & CULVERT FLUSH';
        break;
      case 'lighting_failure':
        targetId = 'auth-lighting';
        deptName = 'Bureau of Energy & Public Street Lighting';
        action = 'ELECTRICAL ISOLATION & LUMINAIRE REPLACEMENT';
        break;
      case 'electrical_hazard':
        targetId = 'auth-lighting';
        deptName = 'High-Voltage Grid Emergency Unit';
        action = 'IMMEDIATE ELECTRICAL LINE ISOLATION';
        break;
      case 'waste_accumulation':
        targetId = 'auth-waste';
        deptName = 'Department of Clean Environment & Solid Waste';
        action = 'RAPID COMPACTOR TRUCK HAZMAT CLEARANCE';
        break;
      case 'sidewalk_hazard':
        targetId = 'auth-sidewalk';
        deptName = 'Pedestrian Safety & Urban Walkways Authority';
        action = 'HYDRAULIC SLAB LEVELING & ROOT SHAVING';
        break;
      case 'traffic_signage':
        targetId = 'auth-traffic';
        deptName = 'Metropolitan Transportation Agency (Signals & Signs)';
        action = 'OVERHEAD GANTRY SIGN RE-ANCHORING';
        break;
      case 'bridge_damage':
        targetId = 'auth-roads';
        deptName = 'Bridge Engineering & Structural Integrity Division';
        action = 'EXPANSION BEARING & SPALLING REPAIR';
        break;
      case 'building_damage':
        targetId = 'auth-roads';
        deptName = 'Department of Building Inspection & Public Structures';
        action = 'STRUCTURAL LOAD BEARING ASSESSMENT & MASONRY STABILIZATION';
        break;
      case 'railway_damage':
        targetId = 'auth-roads';
        deptName = 'Metropolitan Rail Infrastructure & Transit Authority';
        action = 'TRACK ALIGNMENT & DEFECTIVE RAIL SECTION REPLACEMENT';
        break;
      case 'public_utility':
        targetId = 'auth-lighting';
        deptName = 'Public Utility Infrastructure Maintenance Authority';
        action = 'UTILITY POLE SHORING & RE-ANCHORING';
        break;
    }

    // 3. Hierarchical Jurisdiction Analysis
    let state = 'Delhi';
    let district = 'New Delhi';
    let localBodyType: 'MUNICIPAL_CORPORATION' | 'MUNICIPALITY' | 'GRAM_PANCHAYAT' | 'SPECIAL_AGENCY' = 'MUNICIPAL_CORPORATION';
    let localBodyName = 'New Delhi Municipal Council';
    let jurisdictionCode = 'ULB-DEL-NDMC';
    let isAuthorityReviewRequired = false;
    let reviewReason: string | undefined;

    const addr = (location.address || '').toLowerCase();
    const lat = location.latitude;
    const lon = location.longitude;

    // Geographic boundary heuristics
    if (addr.includes('mumbai') || addr.includes('maharashtra') || (lat >= 18.8 && lat <= 19.3 && lon >= 72.7 && lon <= 73.1)) {
      state = 'Maharashtra';
      district = 'Mumbai Suburban';
      localBodyType = 'MUNICIPAL_CORPORATION';
      localBodyName = 'Brihanmumbai Municipal Corporation';
      jurisdictionCode = 'ULB-MH-BMC';
    } else if (addr.includes('nadia') || addr.includes('chandirampur') || addr.includes('village') || addr.includes('gram') || addr.includes('panchayat')) {
      state = 'West Bengal';
      district = 'Nadia';
      localBodyType = 'GRAM_PANCHAYAT';
      localBodyName = 'Chandirampur Gram Panchayat';
      jurisdictionCode = 'GP-WB-NAD-04';
      deptName = 'Gram Sadak & Rural Utility Cell';
    } else if (addr.includes('siliguri') || addr.includes('darjeeling')) {
      state = 'West Bengal';
      district = 'Darjeeling';
      localBodyType = 'MUNICIPALITY';
      localBodyName = 'Siliguri Municipal Corporation';
      jurisdictionCode = 'ULB-WB-SMC';
    }

    // Special Agency Routing (National Highways, State Electricity Board)
    if (category === 'road_damage' && (addr.includes('national highway') || addr.includes('nh-') || addr.includes('expressway'))) {
      localBodyType = 'SPECIAL_AGENCY';
      localBodyName = 'National Highways Authority of India (NHAI)';
      jurisdictionCode = 'AGY-NHAI-HQ';
      deptName = 'Project Implementation Unit (PIU - Highways)';
      isAuthorityReviewRequired = true;
      reviewReason = 'National Highway corridor requires joint inspection with NHAI concessionaire.';
    } else if (category === 'electrical_hazard') {
      localBodyType = 'SPECIAL_AGENCY';
      localBodyName = 'State Electricity Distribution Utility (Discom)';
      jurisdictionCode = 'UTIL-DISCOM-HV';
      deptName = 'High-Voltage Grid & Transformer Protection Division';
    }

    // Border dispute or boundary threshold check
    if (lat > 28.65 && lat < 28.66 && lon > 77.21 && lon < 77.23) {
      isAuthorityReviewRequired = true;
      reviewReason = 'Border zone between NDMC and MCD municipal jurisdiction requires joint jurisdictional sign-off.';
    }

    const matchedAuth =
      this.authorities.find((a) => a.id === targetId || a.category === category) ||
      this.authorities[0];

    // SLA hours calculation
    let slaHours = 48;
    let dispatchPriority: 'immediate' | 'expedited' | 'scheduled' = 'scheduled';

    if (severity === 'critical' || category === 'electrical_hazard') {
      slaHours = 12;
      dispatchPriority = 'immediate';
    } else if (severity === 'high') {
      slaHours = 24;
      dispatchPriority = 'expedited';
    }

    return {
      authority: matchedAuth,
      departmentName: deptName,
      ward: resolvedWard,
      slaHours,
      recommendedAction: action,
      dispatchPriority,
      state,
      district,
      localBodyType,
      localBodyName,
      jurisdictionCode,
      isAuthorityReviewRequired,
      reviewReason,
    };
  }
}
