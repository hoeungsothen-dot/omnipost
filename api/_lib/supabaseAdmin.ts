import { createClient } from '@supabase/supabase-js';

// Server-only credentials. Never prefix these with VITE_ — that would bundle
// them into the browser build. Set as plain (non-"Sensitive") Vercel env vars
// at the project level; see docs/facebook-instagram-setup.md.
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!url || !serviceRoleKey) {
  console.error('[supabaseAdmin] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
}

/**
 * Bypasses Row Level Security. Only use this in endpoints that have no user
 * session to work with (e.g. the OAuth redirect callback) and that derive
 * the target user_id from a value we generated and trust (the signed state
 * parameter), never from unauthenticated client input.
 */
export const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
