# API-Referenz

Alle Endpunkte sind unter `/api` erreichbar. Jeder Endpunkt:
- Validiert seinen Input mit **Zod** (400 bei ungültigen Daten)
- Prüft das **Rate Limit** (429 nach Überschreitung)
- Gibt im Fehlerfall `{ "error": "..." }` zurück

---

## Endpunkte

### `GET /api/admin/categories`


---

### `POST /api/admin/categories`


---

### `PATCH /api/admin/categories/[id]`


---

### `DELETE /api/admin/categories/[id]`


---

### `GET /api/admin/challenges`


---

### `POST /api/admin/challenges`


---

### `PATCH /api/admin/challenges/[id]`


---

### `DELETE /api/admin/challenges/[id]`


---

### `GET /api/admin/feedback`


---

### `GET /api/admin/feedback/suggestions`


---

### `PATCH /api/admin/feedback/suggestions/[id]`


---

### `PATCH /api/admin/feedback/[id]`


---

### `DELETE /api/admin/feedback/[id]`


---

### `POST /api/admin/login`


---

### `POST /api/admin/logout`


---

### `DELETE /api/admin/prompts/[id]`


---

### `GET /api/admin/stats`


---

### `GET /api/admin/users`


---

### `PATCH /api/admin/users/[id]`


---

### `DELETE /api/admin/users/[id]`


---

### `POST /api/auth/login`


---

### `POST /api/auth/logout`


---

### `GET /api/auth/me`

GET /api/auth/me Returns the currently authenticated user from the session cookie. Used by Server Components to bootstrap the user identity server-side.


---

### `POST /api/auth/register`


---

### `GET /api/categories`

GET /api/categories Returns all active prompt categories ordered by display order. Used by the Library filter, Submit form, and Admin panel.


---

### `GET /api/challenges`


---

### `GET /api/favorites`


---

### `POST /api/favorites`


---

### `GET /api/feedback/lesson`


---

### `POST /api/feedback/lesson`


---

### `PUT /api/feedback/lesson/[id]`


---

### `POST /api/feedback`


---

### `POST /api/feedback/suggestions`


---

### `GET /api/health`


---

### `GET /api/learn`


---

### `POST /api/learn/[moduleSlug]/[lessonSlug]/complete`

POST /api/learn/[moduleSlug]/[lessonSlug]/complete No body fields — the user comes from the session cookie. Marks a lesson as complete for the user and awards points (idempotent).


---

### `GET /api/learn/[moduleSlug]/[lessonSlug]`


---

### `GET /api/prompts`

**Query-Parameter:**
- category  – Filter by category name (omit or "all" = no filter)
- search    – Full-text search across title, titleEn, and content (max 50 results)
- userId    – When provided, includes the user's own vote and favorite status
- sortBy    – "newest" (default) | "most-used"
- cursor    – Prompt ID to paginate from (exclusive lower bound for newest; upper for most-used)
- take      – Number of results per page (default 20, max 50)


---

### `POST /api/prompts`

**Query-Parameter:**
- category  – Filter by category name (omit or "all" = no filter)
- search    – Full-text search across title, titleEn, and content (max 50 results)
- userId    – When provided, includes the user's own vote and favorite status
- sortBy    – "newest" (default) | "most-used"
- cursor    – Prompt ID to paginate from (exclusive lower bound for newest; upper for most-used)
- take      – Number of results per page (default 20, max 50)


---

### `GET /api/prompts/trending`

GET /api/prompts/trending Returns two lists for the Dashboard Trending widget: - hot: top 5 prompts by usageCount (most-used) - newest: top 5 prompts by createdAt (most-recent) Both lists include computed avgRating. Not user-specific (no userId param) so the response is publicly cacheable.


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
*Automatisch generiert am 03.07.2026, 06:34 · [Quellcode](https://github.com/your-org/prompt-arena)*
