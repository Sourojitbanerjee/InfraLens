import { 
  UserRole, 
  PortalType, 
  UserSession, 
  PermissionKey, 
  CitizenRegistrationPayload, 
  OfficialLoginCredentials 
} from '../types/auth';
import { AppView } from '../types/navigation';

const SESSION_STORAGE_KEY = 'infralens_auth_session_v2';

export interface DemoAccountInfo {
  role: UserRole;
  portal: PortalType;
  fullName: string;
  officialTitle: string;
  email: string;
  passwordDescription: string;
  institutionName: string;
  assignedWard?: string;
  badgeVariant: 'cyan' | 'amber' | 'emerald' | 'purple';
  permissions: PermissionKey[];
  avatarText: string;
  disclaimer: string;
}

/**
 * Verified DEMO Accounts for Recruitment & Technical Evaluation
 * Clearly marked with fictional evaluation disclaimer to prevent real-world claims.
 */
export const DEMO_PERSONAS: Record<string, DemoAccountInfo> = {
  director: {
    role: 'DIRECTOR_OF_OPERATIONS',
    portal: 'GOVERNMENT_OPERATIONS',
    fullName: 'Dr. Rameshwar Sharma, IAS',
    officialTitle: 'Director of Municipal Operations',
    email: 'director@demo.infralens.gov.in',
    passwordDescription: 'DemoDirector@2026',
    institutionName: 'New Delhi Municipal Council (NDMC)',
    assignedWard: 'All Wards (Central Delhi Jurisdiction)',
    badgeVariant: 'cyan',
    avatarText: 'RS',
    disclaimer: 'DEMO ACCOUNT — Verified for evaluation',
    permissions: [
      'report:create',
      'report:read_public',
      'inspection:schedule',
      'inspection:assign_team',
      'inspection:verify_field',
      'workorder:create',
      'workorder:assign_crew',
      'workorder:update_progress',
      'workorder:approve_closure',
      'institution:manage_settings',
      'institution:configure_wards',
    ],
  },
  chief_inspector: {
    role: 'CHIEF_FIELD_INSPECTOR',
    portal: 'GOVERNMENT_OPERATIONS',
    fullName: 'Er. Arvind Mehta',
    officialTitle: 'Chief Field Inspector',
    email: 'chief@demo.infralens.gov.in',
    passwordDescription: 'DemoChief@2026',
    institutionName: 'NDMC Civil Rapid Response Squad',
    assignedWard: 'Ward 1 — Connaught Place & Ward 5 — Sansad Marg',
    badgeVariant: 'cyan',
    avatarText: 'AM',
    disclaimer: 'DEMO ACCOUNT — Verified for evaluation',
    permissions: [
      'report:read_public',
      'inspection:schedule',
      'inspection:assign_team',
      'inspection:verify_field',
      'workorder:update_progress',
      'workorder:approve_closure',
    ],
  },
  supervisor: {
    role: 'DEPARTMENT_SUPERVISOR',
    portal: 'GOVERNMENT_OPERATIONS',
    fullName: 'Er. Praveen Saxena',
    officialTitle: 'Department Operations Supervisor',
    email: 'supervisor@demo.infralens.gov.in',
    passwordDescription: 'DemoSupervisor@2026',
    institutionName: 'NDMC Civil Roads & Maintenance Division',
    assignedWard: 'Ward 3 — Sarojini Nagar & Safdarjung',
    badgeVariant: 'amber',
    avatarText: 'PS',
    disclaimer: 'DEMO ACCOUNT — Verified for evaluation',
    permissions: [
      'report:read_public',
      'inspection:schedule',
      'inspection:assign_team',
      'inspection:verify_field',
      'workorder:create',
      'workorder:assign_crew',
      'workorder:update_progress',
      'workorder:approve_closure',
    ],
  },
  inspector: {
    role: 'FIELD_INSPECTOR',
    portal: 'GOVERNMENT_OPERATIONS',
    fullName: 'Vikram Rawat',
    officialTitle: 'Senior Field Inspector (Lead Alpha)',
    email: 'inspector@demo.infralens.gov.in',
    passwordDescription: 'DemoInspector@2026',
    institutionName: 'NDMC Mobile Ground Rapid Response Unit',
    assignedWard: 'Ward 1 — Connaught Place & Barakhamba',
    badgeVariant: 'emerald',
    avatarText: 'VR',
    disclaimer: 'DEMO ACCOUNT — Verified for evaluation',
    permissions: [
      'report:read_public',
      'inspection:schedule',
      'inspection:verify_field',
      'workorder:update_progress',
      'workorder:upload_after_evidence',
    ],
  },
  citizen: {
    role: 'CITIZEN',
    portal: 'PUBLIC_CITIZEN',
    fullName: 'Pooja Sharma',
    officialTitle: 'Verified Citizen Reporter',
    email: 'citizen@demo.infralens.gov.in',
    passwordDescription: 'DemoCitizen@2026',
    institutionName: 'New Delhi Resident Community (Ward 1)',
    assignedWard: 'Ward 1 — Connaught Place',
    badgeVariant: 'emerald',
    avatarText: 'PS',
    disclaimer: 'DEMO ACCOUNT — Verified for evaluation',
    permissions: [
      'report:create',
      'report:read_public',
      'report:upvote_nearby',
      'report:track_own',
    ],
  },
  super_admin: {
    role: 'INFRALENS_SUPER_ADMIN',
    portal: 'SUPER_ADMIN',
    fullName: 'Platform Super Administrator',
    officialTitle: 'Cloud Operations & Multi-Tenant Lead',
    email: 'superadmin@demo.infralens.gov.in',
    passwordDescription: 'DemoSuperAdmin@2026',
    institutionName: 'InfraLens Multi-Tenant Cloud Ops',
    assignedWard: 'Global Federation (All States & ULBs)',
    badgeVariant: 'purple',
    avatarText: 'SA',
    disclaimer: 'DEMO ACCOUNT — Verified for evaluation',
    permissions: [
      'report:create',
      'report:read_public',
      'report:upvote_nearby',
      'report:track_own',
      'inspection:schedule',
      'inspection:assign_team',
      'inspection:verify_field',
      'workorder:create',
      'workorder:assign_crew',
      'workorder:update_progress',
      'workorder:upload_after_evidence',
      'workorder:approve_closure',
      'institution:manage_settings',
      'institution:configure_wards',
      'institution:verify_onboarding',
      'superadmin:manage_tenants',
      'superadmin:view_all_telemetry',
    ],
  },
};

