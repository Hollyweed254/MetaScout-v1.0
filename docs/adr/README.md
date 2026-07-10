# Architecture Decision Records

This directory holds the project's Architecture Decision Records (ADRs) — short documents that capture a single consequential decision: its context, what was chosen, and what follows from the choice.

ADRs are append-only. Once accepted, an ADR is not edited to reflect a later reversal; instead, a new ADR is written that supersedes or amends it, and the old one's status is updated (e.g. `Superseded by ADR-0005`).

## Index

| ADR | Title | Status |
| --- | --- | --- |
| [0002](0002-signal-rule-finding-layering.md) | Signal / Rule / Finding Layering, and Deferred Rule-Management Infrastructure | Accepted |

## Format

File naming: `NNNN-kebab-case-title.md`, where `NNNN` is a zero-padded 4-digit sequence number. Numbers are assigned in the order ADRs are written; never reuse a number.

Each ADR has these sections, in this order:

1. **Title** (H1) — short, declarative, names the decision.
2. **Status** — one of: `Proposed`, `Accepted`, `Superseded by ADR-NNNN`, `Deprecated`. Date the status was set.
3. **Date** — the date the ADR was written.
4. **Context** — the situation that forced the decision. What problem or tension surfaced, what constraints existed, what stakeholders were involved.
5. **Decision** — one or more numbered sub-decisions, each with its own heading. State what was chosen, then state the alternatives that were rejected and *why*. The "rejected because" reasoning is the most valuable part of an ADR — it's what stops the same debate from reopening in a year.
6. **Consequences** — the follow-on effects of the decision, both positive and negative. Be honest about trade-offs.

Keep ADRs short. If a section is growing past a page, you're either writing a design doc (put it in `docs/architecture/`) or you've bundled two decisions that should be split.

## See also

- [ARCHITECTURE.md](../architecture/ARCHITECTURE.md) — the authoritative layering rules ADRs must be consistent with.
- [CLAUDE.md](../../CLAUDE.md) — the high-level architecture summary this directory expands on.
