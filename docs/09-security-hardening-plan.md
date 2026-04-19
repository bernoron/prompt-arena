# Security Review & Hardening-Plan (PromptArena)

## 1) Executive Summary

Diese Analyse betrachtet die aktuelle Implementierung als **interne Anwendung mit Mock-Auth** und leitet daraus einen professionellen Hardening-Plan für ein Pentesting-/Security-Engineering-Team ab.

### Gesamtbewertung (Stand: 19.04.2026)

- **Positiv:** Solide Input-Validierung (Zod), Security-Header/CSP, Prisma statt Raw SQL, grundlegendes Rate-Limiting.
- **Kritisch:** Fehlende echte Benutzer-Authentifizierung/Autorisierung in Business-APIs (User-ID wird vom Client geliefert), dadurch hohe Manipulations-/IDOR-Gefahr.
- **Kritisch:** Admin-Session-Mechanismus mit statischem, deterministischem Cookie-Wert (SHA-256 vom Secret) ohne echte Session-Bindung/Rotation.
- **Hoch:** Kein systematischer CSRF-Schutz für mutierende Requests (insb. Cookie-authentisierte Admin-APIs).
- **Hoch:** In-Memory Rate Limiter ist in Multi-Replica-Setups leicht zu umgehen.

### Zielbild

1. **Identity first:** Serverseitig verifizierte Nutzeridentität (OIDC/SAML/NextAuth oder internes SSO).
2. **Zero Trust bei API-Eingaben:** Keine clientseitig gelieferte `userId` mehr als Autoritätsquelle.
3. **Defense in depth:** CSRF, robuste Session-Strategie, Redis-Ratelimit, Audit-Trail, Secret-Management, kontinuierliche Security-Tests.

---

## 2) Relevante Befunde aus dem Code

### A. Kritisch – API vertraut auf clientseitige `userId`

Mehrere Endpunkte akzeptieren `userId` bzw. `authorId` im Request-Body und verwenden diese direkt für schreibende Aktionen (Votes/Prompts/Favorites/Completion etc.). Ohne echte serverseitige Identitätsprüfung kann ein Angreifer fremde IDs nutzen.

**Risiko:** Account-Impersonation, Punktesystem-Manipulation, unautorisierte Aktionen im Namen anderer Nutzer.

### B. Kritisch – Admin-Cookie ist nur `SHA-256(ADMIN_SECRET)`

Der Admin-Login setzt als Cookie den Hash des Secrets. Der Wert ist stabil/deterministisch und nicht an Session-Metadaten (Issued-At, Exp, Device, Rotation) gekoppelt.

**Risiko:** Replay bei Cookie-Diebstahl, fehlende Session-Härtung, schwierige Forensik.

### C. Hoch – CSRF-Schutz nicht explizit implementiert

Für Cookie-basierte Admin-Requests fehlt ein expliziter Anti-CSRF-Mechanismus (Synchronizer Token oder Double-Submit).

**Risiko:** Cross-Site Request Forgery auf Admin-Aktionen.

### D. Hoch – Ratelimit pro Prozess (In-Memory)

Der Limiter lebt in einer lokalen `Map`.

**Risiko:** Umgehung in horizontal skalierten Deployments; kein globaler Schutz, kein zentrales Blocking/Telemetry.

### E. Mittel – AuthN/Audit/Least-Privilege nicht durchgängig

- Kein durchgängiges RBAC/ABAC für Domänenaktionen.
- Kein dediziertes Security-Audit-Log mit unveränderlichen Ereignissen.
- Secret-Lifecycle (Rotation, Vault/KMS) nur minimal dokumentiert.

---

## 3) Pentest-Handlungsplan (professionell, priorisiert)

## Phase 0 – Vorbereitung (Woche 0)

- Scope schriftlich fixieren: Web, API, Auth, Admin, Deployment, CI/CD.
- ROE (Rules of Engagement), Testfenster, Freigaben, Datenklassifikation.
- Test-Accounts: User/Power-User/Admin, inkl. Seed-Daten.
- Telemetrie aktivieren (Request-ID, Audit-Events, SIEM-Anbindung).

