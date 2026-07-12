// eslint.config.mjs
//
// Root-level flat config enforcing package boundary rules across
// packages/*. apps/web is intentionally excluded here — it has its own
// Next.js-specific eslint config and doesn't yet import any @metascout/*
// package (per M1 audit), so boundary enforcement for it is deferred to
// Milestone 5 when real cross-package imports begin there.

import tsParser from '@typescript-eslint/parser';
import { boundariesConfig } from './tooling/eslint-config/boundaries.mjs';

export default [
  {
    files: ['packages/*/src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
      },
    },
    ...boundariesConfig,
  },
];
