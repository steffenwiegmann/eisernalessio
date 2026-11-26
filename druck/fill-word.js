/*
 * Füllt die Turnierplan-Vorlagen mit den Ergebnissen aus js/data.js.
 *   cd druck && node fill-word.js        → alle Turniere
 *   cd druck && node fill-word.js 4      → nur EA Masters IV
 * Ergebnis: druck/ausgefuellt/EA-Masters-<röm>-Ergebnisse.docx
 */
const fs = require('fs');
const path = require('path');
const { build, FORMATS } = require('./generate-word');

// Website-Daten laden (data.js setzt window.EA_DATA)
const window = {};
eval(fs.readFileSync(path.join(__dirname, '..', 'js', 'data.js'), 'utf8'));
const D = window.EA_DATA;

const ROMAN = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
const roman = (n) => { let r = ''; for (const [v, s] of ROMAN) while (n >= v) { r += s; n -= v; } return r; };
const de = (v, d) => (typeof v === 'number' && isFinite(v) ? v.toLocaleString('de-DE', d == null ? { maximumFractionDigits: 2 } : { minimumFractionDigits: d, maximumFractionDigits: d }) : '');
const signed = (v) => (typeof v === 'number' ? (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v) : '');
const dateDE = (iso) => iso.split('-').reverse().join('.');
const LETTER = (i) => String.fromCharCode(65 + i);

