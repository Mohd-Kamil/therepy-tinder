import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if environment variables are defined
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabaseError = !isSupabaseConfigured
  ? 'Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY) are missing. Please create a .env.local file in the project root to configure them.'
  : null;

// Initialize the Supabase client safely
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

/**
 * Helper to check configuration state and log warnings in development
 */
if (!isSupabaseConfigured && process.env.NODE_ENV !== 'production') {
  console.warn(
    'Warning: Supabase client is not configured. ' +
    'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your env variables.'
  );
}
