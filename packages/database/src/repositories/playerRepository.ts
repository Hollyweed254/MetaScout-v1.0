// packages/database/src/repositories/playerRepository.ts
//
// Repositories return domain-typed values only (see packages/domain).
// Callers should never see raw Supabase row shapes (snake_case columns) —
// mapping happens here, once, at the boundary.

import type { Player } from '@metascout/domain';
import { getSupabaseClient } from '../client';

interface PlayerRow {
  id: string;
  name: string;
  source: string;
  source_ref: string | null;
}

function toDomain(row: PlayerRow): Player {
  return {
    id: row.id,
    name: row.name,
    source: row.source,
    sourceRef: row.source_ref ?? undefined,
  };
}

export async function getPlayerById(id: string): Promise<Player | null> {
  const client = getSupabaseClient();
  const { data, error } = await client.from('players').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toDomain(data as PlayerRow) : null;
}

export async function listPlayers(): Promise<Player[]> {
  const client = getSupabaseClient();
  const { data, error } = await client.from('players').select('*');
  if (error) throw error;
  return (data as PlayerRow[]).map(toDomain);
}

export async function createPlayer(
  player: Omit<Player, 'id'>,
): Promise<Player> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('players')
    .insert({ name: player.name, source: player.source, source_ref: player.sourceRef ?? null })
    .select()
    .single();
  if (error) throw error;
  return toDomain(data as PlayerRow);
}
