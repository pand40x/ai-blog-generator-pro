import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Server-side client (service role — tam yetki)
export function createServerClient() {
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Client-side client (anon key — RLS korumalı)
export function createBrowserClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

export { supabaseUrl };
