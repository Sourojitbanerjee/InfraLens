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
}

export class AuthorityResolver {
  private static authorities: Authority[] = [...MOCK_AUTHORITIES];

  static setAuthorities(customAuthorities: Authority[]): void {
    this.authorities = customAuthorities;
  }

  /**
   * Route an infrastructure incident to the correct municipal authority and ward
   */
  static resolve(
    location: GeoLocation,
    category: InfrastructureCategory,
    severity: Severity
  ): AuthorityResolutionResult {
    // 1. Spatially resolve ward if not populated
    const wardLookup = GisEngine.lookupWard(location.latitude, location.longitude);
    const resolvedWard = location.ward || wardLookup.wardName;

    // 2. Map category to authority ID
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
    };
  }
}
