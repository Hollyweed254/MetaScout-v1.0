// packages/domain/src/index.ts
//
// Layer 1 — Domain Facts.
// Pure data types only. No football logic, no I/O, no framework dependencies.
// Every enum below marked DRAFT is a placeholder pending confirmation against
// the current eFootball version — do not treat as authoritative.

// ---------------------------------------------------------------------------
// Attributes
// ---------------------------------------------------------------------------

// DRAFT — confirm exact attribute list and naming against current game version.
export type Attribute =
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
  | 'ballWinning'
  | 'aggression'
  | 'defensiveEngagement'
  | 'gkAwareness'
  | 'gkCatching'
  | 'gkParrying'
  | 'gkReflexes'
  | 'gkReach';

export type AttributeBlock = Record<Attribute, number>;

// ---------------------------------------------------------------------------
// Playstyles
// ---------------------------------------------------------------------------

// DRAFT — confirm exact official Player Playstyle list (e.g. Hole Player,
// Box-to-Box, Anchor Man, Destroyer, etc.) against current game version.
export type PlayerPlaystyle = string;

// DRAFT — confirm exact official Team Playstyle list.
export type TeamPlaystyle = string;

export interface TeamPlaystyleProficiency {
  teamPlaystyle: TeamPlaystyle;
  proficiency: number; // scale to be confirmed
}

// ---------------------------------------------------------------------------
// Positions
// ---------------------------------------------------------------------------

// DRAFT — confirm exact official position list (e.g. CF, SS, AMF, CMF, DMF, ...).
export type Position = string;

export interface RegisteredPosition {
  position: Position;
  proficiency: number; // e.g. A/B/C or numeric — to be confirmed
}

// ---------------------------------------------------------------------------
// Skills / Booster Skills
// ---------------------------------------------------------------------------

// DRAFT — confirm exact official skill list.
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
  baseRarity: string;
  source: string;
  sourceRef?: string;
}

export interface CardStatRevision {
  id: string;
  cardId: string;
  attributes: AttributeBlock;
  playerPlaystyles: PlayerPlaystyle[];
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
