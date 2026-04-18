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

### `GET /api/favorites`


---

### `POST /api/favorites`


---

### `GET /api/health`


---

### `GET /api/prompts`

**Query-Parameter:**
- category  – Filter by category name (omit or "all" = no filter)
- search    – Full-text search across title, titleEn, and content
- userId    – When provided, includes the user's own vote on each prompt


---

### `POST /api/prompts`

**Query-Parameter:**
- category  – Filter by category name (omit or "all" = no filter)
- search    – Full-text search across title, titleEn, and content
- userId    – When provided, includes the user's own vote on each prompt


---

### `POST /api/usage`


---

### `GET /api/users`


---

### `POST /api/users`


---

### `GET /api/users/[id]`


---

### `POST /api/votes`


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
*Automatisch generiert am 18.04.2026, 21:32 · [Quellcode](https://github.com/your-org/prompt-arena)*
