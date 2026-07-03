# PromptArena – Deployment Guide

Dieser Leitfaden beschreibt, wie du PromptArena **sicher und kostengünstig**
produktiv ins Internet bringst.

> **Kernentscheidung vorab – die Datenbank.**
> PromptArena nutzt **SQLite** (eine Datei auf der Festplatte). Das ist
> wartungsarm und kostenlos, **erfordert aber persistenten Speicher**. Klassische
> Serverless-Hoster (Vercel, Netlify Functions) haben ein flüchtiges Dateisystem
> – dort würde die Datenbank bei jedem Deploy **gelöscht**. Du hast zwei Wege:
>
> 1. **SQLite behalten** → auf einer Plattform mit Volume deployen
>    (Fly.io oder eigener VPS). **Empfohlen, am günstigsten.** → Option A / B
> 2. **Auf Postgres wechseln** → dann ist auch Vercel möglich. → Option C

---

## 0. Pre-Go-Live-Checkliste

- [ ] Starke Secrets generiert (siehe unten) und beim Hoster als Secret hinterlegt
      – **niemals** im Code oder in `.env` committen.
- [ ] Dependency-Security-Gate ist grün: `npm run security:deps`.
- [ ] `ADMIN_SECRET` gesetzt (Admin-Login-Passwort, ≥ 32 Zeichen).
- [ ] `USER_SECRET` gesetzt (HMAC-Signaturschlüssel, ≥ 32 Zeichen).
- [ ] `EMAIL_SECRET` gesetzt (E-Mail-Verschlüsselung, ≥ 32 Zeichen).
- [ ] `DATABASE_URL` zeigt auf den **persistenten** Pfad / die Remote-DB.
- [ ] `NODE_ENV=production`.
- [ ] Migrationen laufen beim Start (über `docker-entrypoint.sh` automatisch).
- [ ] Lerninhalte **einmalig** geseedet (siehe Abschnitt 4 – destruktiv!).
- [ ] `GET /api/health` liefert `200 {status:"ok"}`.
- [ ] HTTPS erzwungen (Plattform-TLS oder Caddy).
- [ ] Backup der DB-Datei eingerichtet (Abschnitt 5).

### Secrets generieren

```bash
# USER_SECRET (32 Byte hex):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ADMIN_SECRET (Admin-Passwort, z.B. 32 Zeichen base64url):
node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"

# EMAIL_SECRET (32 Byte hex):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Beim Start prüft `instrumentation.ts` die Konfiguration und **warnt im Log**,
wenn Secrets fehlen oder zu schwach sind. Fehlende Secrets führen zur Laufzeit
zu `503` bei Login/Schreibaktionen (fail-closed) – die App startet trotzdem.

---

## Option A – Fly.io  (empfohlen: günstig, SQLite, wenig Ops)

Fly.io führt den Docker-Container mit einem **persistenten Volume** aus. Ideal
für SQLite. Mit `auto_stop_machines` skaliert die App bei Leerlauf auf null →
Kosten oft **~2–4 USD/Monat** (Volume + minimale Compute), bei wenig Traffic
teils im kostenlosen Rahmen.

Die fertige Konfiguration liegt in [`fly.toml`](fly.toml).

```bash
# 1. Fly CLI installieren: https://fly.io/docs/flyctl/install/
fly auth login

# 2. App anlegen (ohne Deploy), App-Namen in fly.toml anpassen
fly launch --no-deploy --copy-config --name dein-prompt-arena

# 3. Persistentes Volume für die SQLite-DB (gleiche Region wie die App!)
fly volumes create data --size 1 --region fra

# 4. Secrets setzen (werden verschlüsselt gespeichert, nicht im Image)
fly secrets set \
  ADMIN_SECRET="$(node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))")" \
  USER_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" \
  EMAIL_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"

# 5. Deploy – migrate deploy läuft automatisch beim Containerstart
fly deploy

# 6. Lerninhalte einmalig seeden (destruktiv – nur auf leerer DB!)
fly ssh console -C "node node_modules/prisma/build/index.js db seed" || \
  fly ssh console   # dann manuell: npx tsx prisma/seed.ts
