// packages/domain/src/index.ts's RegisteredPosition is:
//   { position: Position; proficiency: PositionProficiencyLevel | null }
// confirmed compatible with this script's output.
//
// One-off script to parse a plain-text batch of transcribed eFootball cards
// and seed them into the schema via raw_import_cards staging, then normalize
// into players/cards/card_stat_revisions. Deliberately NOT reusable
// infrastructure — per project decision (2026-07-13), stays a one-off script
// until a second/third batch in a different format signals a real need to
// extract shared logic into packages/database.
//
// Schema notes (verified against migrations 20260713102009 and
// 20260713203011, 2026-07-13):
// - PLAYSTYLES: line is the single primary Playstyle (not an array).
// - AI_PLAYSTYLES: line is a comma-separated array, separate taxonomy.
// - RARITY: may be left blank in the input file — maps to null (base_rarity
//   is nullable per migration 20260713203011), never a guessed value.
// - POSITIONS: entries may optionally include a (proficiency) suffix, e.g.
//   "DMF(high)". Entries with no suffix (e.g. plain "SS") map to
//   proficiency: null, meaning "not observed," not a guessed value.
//
// Usage: node scripts/import-cards-batch.mjs <path-to-batch.txt>

import { readFileSync } from 'node:fs';
import pg from 'pg';

const { Client } = pg;

const [, , inputPath] = process.argv;
if (!inputPath) {
  console.error('Usage: node scripts/import-cards-batch.mjs <path-to-batch.txt>');
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Missing DATABASE_URL in environment.');
  process.exit(1);
}
const client = new Client({ connectionString });

function parseBatch(text) {
  const blocks = text.split(/^---$/m).map((b) => b.trim()).filter(Boolean);
  return blocks.map(parseBlock);
}

function parsePositionEntry(entry) {
  const trimmed = entry.trim();
  const match = trimmed.match(/^([A-Z]+)\(([a-zA-Z]+)\)$/);
  if (match) {
    return { position: match[1], proficiency: match[2] };
  }
  return { position: trimmed, proficiency: null };
}

function parseBlock(block) {
  const lines = block.split('\n').map((l) => l.trim());
  const card = {
    positions: [],
    primaryPlaystyle: null,
    aiPlaystyles: [],
    attributes: {},
    baseRarity: null,
  };
  let inAttributes = false;

  for (const line of lines) {
    if (line === '') continue;

    if (line === 'ATTRIBUTES:') {
      inAttributes = true;
      continue;
    }
    if (inAttributes && line.includes('=')) {
      const [key, value] = line.split('=').map((s) => s.trim());
      card.attributes[key] = Number(value);
      continue;
    }
    inAttributes = false;

    const [rawKey, ...rest] = line.split(':');
    const key = rawKey.trim();
    const value = rest.join(':').trim();

    switch (key) {
      case 'PLAYER':
        card.playerName = value;
        break;
      case 'EDITION':
        card.edition = value;
        break;
      case 'SEASON':
        card.season = value;
        break;
      case 'RARITY':
        card.baseRarity = value === '' ? null : value;
        break;
      case 'POSITIONS':
        card.positions = value ? value.split(',').map(parsePositionEntry) : [];
        break;
      case 'PLAYSTYLES':
        card.primaryPlaystyle = value === '' ? null : value.trim();
        break;
      case 'AI_PLAYSTYLES':
        card.aiPlaystyles = value ? value.split(',').map((p) => p.trim()) : [];
        break;
      case 'EFFECTIVE_DATE':
        card.effectiveDate = value;
        break;
      case 'SOURCE':
        card.source = value;
        break;
      default:
        break;
    }
  }

  return card;
}

async function findOrCreatePlayer(db, name, source) {
  const found = await db.query('select id from players where name = $1 limit 1', [name]);
  if (found.rowCount > 0) return found.rows[0].id;
  const created = await db.query(
    'insert into players (name, source) values ($1, $2) returning id',
    [name, source]
  );
  return created.rows[0].id;
}

async function importCard(parsedCard) {
  await client.query('begin');
  try {
    const rawInsert = await client.query(
      'insert into raw_import_cards (raw_payload) values ($1::jsonb) returning id',
      [JSON.stringify(parsedCard)]
    );
    const rawId = rawInsert.rows[0].id;

    const playerId = await findOrCreatePlayer(client, parsedCard.playerName, parsedCard.source);

    const cardInsert = await client.query(
      `insert into cards (player_id, edition, season, base_rarity, source)
       values ($1, $2, $3, $4, $5)
       returning id`,
      [
        playerId,
        parsedCard.edition,
        parsedCard.season,
        parsedCard.baseRarity,
        parsedCard.source,
      ]
    );
    const cardId = cardInsert.rows[0].id;

    await client.query(
      `insert into card_stat_revisions
         (card_id, attributes, primary_playstyle, ai_playstyles, registered_positions,
          skills, booster_skills, effective_date, source)
       values ($1, $2::jsonb, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb, $8, $9)`,
      [
        cardId,
        JSON.stringify(parsedCard.attributes),
        parsedCard.primaryPlaystyle,
        JSON.stringify(parsedCard.aiPlaystyles),
        JSON.stringify(parsedCard.positions),
        JSON.stringify([]),
        JSON.stringify([]),
        parsedCard.effectiveDate,
        parsedCard.source,
      ]
    );

    await client.query('update raw_import_cards set processed = true where id = $1', [rawId]);

    await client.query('commit');
    console.log(`✅ Imported: ${parsedCard.playerName} (${parsedCard.edition})`);
  } catch (err) {
    await client.query('rollback');
    throw err;
  }
}

async function main() {
  await client.connect();
  try {
    const text = readFileSync(inputPath, 'utf-8');
    const cards = parseBatch(text);
    console.log(`Parsed ${cards.length} card(s) from ${inputPath}\n`);

    for (const card of cards) {
      try {
        await importCard(card);
      } catch (err) {
        console.error(`❌ Failed to import ${card.playerName ?? 'unknown'}:`, err.message);
      }
    }
  } finally {
    await client.end();
  }
}

main();
