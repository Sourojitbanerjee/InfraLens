/**
 * InfraLens Supabase Authentication Service
 *
 * When Supabase is configured: uses real Supabase Auth (email+password, OAuth).
 * When NOT configured: falls back to the existing demo localStorage auth.
 *
 * Government officials must be manually verified by an admin before receiving
 * privileged access. Demo accounts are clearly labeled and separated.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authService } from './authService';
import { UserSession, UserRole } from '../types/auth';

export interface SignUpPayload {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  department?: string;
  jurisdictionCode?: string;
  state?: string;
  district?: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export interface AuthResult {
  session: UserSession | null;
  error: string | null;
}

/**
 * Maps Supabase user + profile to the app's UserSession type.
 * Never fabricates role data — always reads from the verified DB record.
 */
function profileToSession(user: { id: string; email?: string }, profile: {
  full_name?: string;
  role?: string;
  department_id?: string;
  jurisdiction_code?: string;
  is_verified?: boolean;
} | null): UserSession {
  const role = (profile?.role as UserRole) || 'CITIZEN';
  const portal = role === 'CITIZEN' ? 'PUBLIC_CITIZEN' : role === 'INFRALENS_SUPER_ADMIN' ? 'SUPER_ADMIN' : 'GOVERNMENT_OPERATIONS';
  return {
    id: user.id,
    fullName: profile?.full_name || user.email?.split('@')[0] || 'User',
    email: user.email || '',
    role,
    portal,
    departmentId: profile?.department_id,
    jurisdictionCode: profile?.jurisdiction_code,
    isEmailVerified: true,
    isPhoneVerified: false,
    preferredLanguage: 'en',
    permissions: [],
  };
}

class SupabaseAuthServiceImpl {
  private currentSession: UserSession | null = null;

  constructor() {
    // On load, check if there's an active Supabase session
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user) {
          this.loadProfile(data.session.user.id, data.session.user.email).then((session) => {
            this.currentSession = session;
          });
        }
      });

      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          this.currentSession = await this.loadProfile(session.user.id, session.user.email);
        } else {
          this.currentSession = null;
        }
      });
    }
  }

  private async loadProfile(userId: string, email?: string): Promise<UserSession> {
    if (!supabase) return authService.getCurrentSession()!;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return profileToSession({ id: userId, email }, profile);
  }

  async getCurrentSession(): Promise<UserSession | null> {
    // If Supabase is configured, use real auth
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        return this.loadProfile(data.session.user.id, data.session.user.email);
      }
      return null;
    }

    // Fall back to demo auth
    return authService.getCurrentSession();
  }

  getCurrentSessionSync(): UserSession | null {
    if (isSupabaseConfigured) {
      return this.currentSession;
    }
    return authService.getCurrentSession();
  }

  async signUp(payload: SignUpPayload): Promise<AuthResult> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        session: null,
        error: 'Real authentication requires Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          full_name: payload.fullName,
          role: payload.role,
        },
      },
    });

    if (error) {
      return { session: null, error: error.message };
    }

    // Update profile with additional fields
    if (data.user) {
      await supabase.from('user_profiles').upsert({
        id: data.user.id,
        full_name: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        role: payload.role,
        department_id: payload.department,
        jurisdiction_code: payload.jurisdictionCode,
        state: payload.state || 'Delhi',
        district: payload.district || 'New Delhi',
        // Government officials start unverified — admin must approve
        is_verified: payload.role === 'CITIZEN',
      });

      const session = await this.loadProfile(data.user.id, data.user.email);
      this.currentSession = session;
      return { session, error: null };
    }

    return { session: null, error: 'Registration failed. Please try again.' };
  }

  async signIn(payload: SignInPayload): Promise<AuthResult> {
    if (!isSupabaseConfigured || !supabase) {
      // Fall back to demo auth
      try {
        const session = authService.getCurrentSession();
        return { session, error: null };
      } catch {
        return { session: null, error: 'Demo auth failed.' };
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    if (error) {
      return { session: null, error: error.message };
    }

    if (data.user) {
      const session = await this.loadProfile(data.user.id, data.user.email);
      this.currentSession = session;
      return { session, error: null };
    }

    return { session: null, error: 'Sign in failed.' };
  }

  async signOut(): Promise<void> {
    this.currentSession = null;

    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    } else {
      authService.logout();
    }
  }

  async resetPassword(email: string): Promise<{ error: string | null }> {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'Password reset requires Supabase configuration.' };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    return { error: error?.message || null };
  }

  /**
   * Admin function: verify a government official's account.
   * Only INFRALENS_SUPER_ADMIN and MUNICIPAL_ADMIN can call this.
   */
  async verifyOfficialAccount(
    targetUserId: string,
    verifyingAdminId: string
  ): Promise<{ error: string | null }> {
    if (!isSupabaseConfigured || !supabase) {
      return { error: 'Requires Supabase configuration.' };
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
        verified_by: verifyingAdminId,
      })
      .eq('id', targetUserId);

    return { error: error?.message || null };
  }

  /**
   * Login as a demo persona — clearly marked as a demo account.
   * Falls back to the existing authService demo personas.
   */
  loginAsDemoPersona(key: string): UserSession | null {
    return authService.loginAsDemoPersona(key);
  }

  get isConfigured(): boolean {
    return isSupabaseConfigured;
  }
}

export const supabaseAuthService = new SupabaseAuthServiceImpl();
