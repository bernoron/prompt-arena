# Betriebsdokumentation (DevOps)

## 1. Überblick

PromptArena ist eine **Next.js 14 Monolith-Anwendung** mit eingebettetem SQLite-Datenbankfile.
Kein separater Datenbankserver erforderlich.

| Eigenschaft | Wert |
|---|---|
| Laufzeitumgebung | Node.js ≥ 18 |
| Datenbank | SQLite (Dev: `prisma/dev.db` / Prod: `/data/prod.db`) |
| Port | 3000 (konfigurierbar via `PORT`) |
| Health-Endpoint | `GET /api/health` |
| Docker-Image | `node:20-alpine` (Multi-Stage-Build) |

---

## 2. Umgebungsvariablen

Alle Variablen in `.env` definieren. Vorlage: `.env.example` (liegt im Repository).

| Variable | Standard | Beschreibung |
|---|---|---|
| `DATABASE_URL` | `file:./dev.db` | Database SQLite (default for local development): |
| `ADMIN_PATH` | `` | Admin URL path (optional — hides the admin panel behind a secret URL) Default: admin  → admin panel is at /admin Custom:  ADMIN_PATH=backstage → admin panel is at /backstage, direct /admin returns 404 Use a random string in production to prevent enumeration |
| `ADMIN_SECRET` | `` | Admin authentication (for the admin panel) Set any strong password here |
| `ADMIN_SESSION_EPOCH` | `` | Optional: instantly revoke ALL admin sessions issued before this millisecond timestamp (without rotating ADMIN_SECRET) |
| `USER_SECRET` | `` | User session signing (for cookie-based auth) REQUIRED in production |
| `EMAIL_SECRET` | `` | Email encryption key (for AES-256-GCM email storage) REQUIRED in production |
| `RESEND_API_KEY` | `` | Outbound e-mail (password reset — CR-003) — provider: Resend Without RESEND_API_KEY the app uses a "log" transport: reset e-mails are written to the server log instead of being delivered (fine for dev/test) |
| `MAIL_FROM` | `PromptArena <onboarding@resend.dev>` | Outbound e-mail (password reset — CR-003) — provider: Resend Without RESEND_API_KEY the app uses a "log" transport: reset e-mails are written to the server log instead of being delivered (fine for dev/test) |

> **Wichtig:** `.env` ist in `.gitignore` – niemals committen.

---

## 3. Erster Start (Bare Metal)

```bash
git clone https://github.com/bernoron/prompt-arena.git
cd prompt-arena
npm install
npm run setup:hooks          # Git-Hook für Doku-Regenerierung aktivieren
cp .env.example .env         # .env editieren: DATABASE_URL + ADMIN_SECRET setzen
npm run db:migrate
npm run db:seed               # optional: Beispieldaten laden
npm run build
npm run start                 # → http://localhost:3000
```

---

## 4. Docker-Deployment

### docker-compose (empfohlen)

```bash
# Starten
ADMIN_SECRET=mein-geheimes-passwort docker compose up -d

# Logs verfolgen
docker compose logs -f

# Stoppen
docker compose down

# Stoppen + alle Daten löschen (Achtung: unwiderruflich!)
docker compose down -v
```

### HEALTHCHECK

Eingebaut im Dockerfile (`--interval=30s --timeout=5s --start-period=10s --retries=3`):

```
GET /api/health
→ 200  { "status": "ok",    "dbMs": 3,  "ts": "2026-03-15T12:00:00.000Z" }
→ 503  { "status": "error", "error": "...", "ts": "..." }
```

---

## 5. Admin-Bereich

`/admin` ist durch ein Passwort geschützt (Cookie-basierte Session, kein User-Login nötig).

### Einrichten

```bash
# Sicheres Passwort generieren (≥ 32 Zeichen empfohlen):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# → Wert in .env als ADMIN_SECRET eintragen, dann App neu starten
```

### Technischer Ablauf

| Schritt | Detail |
|---|---|
| Login | `POST /api/admin/login` mit Passwort im JSON-Body |
| Session | HttpOnly-Cookie `admin_session` (SHA-256 des Secrets, 7 Tage gültig) |
| Guard | Edge Middleware prüft Cookie bei jedem `/admin/*` und `/api/admin/*` Request |
| Logout | `POST /api/admin/logout` löscht Cookie → Redirect auf Login-Seite |

> Ohne `ADMIN_SECRET` in `.env` gibt der Login-Endpoint **HTTP 503** zurück.

---

## 6. Logging

Gesteuert über `LOG_LEVEL` in `.env`:

