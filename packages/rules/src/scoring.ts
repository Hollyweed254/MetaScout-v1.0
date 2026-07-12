// packages/rules/src/scoring.ts
//
// Shared scoring utilities for Signals in @metascout/rules.
//
// Extracted from progressivePassingProfile.ts and ballRetentionProfile.ts
// after the same threshold-band/interpolation logic appeared identically in
// both, per the project's "extract reusable abstractions when duplication
// appears, not in anticipation of it" rule (see ARCHITECTURE.md / ADR-0002).
//
// This curve encodes the project owner's threshold bands, applied
// consistently across signals for calibration consistency:
// <75 weak, 75-84 adequate, 85+ strong (0-110 scale), smoothed continuously
// via linear interpolation within each band rather than hard steps.
//
// If a future signal needs genuinely different bands or a different curve
// shape, do not bend this function to accommodate it — write a new function
// alongside this one, named for what it represents, rather than adding
// parameters that make this one ambiguous.

export function scoreAttributeAgainstBands(rawValue: number): number {
  if (rawValue < 75) {
    return Math.max(0, (rawValue / 75) * 0.4);
  }
  if (rawValue < 85) {
    return 0.4 + ((rawValue - 75) / 10) * 0.3;
  }
  return Math.min(1, 0.7 + ((rawValue - 85) / 25) * 0.3);
}
