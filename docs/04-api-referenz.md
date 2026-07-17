# API-Referenz

Alle Endpunkte sind unter `/api` erreichbar. Jeder Endpunkt:
- Validiert seinen Input mit **Zod** (400 bei ungültigen Daten)
- Prüft das **Rate Limit** (429 nach Überschreitung)
- Gibt im Fehlerfall `{ "error": "..." }` zurück

---

## Endpunkte

### `DELETE /api/account`

DELETE /api/account — self-service account deletion (CR-002). Body: { password: string } Flow: 1. Require a valid user session (you can only delete your OWN account). 2. Re-authenticate with the current password (deliberate confirmation). 3. Anonymise the account (tombstone): keep the row so authored prompts/votes stay referentially valid, but strip name → "Gelöschter Nutzer #<id>" and null all credential/PII columns; stamp deletedAt. 4. Clear the session cookie → the user is logged out and, with credentials and emailHash removed, can never log in again. @spec AC-01-010, AC-01-011


---

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

### `POST /api/auth/password-reset/confirm`

POST /api/auth/password-reset/confirm — set a new password via reset token (CR-003). Body: { token: string, password: string } Validates the token (exists, not expired, not already used), sets the new password, marks the token used and invalidates every other outstanding token for the account. The old password stops working because its hash is replaced. @spec AC-01-017


---

### `POST /api/auth/password-reset/request`

POST /api/auth/password-reset/request — start a password reset (CR-003). Body: { email: string } ALWAYS returns the same neutral response, whether or not an account exists, so the endpoint can't be used to discover which addresses are registered (@spec AC-01-016, BAC-01-013). If a (non-deleted) account matches, a single-use, time-limited token is created and a reset e-mail is dispatched. In dev/CI/E2E only, the reset URL is echoed back as `devResetUrl` so automated tests can follow the link. In production this field is never set. @spec AC-01-014, AC-01-016


---

### `POST /api/auth/register`


---

### `GET /api/categories`


---

### `POST /api/categories`


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


---

### `GET /api/learn/[moduleSlug]/[lessonSlug]`


---

### `POST /api/onboarding`


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
*Automatisch generiert am 17.07.2026, 08:02 · [Quellcode](https://github.com/your-org/prompt-arena)*
