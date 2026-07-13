// packages/database/src/repositories/cardStatRevisionRepository.ts

import type { CardStatRevision } from '@metascout/domain';
import { getSupabaseClient } from '../client';

interface CardStatRevisionRow {
  id: string;
  card_id: string;
  attributes: Record<string, number>;
  player_playstyles: string[];
  registered_positions: Array<{ position: string; proficiency: string }>;
  skills: string[];
  booster_skills: Array<{ id: string; name: string; effect: string }>;
  effective_date: string;
  source: string;
  source_ref: string | null;
}

function toDomain(row: CardStatRevisionRow): CardStatRevision {
  return {
    id: row.id,
    cardId: row.card_id,
    attributes: row.attributes as CardStatRevision['attributes'],
    playerPlaystyles: row.player_playstyles as CardStatRevision['playerPlaystyles'],
    registeredPositions: row.registered_positions as CardStatRevision['registeredPositions'],
    skills: row.skills,
    boosterSkills: row.booster_skills,
    effectiveDate: row.effective_date,
    source: row.source,
    sourceRef: row.source_ref ?? undefined,
  };
}

// Implements the "stats as of date X" query pattern from DATABASE.md:
// the current-truth revision is the one with the latest effective_date
// less than or equal to the given date (defaults to now).
export async function getCurrentCardStatRevision(
  cardId: string,
  asOfDate: string = new Date().toISOString(),
): Promise<CardStatRevision | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('card_stat_revisions')
    .select('*')
    .eq('card_id', cardId)
    .lte('effective_date', asOfDate)
    .order('effective_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? toDomain(data as CardStatRevisionRow) : null;
}

export async function createCardStatRevision(
  revision: Omit<CardStatRevision, 'id'>,
): Promise<CardStatRevision> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('card_stat_revisions')
    .insert({
      card_id: revision.cardId,
      attributes: revision.attributes,
      player_playstyles: revision.playerPlaystyles,
      registered_positions: revision.registeredPositions,
      skills: revision.skills,
      booster_skills: revision.boosterSkills,
      effective_date: revision.effectiveDate,
      source: revision.source,
      source_ref: revision.sourceRef ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return toDomain(data as CardStatRevisionRow);
}
