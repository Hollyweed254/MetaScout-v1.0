// packages/engine/src/index.ts
//
// Layer 3 — Findings. The engine package's public surface.
// This is where tactical context (formation, manager, squad) is allowed in.
// The Engine composes Signals + Rules (from @metascout/rules) with this
// context. It must never inspect raw Attribute values directly.

import type { Squad } from '@metascout/domain';

export interface Finding {
  id: string;               // e.g. 'central-midfield-progression-weakness'
  detected: boolean;
  confidence: number;       // 0.0–1.0
  evidence: Array<{ source: string; contribution: number; description: string }>;
}

export interface AnalysisResult {
  findings: Finding[];
  ruleSetVersion: string;
  cardRevisionIds: Record<string, string>; // playerId -> CardStatRevision.id
}

export interface AnalysisInput {
  squad: Squad;
}

export type AnalysisFunction = (input: AnalysisInput) => AnalysisResult;

import { evaluateCentralMidfieldProgressionWeakness } from './findings/centralMidfieldProgressionWeakness';

// Manually bumped per changes to signal/rule/finding weights or logic —
// owner-confirmed approach for Milestone 2 (2026-07-10). A composite version
// computed from individual signal/rule versions can replace this later if
// manual bumping becomes a real maintenance burden.
const RULE_SET_VERSION = '0.1.0';

export const analyzeSquad: AnalysisFunction = (input) => {
  const finding = evaluateCentralMidfieldProgressionWeakness(input.squad);

  const cardRevisionIds: Record<string, string> = {};
  for (const entry of input.squad.players) {
    cardRevisionIds[entry.player.id] = entry.cardStatRevision.id;
  }

  return {
    findings: [finding],
    ruleSetVersion: RULE_SET_VERSION,
    cardRevisionIds,
  };
};
