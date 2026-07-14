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

## Deferred Work / Future Improvements

Recorded 2026-07-14, after Milestone 3 closed. These are accepted technical debt — visible and tracked, not scheduled, not to be addressed until explicitly picked up in a future milestone.

### Deferred Item 1 — Investigate Supabase PostgREST schema-cache inconsistency

**Status:** Worked around, not solved.

- Direct PostgreSQL connections (via the `pg` package, using the pooler connection string) behave correctly and were used to complete the Milestone 3 card import.
- The PostgREST/Data API layer (used by `@metascout/database`'s repositories via `@supabase/supabase-js`) did not reflect the `raw_import_cards` table's existence despite `information_schema.tables` confirming it was present, `supabase db push` reporting the remote as up to date, and the project owner confirming via the Supabase dashboard that "Exposed schemas" correctly listed `public` (and `graphql_public`).
- Attempted fixes that did NOT resolve it: `NOTIFY pgrst, 'reload schema'`, a full Supabase project restart. Dashboard-side deeper investigation (e.g. a Supabase support ticket) was not pursued.
- **Risk:** future API routes (Milestone 4+ services layer, Milestone 5 frontend) will depend on the PostgREST-based repository layer in `packages/database`, not a direct Postgres connection. If this inconsistency recurs, it will surface in a context that's harder to route around than a one-off script.
- **Action for later:** file a Supabase support ticket or investigate further before Milestone 4/5 begins relying on the repository layer against live data. Do not attempt another workaround without understanding root cause first.

### Deferred Item 2 — Documentation update needed

`docs/architecture/DATABASE.md` and `docs/architecture/ARCHITECTURE.md` are stale as of the Milestone 3 domain/schema changes. They need to be updated (later, not now) to describe:
- The split of the original single playstyle list into `primaryPlaystyle` (single value) and `aiPlaystyles` (array) — both in `packages/domain`'s `CardStatRevision` type and the corresponding `card_stat_revisions` table columns.
- Why the first manual card import used a direct PostgreSQL connection (via the `pg` package and pooler connection string) rather than the Supabase Data API / `@supabase/supabase-js`, referencing Deferred Item 1 above.

### Deferred Item 3 — Import pipeline generalization

**Current state:** `scripts/import-cards-batch.mjs` is intentionally a one-off script, not reusable infrastructure — an explicit architecture decision, not an oversight. It successfully proved the schema against one real, manually transcribed card (Eden Hazard).

**Trigger for generalization:** importing the next real batch of approximately 10–20 cards. Only at that point should reusable normalization/import logic in `packages/database` be considered — not before, per the project's standing rule against building infrastructure ahead of demonstrated need.
