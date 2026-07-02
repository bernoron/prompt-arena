# API-Referenz

Alle Endpunkte sind unter `/api` erreichbar. Jeder Endpunkt:
- Validiert seinen Input mit **Zod** (400 bei ungültigen Daten)
- Prüft das **Rate Limit** (429 nach Überschreitung)
- Gibt im Fehlerfall `{ "error": "..." }` zurück

---

## Endpunkte

### `PATCH /api/admin/categories/[id]`

PATCH  /api/admin/categories/[id]  – Update a category DELETE /api/admin/categories/[id]  – Delete a category (only if no prompts reference it) Protected by admin-session middleware.


---

### `DELETE /api/admin/categories/[id]`

PATCH  /api/admin/categories/[id]  – Update a category DELETE /api/admin/categories/[id]  – Delete a category (only if no prompts reference it) Protected by admin-session middleware.


---

### `GET /api/admin/categories`

GET  /api/admin/categories  – List all categories POST /api/admin/categories  – Create a new category Protected by admin-session middleware.


---

### `POST /api/admin/categories`

GET  /api/admin/categories  – List all categories POST /api/admin/categories  – Create a new category Protected by admin-session middleware.


---

### `PATCH /api/admin/challenges/[id]`

PATCH  /api/admin/challenges/[id]  – Toggle isActive, update fields, or award a winner DELETE /api/admin/challenges/[id]  – Delete a challenge


---

### `DELETE /api/admin/challenges/[id]`

PATCH  /api/admin/challenges/[id]  – Toggle isActive, update fields, or award a winner DELETE /api/admin/challenges/[id]  – Delete a challenge


---

### `GET /api/admin/challenges`

GET  /api/admin/challenges  – List all challenges POST /api/admin/challenges  – Create a new challenge


---

### `POST /api/admin/challenges`

GET  /api/admin/challenges  – List all challenges POST /api/admin/challenges  – Create a new challenge


---

### `PATCH /api/admin/feedback/[id]`

PATCH  /api/admin/feedback/[id] – Mark feedback as done DELETE /api/admin/feedback/[id] – Delete feedback entry


---

### `DELETE /api/admin/feedback/[id]`

PATCH  /api/admin/feedback/[id] – Mark feedback as done DELETE /api/admin/feedback/[id] – Delete feedback entry


---

### `GET /api/admin/feedback`

GET /api/admin/feedback – List all feedback entries (admin only) Query params: contextType – filter by GENERAL | LESSON | PROMPT status      – filter by OPEN | DONE


---

### `PATCH /api/admin/feedback/suggestions/[id]`

PATCH /api/admin/feedback/suggestions/[id] – Update suggestion status


---

### `GET /api/admin/feedback/suggestions`

GET /api/admin/feedback/suggestions – List all topic suggestions (admin only)


---

### `POST /api/admin/login`

POST /api/admin/login Body: { password: string } On success sets an HttpOnly `admin_session` cookie and returns { ok: true }. On failure returns 401.


---

### `POST /api/admin/logout`

POST /api/admin/logout Clears the admin session cookie and returns { ok: true }. Rate-limited to prevent cookie-clearing spam.


---

### `DELETE /api/admin/prompts/[id]`

DELETE /api/admin/prompts/[id]  – Remove a prompt and all related data


---

### `GET /api/admin/stats`

GET /api/admin/stats  – Aggregate statistics for the admin dashboard Protected by admin-session middleware (see middleware.ts). Rate-limited to prevent abuse of the heavy aggregation queries.


---

### `PATCH /api/admin/users/[id]`

PATCH  /api/admin/users/[id]  – Adjust points / reset level DELETE /api/admin/users/[id]  – Delete user and all their data


---

### `DELETE /api/admin/users/[id]`

PATCH  /api/admin/users/[id]  – Adjust points / reset level DELETE /api/admin/users/[id]  – Delete user and all their data


---

### `GET /api/admin/users`

GET /api/admin/users Returns all users with decrypted email addresses. Protected by the middleware admin guard AND a secondary in-handler check (defence in depth — middleware can be bypassed by misconfiguration). @spec AC-12-006


---

### `POST /api/auth/login`

POST /api/auth/login Body: { email: string, password: string } Verifies the user's password and sets a signed HttpOnly `user_session` cookie. Email lookup uses the HMAC-SHA256 blind index so plaintext is never queried.


---

### `POST /api/auth/logout`

POST /api/auth/logout Clears the user session cookie. Rate-limited like every other route handler to prevent request-flooding abuse.


---

### `GET /api/auth/me`

GET /api/auth/me Returns the currently authenticated user from the session cookie. Used by Server Components to bootstrap the user identity server-side.


---

### `POST /api/auth/register`

POST /api/auth/register Body: { name: string, email: string, password: string } Creates a new user account and sets a signed session cookie (auto-login). Email is stored encrypted (AES-256-GCM); uniqueness is checked via HMAC blind index. @spec AC-12-004, AC-12-008


---

### `GET /api/categories`

GET /api/categories Returns all active prompt categories ordered by display order. Used by the Library filter, Submit form, and Admin panel.


---

### `GET /api/challenges`

GET /api/challenges Returns all currently active weekly challenges (multiple can be active simultaneously). Includes submission counts per challenge. Returns an empty array when none are active.


