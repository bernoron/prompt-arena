# Security-Audit PromptArena — Juli 2026

**Scope:** Gesamte Applikation (alle API-Routen, Middleware, Auth, Session-Handling,
Validierung, Security-Header, Dependencies, Deployment-Konfiguration).
**Kontext:** Die Applikation ist öffentlich im Internet erreichbar.
**Methodik:** Manuelles Code-Review entlang OWASP Top 10, `npm audit`,
Live-Verifikation der Fixes gegen den Produktions-Build.

---

## 1. Behobene Schwachstellen

### 1.1 Rate-Limit-Bypass über gefälschten `X-Forwarded-For`-Header (HOCH)

`getClientIp()` las den **ersten** Eintrag aus `X-Forwarded-For`. Dieser wird vom
Client mitgesendet — der Reverse-Proxy hängt die echte IP nur **hinten** an. Ein
Angreifer konnte damit pro Request eine neue Fake-IP senden und sämtliche Rate
Limits (inkl. Brute-Force-Schutz auf Login/Registrierung) umgehen.

**Fix** (`lib/rate-limit.ts`): Vertrauensreihenfolge `Fly-Client-IP` →
`CF-Connecting-IP` → `X-Real-IP` → **letzter** XFF-Hop → `unknown`.

### 1.2 Speicher-Erschöpfung im Rate-Limiter (MITTEL)

Der In-Memory-Store wuchs unbegrenzt: rotierende (gefälschte) Keys erzeugten
unbegrenzt Map-Einträge, abgelaufene Einträge wurden nie entfernt → Memory-DoS.

**Fix** (`lib/rate-limit.ts`): Periodischer Sweep abgelaufener Keys (max. 1× pro
Fenster) + harte Obergrenze von 10 000 Keys mit Eviction. Durch Unit-Test abgedeckt
(25 000 rotierende Keys → Limiter bleibt funktionsfähig).

### 1.3 User-Session-Token ohne Ablauf (MITTEL)

Der Session-Cookie (`{userId}.{sig}`) hatte **keinen serverseitigen Ablauf**. Das
Browser-`Max-Age` (30 Tage) ist keine Sicherheitsgrenze — ein gestohlenes Token
blieb für immer gültig.

**Fix** (`lib/user-session.ts`): Neues Token-Format `{userId}.{issuedAt}.{sig}`;
Signatur deckt den Timestamp ab; Verify lehnt Tokens ab, die älter als 30 Tage
sind oder ein Zukunfts-Datum tragen. Alt-Tokens (2-teilig) werden abgelehnt —
bestehende Nutzer müssen sich einmalig neu anmelden.

### 1.4 Log-Injection über `x-request-id` (NIEDRIG)

Route-Handler lasen `x-request-id` aus dem **Request** — also client-kontrolliert.
Beliebige Werte landeten in Server-Logs (Log-Spoofing/-Injection).

**Fix** (`middleware.ts`): Die Middleware generiert die Request-ID und
**überschreibt** den eingehenden Header, bevor der Request die Handler erreicht.

### 1.5 Fehlende Rate Limits (NIEDRIG)

