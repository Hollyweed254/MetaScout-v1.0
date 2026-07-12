// packages/rules/src/signals/ballRetentionProfile.ts
//
// Signal: Ball Retention Profile
// "Can this player keep possession and resist being dispossessed, both under
// active pressure and in calmer circulation?"
//
// This signal intentionally merges what were originally discussed as two
// separate concepts (Press Resistance Profile and Ball Retention Profile).
// Project owner's reasoning (2026-07-10): both rely on nearly the same
// underlying attributes and describe the same core capability — keeping the
// ball in tight spaces under pressure. Kept as one signal to avoid duplicate
// logic; may be split later if a genuine distinct need emerges. See
// ADR-0002 / ARCHITECTURE.md growth-discipline rule.
//
// Weights, thresholds, and playstyle-modifier reasoning supplied directly by
// the project owner, based on personal testing/judgment.
// Provenance: observed_testing throughout.
//
// Weight distribution (30/25/20/15/10) is Claude's interpolation of the
// owner's stated *ranking* (Tight Possession > Ball Control > Balance >
// Dribbling > Physical Contact) into concrete numbers, mirroring the same
// distribution used for Progressive Passing Profile per the owner's request
// to keep that split as the standard template. Thresholds and interpolation
// curve are identical to progressivePassingProfile.ts, per owner instruction.
//
// Threshold scoring logic now lives in ../scoring.ts (extracted, was
// duplicated verbatim between this file and progressivePassingProfile.ts).

import type { SignalDefinition, SignalInput, SignalResult, WeightedFactor } from '../types';
import { scoreAttributeAgainstBands } from '../scoring';

const ATTRIBUTE_WEIGHTS: Record<
  'tightPossession' | 'ballControl' | 'balance' | 'dribbling' | 'physicalContact',
  WeightedFactor
> = {
  tightPossession: {
    value: 0.3,
    provenance: 'observed_testing',
    note: 'Ranked #1 by owner.',
  },
  ballControl: {
    value: 0.25,
    provenance: 'observed_testing',
    note: 'Ranked #2 by owner.',
  },
  balance: {
    value: 0.2,
    provenance: 'observed_testing',
    note: 'Ranked #3 by owner.',
  },
  dribbling: {
    value: 0.15,
    provenance: 'observed_testing',
    note: 'Ranked #4 by owner.',
  },
  physicalContact: {
    value: 0.1,
    provenance: 'observed_testing',
    note: 'Ranked #5 by owner — lowest weight of the five.',
  },
};

// Playstyle modifiers — only the playstyles the owner explicitly named are
// encoded. Target Man and Fox in the Box are correctly absent (neutral by
// default — not included in either a bonus or penalty set).
const POSITIVE_PLAYSTYLE_BONUS = 0.05;
const MAX_PLAYSTYLE_BONUS = 0.1;
const POSITIVE_RETENTION_PLAYSTYLES = new Set(['holePlayer', 'creativePlaymaker']);

export const ballRetentionProfile: SignalDefinition = {
  id: 'ball-retention-profile',
  version: '1.0.0',
  description:
    "Deterministic estimate of a player's ability to retain possession under pressure and in general circulation, based on close-control attributes with a minor playstyle modifier. Merges what were originally two proposed signals (Press Resistance, Ball Retention) into one — see file header.",
  evaluate: (input: SignalInput): SignalResult => {
    const { attributes } = input.cardStatRevision;
    const evidence: string[] = [];

    const weightedScores = (
      Object.keys(ATTRIBUTE_WEIGHTS) as Array<keyof typeof ATTRIBUTE_WEIGHTS>
    ).map((attr) => {
      const rawValue = attributes[attr];
      const score = scoreAttributeAgainstBands(rawValue);
      const weight = ATTRIBUTE_WEIGHTS[attr].value;
      evidence.push(`${attr}=${rawValue} -> score ${score.toFixed(2)} (weight ${weight})`);
      return score * weight;
    });

    const baseScore = weightedScores.reduce((sum, s) => sum + s, 0);

    const playstyleBonus = Math.min(
      MAX_PLAYSTYLE_BONUS,
      input.cardStatRevision.playerPlaystyles.filter((ps) =>
        POSITIVE_RETENTION_PLAYSTYLES.has(ps),
      ).length * POSITIVE_PLAYSTYLE_BONUS,
    );

    if (playstyleBonus > 0) {
      evidence.push(
        `Playstyle bonus: +${playstyleBonus.toFixed(2)} (Hole Player/Creative Playmaker present)`,
      );
    }

    const strength = Math.min(1, baseScore + playstyleBonus);

    return {
      signalId: 'ball-retention-profile',
      strength,
      evidence,
    };
  },
};
