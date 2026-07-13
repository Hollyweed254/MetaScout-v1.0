// packages/database/src/repositories/rawImportRepository.ts
//
// Staging-only repository. Never writes to players/cards/card_stat_revisions
// directly — see DATABASE.md's import pipeline philosophy. Normalization
// (raw_import_cards -> real schema) is a separate, later step, not
// implemented in Milestone 3.

import { getSupabaseClient } from '../client';

export async function insertRawImportCard(rawPayload: unknown): Promise<{ id: string }> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('raw_import_cards')
    .insert({ raw_payload: rawPayload })
    .select('id')
    .single();
  if (error) throw error;
  return data as { id: string };
}

export async function listUnprocessedRawImportCards(): Promise<
  Array<{ id: string; raw_payload: unknown }>
> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('raw_import_cards')
    .select('id, raw_payload')
    .eq('processed', false);
  if (error) throw error;
  return data as Array<{ id: string; raw_payload: unknown }>;
}
