// packages/domain/src/index.ts
//
// Layer 1 — Domain Facts.
// Pure data types only. No football logic, no I/O, no framework dependencies.
//
// Confirmed directly against the eFootball game client by the project owner
// (2026-07-10). Attribute/playstyle/position lists below are no longer DRAFT
// placeholders. Provenance: official_mechanics (client-observed), unless
// stated otherwise. Should still be periodically re-verified against the live
// client when Konami ships major updates, since this is a live-service game.

// ---------------------------------------------------------------------------
// Attributes
// ---------------------------------------------------------------------------

// Confirmed: core outfield attributes, current eFootball version.
export type OutfieldAttribute =
  | 'offensiveAwareness'
  | 'ballControl'
  | 'dribbling'
  | 'tightPossession'
  | 'lowPass'
  | 'loftedPass'
  | 'finishing'
  | 'heading'
  | 'setPieceTaking'
  | 'curl'
  | 'speed'
  | 'acceleration'
  | 'kickingPower'
  | 'jump'
  | 'physicalContact'
  | 'balance'
  | 'stamina'
  | 'defensiveAwareness'
  | 'tackling' // renamed from "Ball Winning" as of current version
  | 'aggression'
  | 'defensiveEngagement';

// Confirmed: goalkeeper attributes, current eFootball version.
export type GoalkeeperAttribute =
  | 'gkAwareness'
  | 'gkCatching'
  | 'gkParrying'
  | 'gkReflexes'
  | 'gkReach';

export type Attribute = OutfieldAttribute | GoalkeeperAttribute;

// Attribute values are numeric. Highest confirmed value in the current game
// client is 110 (up from an earlier 99 ceiling). This is a confirmed
// snapshot, not a hard cap — the ceiling may rise further as Konami adjusts
// the scale over time. Deliberately left as an unbounded `number` rather than
// encoding a maximum in the type — the ceiling is a live-service detail that
// belongs in data validation (packages/database, at import time), not in the
// type system, per the project's "future seasons must not require a schema
// redesign" principle.
export type AttributeBlock = Record<Attribute, number>;

// ---------------------------------------------------------------------------
// Playstyles
// ---------------------------------------------------------------------------

// Confirmed: current Player Playstyle list — this is the single, primary
// "Playing Style" field shown on a card, distinct from AI Playing Styles.
export type PlayerPlaystyle =
  | 'goalPoacher'
  | 'foxInTheBox'
  | 'dummyRunner'
  | 'targetMan'
  | 'deepLyingForward'
  | 'creativePlaymaker'
  | 'holePlayer'
  | 'prolificWinger'
  | 'roamingFlank'
  | 'crossSpecialist'
  | 'classicNo10'
  | 'boxToBox'
  | 'orchestrator'
  | 'anchorMan'
  | 'destroyer'
  | 'buildUp'
  | 'offensiveFullBack'
  | 'defensiveFullBack'
  | 'fullBackFinisher'
  | 'extraFrontman'
  | 'defensiveGoalkeeper'
  | 'offensiveGoalkeeper';

// Confirmed: "AI Playing Styles" — a separate section on the card, distinct
// from the primary Playing Style above. First confirmed directly from the
// game client via Eden Hazard's card (2026-07-13): Trickster, Mazing Run,
// Speeding Bullet. This list is intentionally minimal and will grow
// incrementally as more cards are transcribed — do not assume it is complete.
export type AIPlaystyle =
  | 'trickster'
  | 'mazingRun'
  | 'speedingBullet';

// Confirmed: current Team Playstyle list.
export type TeamPlaystyle =
  | 'possessionGame'
  | 'quickCounter'
  | 'longBallCounter'
  | 'longBall'
  | 'outWide';

export interface TeamPlaystyleProficiency {
  teamPlaystyle: TeamPlaystyle;
  proficiency: number; // scale to be confirmed — not yet supplied
}

// ---------------------------------------------------------------------------
// Positions
// ---------------------------------------------------------------------------

// Confirmed: current position list.
export type Position =
  | 'CF'
  | 'SS'
  | 'LWF'
  | 'RWF'
  | 'AMF'
  | 'LMF'
  | 'RMF'
  | 'CMF'
  | 'DMF'
  | 'LB'
  | 'RB'
  | 'CB'
  | 'GK';

// Confirmed: position proficiency is a three-tier scale. `null` means the
// proficiency was not observed/visible on the transcribed card screen — it
// is data-quality metadata, not a fourth game-mechanic value. Never encode
// "unverified" as a proficiency level; use null instead.
export type PositionProficiencyLevel = 'low' | 'intermediate' | 'high';

export interface RegisteredPosition {
  position: Position;
  proficiency: PositionProficiencyLevel | null;
}

// ---------------------------------------------------------------------------
// Skills / Booster Skills
// ---------------------------------------------------------------------------

// DRAFT — confirm exact official skill list. Not yet supplied.
export type Skill = string;

// DRAFT — confirm exact official booster skill list and effect semantics.
export interface BoosterSkill {
  id: string;
  name: string;
  effect: string; // structured effect shape TBD once confirmed
}

// ---------------------------------------------------------------------------
// Progression
// ---------------------------------------------------------------------------

export interface ProgressionLevel {
  level: number;
  overallRating: number;
}

// ---------------------------------------------------------------------------
// Player Roles / Conditions
// ---------------------------------------------------------------------------

// DRAFT — confirm official Player Role list and how it differs from Playstyle.
export type PlayerRole = string;

// DRAFT — confirm official Condition list (e.g. Excellent, Good, Fatigued...).
export type Condition = string;

// ---------------------------------------------------------------------------
// Core Entities
// ---------------------------------------------------------------------------

export interface Player {
  id: string;
  name: string;
  source: string;      // provenance: 'konami' | 'community' | 'manual'
  sourceRef?: string;
}

export interface Card {
  id: string;
  playerId: string;
  edition: string;      // e.g. 'Epic', 'Big Time', 'Showtime'
  season: string;
  baseRarity: string | null;
  source: string;
  sourceRef?: string;
}

export interface CardStatRevision {
  id: string;
  cardId: string;
  attributes: AttributeBlock;
  primaryPlaystyle: PlayerPlaystyle | null;
  aiPlaystyles: AIPlaystyle[];
  registeredPositions: RegisteredPosition[];
  skills: Skill[];
  boosterSkills: BoosterSkill[];
  effectiveDate: string; // ISO date
  source: string;
  sourceRef?: string;
}

export interface Manager {
  id: string;
  name: string;
  preferredFormation: Formation;
  preferredTeamPlaystyles: TeamPlaystyle[];
  source: string;
  sourceRef?: string;
}

// DRAFT — confirm exact official formation list/shape (positions + spacing data).
export interface Formation {
  id: string;
  name: string;
  positions: Position[];
}

export interface Squad {
  formation: Formation;
  manager: Manager;
  players: Array<{
    player: Player;
    card: Card;
    cardStatRevision: CardStatRevision;
    assignedPosition: Position;
  }>;
}

// DRAFT — confirm what MatchContext actually needs to model (opponent info?
// match importance? none of this has been discussed yet).
export interface MatchContext {
  // placeholder — not yet specified
}