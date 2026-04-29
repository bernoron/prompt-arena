/**
 * Spec-Compliance Test: Keine hardcodierten Punktwerte
 *
 * Stellt sicher, dass alle Punktwerte aus lib/points.ts gelesen werden
 * und nirgendwo als Magic Number im UI-Code stehen.
 *
 * Wenn dieser Test fehlschlägt:
 *   1. Suche die gemeldete Datei
 *   2. Ersetze die hardcodierte Zahl durch POINTS.XXXX aus lib/points.ts
 *   3. Importiere POINTS falls nötig: import { POINTS } from '@/lib/points'
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { POINTS } from '../../../lib/points';

const ROOT = resolve(__dirname, '../../..');

/** Dateien, die Punktwerte definieren dürfen */
const ALLOWED = [
  'lib/points.ts',
  'lib/constants.ts',
  'tests/unit/spec-compliance/no-hardcoded-points.test.ts',
  'scripts/',
  'docs/',
  'specs/',
  '.next/',
  'node_modules/',
];

function isAllowed(filePath: string): boolean {
  const rel = filePath.replace(ROOT, '').replace(/\\/g, '/').replace(/^\//, '');
  return ALLOWED.some((a) => rel.startsWith(a));
}

function collectFiles(dir: string, exts: string[]): string[] {
  const result: string[] = [];
  let entries: string[];
  try { entries = readdirSync(dir); } catch { return result; }

  for (const entry of entries) {
    if (entry.startsWith('.')) continue;
    const full = join(dir, entry);
    let stat;
    try { stat = statSync(full); } catch { continue; }

    if (stat.isDirectory()) {
      result.push(...collectFiles(full, exts));
    } else if (exts.some((e) => entry.endsWith(e))) {
      result.push(full);
    }
  }
  return result;
}

const UI_FILES = [
  ...collectFiles(join(ROOT, 'app'), ['.tsx', '.ts']),
  ...collectFiles(join(ROOT, 'components'), ['.tsx', '.ts']),
].filter((f) => !isAllowed(f));

describe('Spec-Compliance: Keine hardcodierten Punktwerte im UI-Code', () => {
  for (const [key, value] of Object.entries(POINTS)) {
    it(`POINTS.${key} (${value}) darf nicht als "+${value}" hardcodiert sein`, () => {
      const violations: string[] = [];

      for (const file of UI_FILES) {
        const content = readFileSync(file, 'utf8');
        // Suche nach Mustern wie: '+1000', "+1000", `+1000`, >+1000<
        const pattern = new RegExp(
          `(['"\`]\\+${value}['"\`])|>\\+${value}[^0-9]|(\\+${value} Punkte)`
        );
        if (pattern.test(content)) {
          const rel = file.replace(ROOT, '').replace(/\\/g, '/');
          violations.push(rel);
        }
      }

      if (violations.length > 0) {
        const hint = `\n  → Ersetze durch: POINTS.${key} aus lib/points.ts\n  → Betroffene Dateien:\n${violations.map((v) => `     ${v}`).join('\n')}`;
        expect(violations, hint).toEqual([]);
      }
    });
  }
});
