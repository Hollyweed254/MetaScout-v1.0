// scripts/check-boundaries.mjs
//
// Custom package-boundary checker, replacing eslint-plugin-boundaries after
// it was found to silently fail to detect real violations across three
// separate configuration attempts (see project history / ADR notes). This
// script is deliberately simple: a regex-based import scan rather than a
// full AST parse or third-party plugin, so its behavior can be read and
// verified directly rather than trusted opaquely.
//
// It enforces the dependency-direction table in ARCHITECTURE.md.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const PACKAGES_DIR = join(ROOT, 'packages');

// Mirrors the Package Table in docs/architecture/ARCHITECTURE.md exactly.
// Update both places together if this table changes.
const ALLOWED_DEPENDENCIES = {
  domain: [],
  contracts: ['domain'],
  rules: ['domain'],
  engine: ['domain', 'rules'],
  explanation: ['domain', 'rules'],
  services: ['database', 'engine', 'explanation', 'contracts', 'domain'],
  database: ['domain', 'config'],
  config: [],
  sdk: ['contracts'],
  ui: ['contracts'],
  shared: [],
};

const IMPORT_PATTERN = /from\s+['"]@metascout\/([a-zA-Z0-9_-]+)['"]/g;

function walkTsFiles(dir, results = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walkTsFiles(fullPath, results);
    } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

function getOwningPackage(filePath) {
  const rel = relative(PACKAGES_DIR, filePath);
  const parts = rel.split(/[\\/]/);
  return parts[0];
}

function main() {
  const violations = [];
  const packageDirs = readdirSync(PACKAGES_DIR).filter((name) => {
    const p = join(PACKAGES_DIR, name, 'src');
    try {
      return statSync(p).isDirectory();
    } catch {
      return false;
    }
  });

  for (const pkgName of packageDirs) {
    const srcDir = join(PACKAGES_DIR, pkgName, 'src');
    const files = walkTsFiles(srcDir);

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      const matches = [...content.matchAll(IMPORT_PATTERN)];

      for (const match of matches) {
        const importedPkg = match[1];
        if (importedPkg === pkgName) continue; // self-import, irrelevant

        const allowed = ALLOWED_DEPENDENCIES[pkgName] ?? [];
        if (!allowed.includes(importedPkg)) {
          violations.push({
            file: relative(ROOT, file),
            from: pkgName,
            importedPkg,
          });
        }
      }
    }
  }

  if (violations.length > 0) {
    console.error('\n❌ Package boundary violations found:\n');
    for (const v of violations) {
      console.error(
        `  ${v.file}\n    "@metascout/${v.from}" is not allowed to import from "@metascout/${v.importedPkg}"\n`,
      );
    }
    console.error(
      `${violations.length} violation(s) found. See docs/architecture/ARCHITECTURE.md for the allowed dependency table.\n`,
    );
    process.exit(1);
  }

  console.log('✅ No package boundary violations found.');
  process.exit(0);
}

main();
