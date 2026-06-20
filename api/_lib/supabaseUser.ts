import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Builds a Supabase client authenticated as the calling user (via the
 * Authorization: Bearer <access_token> header sent from the frontend), so
 * Row Level Security applies exactly as it does in the browser. Prefer this
 * over supabaseAdmin anywhere a request originates from the logged-in app.
 */
export function supabaseForRequest(authHeader?: string) {
  const token = (authHeader || '').replace(/^Bearer\s+/i, '');
  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  });
}

export async function getUserFromRequest(authHeader?: string) {
  const token = (authHeader || '').replace(/^Bearer\s+/i, '');
  const client = supabaseForRequest(authHeader);
  if (!token) return { client, user: null };
  const { data, error } = await client.auth.getUser(token);
  if (error) return { client, user: null };
  return { client, user: data.user };
}
