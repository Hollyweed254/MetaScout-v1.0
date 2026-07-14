// packages/services/src/analyzeSquadFromCards.ts
//
// Milestone 4: orchestration only. This is the one place that composes
// repository calls (real I/O) with the Engine (pure, persistence-agnostic)
// per ARCHITECTURE.md's Golden Rule. The Engine never sees a repository,
// Supabase client, or SQL — it only receives a fully-assembled Squad domain
// object.
//
// Per project decision (2026-07-14): formation and manager are NOT fetched
// from persistence — no formations/managers tables exist yet, and building
// them now would be premature (see docs/planning/ROADMAP.md Deferred Work).
// Both are supplied directly by the caller as plain domain objects.
//
// Card-centric by design (project decision, 2026-07-14): a Player is an
// identity; a Card is the actual thing selected into a squad and analyzed.
// cardIds is the primary input, not playerIds. assignedPositions is keyed by
// cardId, not playerId, to stay aligned with the actual selected entity and
// avoid encoding assumptions (e.g. "a player can only appear once") that
// aren't part of the domain model.
//
// This service does NOT invent card-selection rules (newest card,
// highest-rated card, favorite edition, etc.) — the caller decides exactly
// which cards make up the squad. Uses the current CardStatRevision as of now
// via the existing Milestone 3 repository function; a future historical
// snapshot feature can pass an asOfDate through without new repository code.
//
// Named analyzeSquadFromCards (not analyzeSquad) to avoid a naming collision
// with @metascout/engine's analyzeSquad, which takes an already-assembled
// Squad rather than cardIds — different signatures, different layers.

import type { Formation, Manager, Position, Squad } from '@metascout/domain';
import type { AnalysisResult } from '@metascout/engine';
import { analyzeSquad as runEngineAnalysis } from '@metascout/engine';
import {
  getPlayerById,
  getCardById,
  getCurrentCardStatRevision,
} from '@metascout/database';

export interface AnalyzeSquadFromCardsInput {
  cardIds: string[];
  formation: Formation;
  manager: Manager;
  assignedPositions: Record<string, Position>; // keyed by cardId
}

export async function analyzeSquadFromCards(
  input: AnalyzeSquadFromCardsInput,
): Promise<AnalysisResult> {
  const players = await Promise.all(
    input.cardIds.map(async (cardId) => {
      const card = await getCardById(cardId);
      if (!card) {
        throw new Error(`Card not found: ${cardId}`);
      }

      const player = await getPlayerById(card.playerId);
      if (!player) {
        throw new Error(`Player not found for card ${cardId}: ${card.playerId}`);
      }

      const cardStatRevision = await getCurrentCardStatRevision(cardId);
      if (!cardStatRevision) {
        throw new Error(`No current stat revision found for card ${cardId}`);
      }

      const assignedPosition = input.assignedPositions[cardId];
      if (!assignedPosition) {
        throw new Error(`No assigned position provided for card ${cardId}`);
      }

      return { player, card, cardStatRevision, assignedPosition };
    }),
  );

  const squad: Squad = {
    formation: input.formation,
    manager: input.manager,
    players,
  };

  return runEngineAnalysis({ squad });
}
