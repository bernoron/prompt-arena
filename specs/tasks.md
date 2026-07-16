# Task List – PromptArena Rebuild

> Format: `- [x]` = done · `- [~]` = in progress · `- [ ]` = open
> Each task references a feature spec and acceptance criterion.

---

## Infrastruktur (INFRA)

- [x] INFRA-001: SDD-Struktur aufsetzen (specs/, .claude/commands/, scripts/)
- [x] INFRA-002: constitution.md, spec.md, plan.md schreiben
- [x] INFRA-003: Feature-Specs für alle 7 Features schreiben
- [x] INFRA-004: Slash Commands erstellen (/specify /plan /tasks /implement /sync)
- [x] INFRA-005: spec-sync.mjs Script erstellen
- [x] INFRA-006: PostToolUse Hooks in settings.json konfigurieren
- [x] INFRA-007: CLAUDE.md mit SDD-Workflow aktualisieren

---

## Feature 01 – Identität (01-identity.md)

- [x] AC-01-001: User-Registrierung (POST /api/users)
- [x] AC-01-002: User-Liste abrufen (GET /api/users)
- [x] AC-01-003: UserPicker-Komponente
- [x] AC-01-004: User-Persistenz via localStorage

---

## Feature 02 – Prompt-Bibliothek (02-prompt-library.md)

- [x] AC-02-001: Prompt einreichen (POST /api/prompts)
- [x] AC-02-002: Prompts listen (GET /api/prompts)
- [x] AC-02-003: Filter nach Kategorie
- [x] AC-02-004: Filter nach Schwierigkeit
- [x] AC-02-005: Volltext-Suche
- [x] AC-02-006: Sortierung (Neueste / Meistgenutzt)
- [x] AC-02-007: Prompt-Modal (Details, Kopieren, Benutzen)
- [x] AC-02-008: PromptCard-Komponente mit Rarity-Badge
- [x] AC-02-009: Submit-Seite (/submit)

---

## Feature 03 – Voting (03-voting.md)

- [x] AC-03-001: Sternebewertung 1–5 (POST /api/votes)
- [x] AC-03-002: UserVote in GET /api/prompts (eigene Bewertung)
- [x] AC-03-003: Bewertungs-UI im Prompt-Modal

---

## Feature 04 – Gamification (04-gamification.md)

- [x] AC-04-001: Punkte vergeben (awardPoints)
- [x] AC-04-002: Level berechnen (getLevel)
- [x] AC-04-003: Fortschritt berechnen (getLevelProgress)
- [x] AC-04-004: Dashboard-Seite (/dashboard)
- [x] AC-04-005: Rangliste (/leaderboard)
- [x] AC-04-006: FloatingPoints-Animation
- [x] AC-04-007: LevelUp-Modal
- [x] AC-04-008: Usages tracken (POST /api/usage)

---

## Feature 05 – Favoriten (05-favorites.md)

- [x] AC-05-001: Favorit hinzufügen/entfernen (POST /api/favorites)
- [x] AC-05-002: Favoriten abrufen (GET /api/favorites)
- [x] AC-05-003: userFavorite-Flag in GET /api/prompts
- [x] AC-05-004: Favoriten-Toggle im Prompt-Modal
- [x] AC-05-005: PromptCard zeigt Favoriten-Stern
- [x] AC-05-006: Favoriten-Seite (/favorites)
- [x] AC-05-007: Autor erhält +10 Punkte (einmalig)

---

## Feature 06 – Challenges (06-challenges.md)

- [x] AC-06-001: Challenge abrufen (GET /api/challenges)
- [x] AC-06-002: Prompt zu Challenge einreichen
- [x] AC-06-003: Challenge-Card auf Submit-Seite
- [x] AC-06-004: Admin: Challenge erstellen/aktivieren/beenden

---

## Feature 07 – Admin (07-admin.md)

- [x] AC-07-001: Admin-Login (POST /api/admin/login)
- [x] AC-07-002: Admin-Logout
- [x] AC-07-003: Admin-Auth-Guard (middleware.ts)
- [x] AC-07-004: Prompts verwalten (CRUD)
- [x] AC-07-005: Challenges verwalten
- [x] AC-07-006: Benutzer verwalten
- [x] AC-07-007: Admin-Dashboard mit Statistiken

---

## Feature 08 – Lernpfad (08-learning-path.md)