class AuthService {
  /**
   * Cryptographic SHA-256 password hashing simulation
   */
  async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + '_infralens_salt_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Attempt sign in with credentials
   */
  async login(credentials: OfficialLoginCredentials): Promise<UserSession> {
    const emailNorm = credentials.email.trim().toLowerCase();

    // Check pre-configured demo personas first
    const matchedKey = Object.keys(DEMO_PERSONAS).find(
      (k) => DEMO_PERSONAS[k].email.toLowerCase() === emailNorm
    );

    if (matchedKey) {
      const demo = DEMO_PERSONAS[matchedKey];
      const session = this.buildSessionFromDemo(demo);
      this.persistSession(session);
      return session;
    }

    // Check locally registered accounts from localStorage
    const registeredUsers = this.getStoredRegisteredUsers();
    const localMatch = registeredUsers.find((u) => u.email.toLowerCase() === emailNorm);

    if (localMatch) {
      const inputHash = await this.hashPassword(credentials.password);
      if (localMatch.passwordHash === inputHash) {
        const session: UserSession = {
          id: localMatch.id,
          fullName: localMatch.fullName,
          email: localMatch.email,
          phone: localMatch.phone,
          role: localMatch.role || 'CITIZEN',
          portal: localMatch.role === 'CITIZEN' ? 'PUBLIC_CITIZEN' : 'GOVERNMENT_OPERATIONS',
          officialTitle: localMatch.officialTitle || 'Registered Citizen',
          assignedWard: localMatch.locality || 'New Delhi',
          isEmailVerified: true,
          isPhoneVerified: true,
          preferredLanguage: localMatch.preferredLanguage || 'en',
          permissions: localMatch.role === 'CITIZEN'
            ? ['report:create', 'report:read_public', 'report:upvote_nearby', 'report:track_own']
            : ['report:read_public', 'inspection:verify_field', 'workorder:update_progress'],
        };
        this.persistSession(session);
        return session;
      } else {
        throw new Error('Invalid credentials provided. Please check your password.');
      }
    }

    // Fallback: If evaluating without credentials, log in as Citizen by default or throw
    throw new Error('Account not found. Please use one of the quick Demo Personas below or register.');
  }

