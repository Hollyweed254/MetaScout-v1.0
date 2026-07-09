## Milestone 1 — Domain, Signal/Rule Shape, Provenance Mechanics
**Packages:** `domain`, `rules`, `config`
**Exit criteria:**
- `domain`/`rules` compile with zero external dependencies.
- `AnalysisResult`/`Finding` provenance shape (`ruleSetVersion`, `cardRevisionIds`, `evidence`) defined and signed off.
- **Blocking, not yet resolved:** confirmation of ADR-0002 (Signal/Rule/Finding layering — specifically, that Rules never accept squad-level tactical context), and real weight/threshold values with provenance for the three Milestone 2 signals (Progressive Passing Profile, Press Resistance Profile, Ball Retention Profile).
- Full domain vocabulary shape for entities referenced by these signals (at minimum: Attributes, Player Playstyles, Registered Positions) — enough to type the signals, not the full domain model.

## Milestone 2 — Analysis Engine + Recommendation Engine (one Finding, proof of purity)
**Packages:** `rules` (signals + rules), `engine`
**Target Finding:** Central Midfield Progression Weakness
**Exit criteria:**
- The three Milestone 1 signals implemented in `packages/rules/src/signals`, each with documented assumptions and provenance-tagged config.
- The Finding composed in `packages/engine`, combining signals + formation spacing + manager compatibility into a confidence score with evidence array.
- Tests proving: same input → same output; zero I/O even under mocked `fetch`/`process.env`.
- ESLint boundary rule enforced in CI, covering both `engine`'s forbidden imports and `rules`'s forbidden squad/tactical-context parameters.