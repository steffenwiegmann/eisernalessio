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
 *    s60, s100, s140, s180   Anzahl Aufnahmen 60+/100+/140+/180
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
 *
 *  Weitere Felder pro Turnier (alle optional):
 *    time     Startzeit 'HH:MM' (für die Uhr „Seit dem letzten Turnier“)
 *    events   [ { type: '180' | 'robinhood' | '9darter', p: 'Spieler', note: '…' } ]
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
 *
 *  nextTournament: Sobald das nächste Turnier geplant ist, z. B.
 *    { date: '2026-12-12', time: '18:00', venue: 'Bovenden', host: 'Fynn' }
 *    → Die Startseite zeigt dann einen Countdown statt der Uhr seit dem letzten Turnier.
 * ============================================================
 */

window.EA_DATA = {
  players: {
    Katsche:    { founder: true, photo: '', nickname: 'Kommt von der Legende Katsche Schwarzenbeck', walkOn: 'Katchi', favDouble: 'D20', dreamFinish: 'Champagne Finish', hand: 'Rechts', darts: 'RED DRAGON Razor 24g', favPlayer: 'Gary Anderson' },
    Otter:      { founder: true, photo: '', nickname: '', walkOn: '', favDouble: '', dreamFinish: '', hand: '', darts: '', favPlayer: '' },
    Quaasus:    { founder: true, photo: '', nickname: '', walkOn: '', favDouble: '', dreamFinish: '', hand: '', darts: '', favPlayer: '' },
    Sweaty:     { founder: true, photo: '', nickname: '', walkOn: '', favDouble: '', dreamFinish: '', hand: '', darts: '', favPlayer: '' },
    Killernini: { photo: '', nickname: '', walkOn: '', favDouble: '', dreamFinish: '', hand: '', darts: '', favPlayer: '' },
    Hugo:       { photo: '', nickname: '', walkOn: '', favDouble: '', dreamFinish: '', hand: '', darts: '', favPlayer: '' },
    Fynn:       { photo: '', nickname: '', walkOn: '', favDouble: '', dreamFinish: '', hand: '', darts: '', favPlayer: '' },
    Samier:     { photo: '', nickname: '', walkOn: '', favDouble: '', dreamFinish: '', hand: '', darts: '', favPlayer: '' },
    Reto:       { photo: '', nickname: '', walkOn: '', favDouble: '', dreamFinish: '', hand: '', darts: '', favPlayer: '' }
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
            { p: 'Fynn',    legs: '4-2', diff: 331 },
            { p: 'Quaasus', legs: '4-2', diff: 55 },
            { p: 'Samier',  legs: '1-5', diff: -386 }
          ]
        }
      ],
      groupMatches: [
        { p1: 'Hugo',    p2: 'Sweaty',  s1: 0, s2: 1, d1: -43 },
        { p1: 'Quaasus', p2: 'Fynn',    s1: 0, s2: 1, d1: -209 },
        { p1: 'Katsche', p2: 'Hugo',    s1: 0, s2: 1, d1: -254 },
        { p1: 'Fynn',    p2: 'Samier',  s1: 1, s2: 0, d1: 147 },
        { p1: 'Katsche', p2: 'Sweaty',  s1: 0, s2: 1, d1: -14 },
        { p1: 'Samier',  p2: 'Quaasus', s1: 0, s2: 1, d1: -23 },
        { p1: 'Sweaty',  p2: 'Hugo',    s1: 1, s2: 0, d1: 167 },
        { p1: 'Fynn',    p2: 'Quaasus', s1: 0, s2: 1, d1: -169 },
        { p1: 'Hugo',    p2: 'Katsche', s1: 0, s2: 1, d1: -267 },
        { p1: 'Samier',  p2: 'Fynn',    s1: 0, s2: 1, d1: -48 },
        { p1: 'Sweaty',  p2: 'Katsche', s1: 0, s2: 1, d1: -112 },
        { p1: 'Quaasus', p2: 'Samier',  s1: 1, s2: 0, d1: 50 },
        { p1: 'Hugo',    p2: 'Sweaty',  s1: 0, s2: 1, d1: -28 },
        { p1: 'Quaasus', p2: 'Fynn',    s1: 1, s2: 0, d1: 86 },
        { p1: 'Katsche', p2: 'Hugo',    s1: 0, s2: 1, d1: -32 },
        { p1: 'Fynn',    p2: 'Samier',  s1: 1, s2: 0, d1: 182 },
        { p1: 'Katsche', p2: 'Sweaty',  s1: 1, s2: 0, d1: 207 },
        { p1: 'Samier',  p2: 'Quaasus', s1: 1, s2: 0, d1: 64 }
      ],
      knockout: [
        { round: 'Halbfinale', bo: 3, p1: 'Fynn',    p2: 'Katsche', s1: 1, s2: 2, a1: 54.70, a2: 57.16 },
        { round: 'Halbfinale', bo: 3, p1: 'Quaasus', p2: 'Sweaty',  s1: 2, s2: 0, a1: 51.83, a2: 39.16 },
        { round: 'Spiel um Platz 5', bo: 3, p1: 'Hugo', p2: 'Samier', s1: 2, s2: 0, a1: 53.68, a2: 33.22 },
        { round: 'Spiel um Platz 3', bo: 3, p1: 'Sweaty', p2: 'Fynn', s1: 0, s2: 2, a1: 45.40, a2: 68.32 },
        { round: 'Finale', bo: 5, p1: 'Katsche', p2: 'Quaasus', s1: 3, s2: 1, a1: 47.47, a2: 41.19 }
      ],
      stats: [
        { p: 'Katsche', avg: 51.84, hs: 140, hco: 46,  minDarts: 21 },
        { p: 'Quaasus', avg: 44.13, hs: 180, hco: 81,  minDarts: 24 },
        { p: 'Fynn',    avg: 53.03, hs: 140, hco: 95,  minDarts: 19 },
        { p: 'Sweaty',  avg: 44.70, hs: 121, hco: 38,  minDarts: 29 },
        { p: 'Hugo',    avg: 48.88, hs: 140, hco: 114, minDarts: 23 },
        { p: 'Samier',  avg: 38.78, hs: 92,  hco: 14,  minDarts: 34 }
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
            { p1: 'Hugo', p2: 'Quaasus', s1: 1, s2: 0, a1: 46.97, a2: 48.70, c1: '1/2', c2: '0/3' }
          ]
        }
      ],
      groupMatches: [
        { p1: 'Reto',    p2: 'Sweaty',  s1: 2, s2: 1, a1: 34.57, a2: 35.08, c1: '2/33', c2: '1/31' },
        { p1: 'Hugo',    p2: 'Quaasus', s1: 2, s2: 0, a1: 38.54, a2: 37.77, c1: '2/16', c2: '0/15' },
        { p1: 'Sweaty',  p2: 'Fynn',    s1: 0, s2: 2, a1: 38.19, a2: 46.97, c1: '0/0',  c2: '2/16' },
        { p1: 'Quaasus', p2: 'Katsche', s1: 0, s2: 2, a1: 44.21, a2: 52.74, c1: '0/0',  c2: '2/5' },
        { p1: 'Fynn',    p2: 'Reto',    s1: 2, s2: 0, a1: 46.97, a2: 32.90, c1: '2/6',  c2: '0/0' },
        { p1: 'Katsche', p2: 'Hugo',    s1: 1, s2: 2, a1: 54.11, a2: 49.94, c1: '1/8',  c2: '2/6' },
        { p1: 'Sweaty',  p2: 'Reto',    s1: 1, s2: 2, a1: 39.73, a2: 41.47, c1: '1/25', c2: '2/12' },
        { p1: 'Quaasus', p2: 'Hugo',    s1: 2, s2: 0, a1: 41.18, a2: 39.58, c1: '2/22', c2: '0/7' },
        { p1: 'Fynn',    p2: 'Sweaty',  s1: 2, s2: 0, a1: 58.94, a2: 35.44, c1: '2/14', c2: '0/0' },
        { p1: 'Katsche', p2: 'Quaasus', s1: 1, s2: 2, a1: 44.26, a2: 49.33, c1: '1/9',  c2: '2/16' },
        { p1: 'Reto',    p2: 'Fynn',    s1: 0, s2: 2, a1: 31.29, a2: 35.79, c1: '0/5',  c2: '2/32' },
        { p1: 'Hugo',    p2: 'Katsche', s1: 0, s2: 2, a1: 42.74, a2: 50.95, c1: '0/5',  c2: '2/5' }
      ],
      knockout: [
        { round: 'Halbfinale', bo: 5, p1: 'Katsche', p2: 'Reto', s1: 3, s2: 0, a1: 46.01, a2: 37.22, c1: '3/13', c2: '0/1' },
        { round: 'Halbfinale', bo: 5, p1: 'Fynn',    p2: 'Hugo', s1: 3, s2: 2, a1: 35.65, a2: 36.93, c1: '1/45', c2: '2/35' },
        { round: 'Spiel um Platz 5', bo: 3, p1: 'Quaasus', p2: 'Sweaty', s1: 0, s2: 2, a1: 37.42, a2: 40.60, c1: '0/13', c2: '2/3' },
        { round: 'Spiel um Platz 3', bo: 3, p1: 'Hugo', p2: 'Reto', s1: 2, s2: 1, a1: 30.85, a2: 30.70, c1: '2/43', c2: '1/20' },
        { round: 'Finale', bo: 5, p1: 'Fynn', p2: 'Katsche', s1: 3, s2: 0, a1: 48.48, a2: 46.77, c1: '3/15', c2: '0/20' }
      ],
      stats: [
        { p: 'Fynn',    avg: 43.71, hs: 140, coHit: 12, coAtt: 128, hco: 49, minDarts: 21 },
        { p: 'Katsche', avg: 48.63, hs: 140, coHit: 9,  coAtt: 60,  hco: 56, minDarts: 20 },
        { p: 'Hugo',    avg: 38.82, hs: 143, coHit: 9,  coAtt: 114, hco: 35, minDarts: 29 },
        { p: 'Reto',    avg: 34.68, hs: 133, coHit: 5,  coAtt: 71,  hco: 33, minDarts: 32 },
        { p: 'Sweaty',  avg: 37.77, hs: 120, coHit: 4,  coAtt: 69,  hco: 48, minDarts: 32 },
        { p: 'Quaasus', avg: 42.63, hs: 140, coHit: 4,  coAtt: 69,  hco: 40, minDarts: 27 }
      ],
      notes: ['Im Halbfinale Fynn – Hugo sind wegen Serverproblemen die Statistiken von zwei Legs verloren gegangen.']
    }
  ]
};
