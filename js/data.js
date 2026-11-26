/*
 * ============================================================
 *  EISERN ALESSIO – Turnierdaten
 * ============================================================
 *  Dies ist die EINZIGE Datei, die für ein neues Turnier
 *  geändert werden muss. Alle Seiten (Startseite, Turniere,
 *  Turnierdetails, Statistiken, Spieler) werden daraus erzeugt.
 *
 *  Neues Turnier: Einen Block in `tournaments` kopieren,
 *  `nr` hochzählen und Werte eintragen. Felder, die nicht
 *  bekannt sind, einfach weglassen – die Seite blendet sie aus.
 *
 *  Zahlen mit Punkt schreiben (41.73), die Seite zeigt sie
 *  automatisch mit Komma an. Datum als 'JJJJ-MM-TT'.
 *
 *  Felder in `stats` (alle optional):
 *    p        Spielername
 *    avg      3-Dart-Average im Turnier
 *    hs       Highest Score
 *    hco      Highest Checkout
 *    minDarts Kürzestes Leg in Darts
 *    coHit / coAtt   Checkout-Treffer / -Versuche
 *    gp, gw   Games gespielt / gewonnen
 *    lp, lw   Legs gespielt / gewonnen
 *    s60, s100, s140, s180   Anzahl Aufnahmen wie bei Autodarts in Bereichen:
 *             60–99 / 100–139 / 140–179 / 180 (jede Aufnahme zählt nur einmal)
 *
 *  Felder in Matches (Gruppe & Endrunde):
 *    p1, p2   Spieler,   s1, s2  Legs
 *    d1       Punktdifferenz aus Sicht von p1 (optional)
 *    a1, a2   Averages (optional)
 *    c1, c2   Checkouts als Text, z. B. '2/16' (optional)
 *    n1, n2   Geworfene Darts laut Autodarts (optional). Sind sie
 *             zusammen mit a1/a2 bei allen Matches eines Spielers
 *             vorhanden, berechnet die Website den Turnier-Average
 *             exakt (Summe Ø × Darts ÷ Summe Darts).
 *    sc1, sc2 Aufnahmen im Match laut Autodarts als [60–99, 100–139, 140–179, 180]
 *             (optional). Sind sie bei allen Matches eines Spielers vorhanden,
 *             werden s60/s100/s140/s180 in stats daraus berechnet.
 *
 *  Weitere Felder pro Turnier (alle optional):
 *    time     Startzeit 'HH:MM' (für die Uhr „Seit dem letzten Turnier“)
 *    events   [ { type: '180' | 'highfinish' | '9darter', p: 'Spieler', v: 121, note: '…' } ]
 *             highfinish = Checkout ab 100 (nur Double Out), v = Wert des Finishes
 *
 *  Felder pro Spieler in `players` (alle optional, leer = „noch nicht hinterlegt“):
 *    founder       true bei Gründungsmitgliedern
 *    photo         Bildpfad, z. B. 'assets/spieler/katsche.jpg'
 *    nickname      Herkunft des Spitznamens
 *    walkOn        Walk-On-Song
 *    favDouble     Lieblingsdoppel (ein Pfeil), z. B. 'D16'
 *    dreamFinish   Traumfinish, z. B. 'Shanghai' oder 'Champagne Finish'
 *    hand          Wurfhand
 *    darts         Darts (Marke, Gewicht)
 *    favPlayer     Lieblingsspieler
 *    favWalkOn     Lieblings-Walk-On (eines Profis), z. B. '„Shut Up and Dance“ (Michael Smith)'
 *    favNickname   Lieblingsspitzname (eines Profis), z. B. 'The Kirkulator'
 *
 *  nextTournament: Sobald das nächste Turnier geplant ist, z. B.
 *    { date: '2026-12-12', time: '18:00', venue: 'Bovenden', host: 'Fynn' }
 *    → Die Startseite zeigt dann einen Countdown statt der Uhr seit dem letzten Turnier.
 * ============================================================
 */

