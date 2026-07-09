# ADR-0002: Signal / Rule / Finding Layering, and Deferred Rule-Management Infrastructure

**Status:** Accepted
**Date:** 2026-07-07

## Context

Initial framing of `packages/rules` treated "Rules" as the single unit of football knowledge above raw domain data. Working through a concrete example (Central Midfield Progression Weakness) surfaced that this collapses two genuinely different things:

1. Deterministic, reusable, **context-free** observations about a single player (e.g. "does this player have a progressive passing profile") — these were named **Signals**.
2. Deterministic, reusable, still context-free combinations of a few signals (e.g. "do these two midfielders have complementary progression roles") — these are **Rules**.
3. Confidence-scored, evidence-backed judgments about a **squad in tactical context** (formation, manager affinity) — these are **Findings**, produced by the Analysis Engine.

## Decision 1: Four conceptual layers, three packages

Domain → Signal → Rule → Finding is now the conceptual model. Signals and Rules share `packages/rules` (as internal folders, not separate packages) because they change together — a new Signal is only ever introduced because a Rule or Finding needs it, not on an independent schedule. This differs from the `rules`/`engine` package split (ADR-0001), which is justified by content changing on Konami's patch schedule, independent of engine execution code. That independent-versioning justification does not apply between Signals and Rules, so no package split is warranted between them.

## Decision 2: "Central Midfield Progression Weakness" is a Finding, not a Rule

This concept requires formation spacing and manager-tactical-compatibility as inputs — squad-level tactical context that a context-free Rule should never accept. Classifying it as a Rule would force squad/tactical-context parameters into the `rules` package, breaking the "Rules are reusable and context-free" property that makes them safely composable across many future Findings.

**Confirmed by project owner (2026-07-07):** Rules were never intended to accept squad-level tactical context. This resolution stands as written.

## Decision 3: Weights as versioned data-as-code, not a DB-backed rule-management system

Two options were considered for "externally configurable" weights:
- **Data-as-code**: versioned config files in `packages/rules`, changed via PR + review + deploy.
- **Data-in-DB**: Supabase-stored weights, editable without redeploy, requiring an admin/authoring surface with validation and audit trail.

**Rejected (data-in-DB) because:** there is no demonstrated need yet for non-engineers to tune weights without a deploy, and building the validation/versioning/audit infrastructure this would require before any weight has ever been changed is speculative infrastructure — the same class of mistake flagged for `sdk` and initially considered for `services` in ADR-0001. Unlike `services`, there is no existing architecture-diagram commitment naming a rule-authoring layer.

**Decision:** data-as-code for now. Revisit only if a concrete need for non-engineer or no-deploy weight tuning materializes.

## Consequences

- `packages/rules` public interface never accepts `Formation`, `Manager`, or `Squad` types — only `Player`/`Card`/`CardStatRevision`-shaped input. This is enforceable by interface design immediately, and by lint rule once `eslint-plugin-boundaries` is introduced in Milestone 2.
- Every weight in `packages/rules` config must carry a provenance tag (`official_mechanics`, `observed_testing`, `documented_experimentation`).
