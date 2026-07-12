// tooling/eslint-config/boundaries.mjs
//
// Enforces the package dependency-direction table in ARCHITECTURE.md at the
// import level. This does NOT enforce ADR-0002's rule that packages/rules
// must never accept Formation/Manager/Squad as parameters — that is a
// type-level constraint eslint-plugin-boundaries cannot express (rules
// legitimately imports from domain, which is where those types live). That
// rule remains enforced by code review and interface design, not CI.

import boundaries from 'eslint-plugin-boundaries';

export const boundariesConfig = {
  plugins: { boundaries },
  settings: {
    'boundaries/include': ['packages/*/src/**/*.ts'],
    'boundaries/elements': [
      { type: 'domain', pattern: 'packages/domain/src/**' },
      { type: 'contracts', pattern: 'packages/contracts/src/**' },
      { type: 'rules', pattern: 'packages/rules/src/**' },
      { type: 'engine', pattern: 'packages/engine/src/**' },
      { type: 'explanation', pattern: 'packages/explanation/src/**' },
      { type: 'services', pattern: 'packages/services/src/**' },
      { type: 'database', pattern: 'packages/database/src/**' },
      { type: 'config', pattern: 'packages/config/src/**' },
      { type: 'sdk', pattern: 'packages/sdk/src/**' },
      { type: 'ui', pattern: 'packages/ui/src/**' },
      { type: 'shared', pattern: 'packages/shared/src/**' },
    ],
  },
  rules: {
    'boundaries/element-types': [
      2,
      {
        default: 'disallow',
        rules: [
          { from: 'domain', allow: [] },
          { from: 'contracts', allow: ['domain'] },
          { from: 'rules', allow: ['domain'] },
          { from: 'engine', allow: ['domain', 'rules'] },
          { from: 'explanation', allow: ['domain', 'rules'] },
          { from: 'services', allow: ['database', 'engine', 'explanation', 'contracts'] },
          { from: 'database', allow: ['domain', 'config'] },
          { from: 'config', allow: [] },
          { from: 'sdk', allow: ['contracts'] },
          { from: 'ui', allow: ['contracts'] },
          { from: 'shared', allow: [] },
        ],
      },
    ],
  },
};
