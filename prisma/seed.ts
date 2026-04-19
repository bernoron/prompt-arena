import { PrismaClient } from '@prisma/client';
import { getLevel } from '../lib/points';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PromptArena...');

  // Clear existing data (order respects FK constraints)
  await prisma.lessonProgress.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.learningModule.deleteMany();
  await prisma.challengeSubmission.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.prompt.deleteMany();
  await prisma.weeklyChallenge.deleteMany();
  await prisma.user.deleteMany();

  // --- USERS ---
  const users = await Promise.all([
    prisma.user.create({ data: { name: 'Anna Müller', department: 'Schaden', avatarColor: '#1D9E75', totalPoints: 450, level: getLevel(450) } }),
    prisma.user.create({ data: { name: 'Thomas Berger', department: 'Vertrieb', avatarColor: '#3B82F6', totalPoints: 280, level: getLevel(280) } }),
    prisma.user.create({ data: { name: 'Sarah Keller', department: 'IT', avatarColor: '#F59E0B', totalPoints: 620, level: getLevel(620) } }),
    prisma.user.create({ data: { name: 'Marco Rossi', department: 'Schaden', avatarColor: '#8B5CF6', totalPoints: 95, level: getLevel(95) } }),
    prisma.user.create({ data: { name: 'Lisa Weber', department: 'Vertrieb', avatarColor: '#EF4444', totalPoints: 155, level: getLevel(155) } }),
  ]);

  const [anna, thomas, sarah, marco, lisa] = users;

  // --- WEEKLY CHALLENGE ---
  const challenge = await prisma.weeklyChallenge.create({
    data: {
      title: 'Schadensmeldungen zusammenfassen',
      description: 'Finde den besten Prompt für das automatische Zusammenfassen von Schadensmeldungen. Der Prompt soll die wichtigsten Infos extrahieren und klar strukturieren.',
      startDate: new Date('2026-03-10'),
      endDate: new Date('2026-03-17'),
      isActive: true,
    },
  });

  // --- PROMPTS ---
  const promptData = [
    {
      title: 'Text kürzen & schärfen',
      titleEn: 'Shorten & Sharpen Text',
      content: 'Kürze den folgenden Text auf maximal [X] Wörter. Behalte den zentralen Inhalt, entferne Füllwörter und formuliere aktiv. Stil: klar und professionell.\n\n[TEXT EINFÜGEN]',
      contentEn: 'Shorten the following text to a maximum of [X] words. Keep the core message, remove filler words, and use active voice. Style: clear and professional.\n\n[PASTE TEXT HERE]',
      category: 'Writing', difficulty: 'Einstieg', authorId: anna.id,
    },
    {
      title: 'Verständlichkeit prüfen',
      titleEn: 'Check Readability',
      content: 'Analysiere den folgenden Text auf Verständlichkeit. Identifiziere: (1) Sätze die zu lang sind, (2) Fachbegriffe die erklärt werden sollten, (3) Passivkonstruktionen. Gib konkrete Verbesserungsvorschläge.\n\n[TEXT EINFÜGEN]',
      contentEn: 'Analyse the following text for readability. Identify: (1) sentences that are too long, (2) technical terms that need explanation, (3) passive constructions. Provide concrete suggestions.\n\n[PASTE TEXT HERE]',
      category: 'Writing', difficulty: 'Einstieg', authorId: thomas.id,
    },
    {
      title: 'Drei Versionen erstellen',
      titleEn: 'Create Three Versions',
      content: 'Schreibe drei Versionen: (A) formal & präzise, (B) freundlich & zugänglich, (C) knapp & direkt. Max [X] Wörter pro Version.\n\nOriginaltext: [TEXT EINFÜGEN]',
      contentEn: 'Write three versions: (A) formal & precise, (B) friendly & accessible, (C) short & direct. Max [X] words.\n\nOriginal: [PASTE TEXT HERE]',
      category: 'Writing', difficulty: 'Einstieg', authorId: sarah.id,
    },
    {
      title: 'E-Mail aus Stichpunkten',
      titleEn: 'Email from Bullet Points',
      content: 'Schreibe eine professionelle E-Mail:\nEmpfänger: [NAME/ROLLE]\nZweck: [BESCHREIBUNG]\nKernpunkte:\n- [PUNKT 1]\n- [PUNKT 2]\nTon: [z.B. freundlich, sachlich]',
      contentEn: 'Write a professional email:\nRecipient: [NAME/ROLE]\nPurpose: [DESCRIPTION]\nKey points:\n- [POINT 1]\n- [POINT 2]\nTone: [e.g. friendly, factual]',
      category: 'Email', difficulty: 'Einstieg', authorId: anna.id,
    },
    {
      title: 'Schwierige Nachricht formulieren',
      titleEn: 'Formulate a Difficult Message',
      content: 'Hilf mir diese Botschaft taktvoll zu kommunizieren:\nSituation: [KONTEXT]\nBotschaft: [KERN]\nVermeiden: [z.B. defensiv wirken]\n\nSchreibe E-Mail-Version und mündliche Version.',
      contentEn: 'Help me communicate this message tactfully:\nSituation: [CONTEXT]\nMessage: [CORE]\nAvoid: [e.g. sounding defensive]\n\nWrite email and verbal version.',
      category: 'Email', difficulty: 'Fortgeschritten', authorId: lisa.id,
    },
    {
      title: 'Meeting-Einladung strukturieren',
      titleEn: 'Structure a Meeting Invitation',
      content: 'Schreibe Meeting-Einladung:\nThema: [THEMA]\nZiel: [WAS SOLL ERREICHT SEIN]\nTeilnehmende: [ROLLEN]\nDauer: [X Minuten]',
      contentEn: 'Write a meeting invitation:\nTopic: [TOPIC]\nGoal: [WHAT SHOULD BE ACHIEVED]\nParticipants: [ROLES]\nDuration: [X minutes]',
      category: 'Email', difficulty: 'Einstieg', authorId: marco.id,
    },
    {
      title: 'Dokument zusammenfassen',
      titleEn: 'Summarise a Document',
      content: 'Fasse das Dokument zusammen:\n1. Kernaussage (1 Satz)\n2. Wichtigste Punkte (max. 5 Bullets)\n3. Nächste Schritte\n\n[DOKUMENT EINFÜGEN]',
      contentEn: 'Summarise the document:\n1. Core message (1 sentence)\n2. Key points (max. 5 bullets)\n3. Next steps\n\n[PASTE DOCUMENT HERE]',
      category: 'Analysis', difficulty: 'Einstieg', authorId: thomas.id,
    },
    {
      title: 'Pro & Kontra Analyse',
      titleEn: 'Pro & Con Analysis',
      content: 'Pro-Kontra-Analyse:\nEntscheidung: [BESCHREIBUNG]\nKontext: [HINTERGRUND]\n\nFormat: Tabelle mit Pros, Kontras, Empfehlung.',
      contentEn: 'Pro-con analysis:\nDecision: [DESCRIPTION]\nContext: [BACKGROUND]\n\nFormat: Table with pros, cons, recommendation.',
      category: 'Analysis', difficulty: 'Fortgeschritten', authorId: sarah.id,
    },
    {
      title: 'Verschiedene Perspektiven',
      titleEn: 'Multiple Perspectives',
      content: 'Analysiere aus 3 Perspektiven:\nThema: [THEMA]\n(1) Kundensicht (2) Mitarbeitendensicht (3) Unternehmenssicht\nJe: Hauptinteressen, Bedenken, Einwände.',
      contentEn: 'Analyse from 3 perspectives:\nTopic: [TOPIC]\n(1) Customer (2) Employee (3) Company\nPer perspective: interests, concerns, objections.',
      category: 'Analysis', difficulty: 'Fortgeschritten', authorId: anna.id,
    },
    {
      title: 'Daten beschreiben lassen',
      titleEn: 'Describe Data',
      content: 'Beschreibe diese Datentabelle:\n(1) Was fällt auf?\n(2) Welche Ausreisser?\n(3) Schlussfolgerung?\n\n[DATEN EINFÜGEN]',
      contentEn: 'Describe this data table:\n(1) What stands out?\n(2) Any outliers?\n(3) What conclusion?\n\n[PASTE DATA HERE]',
      category: 'Excel', difficulty: 'Einstieg', authorId: marco.id,
    },
    {
      title: 'Excel-Formel erklären',
      titleEn: 'Explain Excel Formula',
      content: 'Erkläre diese Formel Schritt für Schritt. Wo könnte sie Fehler produzieren?\nFormel: [FORMEL]\nKontext: Ich verwende sie um [ZWECK]',
      contentEn: 'Explain this formula step by step. Where could it produce errors?\nFormula: [FORMULA]\nContext: I use it to [PURPOSE]',
      category: 'Excel', difficulty: 'Einstieg', authorId: lisa.id,
    },
    {
      title: 'Informationen strukturieren',
      titleEn: 'Structure Information',
      content: 'Strukturiere diese Informationen:\nZielformat: [z.B. Tabelle / Liste]\nZweck: [VERWENDUNG]\n\nRohdaten:\n[INFORMATIONEN EINFÜGEN]',
      contentEn: 'Structure this information:\nTarget format: [e.g. table / list]\nPurpose: [USE CASE]\n\nRaw data:\n[PASTE HERE]',
      category: 'Excel', difficulty: 'Einstieg', authorId: thomas.id,
    },

    // --- ADDITIONAL PROMPTS ---
    {
      title: 'Konstruktives Feedback formulieren',
      titleEn: 'Write Constructive Feedback',
      content: 'Formuliere konstruktives Feedback zu folgender Situation:\nPerson/Rolle: [z.B. Teammitglied, Praktikant]\nBeobachtung: [WAS IST AUFGEFALLEN]\nZiel: [WAS SOLL VERBESSERT WERDEN]\n\nTon: wertschätzend, konkret, lösungsorientiert.\nFormat: (1) Positive Seite, (2) Verbesserungspotenzial, (3) Konkreter Vorschlag.',
      contentEn: 'Write constructive feedback for the following situation:\nPerson/Role: [e.g. team member, intern]\nObservation: [WHAT WAS NOTICED]\nGoal: [WHAT SHOULD IMPROVE]\n\nTone: appreciative, specific, solution-oriented.\nFormat: (1) Positive aspect, (2) Area for improvement, (3) Concrete suggestion.',
      category: 'Writing', difficulty: 'Fortgeschritten', authorId: anna.id,
    },
    {
      title: 'Präsentation strukturieren',
      titleEn: 'Structure a Presentation',
      content: 'Erstelle eine Gliederung für eine Präsentation:\nThema: [THEMA]\nZielgruppe: [z.B. Management, Kundinnen, Team]\nDauer: [X Minuten]\nZiel: [WAS SOLL DIE ZIELGRUPPE DANACH WISSEN/TUN]\n\nLiefere: Titelvorschlag, 5–7 Folien-Kapitel mit je 2–3 Kernaussagen.',
      contentEn: 'Create an outline for a presentation:\nTopic: [TOPIC]\nAudience: [e.g. management, clients, team]\nDuration: [X minutes]\nGoal: [WHAT SHOULD THE AUDIENCE KNOW/DO AFTER]\n\nDeliver: title suggestion, 5–7 slide chapters with 2–3 key points each.',
      category: 'Writing', difficulty: 'Fortgeschritten', authorId: sarah.id,
    },
    {
      title: 'Protokoll erstellen',
      titleEn: 'Create Meeting Minutes',
      content: 'Erstelle ein strukturiertes Protokoll aus diesen Notizen:\nMeeting: [THEMA / DATUM]\nTeilnehmende: [LISTE]\n\nNotizen:\n[ROHE NOTIZEN EINFÜGEN]\n\nFormat: Beschlüsse, offene Punkte mit Verantwortlichen und Deadline.',
      contentEn: 'Create structured meeting minutes from these notes:\nMeeting: [TOPIC / DATE]\nParticipants: [LIST]\n\nNotes:\n[PASTE RAW NOTES]\n\nFormat: Decisions, open items with owners and deadlines.',
      category: 'Writing', difficulty: 'Einstieg', authorId: thomas.id,
    },
    {
      title: 'Abwesenheitsnotiz schreiben',
      titleEn: 'Write Out-of-Office Reply',
      content: 'Schreibe eine professionelle Abwesenheitsnotiz:\nAbwesend von: [DATUM]\nZurück am: [DATUM]\nVertretung: [NAME, E-MAIL]\nDringliche Fälle: [KONTAKT]\n\nTon: freundlich, knapp, klar.',
      contentEn: 'Write a professional out-of-office reply:\nAbsent from: [DATE]\nBack on: [DATE]\nDeputy: [NAME, EMAIL]\nUrgent matters: [CONTACT]\n\nTone: friendly, concise, clear.',
      category: 'Email', difficulty: 'Einstieg', authorId: lisa.id,
    },
    {
      title: 'Eskalations-E-Mail entschärfen',
      titleEn: 'De-escalate an Email',
      content: 'Ich habe diese E-Mail erhalten und möchte deeskalierend antworten:\n\nOriginal-E-Mail:\n[E-MAIL EINFÜGEN]\n\nMein Standpunkt: [MEINE POSITION]\n\nSchreibe eine Antwort, die: Verständnis zeigt, sachlich bleibt, die Beziehung schützt und eine Lösung vorschlägt.',
      contentEn: 'I received this email and want to reply in a de-escalating way:\n\nOriginal email:\n[PASTE EMAIL]\n\nMy position: [MY STANCE]\n\nWrite a reply that: shows understanding, stays factual, protects the relationship, and proposes a solution.',
      category: 'Email', difficulty: 'Fortgeschritten', authorId: marco.id,
    },
    {
      title: 'Follow-up nach Meeting',
      titleEn: 'Follow-up After Meeting',
      content: 'Schreibe eine Follow-up-E-Mail nach dem Meeting:\nMeeting-Thema: [THEMA]\nDatum: [DATUM]\nTeilnehmende: [NAMEN]\nBeschlüsse:\n- [BESCHLUSS 1]\n- [BESCHLUSS 2]\nNächste Schritte mit Verantwortlichen:\n- [AUFGABE] → [NAME] bis [DATUM]',
      contentEn: 'Write a follow-up email after the meeting:\nMeeting topic: [TOPIC]\nDate: [DATE]\nParticipants: [NAMES]\nDecisions:\n- [DECISION 1]\n- [DECISION 2]\nNext steps with owners:\n- [TASK] → [NAME] by [DATE]',
      category: 'Email', difficulty: 'Einstieg', authorId: anna.id,
    },
    {
      title: 'Risiken bewerten',
      titleEn: 'Assess Risks',
      content: 'Bewerte die Risiken für folgendes Vorhaben:\nVorhaben: [BESCHREIBUNG]\nKontext: [HINTERGRUND]\n\nFormat:\n1. Top-3-Risiken (Eintrittswahrscheinlichkeit / Auswirkung)\n2. Gegenmassnahmen pro Risiko\n3. Gesamteinschätzung (niedrig / mittel / hoch)',
      contentEn: 'Assess the risks for the following project:\nProject: [DESCRIPTION]\nContext: [BACKGROUND]\n\nFormat:\n1. Top 3 risks (probability / impact)\n2. Mitigation per risk\n3. Overall assessment (low / medium / high)',
      category: 'Analysis', difficulty: 'Fortgeschritten', authorId: sarah.id,
    },
    {
      title: 'Kundenfeedback auswerten',
      titleEn: 'Analyse Customer Feedback',
      content: 'Analysiere dieses Kundenfeedback:\n[FEEDBACK EINFÜGEN]\n\nLiefere:\n1. Häufigste Themen (positiv / negativ)\n2. Dringende Handlungsfelder\n3. Empfohlene Massnahmen nach Priorität',
      contentEn: 'Analyse this customer feedback:\n[PASTE FEEDBACK]\n\nDeliver:\n1. Most common themes (positive / negative)\n2. Urgent action areas\n3. Recommended measures by priority',
      category: 'Analysis', difficulty: 'Einstieg', authorId: thomas.id,
    },
    {
      title: 'Excel-Formel erstellen',
      titleEn: 'Build an Excel Formula',
      content: 'Erstelle eine Excel-Formel für folgende Aufgabe:\nAufgabe: [BESCHREIBUNG was berechnet werden soll]\nVorhandene Spalten: [z.B. A=Datum, B=Betrag, C=Kategorie]\nBedingungen: [z.B. nur wenn Kategorie = "Schaden"]\n\nLiefere: Formel + Erklärung in einfachen Worten.',
      contentEn: 'Build an Excel formula for the following task:\nTask: [DESCRIPTION of what to calculate]\nAvailable columns: [e.g. A=Date, B=Amount, C=Category]\nConditions: [e.g. only when Category = "Claim"]\n\nDeliver: Formula + explanation in plain language.',
      category: 'Excel', difficulty: 'Fortgeschritten', authorId: lisa.id,
    },
    {
      title: 'Stellungnahme verfassen',
      titleEn: 'Write a Position Statement',
      content: 'Verfasse eine sachliche Stellungnahme:\nThema: [WORUM GEHT ES]\nMeine Position: [STANDPUNKT]\nArgumente dafür:\n- [ARGUMENT 1]\n- [ARGUMENT 2]\nMögliche Einwände: [GEGENARGUMENTE]\n\nStil: professionell, faktenbasiert, überzeugend.',
      contentEn: 'Write a factual position statement:\nTopic: [SUBJECT]\nMy position: [STANCE]\nArguments in favor:\n- [ARGUMENT 1]\n- [ARGUMENT 2]\nPossible objections: [COUNTER-ARGUMENTS]\n\nStyle: professional, fact-based, persuasive.',
      category: 'Writing', difficulty: 'Fortgeschritten', authorId: marco.id,
    },
  ];

  const prompts = await Promise.all(
    promptData.map((p) =>
      prisma.prompt.create({
        data: {
          ...p,
          usageCount: Math.floor(Math.random() * 60) + 5,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        },
      })
    )
  );

  // --- VOTES ---
  const voters = [anna, thomas, sarah, marco, lisa];
  for (const prompt of prompts) {
    const shuffled = [...voters].sort(() => Math.random() - 0.5);
    const numVoters = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < numVoters; i++) {
      const voter = shuffled[i];
      if (voter.id !== prompt.authorId) {
        await prisma.vote.create({
          data: {
            promptId: prompt.id,
            userId: voter.id,
            value: Math.floor(Math.random() * 2) + 4, // 4 or 5
          },
        });
      }
    }
  }

  // --- CHALLENGE SUBMISSIONS ---
  await prisma.challengeSubmission.create({
    data: { challengeId: challenge.id, promptId: prompts[6].id, userId: anna.id },
  });
  await prisma.challengeSubmission.create({
    data: { challengeId: challenge.id, promptId: prompts[8].id, userId: sarah.id },
  });

  // ─── LEARNING PATH ─────────────────────────────────────────────────────────

  type Block =
    | { type: 'text';    content: string }
    | { type: 'tip';     content: string }
    | { type: 'warning'; content: string }
    | { type: 'example'; label: string; bad: string; good: string; explanation: string }
    | { type: 'pattern'; name: string; template: string; example: string; useCase: string };

  const b = (blocks: Block[]) => JSON.stringify(blocks);

  // @spec AC-08-012
  const modules = [
    // ── Modul 1: KI Verstehen ──────────────────────────────────────────────
    {
      slug: 'ki-verstehen', title: 'KI verstehen', icon: '🧠', order: 1,
      description: 'Wie funktionieren KI-Modelle? Was können sie – und was nicht? Dieses Modul legt das Fundament für effektives Prompting.',
      lessons: [
        {
          slug: 'wie-llms-funktionieren', order: 1, points: 15,
          title: 'Wie LLMs funktionieren',
          content: b([
            { type: 'text', content: 'Ein Large Language Model (LLM) wie ChatGPT, Claude oder Copilot ist im Kern eine sehr grosse Wahrscheinlichkeitsmaschine. Es wurde auf riesigen Mengen Text trainiert und lernt dabei, welches Wort nach welchem anderen wahrscheinlich kommt. Daraus entsteht ein Modell, das Text generieren kann, der menschlich klingt und inhaltlich Sinn ergibt.' },
            { type: 'text', content: 'Wichtig zu verstehen: Das Modell "weiss" nichts im menschlichen Sinne. Es sucht nicht in einer Datenbank nach Antworten. Stattdessen berechnet es für jeden Token (Wortfragment) die wahrscheinlichste Fortsetzung, basierend auf dem gesamten Kontext des Gesprächs.' },
            { type: 'tip', content: 'Je mehr relevanten Kontext du gibst, desto besser kann das Modell die wahrscheinlichste (= nützlichste) Antwort berechnen. Kontext ist alles.' },
            { type: 'example', label: 'Kontext macht den Unterschied', bad: 'Erkläre mir das.', good: 'Ich bin Sachbearbeiterin im Versicherungsbereich ohne IT-Kenntnisse. Erkläre mir in 3 einfachen Sätzen, was ein API ist und warum unser IT-Team immer davon spricht.', explanation: 'Der zweite Prompt gibt dem Modell drei entscheidende Infos: Wer fragt, welches Vorwissen vorhanden ist und welches Format gewünscht wird.' },
            { type: 'text', content: 'Das Modell hat ein sogenanntes "Kontextfenster" – das ist die maximale Menge Text, die es in einer Unterhaltung gleichzeitig berücksichtigen kann. Moderne Modelle haben sehr grosse Fenster, aber die Qualität der Antworten steigt, wenn der Prompt präzise und fokussiert ist.' },
          ]),
        },
        {
          slug: 'faehigkeiten-und-grenzen', order: 2, points: 15,
          title: 'Fähigkeiten & Grenzen',
          content: b([
            { type: 'text', content: 'KI-Modelle sind ausserordentlich vielseitig: Sie können Texte schreiben, zusammenfassen, übersetzen, analysieren, strukturieren, Code erklären, Brainstorming unterstützen und vieles mehr. Diese Stärken kommen am besten zur Geltung bei klar definierten Aufgaben mit ausreichend Kontext.' },
            { type: 'tip', content: 'Stärken von LLMs: Texte formulieren und umstrukturieren, Ideen generieren, Sachverhalte erklären, Muster in Texten erkennen, Formate transformieren (z.B. Tabelle → Fliesstext), Zusammenfassen, Übersetzen.' },
            { type: 'warning', content: 'Grenzen von LLMs: Keine aktuellen Informationen (Training hat Cutoff-Datum), Keine Faktenprüfung in Echtzeit (kann plausibel klingende Fehler produzieren – "Halluzinieren"), Kein Zugriff auf interne Systeme, Keine verlässlichen Berechnungen bei komplexen Zahlen.' },
            { type: 'example', label: 'Geeignet vs. ungeeignet', bad: 'Was ist der aktuelle Eurokurs?', good: 'Ich habe diesen Währungskurs aus unserem System: 1 EUR = 1.08 USD. Hilf mir einen kurzen Kommentar für den Monatsbericht zu formulieren, der erklärt, wie sich dieser Kurs auf unsere Exportkunden auswirkt.', explanation: 'Aktuelle Daten liefert das Modell nicht zuverlässig. Aber wenn du die Daten selbst einfügst, kann es dir damit exzellent helfen – Formulieren, Interpretieren, Strukturieren.' },
            { type: 'text', content: 'Faustregel: Nutze KI als smarten Assistenten, der dir beim Denken und Formulieren hilft – nicht als allwissendes Faktenlexikon. Überprüfe Zahlen, Namen und aktuelle Fakten immer selbst.' },
          ]),
        },
        {
          slug: 'warum-prompts-wichtig-sind', order: 3, points: 15,
          title: 'Warum Prompts wichtig sind',
          content: b([
            { type: 'text', content: 'Ein Prompt ist die einzige Stellschraube, die du als Nutzer hast. Das Modell ist fixiert – aber was du herausbekommst, hängt fast vollständig davon ab, was du hineingibt. Zwei Menschen, die dasselbe Modell nutzen, können komplett unterschiedliche Resultate erzielen – je nachdem wie sie fragen.' },
            { type: 'example', label: 'Identische Frage – völlig andere Qualität', bad: 'Schreib mir eine E-Mail.', good: 'Ich bin Teamleiter und muss meinem Team mitteilen, dass unser Quartalsziel um 15% verfehlt wurde. Die Stimmung ist bereits angespannt. Schreib eine ehrliche, wertschätzende E-Mail (max. 150 Wörter), die die Fakten nennt, Verständnis zeigt und die nächsten Schritte ankündigt.', explanation: 'Der erste Prompt zwingt das Modell zu raten, was überhaupt gemeint ist. Der zweite gibt Rolle, Kontext, Ton, Länge und Struktur vor – und bekommt dafür eine sofort verwendbare E-Mail.' },
            { type: 'text', content: 'Gutes Prompting ist keine Magie – es ist eine Fähigkeit, die man in wenigen Stunden lernen kann. Die nächsten Module zeigen dir systematisch, wie es geht.' },
            { type: 'tip', content: 'Merksatz: "Garbage in, garbage out." Die Qualität des Outputs ist direkt proportional zur Qualität des Inputs. Investiere 30 Sekunden mehr in deinen Prompt und spare Minuten bei der Nachbearbeitung.' },
          ]),
        },
      ],
    },

    // ── Modul 2: Grundregeln ───────────────────────────────────────────────
    {
      slug: 'grundregeln', title: 'Die 5 Grundregeln', icon: '✍️', order: 2,
      description: 'Fünf einfache Regeln, die jeden Prompt sofort verbessern. Wer diese beherrscht, bekommt aus jedem KI-Tool deutlich bessere Ergebnisse.',
      lessons: [
        {
          slug: 'sei-spezifisch', order: 1, points: 15,
          title: 'Regel 1: Sei spezifisch',
          content: b([
            { type: 'text', content: 'Vagueness ist der häufigste Fehler beim Prompting. "Schreib etwas über X" erzwingt, dass das Modell selbst entscheidet, was relevant, wie lang und für wen der Text sein soll. Je präziser deine Anfrage, desto weniger muss das Modell raten.' },
            { type: 'example', label: 'Vage vs. spezifisch', bad: 'Schreib etwas über Cybersicherheit für unsere Mitarbeitenden.', good: 'Schreib einen kurzen Abschnitt (max. 80 Wörter) für unseren internen Newsletter zum Thema "Phishing-E-Mails erkennen". Zielgruppe: Büromitarbeitende ohne IT-Kenntnisse. Ton: freundlich, klar, ohne Fachjargon. Schliesse mit einer konkreten Handlungsempfehlung.', explanation: 'Der spezifische Prompt definiert: Länge, Medium, Thema, Zielgruppe, Ton und Abschluss. Das Ergebnis ist sofort verwendbar.' },
            { type: 'tip', content: 'Checkliste für Spezifität: Für wen ist es? Was soll es bewirken? Welches Format / welche Länge? Welcher Ton? Gibt es Einschränkungen?' },
            { type: 'example', label: 'Im Alltag: Zusammenfassung', bad: 'Fasse dieses Dokument zusammen.', good: 'Fasse dieses Dokument auf maximal 5 Bullet-Points zusammen. Jeder Punkt soll eine konkrete Massnahme oder Entscheidung benennen. Weglassen: Hintergrundinfos, die keine Konsequenz haben.', explanation: 'Ohne Vorgaben bekommst du vielleicht eine Zusammenfassung der Geschichte des Unternehmens. Mit Vorgaben bekommst du, was du wirklich brauchst.' },
          ]),
        },
        {
          slug: 'kontext-geben', order: 2, points: 15,
          title: 'Regel 2: Gib Kontext',
          content: b([
            { type: 'text', content: 'Das Modell kennt weder dich noch dein Unternehmen noch deine Situation. Wenn du Kontext weglässt, muss es davon ausgehen, dass es für eine unbekannte Person in einer unbekannten Situation schreibt. Das führt zu generischen, unbrauchbaren Antworten.' },
            { type: 'text', content: 'Guter Kontext beantwortet: Wer bin ich (Rolle, Branche)? Für wen ist das Ergebnis bestimmt? Was ist die Situation oder der Hintergrund? Was ist bereits bekannt oder entschieden?' },
            { type: 'example', label: 'Ohne vs. mit Kontext', bad: 'Schreib eine Absage für eine Bewerbung.', good: 'Ich bin HR-Mitarbeiterin bei einer Versicherung. Wir müssen einem Bewerber absagen, der in der Endrunde war und sehr qualifiziert ist, aber knapp einem internen Kandidaten unterlegen hat. Schreib eine wertschätzende Absage (ca. 100 Wörter), die die Tür für zukünftige Bewerbungen offenlässt.', explanation: 'Kontext = bessere, passendere Antwort. Das Modell weiss jetzt: Branche, Situation des Bewerbers, Grund der Absage, Tonalität und Ziel der Nachricht.' },
            { type: 'tip', content: 'Du musst keine Romane schreiben. 2–3 Sätze Kontext reichen oft aus, um die Qualität der Antwort zu verdoppeln.' },
            { type: 'example', label: 'Kontext bei Analyseaufgaben', bad: 'Was sind die Vor- und Nachteile?', good: 'Unser KMU (50 Mitarbeitende, Versicherungsbranche) evaluiert den Wechsel von Microsoft Office zu Google Workspace. Aktuelle Situation: Alle nutzen Outlook und Excel intensiv. IT-Budget ist begrenzt. Was sind die wichtigsten Vor- und Nachteile dieses Wechsels für uns?', explanation: 'Mit Kontext bekommt man eine auf die eigene Situation zugeschnittene Analyse statt allgemeiner Wikipedia-Fakten.' },
          ]),
        },
        {
          slug: 'format-definieren', order: 3, points: 15,
          title: 'Regel 3: Definiere das Format',
          content: b([
            { type: 'text', content: 'Ohne Formatvorgabe entscheidet das Modell selbst, wie es antwortet: manchmal kurz, manchmal ausführlich, mal als Fliesstext, mal als Liste. Wenn du weisst, was du brauchst, sag es explizit.' },
            { type: 'pattern', name: 'Format-Baukasten', template: 'Antworte als [Format]. Länge: [Vorgabe]. Struktur: [Abschnitte].', example: 'Antworte als Bullet-Point-Liste. Länge: max. 5 Punkte. Jeder Punkt in max. 15 Wörtern.', useCase: 'Immer dann nutzen, wenn das Ergebnis direkt kopiert oder weiterverwendet werden soll.' },
            { type: 'example', label: 'Ohne vs. mit Formatvorgabe', bad: 'Was sind die wichtigsten Risiken bei einem IT-Projekt?', good: 'Nenne die 5 häufigsten Risiken bei IT-Projekten. Format: Tabelle mit 3 Spalten: Risiko | Wahrscheinlichkeit (hoch/mittel/niedrig) | Gegenmassnahme. Keine Einleitung, direkt die Tabelle.', explanation: '"Direkt die Tabelle" ist besonders nützlich – ohne diese Anweisung beginnt das Modell oft mit einem langen Einleitungsabsatz, den du dann manuell löschen musst.' },
            { type: 'tip', content: 'Nützliche Formatanweisungen: "als Markdown-Tabelle", "als nummerierte Liste", "in 3 Absätzen", "in einem einzigen Satz", "als E-Mail mit Betreff und Grussformel", "als Stichpunkte ohne Fliesstext".' },
          ]),
        },
        {
          slug: 'rollen-vergeben', order: 4, points: 15,
          title: 'Regel 4: Weise eine Rolle zu',
          content: b([
            { type: 'text', content: 'Durch eine Rollenzuweisung aktivierst du im Modell ein bestimmtes "Denkmuster". Ein erfahrener HR-Manager formuliert eine Absage anders als ein Jurist oder ein Marketingtexter. Mit "Du bist…" kannst du steuern, aus welcher Perspektive das Modell antwortet.' },
            { type: 'pattern', name: 'Rollen-Pattern', template: 'Du bist [Rolle mit Erfahrung/Expertise]. [Aufgabe]', example: 'Du bist eine erfahrene Kommunikationsexpertin, die auf interne Unternehmenskommunikation spezialisiert ist. Schreib eine Ankündigung für unsere Mitarbeitenden, dass wir ab nächstem Monat ein neues Spesenabrechnungssystem einführen.', useCase: 'Nutzen, wenn ein bestimmter Expertenstil, Fachvokabular oder Blickwinkel gefragt ist.' },
            { type: 'example', label: 'Ohne vs. mit Rolle', bad: 'Schreib einen Einwand gegen diesen Vorschlag.', good: 'Du bist ein kritischer CFO, der jeden Ausgabevorschlag auf Wirtschaftlichkeit und Risiko prüft. Formuliere 3 kritische Fragen / Einwände zum folgenden Projektvorschlag:\n\n[Vorschlag einfügen]', explanation: 'Die Rolle "CFO" aktiviert finanzielle Denkweise. Ohne Rolle bekommst du generische Einwände. Mit Rolle bekommst du die spezifischen Fragen, die ein Finanzverantwortlicher stellen würde.' },
            { type: 'tip', content: 'Kombiniere Rolle + Kontext + Format für maximale Kontrolle: "Du bist [Rolle]. [Kontext]. Schreib [Aufgabe] als [Format]."' },
          ]),
        },
        {
          slug: 'iterieren', order: 5, points: 15,
          title: 'Regel 5: Iteriere und verfeinere',
          content: b([
            { type: 'text', content: 'Der erste Prompt ist selten der beste. Professionelle Nutzer behandeln KI wie eine Zusammenarbeit: sie geben Feedback, korrigieren, verfeinern. Das Modell erinnert sich an alles, was im Gespräch gesagt wurde, und kann gezielt angepasst werden.' },
            { type: 'example', label: 'Iterationsbeispiel', bad: 'Mach es nochmal.', good: 'Gut, aber der Ton ist zu formal für unser Team. Schreib die Version nochmals – gleiche Struktur, aber lockerer und mit einem konkreten Beispiel im zweiten Absatz.', explanation: '"Mach es nochmal" gibt dem Modell keine Information darüber, was besser sein soll. Spezifisches Feedback ("zu formal", "mit einem Beispiel") führt direkt zum gewünschten Ergebnis.' },
            { type: 'tip', content: 'Nützliche Feedback-Phrasen: "Kürzer, max. 3 Sätze.", "Formeller / lockerer.", "Füge ein konkretes Beispiel hinzu.", "Lass den zweiten Absatz weg.", "Formuliere Punkt 3 um – er klingt negativ."' },
            { type: 'text', content: 'Du musst nicht jeden Prompt von Grund auf neu schreiben. Nutze das Gespräch: "Behalte alles, ausser…" oder "Ändere nur den Abschnitt über…" spart Zeit und liefert schnell das richtige Resultat.' },
          ]),
        },
      ],
    },

    // ── Modul 3: Patterns ──────────────────────────────────────────────────
    {
      slug: 'patterns', title: 'Prompt-Patterns', icon: '🔧', order: 3,
      description: 'Bewährte Muster, die du in jede Situation einsetzen kannst. Lerne die Bausteine professionellen Promptings – mit kopierbaren Vorlagen.',
      lessons: [
        {
          slug: 'rollen-pattern', order: 1, points: 15,
          title: 'Pattern: Experten-Perspektive',
          content: b([
            { type: 'text', content: 'Das Experten-Perspektiven-Pattern kombiniert Rollenzuweisung mit einer klar definierten Aufgabe. Es funktioniert, weil das Modell in der Rolle eines Experten auf Fachwissen, Stil und Denkweise dieser Person zurückgreift.' },
            { type: 'pattern', name: 'Experten-Perspektive', template: 'Du bist [Berufsbezeichnung/Expertenrolle] mit [X] Jahren Erfahrung in [Bereich]. [Aufgabe mit Kontext].', example: 'Du bist ein erfahrener Jurist, spezialisiert auf Vertragsrecht. Erkläre mir in einfachen Worten (ohne Fachjargon), welche 3 Klauseln in einem Lieferantenvertrag besonders sorgfältig geprüft werden sollten.', useCase: 'Fachliche Texte, Analysen aus einer bestimmten Perspektive, professionelle Korrespondenz.' },
            { type: 'example', label: 'Mehrere Perspektiven gleichzeitig', bad: 'Was denkst du über unseren neuen Onboarding-Prozess?', good: 'Analysiere unseren neuen Onboarding-Prozess aus drei Perspektiven:\n1. Als neuer Mitarbeiter im ersten Arbeitstag\n2. Als HR-Managerin, die den Prozess koordiniert\n3. Als Abteilungsleiter, der den neuen Mitarbeiter empfängt\n\nJe Perspektive: Was ist gut? Was fehlt? Eine konkrete Verbesserungsidee.', explanation: 'Mehrere Rollen in einem Prompt liefern eine reichhaltigere Analyse – ohne dass du drei separate Gespräche führen musst.' },
            { type: 'tip', content: 'Für heikle Themen besonders nützlich: "Du bist ein neutraler Mediator…" oder "Du bist Advocatus Diaboli – argumentiere gegen meinen Standpunkt."' },
          ]),
        },
        {
          slug: 'chain-of-thought', order: 2, points: 15,
          title: 'Pattern: Schritt-für-Schritt denken',
          content: b([
            { type: 'text', content: 'Chain-of-Thought (Gedankenkette) ist eine Technik, bei der du das Modell explizit aufforderst, seinen Denkprozess zu zeigen. Das führt bei komplexen Aufgaben zu besseren Ergebnissen, weil das Modell nicht direkt zur Antwort "springt", sondern den Weg dorthin strukturiert.' },
            { type: 'pattern', name: 'Chain-of-Thought', template: 'Denke Schritt für Schritt. [Aufgabe]. Zeige deinen Gedankengang bevor du zur Schlussfolgerung kommst.', example: 'Denke Schritt für Schritt. Ein Kunde möchte seinen Vertrag kündigen, weil er mit der Regulierung eines Schadens unzufrieden ist. Wie würdest du vorgehen, um den Kunden zu halten? Zeige deinen Gedankengang bevor du zur Schlussfolgerung kommst.', useCase: 'Komplexe Entscheidungen, Problemlösungen, Analysen, bei denen der Denkweg genauso wichtig ist wie die Antwort.' },
            { type: 'example', label: 'Ohne vs. mit Chain-of-Thought', bad: 'Welches CRM-System sollten wir kaufen?', good: 'Wir sind ein KMU mit 20 Vertriebsmitarbeitenden in der Versicherungsbranche. Budget: max. 200 CHF/Monat. Aktuelle Schmerzen: Kein zentrales Kundendatenmanagement, manuelle Follow-ups.\n\nDenke Schritt für Schritt: (1) Was sind unsere Kernanforderungen? (2) Welche Kategorien von CRM-Systemen gibt es? (3) Welche passen zu unserem Profil? (4) Empfehlung mit Begründung.', explanation: 'Das strukturierte Vorgehen zwingt das Modell, die Entscheidung zu erarbeiten statt sie zu raten. Du bekommst auch den Denkprozess, den du dem Management zeigen kannst.' },
          ]),
        },
        {
          slug: 'few-shot', order: 3, points: 15,
          title: 'Pattern: Beispiele zeigen',
          content: b([
            { type: 'text', content: 'Few-Shot Prompting bedeutet, dass du dem Modell 1–3 Beispiele zeigst, bevor du die eigentliche Aufgabe stellst. So "kalibrierst" du den erwarteten Stil, Ton und die Struktur – ohne ihn langatmig zu beschreiben.' },
            { type: 'pattern', name: 'Few-Shot', template: 'Hier sind [X] Beispiele, wie ich [Aufgabe] formuliere:\n\nBeispiel 1: [Input] → [Output]\nBeispiel 2: [Input] → [Output]\n\nJetzt mach dasselbe für: [Neue Eingabe]', example: 'Hier sind zwei Beispiele, wie wir Kundenbeschwerden beantworten:\n\nBeschwerde 1: "Mein Schaden wurde abgelehnt." → Antwort: "Wir bedauern Ihre Enttäuschung. Ich prüfe den Fall nochmals persönlich und melde mich bis Donnerstag bei Ihnen."\n\nBeschwerde 2: "Niemand hat mich zurückgerufen." → Antwort: "Das tut uns leid. Ich sorge dafür, dass Sie noch heute von unserem zuständigen Berater kontaktiert werden."\n\nNow formuliere eine Antwort auf: "Ich warte seit 3 Wochen auf meine Auszahlung."', useCase: 'Konsistente Tonalität einhalten, Corporate Writing, Texte die einem bestimmten Unternehmensstil folgen sollen.' },
            { type: 'tip', content: 'Few-Shot ist besonders mächtig, wenn du vorhandene gute Beispiele aus deinem Unternehmen hast – Antworten auf Kundenbeschwerden, bewährte E-Mail-Formulierungen, etc.' },
          ]),
        },
        {
          slug: 'constraints', order: 4, points: 15,
          title: 'Pattern: Mit Constraints arbeiten',
          content: b([
            { type: 'text', content: 'Constraints (Einschränkungen) definieren die Grenzen, innerhalb derer das Modell arbeiten soll. Sie sind das Gegenteil von Vagheit – du sagst explizit, was du nicht willst oder welche Bedingungen gelten.' },
            { type: 'pattern', name: 'Constraint-Katalog', template: '[Aufgabe]\n\nBedingungen:\n- Maximal [X] Wörter/Sätze/Punkte\n- Kein [unerwünschtes Element]\n- Muss enthalten: [Pflichtelemente]\n- Zielgruppe: [spezifisch]\n- Sprache: [Deutsch/formell/einfach]', example: 'Schreibe eine Produktbeschreibung für unsere neue Berufsunfähigkeitsversicherung.\n\nBedingungen:\n- Maximal 100 Wörter\n- Kein Fachjargon, keine Zahlen, keine Prozentsätze\n- Muss enthalten: Hauptvorteil + Handlungsaufforderung\n- Zielgruppe: 30-jährige Berufseinsteiger ohne Versicherungswissen\n- Sprache: positiv, vertrauensweckend, direkt', useCase: 'Immer wenn du genaue Vorgaben hast: Marketing, Compliance-Texte, Newsletter, standardisierte Kommunikation.' },
            { type: 'example', label: 'Constraints in der Praxis', bad: 'Schreib eine Zusammenfassung dieses Berichts.', good: 'Schreib eine Zusammenfassung dieses Berichts.\n\nConstraints:\n- Max. 5 Sätze\n- Erster Satz: Kernaussage in einem Satz\n- Kein Passiv\n- Keine Zahlen ausschreiben (2 statt "zwei")\n- Schluss: Was ist die empfohlene nächste Aktion?', explanation: 'Constraints machen Ergebnisse reproduzierbar. Du kannst diesen Prompt nächste Woche für einen anderen Bericht verwenden und bekommst immer dasselbe Format.' },
          ]),
        },
        {
          slug: 'negative-anweisungen', order: 5, points: 15,
          title: 'Pattern: Negative Anweisungen',
          content: b([
            { type: 'text', content: 'Manchmal ist es einfacher zu definieren, was du NICHT willst. Negative Anweisungen sind oft wirkungsvoller als positive Beschreibungen, weil sie präzise Schwächen des Standard-Outputs adressieren.' },
            { type: 'example', label: 'Typische Schwächen eliminieren', bad: 'Schreib eine professionelle E-Mail.', good: 'Schreib eine professionelle E-Mail.\n\nVERMEIDE:\n- Floskeln wie "Ich hoffe, diese E-Mail findet Sie wohl"\n- Passivkonstruktionen ("Es wird darauf hingewiesen…")\n- Sätze länger als 25 Wörter\n- Substantivierungen ("die Durchführung von" statt "durchführen")', explanation: 'Modelle neigen zu bestimmten "Standardfloskeln". Negative Anweisungen schalten diese gezielt aus.' },
            { type: 'pattern', name: 'Anti-Pattern-Liste', template: '[Hauptaufgabe]\n\nVERMEIDE:\n- [Häufige Schwäche 1]\n- [Häufige Schwäche 2]\n- [Häufige Schwäche 3]', example: 'Fasse diese Kundenbeschwerden zusammen.\n\nVERMEIDE:\n- Wertende Formulierungen ("der Kunde klagt zu Unrecht…")\n- Annahmen über Absichten des Kunden\n- Formulierungen, die intern belastend wirken könnten', useCase: 'Compliance-relevante Texte, sensible Kommunikation, wenn du den Standard-Output kennst und gezielt verbessern willst.' },
            { type: 'tip', content: 'Kombiniere positive Anweisung + negative Liste für maximale Kontrolle: "Schreib [X]. Achte besonders auf [Y]. Vermeide [Z]."' },
          ]),
        },
      ],
    },

    // ── Modul 4: Alltag ────────────────────────────────────────────────────
    {
      slug: 'alltag', title: 'KI im Alltag', icon: '💼', order: 4,
      description: 'Konkrete, sofort einsetzbare Prompts für deinen Arbeitsalltag. Mit kopierbaren Vorlagen für die häufigsten Aufgaben.',
      lessons: [
        {
          slug: 'e-mails', order: 1, points: 15,
          title: 'E-Mails schreiben & verbessern',
          content: b([
            { type: 'text', content: 'E-Mail-Kommunikation ist einer der häufigsten Anwendungsfälle für KI im Büro. Ob Erstellen, Umformulieren, Kürzen oder Deeskalieren – mit den richtigen Prompts sparst du täglich 30–60 Minuten.' },
            { type: 'pattern', name: 'E-Mail aus Stichpunkten', template: 'Schreib eine professionelle E-Mail an [Empfänger/Rolle].\nAnlass: [was ist passiert/was ist das Ziel]\nKernpunkte:\n- [Punkt 1]\n- [Punkt 2]\nTon: [freundlich/sachlich/dringend]\nLänge: max. [X] Wörter', example: 'Schreib eine professionelle E-Mail an einen Kunden, der seit 2 Wochen auf eine Antwort wartet.\nAnlass: Wir hatten interne Verzögerung, können jetzt aber liefern\nKernpunkte:\n- Entschuldigung für die Verzögerung\n- Ergebnis: sein Antrag wurde genehmigt\n- Nächster Schritt: Unterlagen bis Freitag\nTon: wertschätzend, professionell\nLänge: max. 80 Wörter', useCase: 'Täglich. Immer wenn du weisst was du sagen willst, aber nicht wie.' },
            { type: 'pattern', name: 'E-Mail deeskalieren', template: 'Ich habe diese E-Mail erhalten:\n[E-MAIL EINFÜGEN]\n\nMein Standpunkt: [DEINE POSITION]\n\nSchreib eine Antwort die:\n- Verständnis zeigt ohne nachzugeben\n- Sachlich bleibt\n- Die Beziehung schützt\n- Eine konkrete nächste Aktion vorschlägt', example: 'Ich habe diese E-Mail erhalten:\n"Ich bin enttäuscht von Ihrem Service. Das ist das dritte Mal, dass mein Anliegen nicht bearbeitet wird. Ich überlege, den Vertrag zu kündigen."\n\nMein Standpunkt: Der Fehler lag bei einer internen Systemumstellung.\n\nSchreib eine Antwort die Verständnis zeigt, den Fehler anerkennt und eine konkrete Lösung innerhalb von 48h verspricht.', useCase: 'Schwierige Kundenkommunikation, Konfliktsituationen, wenn Emotionen hochgehen.' },
            { type: 'tip', content: 'Zeitsparer: Schick dem Modell eine bestehende E-Mail und bitte es: "Kürze diese E-Mail auf das Wesentliche, max. 5 Sätze, formeller Ton."' },
          ]),
        },
        {
          slug: 'zusammenfassen', order: 2, points: 15,
          title: 'Texte zusammenfassen',
          content: b([
            { type: 'text', content: 'Zusammenfassen ist eine der Killer-Anwendungen für KI. Lange Berichte, Protokolle, E-Mail-Threads, Artikel – in Minuten auf das Wesentliche reduziert. Der Schlüssel liegt in der Frage: Was soll die Zusammenfassung leisten?' },
            { type: 'pattern', name: 'Action-Oriented Summary', template: 'Fasse folgenden Text zusammen.\n\nFokus: [Was ist für mich/meine Rolle wichtig]\nFormat: [Bullet-Points / Fliesstext / Tabelle]\nLänge: max. [X] Sätze/Punkte\nBesonders wichtig: [spezifisches Element]\n\n[TEXT EINFÜGEN]', example: 'Fasse folgenden Sitzungsbericht zusammen.\n\nFokus: Nur Entscheidungen und Aufgaben, keine Hintergrunddiskussionen\nFormat: Zwei Abschnitte – "Beschlüsse" und "Aufgaben mit Verantwortlichen"\nLänge: max. 10 Bullet-Points total\nBesonders wichtig: Deadlines hervorheben\n\n[TEXT EINFÜGEN]', useCase: 'Protokolle, Berichte, lange E-Mail-Threads, Artikel, Gesprächsnotizen.' },
            { type: 'example', label: 'E-Mail-Thread zusammenfassen', bad: 'Fasse diesen E-Mail-Thread zusammen.', good: 'Fasse diesen E-Mail-Thread zusammen.\n\nIch bin die neue Projektverantwortliche und brauche:\n1. Was wurde entschieden?\n2. Was ist noch offen?\n3. Wer ist für was zuständig?\n4. Was muss ich als nächstes tun?\n\nMax. 1 Satz pro Punkt.\n\n[THREAD EINFÜGEN]', explanation: 'Als neue Projektverantwortliche brauchst du andere Infos als ein externer Leser. Kontext + spezifische Fragen liefern eine sofort verwendbare Übergabe.' },
            { type: 'tip', content: 'Für Berichte: "Erstelle eine Executive Summary: 1 Satz Gesamtbotschaft, 3 Haupterkenntnisse, 1 empfohlene Massnahme." – Perfekt für das Management.' },
          ]),
        },
        {
          slug: 'brainstorming', order: 3, points: 15,
          title: 'Brainstorming & Ideen entwickeln',
          content: b([
            { type: 'text', content: 'KI ist ein unermüdlicher Brainstorming-Partner, der nie müde wird und keine Idee als "dumm" bewertet. Der Trick: Du musst nicht alle Ideen verwenden – aber selbst 1–2 gute Impulse können deinen Denkprozess entscheidend vorwärtsbringen.' },
            { type: 'pattern', name: 'Brainstorming-Kickstart', template: 'Generiere [Anzahl] Ideen für [Ziel/Problem].\n\nKontext: [Situation, Einschränkungen, Zielgruppe]\nKriterien: [Was macht eine gute Idee aus?]\nAusschliessen: [Was soll NICHT vorgeschlagen werden?]', example: 'Generiere 10 kreative Ideen, wie wir neue Mitarbeitende in ihrer ersten Woche willkommen heissen können.\n\nKontext: Versicherungsunternehmen, 50 Mitarbeitende, Home-Office ist möglich\nKriterien: Günstig, umsetzbar, persönlich\nAusschliessen: Standardmassnahmen wie "Willkommenspaket mit Kugelschreiber"', useCase: 'Alle kreativen Blockaden, Kampagnenideen, Problemlösungen, wenn du "frische Augen" brauchst.' },
            { type: 'example', label: 'Ideen kritisch weiterentwickeln', bad: 'Ist das eine gute Idee?', good: 'Ich habe folgende Idee: [IDEE BESCHREIBEN]\n\nBitte analysiere:\n1. Was spricht dafür? (3 Punkte)\n2. Was sind die grössten Risiken oder Schwächen? (3 Punkte)\n3. Wie könnte ich die Idee stärken?\n4. Eine alternative Idee, die dasselbe Ziel anders erreicht.', explanation: 'Mit "Ist das eine gute Idee?" bekommst du oft nur Bestätigung. Strukturierte Kritik-Analyse liefert echten Mehrwert.' },
            { type: 'tip', content: 'Anti-Konformitäts-Trick: Frage das Modell: "Spiele Advocatus Diaboli – warum könnte diese Idee scheitern?" Das hilft, blinde Flecken zu finden.' },
          ]),
        },
        {
          slug: 'dokumente', order: 4, points: 15,
          title: 'Dokumente & Präsentationen',
          content: b([
            { type: 'text', content: 'Ob Berichte strukturieren, Präsentationen aufbauen oder Stellungnahmen formulieren – KI kann als Ghostwriter, Strukturgeber und kritischer Lektor fungieren. Besonders wertvoll: Rohmaterial (Stichpunkte, unstrukturierte Notizen) in professionelle Dokumente verwandeln.' },
            { type: 'pattern', name: 'Rohmaterial zu Dokument', template: 'Wandle diese unstrukturierten Notizen in ein professionelles [Dokumentformat] um.\n\nDokumenttyp: [z.B. Projektbericht, Konzeptpapier, Antrag]\nZielgruppe: [Wer liest es?]\nTon: [formell/sachlich/überzeugend]\nStruktur: [Gewünschte Abschnitte oder "entscheide selbst"]\n\nNotizen:\n[ROHMATERIAL EINFÜGEN]', example: 'Wandle diese Notizen in eine strukturierte Präsentationsgliederung um.\n\nDokumenttyp: Präsentation für das Management (15 Min.)\nZielgruppe: Geschäftsleitung, erwartet konkrete Zahlen und Empfehlungen\nTon: sachlich, überzeugend\nStruktur: Problem → Analyse → Lösung → Nächste Schritte\n\nNotizen:\n[STICHPUNKTE EINFÜGEN]', useCase: 'Berichte, Konzepte, Anträge, Präsentationsgliederungen aus vorhandenem Rohmaterial.' },
            { type: 'example', label: 'KI als Lektor', bad: 'Ist mein Text gut?', good: 'Du bist ein erfahrener Lektor für Geschäftskommunikation. Überprüfe meinen Text auf:\n1. Klarheit – Gibt es Sätze, die schwer verständlich sind?\n2. Ton – Stimmt der Ton für die Zielgruppe (Management)?\n3. Struktur – Ist der rote Faden klar?\n4. Konkretheit – Wo fehlen Beispiele oder Zahlen?\n\nGib für jeden Punkt 1–2 konkrete Verbesserungsvorschläge.\n\n[TEXT EINFÜGEN]', explanation: 'Als Lektor bekommst du strukturiertes, umsetzbares Feedback statt einem "Sieht gut aus" oder einem unsortierten Texthaufen voller Kommentare.' },
          ]),
        },
      ],
    },

    // ── Modul 5: Fortgeschritten ───────────────────────────────────────────
    {
      slug: 'fortgeschritten', title: 'Fortgeschrittene Techniken', icon: '🚀', order: 5,
      description: 'Für alle, die KI bereits routinemässig einsetzen und den nächsten Schritt machen wollen: Chaining, Personas, komplexe Workflows.',
      lessons: [
        {
          slug: 'prompt-chaining', order: 1, points: 15,
          title: 'Prompt-Chaining',
          content: b([
            { type: 'text', content: 'Prompt-Chaining bedeutet, komplexe Aufgaben in mehrere sequenzielle Schritte aufzuteilen. Statt alles in einem einzigen überlangen Prompt zu verlangen, führst du das Modell Schritt für Schritt durch den Prozess – der Output eines Schritts wird zum Input des nächsten.' },
            { type: 'example', label: 'Ohne vs. mit Chaining', bad: 'Analysiere unsere Kundenzufriedenheitsumfrage, identifiziere Trends, erstelle einen Bericht und schlage Massnahmen vor.', good: 'Schritt 1: "Hier sind 50 Kundenkommentare. Kategorisiere sie in maximal 5 Themen und nenne wie viele Kommentare pro Thema fallen."\n\nSchritt 2: "Gut. Welche 2 Themen haben das grösste Verbesserungspotenzial? Begründe kurz."\n\nSchritt 3: "Schlage für diese 2 Themen je 3 konkrete, umsetzbare Massnahmen vor."\n\nSchritt 4: "Fasse alles in einem 1-seitigen Executive Summary zusammen."', explanation: 'Chaining produziert bessere Ergebnisse, weil jeder Schritt fokussiert ist. Du kannst auch nach jedem Schritt korrigieren, bevor du weitermachst.' },
            { type: 'tip', content: 'Faustregel: Wenn dein Prompt länger als 3 Aufgaben enthält, teile ihn in Schritte auf. Nutze die Antwort eines Schritts explizit als Input für den nächsten.' },
            { type: 'pattern', name: 'Chaining-Template', template: 'SCHRITT 1: [Erste Teilaufgabe – Ergebnis A]\n[Output von Schritt 1 verwenden]\nSCHRITT 2: "Basierend auf deiner Analyse aus Schritt 1: [Zweite Aufgabe – Ergebnis B]"\nSCHRITT 3: "Jetzt erstelle aus A und B: [Finale Aufgabe]"', example: 'SCHRITT 1: "Lies dieses Meeting-Protokoll und liste alle offenen Punkte auf."\nSCHRITT 2: "Priorisiere diese Punkte nach Dringlichkeit (hoch/mittel/niedrig)."\nSCHRITT 3: "Schreib für die 3 dringendsten Punkte je eine konkrete Aufgabe mit Deadline und Verantwortlichen."', useCase: 'Komplexe Analysen, mehrstufige Dokumentenerstellung, wenn Qualitätskontrolle zwischen Schritten wichtig ist.' },
          ]),
        },
        {
          slug: 'personas', order: 2, points: 15,
          title: 'Personas & System-Prompts',
          content: b([
            { type: 'text', content: 'Eine Persona ist eine detaillierte Rollenbeschreibung, die du am Anfang eines Gesprächs einrichtest. Sie bleibt für das gesamte Gespräch aktiv und steuert Ton, Perspektive und Expertise des Modells. Das ist mächtiger als einzelne Rollenzuweisungen per Prompt.' },
            { type: 'pattern', name: 'Persona einrichten', template: 'Du bist [Name/Rolle]. Du arbeitest für [Kontext]. Deine Aufgabe ist [Beschreibung]. Dein Kommunikationsstil ist [Ton]. Du antwortest immer [spezifische Eigenschaft]. Wenn du etwas nicht weisst, sagst du es direkt.', example: 'Du bist "Alex", ein erfahrener interner Coach für Führungskräfte bei unserem Versicherungsunternehmen. Du hast 15 Jahre Erfahrung in Organisationsentwicklung und kennst die Herausforderungen des mittleren Managements sehr gut. Dein Stil ist: direkt, empathisch, lösungsorientiert. Du gibst immer konkrete nächste Schritte. Wenn du mehr Kontext brauchst, fragst du nach.', useCase: 'Wenn du ein KI-Tool für ein bestimmtes wiederkehrendes Szenario einrichten willst: interner Coach, Redaktionsassistent, Feedback-Geber.' },
            { type: 'example', label: 'Persona für konsistente Qualität', bad: 'Du bist mein Assistent.', good: 'Du bist meine persönliche Kommunikationsassistentin für alle schriftlichen Aufgaben. Dein Stil: professionell und klar, aber nie steif. Du verwendest immer aktive Formulierungen. Du fragst nach, wenn der Kontext fehlt. Wenn ich einen Text zeige, gibst du immer zuerst das Positive, dann 1–2 konkrete Verbesserungsvorschläge.', explanation: 'Eine detaillierte Persona macht das Modell konsistenter über viele Gespräche hinweg – und du sparst Zeit, weil du nicht bei jedem Prompt von vorn erklären musst.' },
            { type: 'tip', content: 'Speichere deine bewährten Personas als Textdatei oder in einem Notizdokument. So kannst du sie schnell in ein neues Gespräch einfügen.' },
          ]),
        },
        {
          slug: 'haeufige-fehler', order: 3, points: 15,
          title: 'Häufige Fehler vermeiden',
          content: b([
            { type: 'text', content: 'Auch erfahrene KI-Nutzer tappen in bestimmte Fallen. Dieses Modul fasst die häufigsten Fehler zusammen – und wie man sie vermeidet.' },
            { type: 'warning', content: 'Fehler 1: Dem Modell blind vertrauen. KI-Modelle können plausibel klingende Fehlinformationen produzieren ("halluzinieren"). Zahlen, Namen, Daten und Fakten immer selbst überprüfen – besonders bei wichtigen Dokumenten.' },
            { type: 'example', label: 'Fehler 2: Zu kurze Prompts für komplexe Aufgaben', bad: 'Erkläre mir Datenschutz.', good: 'Erkläre mir die wichtigsten DSGVO-Pflichten für ein KMU, das Kundendaten speichert. Fokus: Was müssen wir konkret umsetzen? Format: Checkliste. Zielgruppe: Geschäftsführer ohne Rechtskenntnisse.', explanation: '"Erkläre mir Datenschutz" könnte einen 20-seitigen Aufsatz oder einen Tweet erzeugen. Kontext + Format + Zielgruppe macht die Antwort sofort verwendbar.' },
            { type: 'warning', content: 'Fehler 3: Vertrauliche Daten eingeben. Gib keine Kundendaten, Personaldaten, Geschäftsgeheimnisse oder andere vertrauliche Informationen in öffentliche KI-Tools ein. Nutze stattdessen Platzhalter: [KUNDENNAME], [BETRAG], [VERTRAGSNUMMER].' },
            { type: 'example', label: 'Fehler 4: Beim ersten Ergebnis aufhören', bad: '[Akzeptiert die erste mittelmässige Antwort ohne Nachfrage]', good: '"Fast gut. Aber der dritte Absatz ist zu vage. Formuliere ihn konkret mit einem Beispiel. Den letzten Satz kannst du weglassen, er fügt nichts hinzu."', explanation: 'Das beste Ergebnis kommt selten beim ersten Versuch. 1–2 gezielte Feedback-Runden verbessern das Resultat oft dramatisch.' },
            { type: 'tip', content: 'Goldene Regel: Je wichtiger das Dokument, desto mehr Zeit lohnt es sich in den Prompt zu investieren. Für eine interne Notiz reichen 30 Sekunden. Für einen Kundenbericht nimm dir 5 Minuten für den Prompt.' },
          ]),
        },
      ],
    },
  ];

  // @spec AC-08-012
  let totalLessons = 0;
  for (const mod of modules) {
    const created = await prisma.learningModule.create({
      data: {
        slug:        mod.slug,
        title:       mod.title,
        description: mod.description,
        icon:        mod.icon,
        order:       mod.order,
        lessons: {
          create: mod.lessons.map((l) => ({
            slug:    l.slug,
            title:   l.title,
            content: l.content,
            order:   l.order,
            points:  l.points,
          })),
        },
      },
    });
    totalLessons += mod.lessons.length;
    console.log(`   📖 Modul "${created.title}" (${mod.lessons.length} Lektionen)`);
  }

  console.log('✅ Seed complete!');
  console.log(`   👥 ${users.length} users`);
  console.log(`   📝 ${prompts.length} prompts`);
  console.log(`   🏆 1 weekly challenge`);
  console.log(`   🧠 5 Lernmodule, ${totalLessons} Lektionen`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
