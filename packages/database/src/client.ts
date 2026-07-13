// packages/database/src/client.ts
//
// The only place in the codebase that instantiates a Supabase client.
// packages/config provides typed env access only (see its own header
// comment) — this file is where that config is actually turned into a
// working client, per the division of responsibility in ARCHITECTURE.md.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { loadConfig } from '@metascout/config';

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient;
  const config = loadConfig();
  const key = config.supabaseServiceRoleKey ?? config.supabaseAnonKey;
  cachedClient = createClient(config.supabaseUrl, key);
  return cachedClient;
}
