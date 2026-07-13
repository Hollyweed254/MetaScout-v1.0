// packages/database/src/repositories/cardRepository.ts

import type { Card } from '@metascout/domain';
import { getSupabaseClient } from '../client';

interface CardRow {
  id: string;
  player_id: string;
  edition: string;
  season: string;
  base_rarity: string | null;
  source: string;
  source_ref: string | null;
}

function toDomain(row: CardRow): Card {
  return {
    id: row.id,
    playerId: row.player_id,
    edition: row.edition,
    season: row.season,
    baseRarity: row.base_rarity,
    source: row.source,
    sourceRef: row.source_ref ?? undefined,
  };
}

export async function getCardById(id: string): Promise<Card | null> {
  const client = getSupabaseClient();
  const { data, error } = await client.from('cards').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? toDomain(data as CardRow) : null;
}

export async function listCardsForPlayer(playerId: string): Promise<Card[]> {
  const client = getSupabaseClient();
  const { data, error } = await client.from('cards').select('*').eq('player_id', playerId);
  if (error) throw error;
  return (data as CardRow[]).map(toDomain);
}

export async function createCard(card: Omit<Card, 'id'>): Promise<Card> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('cards')
    .insert({
      player_id: card.playerId,
      edition: card.edition,
      season: card.season,
      base_rarity: card.baseRarity,
      source: card.source,
      source_ref: card.sourceRef ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return toDomain(data as CardRow);
}