- [x] AC-08-001: Alle Module mit Fortschritt abrufen (GET /api/learn)
- [x] AC-08-002: Einzelne Lektion abrufen (GET /api/learn/[moduleSlug]/[lessonSlug])
- [x] AC-08-003: Lektion abschliessen (POST /api/learn/.../complete) – idempotent
- [x] AC-08-004: Lernübersicht-Seite (/learn) mit ProgressRingen
- [x] AC-08-005: Moduldetail-Seite (/learn/[moduleSlug])
- [x] AC-08-006: Lektionsseite (/learn/[moduleSlug]/[lessonSlug])
- [x] AC-08-007: ContentBlock-Renderer (text, tip, warning, example, pattern)
- [x] AC-08-008: Abschluss vergibt +15 Punkte mit FloatingPoints-Animation
- [x] AC-08-009: Modulübergreifende Vor/Zurück-Navigation (LessonNav)
- [x] AC-08-010: Dashboard-Widget NextLessonWidget
- [x] AC-08-011: Graceful degradation ohne eingeloggten User
- [x] AC-08-012: Seed: 5 Module, 20 Lektionen über KI-Prompting

---

## Feature 09 – Erweiterte Lernmodule (09-extended-learning.md)

- [x] AC-09-001: Seed um 5 Module erweitern (Vision, Coding, Files, Security, Model-Choice)
- [x] AC-09-002: Modul „Vision" mit 4 Lektionen
- [x] AC-09-003: Modul „Coding" mit 5 Lektionen
- [x] AC-09-004: Modul „Files" mit 4 Lektionen
- [x] AC-09-005: Modul „Security" mit 5 Lektionen
- [x] AC-09-006: Modul „Model-Choice" mit 4 Lektionen
- [x] AC-09-007: API gibt alle Module zurück (kein Code-Change)
- [x] AC-09-008: Jedes Modul hat mind. 3 Patterns + 2 Alltagsbeispiele

---

## Feature 10 – Profile & Badge System (10-profile.md)

- [x] AC-10-001: GET /api/users/[id] returns complete profile data
- [x] AC-10-002: Profile page displays hero section with name, avatar, level, and stats
- [x] AC-10-003: Profile lists user's submitted prompts sorted by usage count
- [x] AC-10-004: Profile shows 7 badges (earned and locked)
- [x] AC-10-005: Profile reacts to user selection and updates without page reload

---

## Feature 11 – Nutzer-Feedback (11-feedback.md)

- [x] AC-11-001: FeedbackButton in user layout (floating, nur wenn eingeloggt)
- [x] AC-11-002: FeedbackModal mit 4 Kategorie-Icons (BUG / IMPROVEMENT / IDEA / PRAISE)
- [x] AC-11-003: Zod FeedbackSchema + POST /api/feedback (400 bei fehlendem category/text)
- [x] AC-11-004: POST /api/feedback speichert + Toast-Bestätigung
- [x] AC-11-005: contextPath (window.location.pathname) automatisch mitgesendet
- [x] AC-11-006: LessonFeedback-Komponente am Ende jeder Lernlektion (👍/👎)
- [x] AC-11-007: POST /api/feedback/lesson — ein Klick reicht, optionales Textfeld danach
- [x] AC-11-008: GET /api/feedback/lesson + PUT /api/feedback/lesson/[id] — eigene Bewertung laden/ändern
- [x] AC-11-009: Lektions-Feedback im Admin mit Modul+Lektionsname aufgelöst
- [x] AC-11-010: „Thema vorschlagen"-Button auf /learn und am Lektionsende
- [x] AC-11-011: TopicSuggestionModal + POST /api/feedback/suggestions
- [x] AC-11-012: GET /api/admin/feedback/suggestions + Admin-Tab „Themenvorschläge"
- [x] AC-11-013: Admin-Feedback-Seite mit Tabelle (Kategorie, Text, Nutzer, Datum, Kontext)
- [x] AC-11-014: Filter nach Kontext-Typ + Sortierung nach Datum
- [x] AC-11-015: PATCH /api/admin/feedback/[id] (erledigt) + DELETE
- [x] AC-11-016: PATCH /api/admin/feedback/suggestions/[id] (Status-Dropdown)

---

## Feature 13 – Öffentliche Startseite (13-landing-page.md)

- [x] AC-13-001: middleware.ts – `/` ist ein öffentlicher Pfad (kein Login-Redirect)
- [x] AC-13-002: app/page.tsx – Server Component, Redirect zu /dashboard für angemeldete Nutzer
- [x] AC-13-003: Hero mit Produkterklärung + CTA-Links zu /register und /login
- [x] AC-13-004: Vier Feature-Kacheln (Bibliothek, Einreichen, Lernpfade, Challenges)
- [x] AC-13-005: getTopPrompts() – anonymisierte Top-Prompts (keine Autor-Felder selektiert)
- [x] AC-13-006: Showcase der 3 beliebtesten Prompts ohne Autorenname/Avatar
- [x] AC-13-007: Showcase-Abschnitt wird ausgeblendet, wenn noch keine Prompts genutzt wurden

---

## Feature 01 – Erweiterungen (CR-002, CR-003 — implementiert)