## Phase 1 – Schnelle Risikoreduktion (Woche 1–2)

1. **Sofortmaßnahme:** Serverseitige Identität erzwingen
   - `userId`/`authorId` aus Body entfernen.
   - Identität ausschließlich aus Session/JWT/OIDC-Claims.
2. **Admin-Härtung:** Session-Store + rotierende Session-IDs
   - Keine deterministischen Cookie-Werte.
   - Session-Fingerprint, kurze TTL, Re-Auth bei sensiblen Aktionen.
3. **CSRF-Schutz:** Token-basierter Schutz für alle mutierenden Cookie-Requests.
4. **Ratelimit v2:** Redis-basiert (IP + Account + Route), Burst + Sliding Window.
5. **Logging:** Security Events strukturieren (Login fail/success, privilege change, admin mutations).

## Phase 2 – Architektur-Härtung (Woche 2–6)

- SSO/OIDC Integration (z. B. Entra ID/Okta/Keycloak).
- RBAC-Rollenmodell (User, Moderator, Admin) + Permission-Matrix pro Route.
- Eingabe-/Ausgabehärtung:
  - Striktes Output-Encoding im Frontend.
  - Optional: HTML-Sanitizer bei rich content.
- Security Header erweitern:
  - CSP Nonce/Hash-basiert statt `'unsafe-inline'` (Produktion).
  - `Strict-Transport-Security` in TLS-Umgebungen.
- Secrets in Vault/KMS, Rotationsrunbook.

## Phase 3 – Verifikation & Dauerbetrieb (ab Woche 6)

- Wiederkehrende DAST/SAST/SCA in CI.
- Jährlicher externer Pentest + quartalsweise interne Red-Team-Übungen.
- Hardening-Baselines für Container/Runtime (non-root, read-only FS, minimal image).
- Incident-Response-Playbook + Tabletop Exercises.

---

## 4) Konkrete technische Änderungen (Engineering Backlog)

## P0 (blockierend vor produktiver Exponierung)

- [ ] Echte Authentifizierung einführen (OIDC/SSO) und Mock-Auth entfernen.
- [ ] Alle Schreib-APIs auf serverseitige Identität umstellen.
- [ ] Admin-Session auf random Session-ID + serverseitige Session-Validierung umstellen.
- [ ] Anti-CSRF für Admin/API-Mutationen.
- [ ] Redis-Ratelimiter + zentrale Abuse-Detektion.

## P1

- [ ] RBAC/ABAC Enforcement Layer (Policy Middleware).
- [ ] Security-Audit-Log inkl. Tamper-Resistance (z. B. Write-Once Sink).
- [ ] Sicherheitsrelevante Alerts (Brute force, anomalous write patterns).
- [ ] Dependency- & Container-Scanning in CI als Merge-Gate.

## P2

- [ ] CSP-Nonce-Rollout ohne `unsafe-inline`.
- [ ] Secrets-Rotation automatisieren.
- [ ] Backup/Restore + DR-Szenarien inkl. RTO/RPO-Test.

---

## 5) Pentest-Testkatalog (für Teamausführung)

### AuthN/AuthZ

- IDOR auf allen Ressourcen (User/Prompt/Favorites/Votes/Admin).
- Vertical Privilege Escalation (User → Admin APIs).
- Session Fixation, Session Replay, Logout-Bypass.

### API Security (OWASP API Top 10)

- BOLA/BFLA, Mass Assignment, excessive data exposure.
- Rate-limit bypass (XFF spoofing, distributed clients).
- Input fuzzing: JSON parser edges, overlong payloads, unicode confusables.

### Web Security (OWASP ASVS)

- CSRF auf alle mutierenden Endpunkte.
- XSS (stored/reflected/DOM) in Prompt-Content und Suchparametern.
- CSP Bypass-Versuche.

### Infrastruktur/DevSecOps

