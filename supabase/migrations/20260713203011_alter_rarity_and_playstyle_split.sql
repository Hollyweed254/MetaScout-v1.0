-- Milestone 3 follow-up: base_rarity nullable, and card_stat_revisions split
-- into primary_playstyle + ai_playstyles, following real-card transcription
-- discovering both were required (Eden Hazard, 2026-07-13). See domain
-- package for the corresponding TypeScript type changes.

alter table cards
  alter column base_rarity drop not null;

alter table card_stat_revisions
  rename column player_playstyles to primary_playstyle_legacy;

alter table card_stat_revisions
  add column primary_playstyle text,
  add column ai_playstyles jsonb not null default '[]'::jsonb;

alter table card_stat_revisions
  drop column primary_playstyle_legacy;
