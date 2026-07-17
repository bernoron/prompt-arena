/**
 * Reads the public landing page's "Neuigkeiten" feed directly from the specs
 * themselves — the spec is already the source of truth for what a feature
 * does (specs/constitution.md), so it stays the source of truth for how a
 * feature gets announced too, instead of a second, hand-maintained list.
 *
 * A spec/CR opts in by adding one line:
 *   **Nutzer-Ankündigung**: YYYY-MM-DD | Kurzer Titel | Ein erklärender Satz.
 * Specs without this line (the default — internal refactors, security
 * fixes, this feature's own CRs) simply don't show up.
 *
 * @spec AC-13-008 (CR-007) — parsing is a pure function so it stays
 * unit-testable against fixture strings without touching the filesystem.
 */

import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { cached } from '@/lib/cache';

export interface FeatureAnnouncement {
  date: string;
  title: string;
  description: string;
}

const ANNOUNCEMENT_LINE = /\*\*Nutzer-Ankündigung\*\*:\s*(\d{4}-\d{2}-\d{2})\s*\|\s*([^|]+?)\s*\|\s*(.+?)\s*$/m;

/**
 * Extracts the single announcement line from one spec/CR file's content, if
 * present. CRLF is normalised first — JS regex treats `\r` as a line
 * terminator, so a `$`-anchored match silently fails on a CRLF file
 * otherwise (the same bug found and fixed for CHANGELOG.md parsing in CR-005).
 */
export function parseAnnouncement(markdown: string): FeatureAnnouncement | null {
  const match = ANNOUNCEMENT_LINE.exec(markdown.replace(/\r\n/g, '\n'));
  if (!match) return null;
  const [, date, title, description] = match;
  return { date, title: title.trim(), description: description.trim() };
}

const SPEC_DIRS = ['specs/business', 'specs/changes'];
const CACHE_KEY_PREFIX = 'feature-announcements:recent:';
const TTL_MS = 10 * 60_000; // Specs only change on deploy — a long TTL just saves repeat disk reads.

async function readAllAnnouncements(): Promise<FeatureAnnouncement[]> {
  const results: FeatureAnnouncement[] = [];

  for (const dir of SPEC_DIRS) {
    const dirPath = path.join(process.cwd(), dir);
    let files: string[];
    try {
      files = await readdir(dirPath);
    } catch {
      continue; // Degrade gracefully (NFR-AVAIL-003) if a spec dir is missing in a given deployment.
    }

    for (const file of files) {
      if (!file.endsWith('.md') || file.startsWith('_')) continue; // skip _template.md etc.
      try {
        const content = await readFile(path.join(dirPath, file), 'utf-8');
        const announcement = parseAnnouncement(content);
        if (announcement) results.push(announcement);
      } catch {
        // Skip an unreadable individual file rather than failing the whole page.
      }
    }
  }

  return results;
}

/**
 * The most recently announced features, newest first, for the anonymous
 * landing page.
 */
// @spec AC-13-008
export async function getRecentFeatureAnnouncements(limit: number): Promise<FeatureAnnouncement[]> {
  return cached(`${CACHE_KEY_PREFIX}${limit}`, TTL_MS, async () => {
    const all = await readAllAnnouncements();
    all.sort((a, b) => b.date.localeCompare(a.date));
    return all.slice(0, limit);
  });
}