  /**
   * One-click demo persona switcher for recruiters and technical evaluators
   */
  loginAsDemoPersona(personaKey: string): UserSession {
    const demo = DEMO_PERSONAS[personaKey] || DEMO_PERSONAS.director;
    const session = this.buildSessionFromDemo(demo);
    this.persistSession(session);
    return session;
  }

  /**
   * Register a new citizen reporter
   */
  async registerCitizen(payload: CitizenRegistrationPayload): Promise<UserSession> {
    const passwordHash = await this.hashPassword(payload.password);
    const userId = `usr-cit-${Date.now().toString(36)}`;

    const newUser = {
      id: userId,
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      passwordHash,
      role: 'CITIZEN' as UserRole,
      state: payload.state,
      district: payload.district,
      cityOrVillage: payload.cityOrVillage,
      locality: payload.locality,
      pincode: payload.pincode,
      preferredLanguage: payload.preferredLanguage,
    };

    const registeredUsers = this.getStoredRegisteredUsers();
    registeredUsers.push(newUser);
    try {
      localStorage.setItem('infralens_registered_users', JSON.stringify(registeredUsers));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }

    const session: UserSession = {
      id: userId,
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      role: 'CITIZEN',
      portal: 'PUBLIC_CITIZEN',
      officialTitle: 'Registered Citizen Reporter',
      assignedWard: `${payload.locality}, ${payload.cityOrVillage}`,
      isEmailVerified: true,
      isPhoneVerified: true,
      preferredLanguage: payload.preferredLanguage || 'en',
      permissions: [
        'report:create',
        'report:read_public',
        'report:upvote_nearby',
        'report:track_own',
      ],
    };

    this.persistSession(session);
    return session;
  }

  /**
   * Retrieve active session
   */
  getCurrentSession(): UserSession | null {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) {
        // Return default Director session for seamless evaluation experience
        return this.buildSessionFromDemo(DEMO_PERSONAS.director);
      }
      return JSON.parse(raw) as UserSession;
    } catch {
      return this.buildSessionFromDemo(DEMO_PERSONAS.director);
    }
  }

  /**
   * Sign out
   */
  logout(): void {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear session:', e);
    }
  }

  /**
   * Check RBAC permission
   */
  hasPermission(session: UserSession | null, permission: PermissionKey): boolean {
    if (!session) return false;
    return session.permissions.includes(permission);
  }

  /**
   * Check if user role can access given application view
   */
  canAccessView(role: UserRole | undefined, view: AppView): boolean {
    if (!role) return true; // public views accessible
    if (role === 'INFRALENS_SUPER_ADMIN') return true;

    switch (view) {
      case 'super-admin':
        return false; // already handled above by INFRALENS_SUPER_ADMIN early return
      case 'chief-inspector':
        return role === 'CHIEF_FIELD_INSPECTOR' || role === 'DIRECTOR_OF_OPERATIONS' || role === 'MUNICIPAL_ADMIN';
      case 'supervisor':
        return role === 'DEPARTMENT_SUPERVISOR' || role === 'DIRECTOR_OF_OPERATIONS' || role === 'MUNICIPAL_ADMIN';
      case 'inspector-mobile':
        return role === 'FIELD_INSPECTOR' || role === 'CHIEF_FIELD_INSPECTOR' || role === 'DEPARTMENT_SUPERVISOR';
      default:
        return true;
    }
  }

  private buildSessionFromDemo(demo: DemoAccountInfo): UserSession {
    return {
      id: `usr-${demo.role.toLowerCase()}-01`,
      fullName: demo.fullName,
      email: demo.email,
      role: demo.role,
      portal: demo.portal,
      officialTitle: demo.officialTitle,
      institutionName: demo.institutionName,
      assignedWard: demo.assignedWard,
      isEmailVerified: true,
      isPhoneVerified: true,
      preferredLanguage: 'en',
      permissions: demo.permissions,
    };
  }

  private persistSession(session: UserSession): void {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn('Failed to persist session:', e);
    }
  }

  private getStoredRegisteredUsers(): any[] {
    try {
      const raw = localStorage.getItem('infralens_registered_users');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}

export const authService = new AuthService();
