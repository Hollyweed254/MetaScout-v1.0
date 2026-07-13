# MetaScout Architecture

This document is the authoritative record of MetaScout's package structure and layering rules. It expands on the high-level architecture defined in CLAUDE.md — it does not override it.

---

## Layered Pipeline

Frontend (apps/web)
      │
      ▼
API routes (apps/web/app/api) — thin adapters only
      │
      ▼
Services (packages/services) — orchestration, framework-independent
      │              │
      ▼              ▼
Repositories      Analysis Engine → Recommendation Engine
(packages/database)  (packages/engine, using packages/rules)
      │                              │
      ▼                              ▼
Database                    Explanation Layer (async, non-blocking)
                                      │
                                      ▼
                             External LLM API

## Golden Rule

The Analysis Engine and Recommendation Engine decide. The Explanation Layer only explains. AI never makes a football decision — it narrates one already made deterministically.

---

## Football Knowledge Model (Domain → Signals → Rules → Findings)

Football knowledge is not one undifferentiated blob of "logic." It has four distinct layers, each with a different responsibility, a different owner package, and a different reason to change:

| Layer | Question it answers | Package | Changes when |
|---|---|---|---|
| **Domain** | "What is this, factually?" | `packages/domain` | Konami adds new official data (attributes, playstyles, positions) |
| **Signal** | "What is deterministically true about one player?" (e.g. "Can this player reliably progress the ball?") | `packages/rules/src/signals` | A new reusable, single-entity observation is needed by more than one Rule |
| **Rule** | "What is deterministically true about a narrow combination of players/entities?" (e.g. "Do these two midfielders have complementary progression roles?") | `packages/rules/src/rules` | Football knowledge about combining signals is refined |
| **Finding** | "What is true about the squad, in tactical context?" (e.g. "This squad has a Central Midfield Progression Weakness, confidence 0.74, because...") | `packages/engine` | MetaScout's own analytical models evolve |

**Critical distinction:** Signals and Rules are *reusable, context-free* deterministic building blocks — a Signal never knows about formation, manager, or squad composition. A Finding is where tactical context (formation spacing, manager affinity, squad-wide view) and confidence scoring enter. This is why "Central Midfield Progression Weakness" — which explicitly depends on formation and manager compatibility — is a **Finding**, produced by `packages/engine`, not a Rule produced by `packages/rules`.

### Why Signals and Rules share one package, not two

Both change for the same reason (a new Finding needs new football knowledge beneath it) and on the same cadence — they are proposed and revised together, not independently. This differs from the `rules`/`engine` package split, which is justified by rule *content* (Konami balance patches) changing independently of engine *execution code*. Signals and Rules don't have that independent-versioning property, so splitting them into separate packages would add import-boundary cost without a corresponding benefit — the same speculative-generality mistake flagged elsewhere in this project (see ADR-0002).

---

## Package Dependency Table

The following table defines which packages may import from which. Arrows show allowed dependencies (package → may import from).

| Package | May import from |
|---|---|
| `domain` | *(none)* |
| `contracts` | `domain` |
| `rules` | `domain` |
| `engine` | `domain`, `rules` |
| `explanation` | `domain`, `rules` |
| `services` | `database`, `engine`, `explanation`, `contracts` |
| `database` | `domain`, `config` |
| `config` | *(none)* |
| `sdk` | `contracts` |
| `ui` | `contracts` |
| `shared` | *(none)* |

### Enforcement

Enforced via a custom script (scripts/check-boundaries.mjs) rather than a third-party ESLint plugin. eslint-plugin-boundaries was attempted first but was found, after multiple configuration attempts across versions 4.2.2 and 7.0.2, to silently pass real boundary violations without error — see project history for details. The custom script performs a plain regex-based scan of @metascout/* imports against the allowed-dependency table below, verified working via a deliberate sanity test (a forbidden import was injected and confirmed to be caught). Run via `pnpm check:boundaries`. Note: this catches static import/export statements only — it does not currently catch dynamic import() calls or indirection through re-export barrels; if the codebase adopts those patterns, this script will need a real AST-based parse rather than regex.
