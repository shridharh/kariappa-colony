import { createClient } from '@supabase/supabase-js';

// These are set automatically by the Vercel <-> Supabase marketplace
// integration (both locally via `vercel env pull` and in production).
// The anon key is safe to expose in the browser because Row Level
// Security on the `complainants` table only allows INSERT, never SELECT.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
