// packages/engine/tests/centralMidfieldProgressionWeakness.test.ts
//
// Milestone 2 exit criteria: prove (a) same input -> same output
// (determinism), and (b) the engine performs zero I/O even under mocked
// fetch/process.env.

import { describe, it, expect, vi } from 'vitest';
import { analyzeSquad } from '../src/index';
import type { Squad, AttributeBlock, Attribute } from '@metascout/domain';

const ALL_ATTRIBUTES: Attribute[] = [
  'offensiveAwareness', 'ballControl', 'dribbling', 'tightPossession',
  'lowPass', 'loftedPass', 'finishing', 'heading', 'setPieceTaking', 'curl',
  'speed', 'acceleration', 'kickingPower', 'jump', 'physicalContact',
  'balance', 'stamina', 'defensiveAwareness', 'tackling', 'aggression',
  'defensiveEngagement', 'gkAwareness', 'gkCatching', 'gkParrying',
  'gkReflexes', 'gkReach',
];

function buildAttributeBlock(overrides: Partial<AttributeBlock> = {}): AttributeBlock {
  const base = {} as AttributeBlock;
  for (const attr of ALL_ATTRIBUTES) {
    base[attr] = 70;
  }
  return { ...base, ...overrides };
}

function buildSquad(midfielderAttributeOverrides: Partial<AttributeBlock>): Squad {
  return {
    formation: { id: 'f1', name: '4-2-3-1', positions: ['GK', 'LB', 'CB', 'CB', 'RB', 'DMF', 'DMF', 'AMF', 'LMF', 'RMF', 'CF'] },
    manager: {
      id: 'm1', name: 'Test Manager',
      preferredFormation: { id: 'f1', name: '4-2-3-1', positions: [] },
      preferredTeamPlaystyles: ['possessionGame'],
      source: 'manual',
    },
    players: [
      {
        player: { id: 'p1', name: 'Test DMF', source: 'manual' },
        card: { id: 'c1', playerId: 'p1', edition: 'Base', season: '2026', baseRarity: 'common', source: 'manual' },
        cardStatRevision: {
          id: 'rev1', cardId: 'c1',
          attributes: buildAttributeBlock(midfielderAttributeOverrides),
          playerPlaystyles: [], registeredPositions: [], skills: [], boosterSkills: [],
          effectiveDate: '2026-01-01', source: 'manual',
        },
        assignedPosition: 'DMF',
      },
    ],
  };
}

describe('analyzeSquad — Central Midfield Progression Weakness', () => {
  it('is deterministic: identical input produces identical output', () => {
    const squad = buildSquad({ lowPass: 60, ballControl: 60, tightPossession: 60, balance: 60, dribbling: 60, physicalContact: 60 });
    const result1 = analyzeSquad({ squad });
    const result2 = analyzeSquad({ squad });
    expect(result1).toEqual(result2);
  });

  it('detects a weakness when central midfield attributes are low', () => {
    const squad = buildSquad({ lowPass: 50, ballControl: 50, tightPossession: 50, balance: 50, dribbling: 50, physicalContact: 50 });
    const result = analyzeSquad({ squad });
    expect(result.findings[0].detected).toBe(true);
    expect(result.findings[0].confidence).toBeGreaterThan(0);
  });

  it('does not detect a weakness when central midfield attributes are strong', () => {
    const squad = buildSquad({ lowPass: 95, ballControl: 95, tightPossession: 95, balance: 95, dribbling: 95, physicalContact: 95 });
    const result = analyzeSquad({ squad });
    expect(result.findings[0].detected).toBe(false);
    expect(result.findings[0].confidence).toBe(0);
  });

  it('returns detected: false with explanatory evidence when no central midfielders exist', () => {
    const squad = buildSquad({});
    squad.players[0].assignedPosition = 'CB';
    const result = analyzeSquad({ squad });
    expect(result.findings[0].detected).toBe(false);
    expect(result.findings[0].confidence).toBe(0);
    expect(result.findings[0].evidence[0].description).toContain('No players are registered');
  });

  it('performs zero I/O: never touches fetch or process.env even if both are mocked to throw', () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn(() => { throw new Error('engine must never call fetch'); }) as any;
    const envSpy = vi.spyOn(process, 'env', 'get').mockImplementation(() => {
      throw new Error('engine must never read process.env');
    });

    const squad = buildSquad({ lowPass: 70, ballControl: 70, tightPossession: 70, balance: 70, dribbling: 70, physicalContact: 70 });
    expect(() => analyzeSquad({ squad })).not.toThrow();

    global.fetch = originalFetch;
    envSpy.mockRestore();
  });

  it('populates ruleSetVersion and cardRevisionIds', () => {
    const squad = buildSquad({});
    const result = analyzeSquad({ squad });
    expect(result.ruleSetVersion).toBe('0.1.0');
    expect(result.cardRevisionIds['p1']).toBe('rev1');
  });
});
