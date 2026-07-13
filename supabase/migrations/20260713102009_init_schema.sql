-- Milestone 3: initial schema for players, cards, card_stat_revisions, and
-- raw import staging. Matches packages/domain/src/index.ts exactly — see
-- docs/architecture/DATABASE.md for the reasoning behind this three-level
-- Player -> Card -> CardStatRevision model.

create extension if not exists "pgcrypto";

create table players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source text not null,
  source_ref text,
  created_at timestamptz not null default now()
);

create table cards (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  edition text not null,
  season text not null,
  base_rarity text not null,
  source text not null,
  source_ref text,
  created_at timestamptz not null default now()
);

create index idx_cards_player_id on cards(player_id);

-- attributes, player_playstyles, registered_positions, skills, and
-- booster_skills are stored as jsonb to match packages/domain's
-- AttributeBlock / PlayerPlaystyle[] / RegisteredPosition[] / Skill[] /
-- BoosterSkill[] shapes exactly, without needing a schema migration every
-- time Konami adds a new attribute or playstyle.
create table card_stat_revisions (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references cards(id) on delete cascade,
  attributes jsonb not null,
  player_playstyles jsonb not null default '[]'::jsonb,
  registered_positions jsonb not null default '[]'::jsonb,
  skills jsonb not null default '[]'::jsonb,
  booster_skills jsonb not null default '[]'::jsonb,
  effective_date date not null,
  source text not null,
  source_ref text,
  created_at timestamptz not null default now()
);

-- Supports the "stats as of date X" query pattern documented in DATABASE.md:
-- latest revision per card is the one with the greatest effective_date.
create index idx_card_stat_revisions_card_id_effective_date
  on card_stat_revisions(card_id, effective_date desc);

-- Raw import staging: external/transcribed data lands here first, unmodified,
-- before a separate normalization step maps it into the real schema above.
-- This means a malformed transcription never corrupts real tables, and
-- imports are replayable if normalization logic has a bug.
create table raw_import_cards (
  id uuid primary key default gen_random_uuid(),
  raw_payload jsonb not null,
  imported_at timestamptz not null default now(),
  processed boolean not null default false
);