### CR-002 – Konto löschen ✅
- [x] AC-01-010: `User.deletedAt` + Migration (Tombstone)
- [x] AC-01-011: `DELETE /api/account` (Session + Passwort, Anonymisierung, Cookie-Reset, Rate-Limit)
- [x] AC-01-012: Gelöschte Konten unsichtbar (users-Liste, users/[id] 404, me null, Login scheitert)
- [x] AC-01-013: Profil-„Gefahrenzone" + Bestätigungsdialog

### CR-003 – Passwort zurücksetzen per E-Mail ✅
- [x] AC-01-014: `PasswordResetToken`-Modell + Migration (nur Token-Hash)
- [x] AC-01-015: `lib/reset-token.ts` + `lib/mailer.ts` (Mock-/Log-Transport)
- [x] AC-01-016: `POST /api/auth/password-reset/request` (neutrale Antwort, Rate-Limit)
- [x] AC-01-017: `POST /api/auth/password-reset/confirm` (Token einmalig, Ablauf, Transaktion)
- [x] AC-01-018: Login-Link „Passwort vergessen?" + `/forgot-password`
- [x] AC-01-019: `/reset-password` + öffentlicher Pfad in `middleware.ts`
- [x] INFRA: E-Mail-Versand über Resend implementiert (`lib/mailer.ts`, Log-Fallback ohne Key)
- [ ] INFRA (später): `RESEND_API_KEY` + verifizierte Absender-Domain als Fly-Secret eintragen

---

## Feature 02 – Erweiterungen (CR-004 — implementiert)

### CR-004 – Nutzer können beim Einreichen neue Kategorien erstellen ✅
- [x] AC-02-013: `POST /api/categories` (Nutzer-Endpoint, kein Admin) + `CreateCategorySchema` in `lib/validation.ts`
- [x] AC-02-013: `createCategory()` in `lib/services/category-service.ts` + Cache-Invalidierung von `categories:all`
- [x] AC-02-013: Unit-Tests (`CreateCategorySchema`, `slugify()`)
- [x] AC-02-014: Submit-Formular — Kategorie-Combobox (Freitext + Live-Filter bestehender Kategorien)
- [x] AC-02-014: `CategoryBadge`/`PromptCard` auf `PromptCategoryInfo.icon`/`.color` umstellen (statt `CATEGORY_CONFIG`)
- [x] AC-02-014: E2E-Test (Happy Path: neue Kategorie anlegen → sichtbar in Bibliothek; Edge-Case: doppelter Name)

---

## Feature 13 – Erweiterungen (CR-005 — implementiert)

### CR-005 – Startseite zeigt die 10 zuletzt gebauten Features ✅
- [x] AC-13-008: `lib/services/changelog-service.ts` — `getRecentFeatures()` + `parseChangelogFeatures()` (liest `CHANGELOG.md`, keine Migration)
- [x] AC-13-008: Unit-Tests (`parseChangelogFeatures`: Scope/kein Scope, Limit, leere Features-Sektion)
- [x] AC-13-009: "Neuigkeiten"-Abschnitt in `app/page.tsx` inkl. Leer-Zustand
- [x] AC-13-009: E2E-Test (Neuigkeiten-Abschnitt sichtbar für anonyme Besucher:innen)

---

## Feature 14 – Einstiegs-Funnel (14-onboarding-funnel.md)

- [x] AC-14-001: User.onboardingCompletedAt (nullable) + Migration mit Backfill für Bestandsnutzer
- [x] AC-14-002: getSessionUser() liefert onboardingCompletedAt
- [x] AC-14-003: OnboardingFunnel-Komponente zeigt Modal wenn onboardingCompletedAt === null
- [x] AC-14-004: ONBOARDING_STEPS-Konstante (mind. 5 Schritte: Bibliothek, Einreichen, Punkte/Level, Lernpfad, Challenges)
- [x] AC-14-005: „Überspringen"-Link auf jedem Schritt
- [x] AC-14-006: Letzter Schritt zeigt CTA-Links (Bibliothek / Lernpfad) statt „Weiter"
- [x] AC-14-007: POST /api/onboarding markiert Einführung als erledigt
- [x] AC-14-008: UserMenu-Link „Einführung erneut ansehen" (?tour=1)
- [x] AC-14-009: Responsive Modal-Layout (Desktop/Mobile)

---

## Open Improvements

- [x] PERF-001: GET /api/prompts – votes groupBy instead of include (Performance)
- [ ] PERF-002: awardPoints – Update level only on level change
- [ ] TEST-003: Write E2E tests for Learning Path (/learn)
- [ ] TEST-004: Cover FAVORITE_PROMPT in points.test.ts
- [ ] SPEC-001: Convert all remaining German specs to English
- [ ] DOC-001: Add SPEC-DRIVEN-DEVELOPMENT.md guide (done – see /docs/)
