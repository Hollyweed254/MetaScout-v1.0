// packages/rules/src/index.ts
//
// Public surface of @metascout/rules. Re-exports the public types so callers
// can import from '@metascout/rules' without reaching into src/.

export type {
  Provenance,
  WeightedFactor,
  SignalInput,
  SignalResult,
  SignalDefinition,
  RuleResult,
  RuleDefinition,
} from './types.js';

export * from './signals/index.js';
