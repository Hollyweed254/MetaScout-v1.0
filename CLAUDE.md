# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What MetaScout Is

Intelligent football analysis platform for **eFootball** (Konami). Given a player's squad, manager, formation, playstyle, and available cards, MetaScout deterministically answers: *what is the strongest squad I can build, and why?* The system is built around explainable recommendations — the AI narrates, never decides.

## Tech Stack

- **Monorepo:** pnpm workspaces + Turbo
- **Frontend:** Next.js 16 (App Router) + React 19 + TypeScript 5
- **Styling:** Tailwind 4
- **Validation:** Zod (in `@metascout/config`)
- **Backend:** Supabase + PostgreSQL
- **Package manager:** pnpm 11.10 (pinned)

## Common Commands

All commands run from the repo root and use Turbo to fan out across the workspace.

```bash
pnpm dev            # all dev servers (turbo dev, persistent)
pnpm build          # all builds (turbo build)
pnpm lint           # all lint (turbo lint)
pnpm test           # all tests (turbo test)
pnpm format         # prettier --write .
pnpm check          # turbo check (typecheck)
```

**Per-package work** — every workspace package and `apps/web` exposes its own `package.json` scripts. To run a command in just one package:

```bash
pnpm --filter @metascout/engine test
pnpm --filter web dev
pnpm --filter @metascout/rules build
```

**Supabase env** — copy `.env.example` to `.env.local` in `apps/web/`. `@metascout/config.loadConfig(env)` validates the env at startup using Zod.

## High-Level Architecture

The layering is the most important thing to internalize. Read `docs/architecture/ARCHITECTURE.md` and `docs/adr/0002-signal-rule-finding-layering.md` in full before touching engine or rules code.

**4 conceptual layers, 3 packages:**

| Layer | Question | Package | Input shape |
|---|---|---|---|
| **Domain** | "What is this, factually?" | `@metascout/domain` | n/a (types only) |
| **Signal** | "What is deterministically true about *one* player?" | `@metascout/rules/src/signals` | `Player`, `Card`, `CardStatRevision` |
| **Rule** | "What is true about a narrow combination of players/entities?" | `@metascout/rules/src/rules` | `SignalResult[]` |
| **Finding** | "What is true about the squad, in tactical context?" | `@metascout/engine` | `Squad` + `RuleResult[]` + `SignalResult[]` |

**Request flow** (top-down):

```
apps/web (Next.js UI)
  → apps/web/app/api/* (thin adapters, no logic)
    → packages/database (repositories)
    → packages/engine (Analysis → Recommendation)
      → packages/rules (Signals → Rules; consumes @metascout/domain)
    → (async, non-blocking) Explanation Layer → external LLM
```

**Why Signals and Rules share `@metascout/rules`:** they change for the same reason and on the same cadence (a new Signal is only ever introduced because a Rule or Finding needs it). Splitting them would be speculative generality. They live as internal folders, not separate packages.

## Non-Negotiable Rules

**The Golden Rule (see `docs/architecture/ARCHITECTURE.md`):**
> The Analysis Engine and Recommendation Engine decide. The Explanation Layer only explains. AI never makes a football decision — it narrates one already made deterministically.

**`@metascout/rules` (Signals + Rules) — public interface constraint:**
- NEVER accept `Formation`, `Manager`, `Squad`, or any squad/tactical-context type as input.
- Only `Player` / `Card` / `CardStatRevision` / `SignalResult[]` are allowed in.
- This is enforced by interface design now, and will be enforced by `eslint-plugin-boundaries` in Milestone 2.

**`@metascout/engine` — purity constraints:**
- Pure and deterministic. Same input → same output, always.
- Never: access the database, make HTTP requests, read `process.env`, contain UI logic.
- Never inspect raw Attribute values directly. Consume signals/rules only.
- See `packages/engine/README.md` for the full list.

**`@metascout/config` (env access):**
- Single source for typed env validation. Returns `AppConfig` (Zod-validated).
- Never instantiate clients here. Supabase client instantiation belongs in `@metascout/database`.

**`apps/web/app/api/*` (API routes):**
- Thin adapters only. No business logic, no engine calls inline — route to packages.

**Weights as data-as-code:**
- Every weight in `packages/rules` config MUST carry a `Provenance` tag: `official_mechanics` | `observed_testing` | `documented_experimentation`.
- No DB-backed rule management. If non-engineer weight-tuning becomes a real need, revisit (ADR-0002).

**Database philosophy (`docs/architecture/DATABASE.md`):**
- The database stores **facts**, never calculations.
- Facts are never invented — only mirrored from real eFootball data or explicitly marked as user-entered.

## Repository Layout

```
apps/
  web/                        # Next.js 16 frontend + API routes
packages/
  domain/                     # Layer 1: factual eFootball types
  rules/                      # Layers 2a+2b: Signals + Rules (internal src/signals, src/rules)
  engine/                     # Layer 3: Findings (composes signals/rules + tactical context)
  config/                     # Zod-validated env access (loadConfig)
  database/                   # Repositories
  contracts/                  # API contracts
  shared/                     # Cross-cutting utilities
  ui/                         # Shared UI primitives
  sdk/                        # External SDK (deferred — see ADR-0001; don't build infra for it yet)
tooling/
  tsconfig/base.json          # Shared TS config (extends to ES2022, strict, bundler resolution)
docs/
  architecture/               # ARCHITECTURE.md, DATABASE.md (authoritative)
  adr/                        # Architecture Decision Records (read before non-trivial changes)
  engines/                    # ANALYSIS_ENGINE, RECOMMENDATION_ENGINE, EXPLANATION_ENGINE
  football/                   # FOOTBALL_RULEBOOK, FOOTBALL_DOMAIN (football knowledge source of truth)
  planning/ROADMAP.md         # Milestone status — current: M1 (domain/rules/config), next: M2 (engine)
supabase/                     # empty (M2+)
scripts/                      # empty (M2+)
```

## Roadmap Status

🚧 **Early development** — architecture being established before feature implementation.

- **M1 (current):** domain, rules, config — exit criteria include zero external deps for `domain`/`rules`, signed-off provenance shape.
- **M2 (next):** engine + recommendation — first Finding is **Central Midfield Progression Weakness**; includes 3 signals (Progressive Passing Profile, Press Resistance Profile, Ball Retention Profile). ESLint boundary rule lands in CI here.

See `docs/planning/ROADMAP.md` for full exit criteria. Don't add features outside the current milestone without checking the roadmap first.

## TypeScript Conventions

- All packages are ESM (`"type": "module"`); `main` points to `./src/index.ts` (consumed by TS via workspace links).
- TS config: `tooling/tsconfig/base.json` is the shared base; package `tsconfig.json` extends it. Apps use Next.js' own TS config.
- Strict mode is on. No `any` in new code.
- All cross-package imports use the `@metascout/*` workspace names; never reach into another package's `src/` directly.

## Where to Read Before You Start

- Touching engine/rules code → `docs/architecture/ARCHITECTURE.md` + `docs/adr/0002-signal-rule-finding-layering.md` + `docs/engines/ANALYSIS_ENGINE.md`
- Adding football knowledge → `docs/football/FOOTBALL_RULEBOOK.md` + `docs/football/FOOTBALL_DOMAIN.md`
- Touching DB → `docs/architecture/DATABASE.md`
- Adding an ADR → `docs/adr/README.md` (read the existing ADR-0002 for the format)
- Adding a new Finding → confirm with the project owner that the concept doesn't belong as a Rule (Signal/Rule/Finding split is not always obvious — the ADR explains why)