- Container image hardening, secrets exposure, build pipeline poisoning.
- Dependency vulnerabilities, lockfile integrity, SBOM validation.

---

## 6) Umsetzungs-Prompts (für KI-gestützte Entwicklung)

## Prompt 1 – Authentifizierung & serverseitige Identität

```text
Du bist Senior Security Engineer für eine Next.js 14 App (App Router, TypeScript, Prisma).

Aufgabe:
1) Ersetze lokale Mock-Auth vollständig durch echte serverseitige Authentifizierung (OIDC/NextAuth).
2) Entferne userId/authorId aus allen mutierenden Request-Bodies.
3) Nutze ausschließlich serverseitige Session-/Token-Claims zur Identifikation.
4) Ergänze eine zentrale Auth-Guard Utility für API Routes.
5) Schreibe Unit- und Integrationstests für IDOR/Impersonation-Prevention.

Akzeptanzkriterien:
- Kein Endpoint akzeptiert userId als Autoritätsquelle.
- Unautorisierte Requests liefern 401, unberechtigte 403.
- Tests decken positive/negative Fälle je Route ab.
```

## Prompt 2 – Admin-Session-Härtung & CSRF

```text
Du bist Security Architect. Refaktoriere die Admin-Authentifizierung.

Ziele:
1) Ersetze deterministischen Cookie-Wert durch zufällige Session-ID.
2) Lege Sessions serverseitig ab (TTL, Rotation, revoke on logout).
3) Implementiere CSRF-Schutz (Synchronizer Token oder Double-Submit) für alle mutierenden Admin-Requests.
4) Ergänze Security-Logs: login success/fail, session rotation, logout, failed CSRF.
5) Schreibe Playwright-Tests für Login, CSRF-Ablehnung, Session-Expiry.

Lieferumfang:
- Codeänderungen inkl. Migrations/Store
- Sicherheitsdokumentation
- Tests mit klaren Assertions
```

## Prompt 3 – Rate Limiting & Abuse Detection

```text
Implementiere einen Redis-basierten, verteilten Rate Limiter für Next.js API Routes.

Anforderungen:
- Schlüsselstrategie: IP + userId + route + method
- Sliding Window + Burst-Kontrolle
- Separate Limits für Login/Admin/Read/Write
- Einheitliches 429-Response-Schema inkl. Retry-After
- Telemetrie-Events für SIEM (rate_limit_hit, suspicious_pattern)

Zusätzlich:
- Feature-Flag für schrittweisen Rollout
- Lasttests (k6 oder Artillery) mit Bericht
```

## Prompt 4 – Security Regression Pipeline

```text
Baue eine CI-Sicherheits-Pipeline:
- SAST (Semgrep/CodeQL)
- SCA (npm audit + OSV + Lizenzprüfung)
- Secret Scanning (gitleaks)
- Container Scan (Trivy/Grype)
- DAST Smoke gegen Staging (OWASP ZAP Baseline)

Regeln:
- High/Critical Findings blockieren den Merge.
- Erzeuge maschinenlesbare Reports (SARIF/JSON) und ein zusammenfassendes Security Dashboard Artefakt.
- Dokumentiere lokale Reproduzierbarkeit der Scans.
```

---

## 7) Definition of Done (Security)

Eine Maßnahme gilt erst als abgeschlossen, wenn:

1. Bedrohungsmodell aktualisiert wurde.
2. Code + Tests + Doku + Monitoring angepasst sind.
3. Security Review (4-Augen-Prinzip) bestanden ist.
4. Regressions-Scans ohne neue High/Critical Findings laufen.
5. Rollback-Strategie dokumentiert ist.

---

## 8) Empfehlung für das Management

Für internen Pilotbetrieb ist die aktuelle Lösung funktional, aber für breiteren produktiven Einsatz besteht ein **erhöhtes Risiko** durch fehlende starke Identitätssicherung und Admin-Session-Design.

**Empfohlen:** P0-Maßnahmen innerhalb von 2–4 Wochen umsetzen und erst danach den Nutzerkreis erweitern.
