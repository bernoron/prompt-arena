# API-Referenz

Alle Endpunkte sind unter `/api` erreichbar. Jeder Endpunkt:
- Validiert seinen Input mit **Zod** (400 bei ungültigen Daten)
- Prüft das **Rate Limit** (429 nach Überschreitung)
- Gibt im Fehlerfall `{ "error": "..." }` zurück

---

## Endpunkte

### `GET /api/admin/challenges`


---

### `POST /api/admin/challenges`


---

### `PATCH /api/admin/challenges/[id]`


---

### `DELETE /api/admin/challenges/[id]`


---

### `POST /api/admin/login`


---

### `POST /api/admin/logout`


---

### `DELETE /api/admin/prompts/[id]`


---

### `GET /api/admin/stats`


---

### `PATCH /api/admin/users/[id]`


---

### `DELETE /api/admin/users/[id]`


---

### `GET /api/challenges`


---

### `GET /api/health`


---

### `GET /api/prompts`

GET  /api/prompts   – Fetch all prompts (with optional filters) POST /api/prompts   – Create a new prompt GET query params: category  – Filter by category name (omit or "all" = no filter) search    – Full-text search across title, titleEn, and content userId    – When provided, includes the user's own vote on each prompt

**Query-Parameter:**
- category  – Filter by category name (omit or "all" = no filter)
- search    – Full-text search across title, titleEn, and content
- userId    – When provided, includes the user's own vote on each prompt


---

### `POST /api/prompts`

GET  /api/prompts   – Fetch all prompts (with optional filters) POST /api/prompts   – Create a new prompt GET query params: category  – Filter by category name (omit or "all" = no filter) search    – Full-text search across title, titleEn, and content userId    – When provided, includes the user's own vote on each prompt

**Query-Parameter:**
- category  – Filter by category name (omit or "all" = no filter)
- search    – Full-text search across title, titleEn, and content
- userId    – When provided, includes the user's own vote on each prompt


---

### `POST /api/usage`

POST /api/usage Records that the current user copied and used a prompt. Increments the prompt's usageCount and awards PROMPT_USED points to the prompt's author (not the user pressing the button). Body: { promptId: number }


---

### `GET /api/users`

GET  /api/users   – List all users ordered by points (for Leaderboard / UserPicker) POST /api/users   – Register a new user (self-registration) POST body: { name: string, department: string }


---

### `POST /api/users`

GET  /api/users   – List all users ordered by points (for Leaderboard / UserPicker) POST /api/users   – Register a new user (self-registration) POST body: { name: string, department: string }


---

### `GET /api/users/[id]`


---

### `POST /api/votes`

POST /api/votes Records or updates a star rating (1–5) for a prompt. Uses an upsert so a user can change their vote at any time. Awards VOTE_ON_PROMPT points only for the FIRST vote (not for updates). Body: { promptId: number, userId: number, value: number }


---

## Fehler-Codes

| HTTP-Status | Bedeutung |
|---|---|
| 400 | Ungültige Eingabe (Validierungsfehler, Details im `error`-Feld) |
| 404 | Ressource nicht gefunden |
| 429 | Zu viele Anfragen (Rate Limit überschritten) |
| 500 | Interner Serverfehler |

## Datums-Format
Alle Timestamps werden als **ISO 8601** Strings zurückgegeben, z.B. `"2024-03-15T14:30:00.000Z"`.



---
*Automatisch generiert am 15.03.2026, 21:04 · [Quellcode](https://github.com/your-org/prompt-arena)*