---

### `GET /api/favorites`

GET  /api/favorites?userId=<id>  – Fetch all favorited prompts for a user POST /api/favorites               – Toggle a prompt as favorite (add / remove) POST body: { promptId: number, userId: number } Idempotent point distribution: The FIRST time a user favorites a prompt the prompt author receives FAVORITE_PROMPT points. Removing and re-adding a favorite does NOT award points again. We track this via the `pointsAwarded` flag on the Favorite row, which persists even after soft-deletion (isActive = false). Soft-delete pattern: Favorites are never hard-deleted. "Remove" sets isActive = false so the pointsAwarded history is preserved. "Add" sets isActive = true (upsert).


---

### `POST /api/favorites`

GET  /api/favorites?userId=<id>  – Fetch all favorited prompts for a user POST /api/favorites               – Toggle a prompt as favorite (add / remove) POST body: { promptId: number, userId: number } Idempotent point distribution: The FIRST time a user favorites a prompt the prompt author receives FAVORITE_PROMPT points. Removing and re-adding a favorite does NOT award points again. We track this via the `pointsAwarded` flag on the Favorite row, which persists even after soft-deletion (isActive = false). Soft-delete pattern: Favorites are never hard-deleted. "Remove" sets isActive = false so the pointsAwarded history is preserved. "Add" sets isActive = true (upsert).


---

### `PUT /api/feedback/lesson/[id]`

PUT /api/feedback/lesson/[id] – Update own lesson feedback (helpful + optional text)


---

### `GET /api/feedback/lesson`

GET  /api/feedback/lesson?userId=&lessonId= – Get own lesson feedback POST /api/feedback/lesson                   – Submit lesson helpful vote


---

### `POST /api/feedback/lesson`

GET  /api/feedback/lesson?userId=&lessonId= – Get own lesson feedback POST /api/feedback/lesson                   – Submit lesson helpful vote


---

### `POST /api/feedback`

POST /api/feedback – Submit general or context-aware feedback


---

### `POST /api/feedback/suggestions`

POST /api/feedback/suggestions – Submit a topic suggestion


---

### `GET /api/health`

GET /api/health Lightweight liveness / readiness probe. Returns: 200  { status: "ok",   dbMs, ts } 503  { status: "error", error, ts } `dbMs` is the round-trip time (in ms) for a simple Prisma ping query. Use this endpoint from uptime monitors, Docker HEALTHCHECK, or k8s probes.


---

### `POST /api/learn/[moduleSlug]/[lessonSlug]/complete`

POST /api/learn/[moduleSlug]/[lessonSlug]/complete Body: { userId: number } Marks a lesson as complete for the user and awards points (idempotent).


---

### `GET /api/learn/[moduleSlug]/[lessonSlug]`

GET /api/learn/[moduleSlug]/[lessonSlug]?userId=<id> Returns lesson content, completion status, and prev/next navigation.


---

### `GET /api/learn`

GET /api/learn?userId=<id> Returns all learning modules with lessons and per-user progress.


---

### `GET /api/prompts`

GET  /api/prompts   – Fetch prompts (cursor-based pagination) POST /api/prompts   – Create a new prompt GET query params: category  – Filter by category name (omit or "all" = no filter) search    – Full-text search across title, titleEn, and content (max 50 results) userId    – When provided, includes the user's own vote and favorite status sortBy    – "newest" (default) | "most-used" cursor    – Prompt ID to paginate from (exclusive lower bound for newest; upper for most-used) take      – Number of results per page (default 20, max 50)

**Query-Parameter:**
- category  – Filter by category name (omit or "all" = no filter)
- search    – Full-text search across title, titleEn, and content (max 50 results)
- userId    – When provided, includes the user's own vote and favorite status
- sortBy    – "newest" (default) | "most-used"
- cursor    – Prompt ID to paginate from (exclusive lower bound for newest; upper for most-used)
- take      – Number of results per page (default 20, max 50)


---

### `POST /api/prompts`

GET  /api/prompts   – Fetch prompts (cursor-based pagination) POST /api/prompts   – Create a new prompt GET query params: category  – Filter by category name (omit or "all" = no filter) search    – Full-text search across title, titleEn, and content (max 50 results) userId    – When provided, includes the user's own vote and favorite status sortBy    – "newest" (default) | "most-used" cursor    – Prompt ID to paginate from (exclusive lower bound for newest; upper for most-used) take      – Number of results per page (default 20, max 50)

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

POST /api/usage Records that the current user copied and used a prompt. The first use per user/prompt increments usageCount and awards PROMPT_USED points to the prompt author. Repeated uses by the same user are idempotent. Body: { promptId: number, userId: number }


---

### `GET /api/users/[id]`

GET /api/users/[id] Returns a full user profile for the Profile page, including: - All prompts the user has submitted (with computed avgRating and voteCount) - The user's current rank in the global leaderboard


---

### `GET /api/users`

GET  /api/users   - List all users ordered by points. POST /api/users   - Legacy self-registration endpoint (disabled).


---

### `POST /api/users`

GET  /api/users   - List all users ordered by points. POST /api/users   - Legacy self-registration endpoint (disabled).


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
*Automatisch generiert am 02.07.2026, 07:22 · [Quellcode](https://github.com/your-org/prompt-arena)*
