
import { createClient } from '@supabase/supabase-js';

// Access environment variables with VITE_ prefix for frontend
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a single supabase client for interacting with your database
// If keys are missing, this will fail or warn, but we'll handle that in api.js
export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
