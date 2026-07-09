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