| Level | Ausgabe | Empfohlen für |
|---|---|---|
| `debug` | Alles inkl. SQL-Queries | Lokales Debugging |
| `info` | Business-Events + Request-Traces | Staging |
| `warn` | Nur Warnungen + Fehler | Produktion |
| `error` | Nur Fehler | Kritische Produktion |

- **Entwicklung** → farbige ANSI-Ausgabe im Terminal
- **Produktion** → JSON-Lines (ein JSON-Objekt pro Zeile), kompatibel mit Loki, Datadog, CloudWatch

Jeder Request erhält einen eindeutigen `x-request-id`-Header zur Log-Korrelation (sichtbar in Browser-DevTools → Network → Response Headers).

---

## 7. Rate Limiting

| Limiter | Max. Anfragen | Zeitfenster | Gilt für |
|---|---|---|---|
| `writeLimiter` | 30 | 60 Sekunden | POST / PATCH / DELETE |
| `readLimiter` | 120 | 60 Sekunden | GET |
| `authLimiter` | 10 | 15 Minuten | Login / Registrierung / Admin-Login |

Bei Überschreitung: **HTTP 429** mit `{ "error": "Too many requests" }`.

Die Client-IP wird über vertrauenswürdige Proxy-Header ermittelt (`Fly-Client-IP`,
`CF-Connecting-IP`, `X-Real-IP`, sonst letzter `X-Forwarded-For`-Hop). Der
In-Memory-Store ist auf 10 000 Keys gedeckelt und räumt abgelaufene Einträge
periodisch auf — ein Angreifer kann den Speicher nicht durch rotierende
Fake-IPs erschöpfen.

> **Hinweis:** Prozesslokal (In-Memory) — bei mehreren App-Instanzen muss ein Redis-Adapter eingesetzt werden.

---

## 8. Datenbank

### Migrationen

```bash
# Neue Migration ausführen (nach schema.prisma-Änderung)
npm run db:migrate

# Datenbank zurücksetzen + neu seeden (NUR DEV!)
npm run db:reset
```

Vorhandene Migrationen:

- `20260314210555_init`
- `20260315194108_add_performance_indexes`
- `20260316111241_add_favorites`
- `20260418200230_add_learning_path`
- `20260430100000_user_unique_name_favorite_soft_delete`
- `20260501120000_add_prompt_category`
- `20260628062941_add_feedback_models`
- `20260628084928_add_password_hash`
- `20260628090125_add_email_fields`
- `20260628193000_add_usage_events`
- `20260702200000_remove_department`
- `20260703053000_add_points_ledger`
- `20260707113759_add_onboarding_completed_at`
- `20260708191608_add_account_deletion_and_password_reset`

### Backup (SQLite)

```bash
# Lokal – Datei kopieren
cp prisma/dev.db backups/dev-$(date +%Y%m%d-%H%M%S).db

# Docker – aus Volume exportieren
docker run --rm -v prompt-arena-data:/data -v $(pwd)/backups:/backup \
  alpine cp /data/prod.db /backup/prod-$(date +%Y%m%d).db
```

### Skalierung auf PostgreSQL

1. `prisma/schema.prisma`: `provider = "postgresql"` setzen
2. `DATABASE_URL` auf Postgres-Connection-String ändern
3. `npm run db:migrate` — Prisma migriert automatisch

---

## 9. Monitoring & Uptime

| Probe | Endpoint | Erwartete Antwort |
|---|---|---|
| Liveness | `GET /api/health` | HTTP 200, `status: "ok"` |
| Readiness | `GET /api/health` | HTTP 200, `dbMs < 200` |

Empfohlene externe Uptime-Monitore (alle mit Gratis-Tier verfügbar): **UptimeRobot**, **BetterStack**, **StatusCake** — Polling alle 5 Minuten konfigurieren.

---

## 10. Deployment-Checkliste

- [ ] `ADMIN_SECRET` ist gesetzt und ≥ 32 Zeichen lang
- [ ] `DATABASE_URL` zeigt auf persistentes Volume (nicht `./dev.db`)
- [ ] `LOG_LEVEL=warn` oder `error` gesetzt
- [ ] `NODE_ENV=production` gesetzt
- [ ] `npm run build` läuft ohne Fehler durch
- [ ] `GET /api/health` gibt HTTP 200 zurück
- [ ] Datenbank-Backup vor dem Deployment vorhanden
- [ ] `.env` ist **nicht** im Git-Commit enthalten



---
*Automatisch generiert am 16.07.2026, 23:20 · [Quellcode](https://github.com/your-org/prompt-arena)*
