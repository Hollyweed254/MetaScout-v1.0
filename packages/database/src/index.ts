// packages/database/src/index.ts
//
// Public surface of @metascout/database. Callers should only ever import
// from here, never reach into src/repositories or src/client directly.

export { getSupabaseClient } from './client';
export * from './repositories/playerRepository';
export * from './repositories/cardRepository';
export * from './repositories/cardStatRevisionRepository';
export * from './repositories/rawImportRepository';
