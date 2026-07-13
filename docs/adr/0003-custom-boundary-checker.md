# ADR-0003: Custom Boundary Checker Instead of eslint-plugin-boundaries

**Status:** Accepted
**Date:** 2026-07-11

## Context

ADR-0001 and ARCHITECTURE.md specified eslint-plugin-boundaries as the mechanism to enforce the package dependency-direction table in CI. Three separate configuration attempts were made (v4.2.2 with an element-types rule, v4.2.2 debugged and reconfigured, v7.0.2 upgrade with a dependencies rule) — all three reported success (clean lint runs, correct-looking config output via --print-config) while a deliberate sanity test (injecting a real forbidden import) proved each configuration silently failed to detect it.

## Decision

Replaced the plugin with a small custom script (scripts/check-boundaries.mjs) that scans packages/*/src for @metascout/* import statements via regex and checks them against the same allowed-dependency table, previously encoded in the plugin's settings and now living directly in the script (kept in sync with ARCHITECTURE.md's Package Table).

## Consequences

- The script was verified working via the same sanity-test methodology that exposed the plugin's failures: a forbidden import was injected and confirmed to produce a non-zero exit code with a correct violation message, then reverted.
- Trade-off accepted: the script only catches static import/export syntax, not dynamic import() or re-export indirection. This is judged acceptable for the project's current straightforward import patterns; revisit with a real AST parse (e.g. TypeScript's compiler API) if that changes.
- Lesson for future tooling decisions: verify third-party enforcement tools with a deliberate negative test (inject a real violation, confirm it's caught) before trusting a clean run as proof the tool works. A clean run alone is consistent with both "no violations exist" and "the tool isn't actually checking."
