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