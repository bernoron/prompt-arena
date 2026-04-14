# Feature: Admin-Panel

## Metadaten
- **Status**: `implemented`
- **Feature-Nr**: 07
- **Letzte Änderung**: 2026-04-13

---

## User Story
Als Admin will ich Prompts, Challenges und Benutzer verwalten können, damit die Plattform qualitativ hochwertig und sauber bleibt.

---

## Akzeptanzkriterien

- [x] **AC-07-001**: Admin kann sich mit Passwort einloggen (POST /api/admin/login)
- [x] **AC-07-002**: Admin kann sich ausloggen (POST /api/admin/logout)
- [x] **AC-07-003**: Alle /admin/* Routen sind ohne gültigen Session-Cookie nicht erreichbar
- [x] **AC-07-004**: Admin sieht Dashboard mit Statistiken (Gesamt-User, Prompts, Votes, Challenges)
- [x] **AC-07-005**: Admin kann alle Prompts sehen, bearbeiten und löschen
- [x] **AC-07-006**: Admin kann Challenges erstellen, aktivieren und beenden
- [x] **AC-07-007**: Admin kann Benutzer einsehen und verwalten
- [x] **AC-07-008**: Admin-Layout hat Sidebar (keine User-Navigation)

---

## API-Vertrag

### POST /api/admin/login
**Body**: `{ password: string }`
**Response 200**: `{ ok: true }` + setzt HttpOnly-Cookie `admin_session`
**Response 401**: `{ error: "Ungültiges Passwort" }`

### POST /api/admin/logout
**Response 200**: `{ ok: true }` + löscht Cookie

### GET /api/admin/stats
**Response 200**: `{ users: number, prompts: number, votes: number, challenges: number }`

### GET /api/admin/prompts
**Response 200**: alle Prompts mit Autor-Info

### PUT /api/admin/prompts/[id]
**Body**: Partial Prompt-Felder
**Response 200**: aktualisierter Prompt

### DELETE /api/admin/prompts/[id]
**Response 204**: kein Body

### GET/POST /api/admin/challenges
**GET**: alle Challenges
**POST**: Challenge erstellen

### PUT /api/admin/challenges/[id]
Aktivieren/Beenden/Bearbeiten

### GET/PUT /api/admin/users/[id]
Benutzer-Details + Verwaltung

---

## Datenmodell
Kein eigenes Modell — Admin ist ein einzelner User via Umgebungsvariable.

```env
ADMIN_PASSWORD=secret     # in .env
ADMIN_SESSION_SECRET=...  # für Cookie-Signierung
```

---

## UI-Verhalten

### Layout: Admin-Sidebar
- Sidebar mit Links: Übersicht, Prompts, Challenges, Benutzer
- Kein UserPicker, keine normale Navigation
- Logout-Button in Sidebar

### Seite: `/admin/login`
- Einfaches Passwort-Formular
- Bei Fehler: Fehlermeldung in Rot

### Seite: `/admin` (Dashboard)
- 4 Stat-Karten: User, Prompts, Votes, Challenges
- Schnellzugriff-Links

### Middleware: `middleware.ts`
- Prüft Cookie `admin_session` auf allen `/admin/*` Routen (außer `/admin/login`)
- Redirect zu `/admin/login` wenn kein gültiger Cookie

---

## Punkte-Impact
Keine Punkte für Admin-Aktionen.

---

## Tests

### E2E
- Login: falsches Passwort → Fehlermeldung
- Login: korrektes Passwort → Redirect zu /admin
- Guard: /admin ohne Cookie → Redirect zu /admin/login
- Dashboard: Statistiken sichtbar

### Unit
- Keine (Admin-Auth ist HTTP-Cookie-basiert, nicht unit-testbar ohne Mocks)
