# Task-Liste – PromptArena Rebuild

> Format: `- [x]` = erledigt · `- [~]` = in Arbeit · `- [ ]` = offen
> Jeder Task referenziert eine Feature-Spec und das Akzeptanzkriterium.

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

## Offene Verbesserungen

- [ ] PERF-001: GET /api/prompts – votes groupBy statt include (Performance)
- [ ] PERF-002: awardPoints – Level-Update nur bei Level-Change
- [ ] TEST-003: E2E-Tests für Lernpfad (/learn) schreiben
- [ ] TEST-004: FAVORITE_PROMPT in points.test.ts abdecken
