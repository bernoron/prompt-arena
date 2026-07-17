import { describe, it, expect } from 'vitest';
import { parseAnnouncement } from '../../../lib/services/feature-announcements-service';

describe('parseAnnouncement', () => {
  it('extracts date, title, and description from a well-formed line', () => {
    const md = `# CR-004: Nutzer können beim Einreichen neue Kategorien erstellen

Some content here.

**Nutzer-Ankündigung**: 2026-07-16 | Eigene Kategorien erstellen | Beim Einreichen eines Prompts kannst du jetzt direkt eine neue Kategorie anlegen.

More content.
`;
    expect(parseAnnouncement(md)).toEqual({
      date: '2026-07-16',
      title: 'Eigene Kategorien erstellen',
      description: 'Beim Einreichen eines Prompts kannst du jetzt direkt eine neue Kategorie anlegen.',
    });
  });

  it('returns null when the file has no announcement line (the default/opt-out case)', () => {
    const md = `# CR-001: Framework-Upgrade Next.js 14 → 16 (Security)

Internal security upgrade, no user-visible change.
`;
    expect(parseAnnouncement(md)).toBeNull();
  });

  it('handles CRLF line endings (this repo checks specs out with CRLF on Windows)', () => {
    const md = '# Title\r\n\r\n**Nutzer-Ankündigung**: 2026-07-01 | Titel | Text hier.\r\n';
    expect(parseAnnouncement(md)).toEqual({
      date: '2026-07-01',
      title: 'Titel',
      description: 'Text hier.',
    });
  });

  it('trims surrounding whitespace around title and description', () => {
    const md = '**Nutzer-Ankündigung**:   2026-07-01   |   Titel mit Leerzeichen   |   Text mit Leerzeichen.   \n';
    expect(parseAnnouncement(md)).toEqual({
      date: '2026-07-01',
      title: 'Titel mit Leerzeichen',
      description: 'Text mit Leerzeichen.',
    });
  });

  it('takes the first announcement line when a file somehow has more than one', () => {
    const md = `**Nutzer-Ankündigung**: 2026-07-01 | Erster | Text A.\n**Nutzer-Ankündigung**: 2026-07-02 | Zweiter | Text B.\n`;
    expect(parseAnnouncement(md)?.title).toBe('Erster');
  });
});
