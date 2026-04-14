import { PrismaClient } from '@prisma/client';
import { getLevel } from '../lib/points';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PromptArena...');

  // Clear existing data (order respects FK constraints)
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

  console.log('✅ Seed complete!');
  console.log(`   👥 ${users.length} users`);
  console.log(`   📝 ${prompts.length} prompts`);
  console.log(`   🏆 1 weekly challenge`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
