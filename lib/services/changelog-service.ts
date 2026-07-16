/**
 * Reads the "what got built" feed for the public landing page directly from
 * CHANGELOG.md — the file Release Please already regenerates from
 * Conventional Commits on every release (specs/technical/99-pipeline.md), so
 * this needs no new database table or manual upkeep.
 *
 * @spec AC-13-008 — parsing is a pure function so it stays unit-testable
 * without touching the filesystem or a fixed CHANGELOG.md snapshot.
 */

import { readFile } from 'fs/promises';
import path from 'path';
import { cached } from '@/lib/cache';

export interface RecentFeature {
  version: string;
  date: string;
  /** Conventional Commit scope, e.g. "landing" — shown as a technical label, not translated. */
  scope: string | null;
  description: string;
}

const VERSION_HEADING = /^##\s+\[?([\w.-]+)\]?(?:\([^)]*\))?\s*\((\d{4}-\d{2}-\d{2})\)/;
const SECTION_HEADING = /^###\s+(.+)$/;
const BULLET = /^\*\s+(.*)$/;
const SCOPED_DESCRIPTION = /^\*\*([^*:]+):\*\*\s*(.*)$/;

/**
 * Extracts entries listed under "### Features" headings, newest release
 * first (the file's own order), stopping once `limit` entries are found.
 */
export function parseChangelogFeatures(markdown: string, limit: number): RecentFeature[] {
  const entries: RecentFeature[] = [];
  let version = '';
  let date = '';
  let inFeaturesSection = false;

  // Normalise CRLF → LF first: JS regex `.` treats `\r` as a line terminator,
  // so a trailing `\r` (this repo's CHANGELOG.md is CRLF) silently breaks the
  // `$`-anchored heading/bullet matches below otherwise.
  for (const line of markdown.replace(/\r\n/g, '\n').split('\n')) {
    if (entries.length >= limit) break;

    const versionMatch = VERSION_HEADING.exec(line);
    if (versionMatch) {
      [, version, date] = versionMatch;
      inFeaturesSection = false;
      continue;
    }

    const sectionMatch = SECTION_HEADING.exec(line);
    if (sectionMatch) {
      inFeaturesSection = sectionMatch[1].trim().toLowerCase() === 'features';
      continue;
    }

    if (!inFeaturesSection) continue;

    const bulletMatch = BULLET.exec(line);
    if (!bulletMatch) continue;

    // Strip the trailing commit/issue links, e.g. " ([#47](...)) ([hash](...))".
    const text = bulletMatch[1].replace(/\s*\(\[.*$/, '').trim();
    if (!text) continue;

    const scopedMatch = SCOPED_DESCRIPTION.exec(text);
    entries.push({
      version,
      date,
      scope: scopedMatch ? scopedMatch[1] : null,
      description: scopedMatch ? scopedMatch[2] : text,
    });
  }

  return entries;
}

const CACHE_KEY_PREFIX = 'changelog:recent-features:';
const TTL_MS = 10 * 60_000; // CHANGELOG.md only changes on deploy — a long TTL just saves repeat disk reads.

/**
 * The most recently shipped features, newest first, for the anonymous
 * landing page. Degrades to an empty list (NFR-AVAIL-003) if CHANGELOG.md is
 * missing or unreadable in a given deployment, instead of failing the page.
 */
// @spec AC-13-008
export async function getRecentFeatures(limit: number): Promise<RecentFeature[]> {
  return cached(`${CACHE_KEY_PREFIX}${limit}`, TTL_MS, async () => {
    try {
      const filePath = path.join(process.cwd(), 'CHANGELOG.md');
      const markdown = await readFile(filePath, 'utf-8');
      return parseChangelogFeatures(markdown, limit);
    } catch {
      return [];
    }
  });
}
