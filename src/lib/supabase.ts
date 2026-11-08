/**
 * InfraLens Supabase Client
 *
 * Singleton Supabase client used throughout the application.
 * Configure via environment variables — NEVER hardcode keys here.
 *
 * Required .env / Vercel environment variables:
 *   VITE_SUPABASE_URL   = https://your-project.supabase.co
 *   VITE_SUPABASE_ANON_KEY = your-anon-public-key
 *
 * The anon key is safe to expose in the frontend because Row Level Security (RLS)
 * enforces data access control at the database level.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Indicates whether a real Supabase project is configured.
 * When false, the app falls back to in-memory storage with a clear warning.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    if (!isSupabaseConfigured) {
      throw new Error(
        '[InfraLens] Supabase is not configured. ' +
        'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables. ' +
        'The application is running in in-memory demo mode.'
      );
    }
    _supabase = createClient(supabaseUrl!, supabaseAnonKey!);
  }
  return _supabase;
}

/** Convenience export — use this throughout the app */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

export type { SupabaseClient };