function fillFor(t, next) {
  const n = t.placements.length;
  const fmt = FORMATS[n];
  const twoGroups = fmt.groups.length === 2;
  const groups = t.groups || [];
  const gm = t.groupMatches || [];

  // Gruppen der Vorlage (Code '' / 'A' / 'B') den Datengruppen zuordnen
  const groupByCode = {};
  fmt.groups.forEach((fg, i) => { groupByCode[fg.code] = groups[i] || null; });

  // Spielerplätze (A1, A2 … bzw. A, B …) nach Reihenfolge des ersten Auftretens
  // in den Gruppenspielen: Spiel 1 = Platz 1 gegen Platz 2, dann der nächste neue Spieler usw.
  // Ohne Gruppenspiele: Reihenfolge der Abschlusstabelle, sonst alphabetisch.
  const slots = {};
  fmt.groups.forEach((fg) => {
    const g = groupByCode[fg.code];
    const members = g ? g.standings.map((s) => s.p) : t.placements.slice().sort((a, b) => a.localeCompare(b));
    const order = [];
    gm.filter((m) => members.includes(m.p1) && members.includes(m.p2)).forEach((m) => {
      [m.p1, m.p2].forEach((p) => { if (!order.includes(p)) order.push(p); });
    });
    members.forEach((p) => { if (!order.includes(p)) order.push(p); });
    slots[fg.code] = order;
  });
  const codeOf = (name) => {
    for (const fg of fmt.groups) {
      const i = slots[fg.code].indexOf(name);
      if (i >= 0) return fg.code ? fg.code + (i + 1) : LETTER(i);
    }
    return name;
  };
  const seedOf = (name) => {
    for (const fg of fmt.groups) {
      const g = groupByCode[fg.code];
      if (!g) continue;
      const i = g.standings.findIndex((s) => s.p === name);
      if (i >= 0) return twoGroups ? `${i + 1}. ${fg.code}` : `${i + 1}. Platz`;
    }
    return '–';
  };

  // Gruppenspiele
  const maxLegs = gm.reduce((m, x) => Math.max(m, x.s1, x.s2), 0);
  const groupBo = maxLegs ? String(2 * maxLegs - 1) : '';
  const toRow = (m, nr) => ({
    nr, a: codeOf(m.p1), b: codeOf(m.p2), s1: m.s1, s2: m.s2,
    a1: m.a1 != null ? m.a1 : null, a2: m.a2, n1: m.n1, n2: m.n2, sc1: m.sc1, sc2: m.sc2,
    rest: typeof m.d1 === 'number' ? String(Math.abs(m.d1)) : ''
  });
  const games = {};
  const groupInfo = {};
  let maxRows = 0;
  fmt.groups.forEach((fg) => {
    const g = groupByCode[fg.code];
    const names = slots[fg.code];
    const list = (twoGroups ? gm.filter((m) => names.includes(m.p1) && names.includes(m.p2)) : gm).map((m, i) => toRow(m, i + 1));
    if (g && g.tiebreak) {
      list.push({ sep: 'Entscheidungsspiel' });
      g.tiebreak.forEach((m) => list.push(toRow(m, list.filter((x) => !x.sep).length + 1)));
    }
    games[fg.code] = list;
    const pairs = (fg.size * (fg.size - 1)) / 2;
    const played = list.filter((x) => !x.sep && x.nr && !(g && g.tiebreak && x === list[list.length - 1] && list.some((y) => y.sep))).length;
    const rounds = g ? Math.round((twoGroups ? played : gm.length) / pairs) : 0;
    groupInfo[fg.code] = rounds ? `${fg.size} Spieler · jeder gegen jeden · ${rounds === 1 ? 'eine Runde' : rounds === 2 ? 'Hin- & Rückrunde' : rounds + ' Runden'}` : `${fg.size} Spieler`;
    maxRows = Math.max(maxRows, list.length);
  });

  // Abschlusstabellen
  const standings = {};
  fmt.groups.forEach((fg) => {
    const g = groupByCode[fg.code];
    standings[fg.code] = g ? g.standings.map((s) => ({
      p: s.p,
      wins: s.games ? s.games.split('-')[0] : (groupBo === '1' && s.legs ? s.legs.split('-')[0] : ''),
      legs: s.legs ? s.legs.replace('-', ':') : '',
      diff: signed(s.diff)
    })) : null;
  });

  // Endrunde
  const ko = {};
  const koNotes = [];
  const kos = t.knockout || [];
  const box = (m, seeds, flip) => {
    const o = flip
      ? { names: [m.p2, m.p1], legs: [m.s2, m.s1], avg: [m.a2, m.a1], darts: [m.n2, m.n1], sc: [m.sc2, m.sc1] }
      : { names: [m.p1, m.p2], legs: [m.s1, m.s2], avg: [m.a1, m.a2], darts: [m.n1, m.n2], sc: [m.sc1, m.sc2] };
    return Object.assign(o, { bo: m.bo, seeds });
  };
  const winnerOf = (m) => (m.s1 > m.s2 ? m.p1 : m.p2);
  const loserOf = (m) => (m.s1 > m.s2 ? m.p2 : m.p1);

  let hf = kos.filter((m) => m.round === 'Halbfinale');
  const firstSeed = fmt.hf[0][1]; // '1. A' bzw. '1. Platz'
  const hf1Idx = hf.findIndex((m) => seedOf(m.p1) === firstSeed || seedOf(m.p2) === firstSeed);
  if (hf1Idx > 0) hf = [hf[1], hf[0]];
  hf.forEach((m, i) => {
    const s1 = seedOf(m.p1), s2 = seedOf(m.p2);
    const tplA = fmt.hf[i][1];
    const flip = s2 === tplA;
    ko[`Halbfinale ${i + 1}`] = box(m, flip ? [s2, s1] : [s1, s2], flip);
  });
  const fin = kos.find((m) => m.round === 'Finale');
  if (fin && hf.length === 2) {
    const flip = fin.p2 === winnerOf(hf[0]);
    ko['Finale'] = box(fin, ['Sieger HF 1', 'Sieger HF 2'], flip);
  }
  const p3 = kos.find((m) => m.round === 'Spiel um Platz 3');
  if (p3 && p3.text) {
    ko['Platz 3'] = { names: p3.text.split(', ').length === 3 ? [p3.text.split(', ')[0], p3.text.split(', ').slice(1).join(', ')] : [p3.text, ''], legs: ['', ''], avg: [null, null], bo: p3.bo, seeds: ['3.', '4. / 5.'] };
    koNotes.push(`Platz 3 wurde als Dreierspiel ausgespielt: ${p3.result}`);
  } else if (p3 && hf.length === 2) {
    const flip = p3.p2 === loserOf(hf[0]);
    ko['Platz 3'] = box(p3, ['Verlierer HF 1', 'Verlierer HF 2'], flip);
  }
  [5, 7].forEach((pl) => {
    const m = kos.find((x) => x.round === `Spiel um Platz ${pl}`);
    if (!m) return;
    const s1 = seedOf(m.p1), s2 = seedOf(m.p2);
    const flip = s1 > s2; // "3. A" vor "3. B"
    ko[`Platz ${pl}`] = box(m, flip ? [s2, s1] : [s1, s2], flip);
  });

  // Blatt 2
  const stat = (p) => (t.stats || []).find((s) => s.p === p);
  const stats = t.placements.map((p) => {
    const s = stat(p) || {};
    const co = s.coAtt ? `${s.coHit}/${s.coAtt} (${de(s.coHit / s.coAtt * 100)} %)` : '';
    const md = s.minDarts ? `${s.minDarts} (${de(1503 / s.minDarts, 2)})` : '';
    const sc = ['s60', 's100', 's140', 's180'].map((k) => (typeof s[k] === 'number' ? String(s[k]) : ''));
    return [p, de(s.avg, 2), s.hs != null ? String(s.hs) : '', co, s.hco != null ? String(s.hco) : '', md, ...sc];
  });
  const tons = (s) => (['s100', 's140', 's180'].every((k) => typeof s[k] === 'number') ? s.s100 + s.s140 + s.s180 : null);
  const S = t.stats || [];
  const bestOf = (get, dir, show) => {
    const vals = S.map((s) => ({ p: s.p, v: get(s) })).filter((x) => typeof x.v === 'number' && isFinite(x.v));
    if (!vals.length) return ['', ''];
    const target = dir === 'min' ? Math.min(...vals.map((x) => x.v)) : Math.max(...vals.map((x) => x.v));
    return [show(target), vals.filter((x) => x.v === target).map((x) => x.p).join(', ')];
  };
  const bests = [
    bestOf((s) => s.avg, 'max', (v) => de(v, 2)),
    bestOf((s) => s.hs, 'max', String),
    bestOf((s) => (s.coAtt ? s.coHit / s.coAtt : null), 'max', (v) => `${de(v * 100)} %`),
    bestOf((s) => s.hco, 'max', String),
    bestOf((s) => s.minDarts, 'min', (v) => `${v} (${de(1503 / v, 2)})`),
    bestOf(tons, 'max', (v) => `${v}×`)
  ];

  const moments = (t.notes || []).slice();
  const gw = S.filter((s) => s.gp != null);
  if (gw.length) moments.push('Games/Legs gewonnen: ' + gw.map((s) => `${s.p} ${de(s.gw)}/${de(s.gp)} · ${de(s.lw)}/${de(s.lp)}`).join(' · '));
  S.filter((s) => s.hs === 180).forEach((s) => moments.push(`💥 180 geworfen: ${s.p}`));

  return {
    roman: roman(t.nr),
    date: dateDE(t.date),
    venue: [t.venue, t.country].filter(Boolean).join(', '),
    host: t.host || '',
    mode: t.mode.replace('Single Out', 'Single Out').trim(),
    groupBo,
    slots, games, standings, groupInfo,
    gameRowH: maxRows > 7 ? 300 : 350,
    ko, koNotes,
    winner: t.placements[0],
    placements: t.placements,
    honors: [t.placements[0], t.ballonDart || '', next ? next.host : t.placements[0], ''],
    stats, bests, moments
  };
}

(async () => {
  const out = process.env.OUT_DIR || path.join(__dirname, 'ausgefuellt');
  fs.mkdirSync(out, { recursive: true });
  const tours = D.tournaments.slice().sort((a, b) => a.nr - b.nr);
  const only = process.argv[2] ? [Number(process.argv[2])] : tours.map((t) => t.nr);
  for (const t of tours.filter((x) => only.includes(x.nr))) {
    const next = tours.find((x) => x.nr === t.nr + 1);
    await build(t.placements.length, fillFor(t, next), path.join(out, `EA-Masters-${roman(t.nr)}-Ergebnisse.docx`));
  }
})();