window.EA_DATA = {
  players: {
    Katsche:    { founder: true, photo: '', nickname: 'Kommt von der Legende Katsche Schwarzenbeck', walkOn: 'Katchi', favDouble: 'D20', dreamFinish: 'Tops Tops', hand: 'Rechts', darts: 'RED DRAGON Razor 24g', favPlayer: 'Gary Anderson', favWalkOn: '„Shut Up and Dance“ (Michael Smith)', favNickname: 'The Kirkulator' },
    Otter:      { founder: true, photo: '', nickname: '', walkOn: '', favDouble: '', dreamFinish: '', hand: '', darts: '', favPlayer: '', favWalkOn: '', favNickname: '' },
    Quaasus:    { founder: true, photo: '', nickname: '', walkOn: '', favDouble: '', dreamFinish: '', hand: '', darts: '', favPlayer: '', favWalkOn: '', favNickname: '' },
    Sweaty:     { founder: true, photo: '', nickname: '', walkOn: '', favDouble: '', dreamFinish: '', hand: '', darts: '', favPlayer: '', favWalkOn: '', favNickname: '' },
    Killernini: { photo: '', nickname: '', walkOn: '', favDouble: '', dreamFinish: '', hand: '', darts: '', favPlayer: '', favWalkOn: '', favNickname: '' },
    Hugo:       { photo: '', nickname: '', walkOn: '', favDouble: '', dreamFinish: '', hand: '', darts: '', favPlayer: '', favWalkOn: '', favNickname: '' },
    Fynn:       { photo: '', nickname: '', walkOn: '', favDouble: '', dreamFinish: '', hand: '', darts: '', favPlayer: '', favWalkOn: '', favNickname: '' },
    Samier:     { photo: '', nickname: '', walkOn: '', favDouble: '', dreamFinish: '', hand: '', darts: '', favPlayer: '', favWalkOn: '', favNickname: '' },
    Reto:       { photo: '', nickname: '', walkOn: '', favDouble: '', dreamFinish: '', hand: '', darts: '', favPlayer: '', favWalkOn: '', favNickname: '' }
  },

  nextTournament: null,

  tournaments: [
    /* ---------------------------------------------------- I */
    {
      nr: 1,
      date: '2025-06-06',
      host: 'Katsche',
      venue: 'Bovenden',
      country: 'Deutschland',
      mode: '501 · Single Out · Legmodus',
      placements: ['Sweaty', 'Katsche', 'Otter', 'Quaasus', 'Killernini'],
      ballonDart: 'Katsche',
      groups: [
        {
          name: 'Gruppe',
          standings: [
            { p: 'Katsche',    legs: '4-0', diff: 459 },
            { p: 'Otter',      legs: '3-1', diff: 290 },
            { p: 'Sweaty',     legs: '2-2', diff: -114 },
            { p: 'Quaasus',    legs: '1-3', diff: -316 },
            { p: 'Killernini', legs: '0-4', diff: -319 }
          ]
        }
      ],
      groupMatches: [
        { p1: 'Katsche', p2: 'Killernini', s1: 1, s2: 0, d1: 23 },
        { p1: 'Otter',   p2: 'Quaasus',    s1: 1, s2: 0, d1: 50 },
        { p1: 'Sweaty',  p2: 'Killernini', s1: 1, s2: 0, d1: 39 },
        { p1: 'Katsche', p2: 'Otter',      s1: 1, s2: 0, d1: 5 },
        { p1: 'Sweaty',  p2: 'Quaasus',    s1: 1, s2: 0, d1: 112 },
        { p1: 'Quaasus', p2: 'Killernini', s1: 1, s2: 0, d1: 96 },
        { p1: 'Otter',   p2: 'Sweaty',     s1: 1, s2: 0, d1: 84 },
        { p1: 'Katsche', p2: 'Quaasus',    s1: 1, s2: 0, d1: 250 },
        { p1: 'Otter',   p2: 'Killernini', s1: 1, s2: 0, d1: 161 },
        { p1: 'Katsche', p2: 'Sweaty',     s1: 1, s2: 0, d1: 181 }
      ],
      knockout: [
        { round: 'Halbfinale', bo: 3, p1: 'Katsche', p2: 'Quaasus', s1: 2, s2: 0 },
        { round: 'Halbfinale', bo: 3, p1: 'Sweaty',  p2: 'Otter',   s1: 2, s2: 0 },
        { round: 'Spiel um Platz 3', bo: 1, text: 'Otter, Quaasus, Killernini', result: '3. Otter · 4. Quaasus · 5. Killernini' },
        { round: 'Finale', bo: 5, p1: 'Sweaty', p2: 'Katsche', s1: 3, s2: 2 }
      ],
      stats: [
        { p: 'Sweaty',     gp: 6, gw: 4,   lp: 11, lw: 7,   avg: 41.08, hs: 121, hco: 89, minDarts: 27, s60: 19, s100: 4, s140: 0, s180: 0 },
        { p: 'Katsche',    gp: 6, gw: 5,   lp: 11, lw: 8,   avg: 41.73, hs: 140, hco: 43, minDarts: 25, s60: 24, s100: 1, s140: 1, s180: 0 },
        { p: 'Otter',      gp: 6, gw: 3,   lp: 8,  lw: 4,   avg: 39.15, hs: 125, hco: 57, minDarts: 32, s60: 10, s100: 2, s140: 0, s180: 0 },
        { p: 'Quaasus',    gp: 6, gw: 1.5, lp: 8,  lw: 1.5, avg: 38.44, hs: 98,  hco: 1,  minDarts: 34, s60: 15, s100: 0, s140: 0, s180: 0 },
        { p: 'Killernini', gp: 6, gw: 0,   lp: 6,  lw: 0,   avg: 35.03, hs: 113,                       s60: 11, s100: 1, s140: 0, s180: 0 }
      ]
    },

    /* --------------------------------------------------- II */
    {
      nr: 2,
      date: '2025-10-08',
      host: 'Sweaty',
      venue: 'Blåvand',
      country: 'Dänemark',
      mode: '501 · Single Out · Legmodus',
      placements: ['Katsche', 'Otter', 'Sweaty', 'Quaasus'],
      knockout: [
        { round: 'Halbfinale', bo: 3, p1: 'Otter',   p2: 'Sweaty',  s1: 2, s2: 0 },
        { round: 'Halbfinale', bo: 3, p1: 'Quaasus', p2: 'Katsche', s1: 1, s2: 2 },
        { round: 'Spiel um Platz 3', bo: 1, p1: 'Sweaty', p2: 'Quaasus', s1: 1, s2: 0 },
        { round: 'Finale', bo: 5, p1: 'Katsche', p2: 'Otter', s1: 3, s2: 2 }
      ],
      notes: ['Für die Gruppenphase und die Spielerstatistiken liegen keine Daten vor.']
    },

    /* -------------------------------------------------- III */
    {
      nr: 3,
      date: '2026-01-25',
      host: 'Katsche',
      venue: 'Bovenden',
      country: 'Deutschland',
      mode: '501 · Single Out · Legmodus',
      placements: ['Katsche', 'Quaasus', 'Fynn', 'Sweaty', 'Hugo', 'Samier'],
      ballonDart: 'Fynn',
      events: [{ type: '180', p: 'Quaasus' }],
      groups: [
        {
          name: 'Gruppe A',
          standings: [
            { p: 'Sweaty',  legs: '4-2', diff: -67 },
            { p: 'Katsche', legs: '3-3', diff: 286 },
            { p: 'Hugo',    legs: '2-4', diff: -219 }
          ]
        },
        {
          name: 'Gruppe B',
          standings: [
            { p: 'Fynn',    legs: '4-2', diff: 330 },
            { p: 'Quaasus', legs: '4-2', diff: 56 },
            { p: 'Samier',  legs: '1-5', diff: -386 }
          ]
        }
      ],
      groupMatches: [
        { p1: 'Hugo',    p2: 'Sweaty',  s1: 0, s2: 1, d1: -43, a1: 50.89, a2: 50.10, n1: 27, n2: 30, sc1: [3, 0, 0, 0], sc2: [2, 1, 0, 0] },
        { p1: 'Quaasus', p2: 'Fynn',    s1: 0, s2: 1, d1: -209, a1: 36.50, a2: 55.67, n1: 24, n2: 27, sc1: [1, 0, 0, 0], sc2: [3, 1, 0, 0] },
        { p1: 'Katsche', p2: 'Hugo',    s1: 0, s2: 1, d1: -254, a1: 35.29, a2: 65.35, n1: 21, n2: 23, sc1: [1, 0, 0, 0], sc2: [3, 0, 1, 0] },
        { p1: 'Fynn',    p2: 'Samier',  s1: 1, s2: 0, d1: 147, a1: 60.12, a2: 44.25, n1: 25, n2: 24, sc1: [2, 2, 0, 0], sc2: [2, 0, 0, 0] },
        { p1: 'Katsche', p2: 'Sweaty',  s1: 0, s2: 1, d1: -14, a1: 48.70, a2: 46.97, n1: 30, n2: 32, sc1: [2, 2, 0, 0], sc2: [2, 1, 0, 0] },
        { p1: 'Samier',  p2: 'Quaasus', s1: 0, s2: 1, d1: -23, a1: 43.45, a2: 44.21, n1: 33, n2: 34, sc1: [2, 0, 0, 0], sc2: [3, 0, 0, 0] },
        { p1: 'Sweaty',  p2: 'Hugo',    s1: 1, s2: 0, d1: 167, a1: 51.83, a2: 37.11, n1: 29, n2: 27, sc1: [5, 0, 0, 0], sc2: [2, 0, 0, 0] },
        { p1: 'Fynn',    p2: 'Quaasus', s1: 0, s2: 1, d1: -169, a1: 33.20, a2: 48.48, n1: 30, n2: 31, sc1: [1, 0, 0, 0], sc2: [4, 0, 0, 0] },
        { p1: 'Hugo',    p2: 'Katsche', s1: 0, s2: 1, d1: -267, a1: 33.43, a2: 71.57, n1: 21, n2: 21, sc1: [0, 0, 0, 0], sc2: [2, 2, 0, 0] },
        { p1: 'Samier',  p2: 'Fynn',    s1: 0, s2: 1, d1: -48, a1: 34.85, a2: 40.62, n1: 39, n2: 37, sc1: [1, 0, 0, 0], sc2: [2, 0, 0, 0] },
        { p1: 'Sweaty',  p2: 'Katsche', s1: 0, s2: 1, d1: -112, a1: 48.63, a2: 57.81, n1: 24, n2: 26, sc1: [1, 1, 0, 0], sc2: [2, 2, 0, 0] },
        { p1: 'Quaasus', p2: 'Samier',  s1: 1, s2: 0, d1: 50, a1: 38.54, a2: 34.69, n1: 39, n2: 39, sc1: [1, 0, 0, 0], sc2: [1, 0, 0, 0] },
        { p1: 'Hugo',    p2: 'Sweaty',  s1: 0, s2: 1, d1: -28, a1: 43.00, a2: 46.97, n1: 33, n2: 32, sc1: [2, 0, 0, 0], sc2: [2, 0, 0, 0] },
        { p1: 'Quaasus', p2: 'Fynn',    s1: 1, s2: 0, d1: 87, a1: 55.67, a2: 46.00, n1: 27, n2: 27, sc1: [5, 0, 0, 0], sc2: [2, 0, 0, 0] },
        { p1: 'Katsche', p2: 'Hugo',    s1: 0, s2: 1, d1: -32, a1: 52.11, a2: 53.68, n1: 27, n2: 28, sc1: [2, 0, 0, 0], sc2: [3, 1, 0, 0] },
        { p1: 'Fynn',    p2: 'Samier',  s1: 1, s2: 0, d1: 182, a1: 62.63, a2: 45.57, n1: 24, n2: 21, sc1: [4, 1, 0, 0], sc2: [1, 0, 0, 0] },
        { p1: 'Katsche', p2: 'Sweaty',  s1: 1, s2: 0, d1: 207, a1: 51.83, a2: 32.67, n1: 29, n2: 27, sc1: [2, 0, 1, 0], sc2: [0, 0, 0, 0] },
        { p1: 'Samier',  p2: 'Quaasus', s1: 1, s2: 0, d1: 64, a1: 44.21, a2: 39.73, n1: 34, n2: 33, sc1: [3, 0, 0, 0], sc2: [1, 0, 0, 0] }
      ],
      knockout: [
        { round: 'Halbfinale', bo: 3, p1: 'Fynn',    p2: 'Katsche', s1: 1, s2: 2, a1: 54.70, a2: 57.16, n1: 77, n2: 77, sc1: [12, 2, 0, 0], sc2: [6, 3, 0, 0] },
        { round: 'Halbfinale', bo: 3, p1: 'Quaasus', p2: 'Sweaty',  s1: 2, s2: 0, a1: 51.83, a2: 39.16, n1: 58, n2: 57, sc1: [4, 0, 0, 1], sc2: [2, 0, 0, 0] },
        { round: 'Spiel um Platz 5', bo: 3, p1: 'Hugo', p2: 'Samier', s1: 2, s2: 0, a1: 53.68, a2: 33.22, n1: 56, n2: 54, sc1: [4, 1, 0, 0], sc2: [1, 0, 0, 0] },
        { round: 'Spiel um Platz 3', bo: 3, p1: 'Sweaty', p2: 'Fynn', s1: 0, s2: 2, a1: 45.40, a2: 68.32, n1: 45, n2: 44, sc1: [4, 0, 0, 0], sc2: [6, 0, 1, 0] },
        { round: 'Finale', bo: 5, p1: 'Katsche', p2: 'Quaasus', s1: 3, s2: 1, a1: 47.41, a2: 41.19, n1: 122, n2: 119, sc1: [11, 1, 0, 0], sc2: [6, 1, 0, 0] }
      ],
      stats: [
        { p: 'Katsche', avg: 51.85, hs: 140, hco: 46,  minDarts: 21, s60: 28, s100: 10, s140: 1, s180: 0 },
        { p: 'Quaasus', avg: 44.13, hs: 180, hco: 81,  minDarts: 24, s60: 25, s100: 1,  s140: 0, s180: 1 },
        { p: 'Fynn',    avg: 53.15, hs: 140, hco: 95,  minDarts: 19, s60: 32, s100: 6,  s140: 1, s180: 0 },
        { p: 'Sweaty',  avg: 44.70, hs: 121, hco: 38,  minDarts: 29, s60: 18, s100: 3,  s140: 0, s180: 0 },
        { p: 'Hugo',    avg: 48.88, hs: 140, hco: 114, minDarts: 23, s60: 17, s100: 2,  s140: 1, s180: 0 },
        { p: 'Samier',  avg: 38.78, hs: 92,  hco: 14,  minDarts: 34, s60: 11, s100: 0,  s140: 0, s180: 0 }
      ]
    },

    /* --------------------------------------------------- IV */
    {
      nr: 4,
      date: '2026-02-28',
      host: 'Katsche',
      venue: 'Bovenden',
      country: 'Deutschland',
      mode: '501 · Double Out · Legmodus',
      placements: ['Fynn', 'Katsche', 'Hugo', 'Reto', 'Sweaty', 'Quaasus'],
      ballonDart: 'Katsche',
      groups: [
        {
          name: 'Gruppe A',
          standings: [
            { p: 'Fynn',   games: '4-0', legs: '8-0' },
            { p: 'Reto',   games: '2-2', legs: '4-6' },
            { p: 'Sweaty', games: '0-4', legs: '2-8' }
          ]
        },
        {
          name: 'Gruppe B',
          standings: [
            { p: 'Katsche', games: '2-2', legs: '6-4' },
            { p: 'Hugo',    games: '2-2', legs: '4-5' },
            { p: 'Quaasus', games: '2-2', legs: '4-5' }
          ],
          tiebreak: [
            { p1: 'Hugo', p2: 'Quaasus', s1: 1, s2: 0, a1: 46.97, a2: 48.70, c1: '1/2', c2: '0/3', n1: 32, n2: 30, sc1: [3, 0, 0, 0], sc2: [3, 1, 0, 0] }
          ]
        }
      ],
      groupMatches: [
        { p1: 'Reto',    p2: 'Sweaty',  s1: 2, s2: 1, a1: 34.57, a2: 35.08, c1: '2/33', c2: '1/31', n1: 130, n2: 127, sc1: [2, 3, 0, 0], sc2: [5, 1, 0, 0] },
        { p1: 'Hugo',    p2: 'Quaasus', s1: 2, s2: 0, a1: 38.54, a2: 37.77, c1: '2/16', c2: '0/15', n1: 78, n2: 78, sc1: [2, 0, 2, 0], sc2: [2, 1, 0, 0] },
        { p1: 'Sweaty',  p2: 'Fynn',    s1: 0, s2: 2, a1: 38.19, a2: 46.97, c1: '0/0', c2: '2/16', n1: 63, n2: 64, sc1: [3, 0, 0, 0], sc2: [6, 1, 1, 0] },
        { p1: 'Quaasus', p2: 'Katsche', s1: 0, s2: 2, a1: 44.21, a2: 52.74, c1: '0/0', c2: '2/5', n1: 57, n2: 57, sc1: [4, 0, 0, 0], sc2: [5, 1, 0, 0] },
        { p1: 'Fynn',    p2: 'Reto',    s1: 2, s2: 0, a1: 46.97, a2: 32.90, c1: '2/6', c2: '0/0', n1: 64, n2: 63, sc1: [4, 2, 0, 0], sc2: [2, 0, 0, 0] },
        { p1: 'Katsche', p2: 'Hugo',    s1: 1, s2: 2, a1: 54.11, a2: 49.94, c1: '1/8', c2: '2/6', n1: 80, n2: 79, sc1: [4, 5, 0, 0], sc2: [9, 1, 0, 0] },
        { p1: 'Sweaty',  p2: 'Reto',    s1: 1, s2: 2, a1: 39.73, a2: 41.47, c1: '1/25', c2: '2/12', n1: 111, n2: 108, sc1: [7, 1, 0, 0], sc2: [5, 1, 0, 0] },
        { p1: 'Quaasus', p2: 'Hugo',    s1: 2, s2: 0, a1: 41.18, a2: 39.58, c1: '2/22', c2: '0/7', n1: 73, n2: 72, sc1: [3, 2, 1, 0], sc2: [2, 2, 0, 0] },
        { p1: 'Fynn',    p2: 'Sweaty',  s1: 2, s2: 0, a1: 58.94, a2: 35.44, c1: '2/14', c2: '0/0', n1: 51, n2: 48, sc1: [7, 4, 0, 0], sc2: [2, 0, 0, 0] },
        { p1: 'Katsche', p2: 'Quaasus', s1: 1, s2: 2, a1: 44.26, a2: 49.33, c1: '1/9', c2: '2/16', n1: 85, n2: 88, sc1: [4, 1, 1, 0], sc2: [5, 5, 0, 0] },
        { p1: 'Reto',    p2: 'Fynn',    s1: 0, s2: 2, a1: 31.29, a2: 35.79, c1: '0/5', c2: '2/23', n1: 84, n2: 84, sc1: [5, 0, 0, 0], sc2: [5, 1, 0, 0] },
        { p1: 'Hugo',    p2: 'Katsche', s1: 0, s2: 2, a1: 42.74, a2: 50.95, c1: '0/5', c2: '2/5', n1: 57, n2: 59, sc1: [6, 0, 0, 0], sc2: [6, 1, 0, 0] }
      ],
      knockout: [
        { round: 'Halbfinale', bo: 5, p1: 'Katsche', p2: 'Reto', s1: 3, s2: 0, a1: 46.01, a2: 37.22, c1: '3/13', c2: '0/1', n1: 98, n2: 96, sc1: [9, 1, 0, 0], sc2: [3, 0, 0, 0] },
        { round: 'Halbfinale', bo: 5, p1: 'Fynn',    p2: 'Hugo', s1: 3, s2: 2, a1: 35.65, a2: 36.93, c1: '1/45', c2: '2/35', n1: 121, n2: 120, sc1: [7, 2, 0, 0], sc2: [4, 3, 1, 0] },
        { round: 'Spiel um Platz 5', bo: 3, p1: 'Quaasus', p2: 'Sweaty', s1: 0, s2: 2, a1: 37.42, a2: 40.62, c1: '0/13', c2: '2/3', n1: 72, n2: 74, sc1: [6, 0, 0, 0], sc2: [4, 0, 0, 0] },
        { round: 'Spiel um Platz 3', bo: 3, p1: 'Hugo', p2: 'Reto', s1: 2, s2: 1, a1: 30.85, a2: 30.70, c1: '2/43', c2: '1/20', n1: 145, n2: 142, sc1: [5, 0, 0, 0], sc2: [4, 0, 0, 0] },
        { round: 'Finale', bo: 5, p1: 'Fynn', p2: 'Katsche', s1: 3, s2: 0, a1: 48.48, a2: 46.77, c1: '3/15', c2: '0/20', n1: 93, n2: 90, sc1: [6, 1, 1, 0], sc2: [9, 2, 1, 0] }
      ],
      stats: [
        { p: 'Fynn',    avg: 43.70, hs: 140, coHit: 12, coAtt: 119, hco: 49, minDarts: 21, s60: 35, s100: 11, s140: 2, s180: 0 },
        { p: 'Katsche', avg: 48.66, hs: 140, coHit: 9,  coAtt: 60,  hco: 56, minDarts: 20, s60: 37, s100: 11, s140: 2, s180: 0 },
        { p: 'Hugo',    avg: 38.84, hs: 143, coHit: 9,  coAtt: 114, hco: 35, minDarts: 29, s60: 31, s100: 6,  s140: 3, s180: 0 },
        { p: 'Reto',    avg: 34.68, hs: 133, coHit: 5,  coAtt: 71,  hco: 33, minDarts: 32, s60: 21, s100: 4,  s140: 0, s180: 0 },
        { p: 'Sweaty',  avg: 37.77, hs: 120, coHit: 4,  coAtt: 59,  hco: 48, minDarts: 32, s60: 21, s100: 2,  s140: 0, s180: 0 },
        { p: 'Quaasus', avg: 42.63, hs: 140, coHit: 4,  coAtt: 69,  hco: 40, minDarts: 27, s60: 23, s100: 9,  s140: 1, s180: 0 }
      ],
      notes: ['Im Halbfinale Fynn – Hugo sind wegen Serverproblemen die Statistiken von zwei Legs verloren gegangen.']
    }
  ]
};
