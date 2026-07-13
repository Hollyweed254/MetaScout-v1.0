// packages/rules/src/signals/progressivePassingProfile.ts
//
// Signal: Progressive Passing Profile
// "Can this player reliably move the ball forward through central areas
// under pressure?"
//
// Weights, thresholds, and playstyle-modifier reasoning supplied directly by
// the project owner (2026-07-10), based on personal testing/judgment.
// Provenance: observed_testing throughout, unless noted otherwise.
//
// Weight distribution (30/25/20/15/10) is Claude's interpolation of the
// owner's stated *ranking* (Low Pass > Ball Control > Tight Possession >
// Offensive Awareness > Lofted Pass) into concrete numbers — the ranking
// itself is the owner's; the exact percentages are an implementation choice
// pending owner review.
//
// Threshold scoring logic now lives in ../scoring.ts (extracted once it was
// duplicated verbatim in ballRetentionProfile.ts).

import type { SignalDefinition, SignalInput, SignalResult, WeightedFactor } from '../types';
import { scoreAttributeAgainstBands } from '../scoring';

const ATTRIBUTE_WEIGHTS: Record<
  'lowPass' | 'ballControl' | 'tightPossession' | 'offensiveAwareness' | 'loftedPass',
  WeightedFactor
> = {
  lowPass: {
    value: 0.3,
    provenance: 'observed_testing',
    note: 'Ranked #1 by owner — "especially Low Pass" called out explicitly.',
  },
  ballControl: {
    value: 0.25,
    provenance: 'observed_testing',
    note: 'Ranked #2 by owner — "especially Ball Control" called out explicitly.',
  },
  tightPossession: {
    value: 0.2,
    provenance: 'observed_testing',
    note: 'Ranked #3 by owner.',
  },
  offensiveAwareness: {
    value: 0.15,
    provenance: 'observed_testing',
    note: 'Ranked #4 by owner.',
  },
  loftedPass: {
    value: 0.1,
    provenance: 'observed_testing',
    note: 'Ranked #5 by owner — lowest weight of the five.',
  },
};

// Playstyle modifiers — see design note above. Orchestrator and Creative
// Playmaker are minor positive nudges only; Anchor Man and Destroyer are
// intentionally absent from this map (true neutral, zero effect).
// Bonus is based on the card's single primary Playstyle field (not AI Playing
// Styles, which are a separate taxonomy with no established deterministic
// rules yet — see project decision, 2026-07-13). Bonus is now a flat +0.1 if
// the primary Playstyle qualifies, rather than stacking per matching entry,
// since there is only ever one primary Playstyle to check.
const PLAYSTYLE_BONUS = 0.1;
const POSITIVE_PROGRESSION_PLAYSTYLES = new Set(['orchestrator', 'creativePlaymaker']);

export const progressivePassingProfile: SignalDefinition = {
  id: 'progressive-passing-profile',
  version: '1.0.0',
  description:
    "Deterministic estimate of a player's ability to reliably progress the ball through central areas under pressure, based on passing/control attributes with a minor playstyle modifier.",
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

    const primaryPlaystyle = input.cardStatRevision.primaryPlaystyle;
    const playstyleBonus =
      primaryPlaystyle && POSITIVE_PROGRESSION_PLAYSTYLES.has(primaryPlaystyle)
        ? PLAYSTYLE_BONUS
        : 0;

    if (playstyleBonus > 0) {
      evidence.push(
        `Playstyle bonus: +${playstyleBonus.toFixed(2)} (Orchestrator/Creative Playmaker present)`,
      );
    }

    const strength = Math.min(1, baseScore + playstyleBonus);

    return {
      signalId: 'progressive-passing-profile',
      strength,
      evidence,
    };
  },
};
