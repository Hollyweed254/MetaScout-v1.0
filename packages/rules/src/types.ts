// packages/rules/src/types.ts
//
// Layer 2 — Signals and Rules.
// Both are deterministic, reusable, and context-free: they never accept
// Formation, Manager, or Squad. Only Player/Card/CardStatRevision-shaped input.
// See ADR-0002 for the reasoning behind this constraint.

import type { Card, CardStatRevision, Player } from '@metascout/domain';

export type Provenance = 'official_mechanics' | 'observed_testing' | 'documented_experimentation';

export interface WeightedFactor {
  value: number;
  provenance: Provenance;
  note?: string; // e.g. "based on 40-match sample, patch 3.2"
}

export interface SignalInput {
  player: Player;
  card: Card;
  cardStatRevision: CardStatRevision;
}

export interface SignalResult {
  signalId: string;
  strength: number; // 0.0–1.0, deterministic
  evidence: string[]; // human-readable, for Explanation Layer consumption
}

export interface SignalDefinition {
  id: string;
  version: string;
  description: string;
  evaluate: (input: SignalInput) => SignalResult;
}

export interface RuleResult {
  ruleId: string;
  detected: boolean;
  confidence: number; // 0.0–1.0
  evidence: Array<{ signalId: string; contribution: number }>;
}

export interface RuleDefinition {
  id: string;
  version: string;
  description: string;
  requiredSignals: string[]; // signal ids this rule depends on
  weights: Record<string, WeightedFactor>;
  evaluate: (signalResults: SignalResult[]) => RuleResult;
}