Vier Handler hatten kein Rate Limit (Verstoss gegen die Projekt-Regel
„Rate Limiting auf jedem Route-Handler"):

| Route | Risiko | Fix |
|---|---|---|
| `GET /api/health` | DB-Query pro Aufruf → billige DoS-Verstärkung | `readLimiter` |
| `GET /api/admin/users` | entschlüsselt alle E-Mails pro Aufruf | `readLimiter` |
| `GET /api/admin/challenges` | ungebremste DB-Reads | `readLimiter` |
| `POST /api/auth/logout` | Request-Flooding | `writeLimiter` |

### 1.6 CSP- und Angriffsflächen-Härtung (NIEDRIG)

- `object-src 'none'` zur CSP ergänzt (blockiert `<object>`/`<embed>`).
- Next.js Image-Optimizer deaktiviert (`images.unoptimized: true`) — die App
  nutzt kein `next/image`; der `/_next/image`-Endpunkt (Ziel mehrerer bekannter
  DoS-Advisories) entfällt damit komplett.

### 1.7 Verwundbare Dependencies (MITTEL)

`npm audit fix` (non-breaking) angewendet: u.a. **undici** (7 Advisories: TLS-Bypass,
Header-Injection, Response-Queue-Poisoning) und **vite** (Path Traversal,
Arbitrary File Read im Dev-Server) aktualisiert. 20 → 6 offene Findings.

---

## 2. Geprüft und für solide befunden

- **Auth-Flows:** scrypt-Passwort-Hashing mit Salt, timing-safe Vergleiche,
  Dummy-Hash gegen User-Enumeration, HMAC-signierte HttpOnly-Cookies
  (`Secure`, `SameSite=strict`), Auth-Limiter 10/15 min.
- **Autorisierung:** Middleware-Guard + In-Handler-`requireAdmin` (Defence in
  Depth); `resolveUserId` bindet jede Schreiboperation an die Session (kein IDOR);
  Self-Vote serverseitig verboten.
- **Input-Validierung:** Zod auf allen POST/PATCH-Bodies, Längenlimits,
  Pfad-/Query-ID-Validierung, Namens-Regex gegen Stored-XSS. Kein
  `dangerouslySetInnerHTML`/`eval` im gesamten Frontend.
- **Datenschutz:** E-Mails AES-256-GCM-verschlüsselt + HMAC-Blind-Index; öffentliche
  Endpunkte selektieren PII/Credentials explizit **nicht**; Fehlerdetails werden
  Clients nie gezeigt.
- **Betrieb:** Startup-Abbruch bei fehlenden Secrets (`instrumentation.ts`),
  Docker-Container läuft als Non-Root-User, keine Secrets im Repo (`.env` ignoriert,
  nur `.env.example` mit Platzhaltern), Seed legt Dev-Accounts nur ausserhalb von
  Produktion an, `db:reset` in Produktion gesperrt.

---

## 3. Restrisiken & Empfehlungen

| # | Restrisiko | Empfehlung | Priorität |
|---|---|---|---|
| 1 | **Framework-/Dependency-Advisories** können zwischen Releases neu auftauchen und müssen vor jedem Deploy sichtbar werden | Umgesetzt: `npm run security:deps` blockt High/Critical-Advisories in Produktionsabhängigkeiten in CI; Dependabot erstellt wöchentliche PRs für npm- und GitHub-Actions-Updates. Next-Upgrades weiter als eigene Change Requests behandeln. | Hoch |
| 2 | CSP enthält `script-src 'unsafe-inline'` (von Next.js-Hydration benötigt) | Nonce-basierte CSP via Middleware evaluieren (erfordert dynamisches Rendering aller Seiten) | Mittel |
| 3 | Admin-Sessions stateless → kein serverseitiger Widerruf vor 7-Tage-Ablauf | Bei Bedarf: Token-Denylist in DB/Redis; kurzfristig `ADMIN_SECRET` rotieren (invalidiert alle Admin-Sessions sofort) | Mittel |
| 4 | Rate Limiter prozesslokal | Bei Multi-Replica-Deployment auf Redis-basierten Limiter wechseln | Niedrig (aktuell Single Instance) |
| 5 | Verbleibende `npm audit`-Findings: `esbuild`/`glob` (nur Dev-Toolchain, nicht im Produktions-Bundle), `next`/`postcss` (siehe #1) | Mit dem Next-Upgrade erledigen | Niedrig |
| 6 | `ADMIN_SECRET` ist ein geteiltes Passwort ohne Benutzerbindung | Für Mehr-Admin-Betrieb: echte Admin-Accounts oder SSO | Niedrig |

---

## 4. Verifikation

- `npm run test:unit`: **110/110 bestanden** (inkl. 7 neuer Security-Tests für
  IP-Ermittlung, Limiter-Bounding, Token-Ablauf, Legacy-Token-Ablehnung)
- `npm run security:deps`: CI-Gate für High/Critical-Advisories in Produktionsabhängigkeiten
- `npm run test:e2e`: **17/17 bestanden** (Produktions-Standalone-Build)
- Live-Verifikation gegen den Produktions-Build: Security-Header vollständig,
  Auth-Limiter greift nach 10 Versuchen (429), neues Session-Format aktiv,
  Legacy-Token → 401.
