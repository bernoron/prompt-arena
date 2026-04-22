#!/usr/bin/env node
/**
 * post-push-auto-tag.mjs
 *
 * PostToolUse Hook (Bash matcher) — liest stdin JSON von Claude Code,
 * prüft ob ein "git push origin main" ausgeführt wurde,
 * und ruft dann scripts/auto-tag.mjs auf.
 *
 * Loop-Schutz:
 *   - --no-verify Pushes werden ignoriert (sind vom auto-tag selbst)
 *   - --follow-tags Pushes werden ignoriert
 *   - Tag-Pushes (v1.2.3) werden ignoriert
 */

import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

// Stdin lesen (Claude Code übergibt JSON via stdin)
let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { raw += chunk; });
process.stdin.on('end', () => {
  try {
    const payload = JSON.parse(raw);
    const cmd = (payload?.tool_input?.command ?? '').trim();

    // Nur auf "git push ... main" reagieren
    const isPushToMain = /git\s+push\b.*\bmain\b/.test(cmd);
    // Ausschliessen: auto-tag's eigene Pushes + Tag-Pushes
    const isAutoTagPush = cmd.includes('--no-verify') || cmd.includes('--follow-tags');
    const isTagPush = /git\s+push\b.*v\d+\.\d+/.test(cmd);

    if (!isPushToMain || isAutoTagPush || isTagPush) {
      process.exit(0);
    }

    console.log('🏷️  Auto-Tagging nach Push…');
    execSync(`node ${resolve(ROOT, 'scripts/auto-tag.mjs')}`, {
      cwd: ROOT,
      stdio: 'inherit',
    });
  } catch (err) {
    // Nie den Push blockieren — stille Fehler
    if (err.message && !err.message.includes('HEAD bereits getaggt')) {
      process.stderr.write(`[auto-tag] Fehler: ${err.message}\n`);
    }
    process.exit(0);
  }
});
