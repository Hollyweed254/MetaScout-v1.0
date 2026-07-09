// packages/config/src/index.ts
//
// Typed, validated env access only. Never instantiates a client
// (Supabase client instantiation belongs in @metascout/database).

import { z } from 'zod';

const AppConfigSchema = z.object({
  supabaseUrl: z.string().url(),
  supabaseAnonKey: z.string().min(1),
  supabaseServiceRoleKey: z.string().min(1).optional(),
  databaseUrl: z.string().min(1),
  appUrl: z.string().url(),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return AppConfigSchema.parse({
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    databaseUrl: env.DATABASE_URL,
    appUrl: env.NEXT_PUBLIC_APP_URL,
  });
}
