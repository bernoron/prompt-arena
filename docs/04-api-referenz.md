# API-Referenz

Alle Endpunkte sind unter `/api` erreichbar. Jeder Endpunkt:
- Validiert seinen Input mit **Zod** (400 bei ungültigen Daten)
- Prüft das **Rate Limit** (429 nach Überschreitung)
- Gibt im Fehlerfall `{ "error": "..." }` zurück

---

## Endpunkte

### `GET /api/admin/categories`

GET  /api/admin/categories  – List all categories POST /api/admin/categories  – Create a new category Protected by admin-session middleware.


---

### `POST /api/admin/categories`

GET  /api/admin/categories  – List all categories POST /api/admin/categories  – Create a new category Protected by admin-session middleware.


---

### `PATCH /api/admin/categories/[id]`

PATCH  /api/admin/categories/[id]  – Update a category DELETE /api/admin/categories/[id]  – Delete a category (only if no prompts reference it) Protected by admin-session middleware.


---

### `DELETE /api/admin/categories/[id]`

PATCH  /api/admin/categories/[id]  – Update a category DELETE /api/admin/categories/[id]  – Delete a category (only if no prompts reference it) Protected by admin-session middleware.


---

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

POST /api/admin/logout Clears the admin session cookie and returns { ok: true }. Rate-limited to prevent cookie-clearing spam.


---

### `DELETE /api/admin/prompts/[id]`


---

### `GET /api/admin/stats`

GET /api/admin/stats  – Aggregate statistics for the admin dashboard Protected by admin-session middleware (see middleware.ts). Rate-limited to prevent abuse of the heavy aggregation queries.


---

### `PATCH /api/admin/users/[id]`


---

### `DELETE /api/admin/users/[id]`


---

### `POST /api/auth/login`

POST /api/auth/login Body: { userId: number } Sets a signed HttpOnly `user_session` cookie for the given user. Called by UserPicker when the user selects or creates a profile.


---

### `POST /api/auth/logout`

POST /api/auth/logout Clears the user session cookie.


---

### `GET /api/auth/me`

GET /api/auth/me Returns the currently authenticated user from the session cookie. Used by Server Components to bootstrap the user identity server-side.


---

### `GET /api/categories`

GET /api/categories Returns all active prompt categories ordered by display order. Used by the Library filter, Submit form, and Admin panel.


---

### `GET /api/challenges`


---

### `GET /api/favorites`

GET  /api/favorites?userId=<id>  – Fetch all favorited prompts for a user POST /api/favorites               – Toggle a prompt as favorite (add / remove) POST body: { promptId: number, userId: number } Idempotent point distribution: The FIRST time a user favorites a prompt the prompt author receives FAVORITE_PROMPT points. Removing and re-adding a favorite does NOT award points again. We track this via the `pointsAwarded` flag on the Favorite row, which persists even after soft-deletion (isActive = false). Soft-delete pattern: Favorites are never hard-deleted. "Remove" sets isActive = false so the pointsAwarded history is preserved. "Add" sets isActive = true (upsert).


---

### `POST /api/favorites`

GET  /api/favorites?userId=<id>  – Fetch all favorited prompts for a user POST /api/favorites               – Toggle a prompt as favorite (add / remove) POST body: { promptId: number, userId: number } Idempotent point distribution: The FIRST time a user favorites a prompt the prompt author receives FAVORITE_PROMPT points. Removing and re-adding a favorite does NOT award points again. We track this via the `pointsAwarded` flag on the Favorite row, which persists even after soft-deletion (isActive = false). Soft-delete pattern: Favorites are never hard-deleted. "Remove" sets isActive = false so the pointsAwarded history is preserved. "Add" sets isActive = true (upsert).


---

### `GET /api/health`


---

### `GET /api/learn`

GET /api/learn?userId=<id> Returns all learning modules with lessons and per-user progress.


---

### `POST /api/learn/[moduleSlug]/[lessonSlug]/complete`

POST /api/learn/[moduleSlug]/[lessonSlug]/complete Body: { userId: number } Marks a lesson as complete for the user and awards points (idempotent).


---

### `GET /api/learn/[moduleSlug]/[lessonSlug]`

GET /api/learn/[moduleSlug]/[lessonSlug]?userId=<id> Returns lesson content, completion status, and prev/next navigation.


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
*Automatisch generiert am 27.06.2026, 15:36 · [Quellcode](https://github.com/your-org/prompt-arena)*
