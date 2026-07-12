// packages/engine/src/findings/centralMidfieldProgressionWeakness.ts
//
// Finding: Central Midfield Progression Weakness
// "Does this squad lack the ability to reliably move possession from
// defensive areas into attacking areas through central midfield?"
//
// This is a Layer 3 Finding — the first place tactical/squad-level context
// (which positions a player occupies, how central-midfield contributions are
// weighted and combined) is allowed to enter, per ADR-0002. It composes two
// Layer 2 signals (@metascout/rules) without inspecting raw attributes.
//
// All combination math, thresholds, and the confidence formula below were
// explicitly confirmed by the project owner (2026-07-10):
//   - Per-player score: 50/50 average of progressivePassingProfile and
//     ballRetentionProfile.
//   - Position weighting: DMF/CMF = 1.2, AMF = 1.0 ("slightly favored").
//   - Detection: combined weighted-average score < 0.5.
//   - Confidence: linear ramp, confidence = (0.5 - score) / 0.5, floored at 0.
//
// Explicitly deferred, not incorporated (documented, not invented, per
// project philosophy):
//   - Formation spacing / distance data — domain.Formation has no spacing
//     data yet. This Finding only uses formation.positions to identify which
//     positions exist, not their physical relationship to one another.
//   - Manager tactical compatibility — no deterministic rule exists yet for
//     how manager preference should affect this Finding. Adding one now would
//     mean inventing football knowledge, which the project explicitly forbids.
//
// If the squad has no players registered in DMF/CMF/AMF for the given
// formation, the Finding returns detected: false, confidence: 0, with
// evidence explaining that it could not be evaluated (owner-confirmed
// behavior, not a silent failure).

import type { Squad } from '@metascout/domain';
import { progressivePassingProfile, ballRetentionProfile } from '@metascout/rules';
import type { Finding } from '../index';

const CENTRAL_MIDFIELD_POSITIONS = new Set(['DMF', 'CMF', 'AMF']);

const POSITION_WEIGHTS: Record<string, number> = {
  DMF: 1.2,
  CMF: 1.2,
  AMF: 1.0,
};

export function evaluateCentralMidfieldProgressionWeakness(squad: Squad): Finding {
  const centralMidfielders = squad.players.filter((p) =>
    CENTRAL_MIDFIELD_POSITIONS.has(p.assignedPosition),
  );

  if (centralMidfielders.length === 0) {
    return {
      id: 'central-midfield-progression-weakness',
      detected: false,
      confidence: 0,
      evidence: [
        {
          source: 'squad-composition',
          contribution: 0,
          description:
            'No players are registered in a central midfield position (DMF, CMF, or AMF) for the current formation — this Finding could not be evaluated.',
        },
      ],
    };
  }

  let weightedScoreSum = 0;
  let weightSum = 0;
  const evidence: Array<{ source: string; contribution: number; description: string }> = [];

  for (const entry of centralMidfielders) {
    const signalInput = {
      player: entry.player,
      card: entry.card,
      cardStatRevision: entry.cardStatRevision,
    };

    const passingResult = progressivePassingProfile.evaluate(signalInput);
    const retentionResult = ballRetentionProfile.evaluate(signalInput);

    const perPlayerScore = (passingResult.strength + retentionResult.strength) / 2;
    const positionWeight = POSITION_WEIGHTS[entry.assignedPosition] ?? 1.0;

    weightedScoreSum += perPlayerScore * positionWeight;
    weightSum += positionWeight;

    evidence.push({
      source: `player:${entry.player.id}`,
      contribution: perPlayerScore,
      description: `${entry.player.name} (${entry.assignedPosition}): progressive passing ${passingResult.strength.toFixed(2)}, ball retention ${retentionResult.strength.toFixed(2)}, combined ${perPlayerScore.toFixed(2)} (position weight ${positionWeight})`,
    });
  }

  const combinedScore = weightedScoreSum / weightSum;
  const detected = combinedScore < 0.5;
  const confidence = detected ? Math.max(0, (0.5 - combinedScore) / 0.5) : 0;

  return {
    id: 'central-midfield-progression-weakness',
    detected,
    confidence,
    evidence,
  };
}
