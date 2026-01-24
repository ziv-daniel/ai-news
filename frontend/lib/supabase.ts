import { createClient } from '@supabase/supabase-js';

// Use environment variables if available, with fallback for static builds
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://chhryzblsnqjqrrqmwdx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create client only if we have a valid key
export const supabase = supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return supabase !== null && supabaseAnonKey.length > 0;
};