```

> **Wichtig:** Genau **eine** Maschine laufen lassen. SQLite kann nicht über
> mehrere Instanzen geteilt werden. `min_machines_running = 0` + eine Maschine
> ist korrekt; **nicht** horizontal skalieren ohne vorher auf Postgres zu
> wechseln (Option C).

---

## Option B – Eigener VPS + Docker + Caddy  (maximale Kontrolle, ~4–5 €/Mt.)

Z.B. Hetzner CX22 (~4 €/Monat) oder vergleichbar. Du bekommst volle Kontrolle
und die günstigsten Fixkosten, dafür etwas mehr Wartung.

```bash
# Auf dem Server (Docker + Compose vorausgesetzt):
git clone <repo> prompt-arena && cd prompt-arena

# Secrets als Umgebungsdatei (chmod 600, NICHT ins Repo):
cat > .env.production <<'EOF'
NODE_ENV=production
DATABASE_URL=file:/data/prod.db
ADMIN_SECRET=__hier_einsetzen__
USER_SECRET=__hier_einsetzen__
EMAIL_SECRET=__hier_einsetzen__
LOG_LEVEL=info
EOF
chmod 600 .env.production
```

`docker-compose.yml` (Minimalbeispiel):

```yaml
services:
  app:
    build: .
    restart: always
    env_file: .env.production
    volumes:
      - prompt-data:/data        # persistente SQLite-DB
    expose:
      - "3000"
  caddy:                          # TLS-Terminierung (Let's Encrypt automatisch)
    image: caddy:2-alpine
    restart: always
    ports: ["80:80", "443:443"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy-data:/data
volumes:
  prompt-data:
  caddy-data:
```

`Caddyfile`:

```
deine-domain.example.com {
    reverse_proxy app:3000
}
```

```bash
docker compose up -d --build
# Migrationen laufen automatisch im Entrypoint.
# Einmalig seeden:
docker compose exec app npx tsx prisma/seed.ts
```

---

## Option C – Vercel + Neon Postgres  (serverless, wenn kein Volume gewünscht)

Wenn du serverless deployen willst, **muss** die DB extern liegen. Neon und
Supabase bieten kostenlose Postgres-Tiers.

1. `prisma/schema.prisma` Datasource umstellen:
   ```prisma
   datasource db {
     provider = "postgresql"   // statt "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
2. Migrationen für Postgres neu erzeugen (die bestehenden SQLite-Migrationen
   sind nicht 1:1 kompatibel):
   ```bash
   rm -rf prisma/migrations
   DATABASE_URL="postgres://…neon…" npx prisma migrate dev --name init
   ```
3. Auf Vercel `DATABASE_URL`, `ADMIN_SECRET`, `USER_SECRET`, `EMAIL_SECRET` als Environment
   Variables setzen.
4. **Achtung:** Der In-Memory-Ratelimiter (`lib/rate-limit.ts`) zählt pro
   Instanz. Auf Serverless mit vielen Lambdas ist das Limit faktisch wirkungslos
   → für ernsthaften Schutz einen geteilten Store (z.B. Upstash Redis) ergänzen.

Trade-off: bequemes Autoscaling, aber zusätzliche Komplexität und potenziell
höhere Kosten als Option A/B bei kleinem Nutzerkreis.

---

## 4. Datenbank seeden (Lerninhalte)

`prisma/seed.ts` befüllt Lernmodule, Beispiel-Prompts, User und eine Challenge.

> ⚠️ **Destruktiv:** Das Skript löscht zuerst **alle** Tabelleninhalte. Nur auf
> einer **leeren** Produktionsdatenbank ausführen, danach nie wieder.

Für eine Produktionsumgebung empfiehlt sich, das Skript so anzupassen, dass es
nur die Lerninhalte (Module/Lektionen) anlegt und keine Demo-User/-Prompts –
oder die Demo-Daten nach dem ersten Seed manuell zu entfernen.

---

## 5. Backups (nur SQLite-Optionen A/B)

Die gesamte Datenbank ist **eine Datei**. Backup = Datei kopieren.

```bash
# Konsistenter Snapshot trotz laufender Schreibzugriffe (WAL-Mode ist aktiv):
sqlite3 /data/prod.db ".backup '/data/backup-$(date +%F).db'"
```

- Fly.io: per Cron im Container oder `fly ssh` + `fly sftp get` regelmässig ziehen.
- VPS: täglicher Cronjob, der den Snapshot auf externen Speicher (S3/Backblaze) kopiert.
- Bewahre mindestens 7 tägliche Kopien auf.

---

## 6. Nach dem Deploy verifizieren

```bash
curl -s https://deine-domain/api/health          # → {"status":"ok","dbMs":...}
```

- [ ] `/` lädt, User-Auswahl funktioniert.
- [ ] Registrierung legt User an, doppelter Name → `409`.
- [ ] `/admin/login` mit `ADMIN_SECRET` → Zugriff; falsches Passwort → `401`.
- [ ] Prompt einreichen / bewerten / favorisieren funktioniert.
- [ ] Logs zeigen `startup config check passed` (keine `startup config error`).

---

## 7. Sicherheits-Hinweise (Stand des Audits)

**Bereits umgesetzt:** Security-Header inkl. CSP (`next.config.mjs`),
HttpOnly/SameSite-Cookies, HMAC-signierte User-Sessions, timing-safe
Admin-Vergleich, Zod-Validierung + Rate-Limiting auf allen Routen,
serverseitige Selbst-Vote-Sperre, Health-Endpoint ohne Fehler-Leak,
keine Secrets im Image (`.dockerignore`).

**Bewusste Einschränkungen (kein Blocker, ggf. später):**
- Rate-Limiter ist In-Memory (pro Instanz) – ausreichend bei einer Instanz.
- `POST /api/usage` kann pro Aufruf Punkte vergeben; bei Missbrauchsverdacht
  später eine „einmal pro User"-Regel als Change Request ergänzen.

> Aktueller Stand des Auth-Modells (E-Mail + Passwort, signierte Sessions) und
> des vollständigen Security-Audits: siehe `docs/SECURITY-AUDIT-2026-07.md`.

### Leak-Audit – Ergebnis

Gezielte Prüfung auf Daten-/Secret-Lecks. **Keine kritischen Lecks gefunden.**

Verifiziert *sauber*:
- **Keine Secrets in der Git-History** (alle Treffer sind Platzhalter/Doku); weder
  `.env` noch `*.db` wurden je committet. Passwörter sind gehasht (scrypt) und
  E-Mails verschlüsselt (AES-256-GCM) gespeichert – nie im Klartext.
- **Keine `NEXT_PUBLIC_`-Variablen** → es gelangt keine Server-Konfiguration in den
  Browser. Alle `ADMIN_SECRET`/`USER_SECRET`-Zugriffe liegen in Server-Modulen.
- **Keine Browser-Source-Maps** im Build, **kein `public/`-Verzeichnis**, keine
  hartkodierten Keys/Tokens im Code.
- Admin-Endpunkte sind durch die Middleware geschützt; `/api/health` und Fehlerpfade
  geben **keine internen Details/Stacktraces** an Clients zurück.
- `Cache-Control: public` steht **nur** auf nicht-personalisierten Antworten
  (Leaderboard, Trending, Kategorien); nutzer-spezifische Antworten (Favoriten,
  personalisierte Prompts) werden **nicht** gecacht.
- CSP `connect-src 'self'` begrenzt Daten-Exfiltration auf dieselbe Origin.
- Behoben in diesem Audit: `x-powered-by` deaktiviert (Fingerprinting),
  `productionBrowserSourceMaps: false` explizit gesetzt.

⚠️ **Wichtig bei Nicht-Docker-Builds:** `next build` mit `output: standalone` kopiert
eine vorhandene `.env` nach `.next/standalone/.env`. Wer **ohne** Docker deployt
(z.B. `.next/standalone/` manuell auf einen Server kopiert), würde damit
Produktions-Secrets mitschleppen. Der Docker-Weg in dieser Anleitung ist sicher
(`.dockerignore` schliesst `.env` **und** `.next` aus, der Build läuft frisch im
Image). Für manuelle Builds: Secrets ausschliesslich über echte Umgebungsvariablen
setzen und `.next/standalone/.env` vor dem Ausliefern löschen.

**Privacy-Hinweis:** `GET /api/favorites?userId=` / `GET /api/prompts?userId=` akzeptieren
`userId` als Query-Parameter, aber die zurückgegebenen `userVote`/`userFavorite`-Felder
werden serverseitig gegen die signierte Session validiert (kein IDOR über den Parameter).
