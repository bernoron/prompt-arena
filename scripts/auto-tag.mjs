#!/usr/bin/env node
/**
 * auto-tag.mjs – Automatisches Semver-Tagging nach Conventional Commits
 *
 * Wird von einem PostToolUse-Hook nach "git push origin main" aufgerufen.
 * Bestimmt den Bump-Typ aus Commit-Messages seit dem letzten Tag,
 * aktualisiert package.json, erstellt einen annotierten Tag und pusht ihn.
 *
 * Bump-Regeln (Conventional Commits):
 *   BREAKING CHANGE / !:  → major
 *   feat:                  → minor
 *   fix: / chore: / etc.   → patch
 *
 * Loop-Schutz: wenn HEAD bereits ein Tag hat → sofortiger Exit.
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function run(cmd, opts = {}) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], ...opts }).trim();
}

function runSafe(cmd) {
  try { return run(cmd); } catch { return ''; }
}

// ── Loop-Schutz: HEAD schon getaggt? ────────────────────────────────────────
const existingTag = runSafe('git describe --exact-match HEAD');
if (existingTag) {
  console.log(`ℹ️  HEAD bereits getaggt als ${existingTag} – nichts zu tun.`);
  process.exit(0);
}

// ── Letzten Tag ermitteln ────────────────────────────────────────────────────
const lastTag = runSafe('git describe --tags --abbrev=0');

// ── Commits seit letztem Tag ─────────────────────────────────────────────────
const logCmd = lastTag
  ? `git log ${lastTag}..HEAD --pretty=format:"%s"`
  : 'git log --pretty=format:"%s"';
const messages = run(logCmd).split('\n').filter(Boolean);

if (!messages.length) {
  console.log('ℹ️  Keine Commits seit letztem Tag – nichts zu releasen.');
  process.exit(0);
}

// ── Bump-Typ bestimmen ───────────────────────────────────────────────────────
let bumpType = 'patch';
for (const msg of messages) {
  if (/BREAKING.CHANGE|^[^:]+!:/.test(msg)) { bumpType = 'major'; break; }
  if (/^feat(\(.+\))?[!:]/.test(msg) && bumpType !== 'major') bumpType = 'minor';
}

// ── Version berechnen ────────────────────────────────────────────────────────
const pkgPath = resolve(ROOT, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const oldVersion = pkg.version;
const [maj, min, pat] = oldVersion.split('.').map(Number);

const newVersion =
  bumpType === 'major' ? `${maj + 1}.0.0` :
  bumpType === 'minor' ? `${maj}.${min + 1}.0` :
                         `${maj}.${min}.${pat + 1}`;

// ── package.json aktualisieren ───────────────────────────────────────────────
pkg.version = newVersion;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`📦 ${oldVersion} → ${newVersion} (${bumpType})`);

// ── Release-Commit (--no-verify: rein mechanisch, keine Logik-Änderung) ─────
run('git add package.json');
run(`git commit --no-verify -m "chore: release v${newVersion}"`);

// ── Annotierten Tag erstellen ────────────────────────────────────────────────
const tagBody = messages.map(m => `- ${m}`).join('\n');
const tagMsg = `Release v${newVersion}\n\n${tagBody}`;

// Tag-Message via Datei schreiben (vermeidet Shell-Escaping-Probleme)
const tagMsgPath = resolve(ROOT, '.git', 'TAG_MSG_TMP');
writeFileSync(tagMsgPath, tagMsg, 'utf8');
run(`git tag -a v${newVersion} -F .git/TAG_MSG_TMP`);

try {
  // Datei aufräumen (nicht kritisch)
  run('git rm -f .git/TAG_MSG_TMP 2>/dev/null || true');
} catch { /* ignore */ }

// ── Nur den Tag pushen (kein E2E-Rerun via pre-push) ────────────────────────
console.log(`🚀 Pushe v${newVersion}…`);
run(`git push origin v${newVersion}`);

// ── Auch den Release-Commit auf main pushen (ohne pre-push Hook) ─────────────
// Nutzt --no-verify damit nicht erneut E2E laufen
run('git push --no-verify origin main');

console.log(`🏷️  v${newVersion} getaggt und gepusht (${bumpType} bump)`);
console.log(`   Commits eingeschlossen: ${messages.length}`);
