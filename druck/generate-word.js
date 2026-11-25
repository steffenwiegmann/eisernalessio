/*
 * Erzeugt die Turnierplan-Vorlagen als Word-Dateien (DIN A4, je 2 Seiten).
 *   cd druck && npm install && node generate-word.js
 * Ergebnis: druck/EA-Masters-Turnierplan-<n>-Spieler.docx
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  WidthType, BorderStyle, ShadingType, AlignmentType, VerticalAlign, HeightRule,
  UnderlineType, TableLayoutType, PositionalTab, PositionalTabAlignment,
  PositionalTabRelativeTo, PositionalTabLeader
} = require('docx');

/* ---------------------------------------------------------
   Formate
   --------------------------------------------------------- */
const HF_SINGLE = [['Halbfinale 1', '1. Platz', '4. Platz'], ['Halbfinale 2', '2. Platz', '3. Platz']];
const HF_DOUBLE = [['Halbfinale 1', '1. A', '2. B'], ['Halbfinale 2', '1. B', '2. A']];
const FORMATS = {
  4: { groups: [{ code: '', name: 'Gruppe', size: 4, double: true }], hf: HF_SINGLE, places: [], fixed: [] },
  5: { groups: [{ code: '', name: 'Gruppe', size: 5, double: false }], hf: HF_SINGLE, places: [], fixed: ['Platz 5: 5. der Gruppe (kein Platzierungsspiel)'] },
  6: { groups: [{ code: 'A', name: 'Gruppe A', size: 3, double: true }, { code: 'B', name: 'Gruppe B', size: 3, double: true }], hf: HF_DOUBLE, places: [['Platz 5', '3. A', '3. B']], fixed: [] },
  7: { groups: [{ code: 'A', name: 'Gruppe A', size: 4, double: false }, { code: 'B', name: 'Gruppe B', size: 3, double: true }], hf: HF_DOUBLE, places: [['Platz 5', '3. A', '3. B']], fixed: ['Platz 7: 4. A (kein Platzierungsspiel)'] },
  8: { groups: [{ code: 'A', name: 'Gruppe A', size: 4, double: false }, { code: 'B', name: 'Gruppe B', size: 4, double: false }], hf: HF_DOUBLE, places: [['Platz 5', '3. A', '3. B'], ['Platz 7', '4. A', '4. B']], fixed: [] }
};

function roundRobin(n, double) {
  const ids = Array.from({ length: n }, (_, i) => i + 1);
  if (n % 2) ids.push(0);
  const m = ids.length;
  const out = [];
  let arr = ids.slice();
  for (let r = 0; r < m - 1; r++) {
    for (let i = 0; i < m / 2; i++) {
      const a = arr[i], b = arr[m - 1 - i];
      if (a && b) out.push(r % 2 ? [b, a] : [a, b]);
    }
    arr = [arr[0], arr[m - 1]].concat(arr.slice(1, m - 1));
  }
  return double ? out.concat(out.map(([a, b]) => [b, a])) : out;
}

/* ---------------------------------------------------------
   Kleine PNG-Grafiken (Logo, Warnstreifen) ohne Zusatzpakete
   --------------------------------------------------------- */
function png(w, h, pixel) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = pixel(x, y);
      const o = y * (w * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
    }
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const Y = [255, 212, 0], K = [11, 11, 11];
const LOGO_PNG = png(160, 160, (x, y) => {
  // 4x Supersampling für glatte Kreise
  let acc = [0, 0, 0, 0];
  for (let sy = 0; sy < 4; sy++) for (let sx = 0; sx < 4; sx++) {
    const dx = (x + (sx + 0.5) / 4) / 5 - 16, dy = (y + (sy + 0.5) / 4) / 5 - 16;
    const d = Math.sqrt(dx * dx + dy * dy);
    let c = null;
    if (d <= 1.8) c = Y; else if (d <= 4.5) c = K; else if (d <= 8) c = Y; else if (d <= 11.5) c = K; else if (d <= 15) c = Y;
    if (c) { acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2]; acc[3] += 255; }
  }
  return acc[3] ? [acc[0] / (acc[3] / 255), acc[1] / (acc[3] / 255), acc[2] / (acc[3] / 255), acc[3] / 16] : [0, 0, 0, 0];
});
const STRIPE_PNG = png(1600, 22, (x, y) => (((x + y) % 52) < 26 ? [...Y, 255] : [...K, 255]));

/* ---------------------------------------------------------
   Gestaltung
   --------------------------------------------------------- */
const FONT = 'Arial';
const DISPLAY = 'Bahnschrift SemiBold Condensed';
const YELLOW = 'FFD400', BLACK = '141414', GREY = '666666', LINE = 'BDBDB8', SOFT = 'F1F1EE';
const PAGE_W = 11906, PAGE_H = 16838, MARGIN = 680;
const W = PAGE_W - 2 * MARGIN; // 10546
const SAFE = 60; // Abstand, damit rechte Tabellenränder nie abgeschnitten werden

const NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const NO_BORDERS = { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE };
const NO_CELL = { top: NONE, bottom: NONE, left: NONE, right: NONE };
const thin = (color = LINE, size = 4) => ({ style: BorderStyle.SINGLE, size, color });
const GRID = { top: thin(), bottom: thin(), left: thin(), right: thin(), insideHorizontal: thin(), insideVertical: thin() };

const run = (text, o = {}) => new TextRun({ text, font: o.font || FONT, size: o.size || 18, bold: o.bold, color: o.color || '111111', characterSpacing: o.spacing, underline: o.underline, shading: o.shading, italics: o.italics });
const para = (children, o = {}) => new Paragraph({
  children: Array.isArray(children) ? children : [children],
  alignment: o.align,
  spacing: { before: o.before || 0, after: o.after || 0, line: o.line },
  border: o.border,
  keepNext: o.keepNext
});
const cell = (children, w, o = {}) => new TableCell({
  children: Array.isArray(children) ? children : [children],
  width: { size: w, type: WidthType.DXA },
  columnSpan: o.span,
  shading: o.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: o.fill } : undefined,
  verticalAlign: o.vAlign || VerticalAlign.CENTER,
  borders: o.borders,
  margins: o.margins || { top: 20, bottom: 20, left: 80, right: 80 }
});
const table = (widths, rows, o = {}) => new Table({
  width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
  columnWidths: widths,
  layout: TableLayoutType.FIXED,
  borders: o.borders || NO_BORDERS,
  rows
});
const row = (cells, h, o = {}) => new TableRow({ children: cells, height: h ? { value: h, rule: HeightRule.ATLEAST } : undefined, cantSplit: true, tableHeader: o.header });
const spacer = (pt = 4) => para(run(''), { before: 0, after: 0, line: pt * 20 });
const lineCell = (w, text) => cell(para(text ? run(String(text), { bold: true }) : run('')), w, { borders: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '111111' } }, vAlign: VerticalAlign.BOTTOM });

/* ---------------------------------------------------------
   Ausfüll-Modus: F = null → leere Vorlage, sonst Turnierdaten
   (siehe fill-word.js). Werte erscheinen fett.
   --------------------------------------------------------- */
let F = null;
const fv = (text, o = {}) => (text == null || text === '' ? run('') : run(String(text), Object.assign({ bold: true }, o)));
const de = (v, d) => (typeof v === 'number' && isFinite(v) ? v.toLocaleString('de-DE', d == null ? { maximumFractionDigits: 2 } : { minimumFractionDigits: d, maximumFractionDigits: d }) : '');

const heading = (text, small) => para([
  run(text.toUpperCase(), { font: DISPLAY, size: 30 }),
  ...(small ? [run('   ' + small, { size: 14, color: GREY })] : [])
], { after: 80, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: YELLOW, space: 1 } }, keepNext: true });

const th = (text, w, o = {}) => cell(para(run(text.toUpperCase(), { bold: true, size: 13, color: YELLOW, spacing: 10 }), { align: o.align || AlignmentType.LEFT }), w, { fill: BLACK, span: o.span });

/* ---------------------------------------------------------
   Seitenkopf
   --------------------------------------------------------- */
function band(n, page) {
  return [
    table([W * 0.6, W * 0.4].map(Math.round).map((v, i) => (i ? W - Math.round(W * 0.6) : v)), [row([
      cell(para([
        new ImageRun({ type: 'png', data: LOGO_PNG, transformation: { width: 30, height: 30 } }),
        run('  EISERN ', { font: DISPLAY, size: 34, color: 'F5F5F3' }),
        run('ALESSIO', { font: DISPLAY, size: 34, color: YELLOW })
      ]), Math.round(W * 0.6), { fill: BLACK, borders: NO_CELL, margins: { top: 110, bottom: 110, left: 180, right: 80 } }),
      cell([
        para(run(`TURNIERPLAN · ${n} SPIELER`, { bold: true, size: 17, color: YELLOW, spacing: 20 }), { align: AlignmentType.RIGHT }),
        para(run(`BLATT ${page}/3`, { bold: true, size: 13, color: 'A6A6A1', spacing: 20 }), { align: AlignmentType.RIGHT })
      ], W - Math.round(W * 0.6), { fill: BLACK, borders: NO_CELL, margins: { top: 110, bottom: 110, left: 80, right: 180 } })
    ])]),
    para(new ImageRun({ type: 'png', data: STRIPE_PNG, transformation: { width: 703, height: 10 } }), { line: 200 }),
    para([run('▬▬  ', { color: YELLOW, size: 16 }), run(page === 1 ? 'TURNIERPLAN' : page === 2 ? 'ERGEBNISSE & STATISTIK' : 'AUTODARTS-PROTOKOLL', { bold: true, size: 15, spacing: 30 })], { before: 160 }),
    table([760, 2450, 260, 700, 2600, W - 6770], [row([
      cell(para(run('EA', { font: DISPLAY, size: 80 })), 760, { margins: { top: 0, bottom: 0, left: 0, right: 0 }, vAlign: VerticalAlign.BOTTOM }),
      cell(para(run('MASTERS', { font: DISPLAY, size: 80 })), 2450, { margins: { top: 0, bottom: 0, left: 0, right: 0 }, vAlign: VerticalAlign.BOTTOM, borders: { bottom: { style: BorderStyle.SINGLE, size: 48, color: YELLOW } } }),
      cell(para(run('')), 260),
      cell(para(run('Nr.', { size: 18, color: GREY, bold: true }), { align: AlignmentType.RIGHT }), 700, { vAlign: VerticalAlign.BOTTOM }),
      F ? cell(para(run(F.roman, { font: DISPLAY, size: 56 })), 2600, { borders: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '111111' } }, vAlign: VerticalAlign.BOTTOM }) : lineCell(2600),
      cell(para(run('')), W - 6770)
    ])]),
    spacer(8)
  ];
}

/* ---------------------------------------------------------
   Blatt 1
   --------------------------------------------------------- */
function infoBlock() {
  const lw = [1150, 2365, 1250, 2265, 1450, 2066];
  const label = (t, w, o = {}) => cell(para(run(t, { bold: true, size: 14, spacing: 15 }), { align: o.align }), w, { vAlign: VerticalAlign.BOTTOM });
  return table(lw, [
    row([label('DATUM', lw[0]), lineCell(lw[1], F && F.date), label('SPIELORT', lw[2], { align: AlignmentType.RIGHT }), lineCell(lw[3], F && F.venue), label('AUSRICHTER', lw[4], { align: AlignmentType.RIGHT }), lineCell(lw[5], F && F.host)], 420),
    row([
      label('MODUS', lw[0]),
      cell(para(run(` ${F ? F.mode : '501 · Double Out · Legmodus'} `, { bold: true, size: 19, shading: { type: ShadingType.CLEAR, color: 'auto', fill: YELLOW } })), lw[1] + lw[2], { span: 2, vAlign: VerticalAlign.BOTTOM }),
      cell(para(run('GRUPPENSPIELE: BEST OF', { bold: true, size: 14, spacing: 15 }), { align: AlignmentType.RIGHT }), lw[3] + lw[4], { span: 2, vAlign: VerticalAlign.BOTTOM }),
      cell(para(fv(F ? F.groupBo : '')), lw[5], { borders: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '111111' } }, vAlign: VerticalAlign.BOTTOM })
    ], 460)
  ]);
}

function playersTable(g, totalW) {
  const code = (i) => (g.code ? g.code + i : String.fromCharCode(64 + i));
  const perRow = g.code ? 2 : g.size;
  const cw = g.code ? 560 : 520;
  const lw = Math.floor(totalW / perRow) - cw;
  const widths = [];
  for (let i = 0; i < perRow; i++) widths.push(cw, i === perRow - 1 ? totalW - (perRow - 1) * (cw + lw) - cw : lw);
  const rows = [];
  for (let start = 1; start <= g.size; start += perRow) {
    const cells = [];
    for (let i = 0; i < perRow; i++) {
      const nr = start + i;
      if (nr <= g.size) {
        cells.push(cell(para(run(code(nr), { bold: true, size: 17 }), { align: AlignmentType.CENTER }), widths[i * 2], { fill: YELLOW }));
        cells.push(cell(para(fv(F ? F.slots[g.code][nr - 1] : '')), widths[i * 2 + 1], { borders: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '111111' } } }));
      } else {
        cells.push(cell(para(run('')), widths[i * 2]), cell(para(run('')), widths[i * 2 + 1]));
      }
    }
    rows.push(row(cells, 360));
  }
  return table(widths, rows);
}

function gamesTable(g, widths) {
  const code = (i) => (g.code ? g.code + i : String.fromCharCode(64 + i));
  const games = roundRobin(g.size, g.double);
  const half = games.length / 2;
  const center = (t, o = {}) => para(run(t, { size: o.size || 18, bold: o.bold, color: o.color }), { align: AlignmentType.CENTER });
  const rows = [row([th('Nr.', widths[0]), th('Spiel', widths[1]), th('Legs', widths[2], { align: AlignmentType.CENTER }), th('Ø Average', widths[3], { align: AlignmentType.CENTER }), th('Rest-Diff.', widths[4], { align: AlignmentType.CENTER })], null, { header: true })];
  if (F) {
    const list = F.games[g.code] || [];
    const total = widths.reduce((s, v) => s + v, 0);
    if (!list.length) {
      rows.push(row([cell(para(run('Keine Daten zur Gruppenphase vorhanden', { size: 15, color: GREY, italics: true })), total, { span: 5 })], 350));
    }
    list.forEach((m, i) => {
      if (m.sep) {
        rows.push(row([cell(para(run(m.sep.toUpperCase(), { bold: true, size: 13, color: GREY, spacing: 15 })), total, { span: 5, fill: SOFT })], 240));
        return;
      }
      rows.push(row([
        cell(para(run(String(m.nr), { bold: true, color: GREY })), widths[0]),
        cell(para([run(m.a, { bold: m.s1 > m.s2 }), run('  –  ', { color: GREY }), run(m.b, { bold: m.s2 > m.s1 })]), widths[1]),
        cell(para([fv(m.s1), run(' : ', { color: GREY, bold: true }), fv(m.s2)], { align: AlignmentType.CENTER }), widths[2]),
        cell(para(m.a1 != null ? [run(de(m.a1, 2), { size: 15 }), run(' | ', { color: LINE }), run(de(m.a2, 2), { size: 15 })] : [run('')], { align: AlignmentType.CENTER }), widths[3]),
        cell(para(fv(m.rest), { align: AlignmentType.CENTER }), widths[4])
      ], F.gameRowH || 350));
    });
    return table(widths, rows, { borders: GRID });
  }
  games.forEach(([a, b], i) => {
    if (g.double && i === half) {
      rows.push(row([cell(para(run('RÜCKRUNDE', { bold: true, size: 13, color: GREY, spacing: 15 })), widths.reduce((s, v) => s + v, 0), { span: 5, fill: SOFT })], 240));
    }
    rows.push(row([
      cell(para(run(String(i + 1), { bold: true, color: GREY })), widths[0]),
      cell(para([run(code(a), { bold: true }), run('  –  ', { color: GREY }), run(code(b), { bold: true })]), widths[1]),
      cell(center(':', { color: GREY, bold: true }), widths[2]),
      cell(center('|', { color: LINE }), widths[3]),
      cell(center(''), widths[4])
    ], 350));
  });
  return table(widths, rows, { borders: GRID });
}

function standingsTable(g, widths) {
  const q = g.code ? 2 : 4;
  const rows = [row([th('Platz', widths[0]), th('Spieler', widths[1]), th('Siege', widths[2], { align: AlignmentType.CENTER }), th('Legs', widths[3], { align: AlignmentType.CENTER }), th('Diff.', widths[4], { align: AlignmentType.CENTER })], null, { header: true })];
  for (let i = 1; i <= g.size; i++) {
    rows.push(row([
      cell(para(run(String(i), { bold: true }), { align: AlignmentType.CENTER }), widths[0], { fill: i <= q ? YELLOW : undefined }),
      ...(F && F.standings[g.code] && F.standings[g.code][i - 1]
        ? (() => { const s = F.standings[g.code][i - 1]; return [
          cell(para(fv(s.p)), widths[1]),
          cell(para(fv(s.wins), { align: AlignmentType.CENTER }), widths[2]),
          cell(para(fv(s.legs), { align: AlignmentType.CENTER }), widths[3]),
          cell(para(fv(s.diff), { align: AlignmentType.CENTER }), widths[4])]; })()
        : [cell(para(run('')), widths[1]), cell(para(run('')), widths[2]), cell(para(run('')), widths[3]), cell(para(run('')), widths[4])])
    ], 380));
  }
  return table(widths, rows, { borders: GRID });
}

function groupsBlock(f) {
  if (f.groups.length === 2) {
    const cw = 5123, gap = W - 2 * cw;
    const inner = (g) => [
      heading(g.name, (F && F.groupInfo && F.groupInfo[g.code]) || `${g.size} Spieler · jeder gegen jeden${g.double ? ' · Hin- & Rückrunde' : ''}`),
      playersTable(g, cw - SAFE), spacer(5),
      gamesTable(g, [520, 1330, 1150, 1250, 873 - SAFE]), spacer(5),
      standingsTable(g, [700, 2123 - SAFE, 750, 800, 750])
    ];
    return table([cw, gap, cw], [row([
      cell(inner(f.groups[0]), cw, { vAlign: VerticalAlign.TOP, margins: { top: 0, bottom: 0, left: 0, right: 0 } }),
      cell(para(run('')), gap),
      cell(inner(f.groups[1]), cw, { vAlign: VerticalAlign.TOP, margins: { top: 0, bottom: 0, left: 0, right: 0 } })
    ])]);
  }
  const g = f.groups[0];
  const lw = 6000, gap = 300, rw = W - lw - gap;
  return [
    heading(g.name, (F && F.groupInfo && F.groupInfo[g.code]) || `${g.size} Spieler · jeder gegen jeden${g.double ? ' · Hin- & Rückrunde' : ''}`),
    playersTable(g, W - SAFE), spacer(5),
    table([lw, gap, rw], [row([
      cell(gamesTable(g, [600, 1500, 1300, 1500, 1100]), lw, { vAlign: VerticalAlign.TOP, margins: { top: 0, bottom: 0, left: 0, right: 0 } }),
      cell(para(run('')), gap),
      cell(standingsTable(g, [700, rw - SAFE - 700 - 650 - 700 - 650, 650, 700, 650]), rw, { vAlign: VerticalAlign.TOP, margins: { top: 0, bottom: 0, left: 0, right: 0 } })
    ])])
  ];
}

function matchBox([label, a, b], w, final, m) {
  const small = w < 4000;
  const seedW = Math.round(w * (small ? 0.26 : 0.24)), boxW = Math.round(w * 0.14), nameW = w - seedW - 2 * boxW;
  const outer = { style: BorderStyle.SINGLE, size: final ? 14 : 8, color: '111111' };
  const head = final ? YELLOW : SOFT;
  const bestOf = new TextRun({ children: [new PositionalTab({ alignment: PositionalTabAlignment.RIGHT, relativeTo: PositionalTabRelativeTo.MARGIN, leader: PositionalTabLeader.NONE }), m && m.bo ? `Best of ${m.bo}` : 'Best of ____'], font: FONT, size: 13, bold: m && m.bo ? true : undefined });
  if (m && m.seeds) { a = m.seeds[0] || a; b = m.seeds[1] || b; }
  const seedRow = (s, i) => row([
    cell(para(run(small ? s.replace('Verlierer', 'Verl.') : s, { size: 13, bold: true, color: GREY })), seedW),
    cell(para(m ? fv(m.names[i], { size: m.names[i] && m.names[i].length > 18 ? 14 : 18 }) : run('')), nameW),
    cell(para(m ? fv(m.legs[i]) : run(''), m ? { align: AlignmentType.CENTER } : {}), boxW),
    cell(para(m ? fv(de(m.avg[i], 2), { size: small ? 12 : 14 }) : run(''), m ? { align: AlignmentType.CENTER } : {}), boxW, m && small ? { margins: { top: 20, bottom: 20, left: 30, right: 30 } } : {})
  ], 390);
  return table([seedW, nameW, boxW, boxW], [
    row([
      cell(para([run(label.toUpperCase(), { bold: true, size: small ? 13 : 14, spacing: small ? 0 : 15 }), bestOf]), seedW + nameW, { span: 2, fill: head }),
      cell(para(run('Legs', { size: 12, color: GREY, bold: true }), { align: AlignmentType.CENTER }), boxW, { fill: head }),
      cell(para(run('Ø', { size: 12, color: GREY, bold: true }), { align: AlignmentType.CENTER }), boxW, { fill: head })
    ], 300),
    seedRow(a, 0), seedRow(b, 1)
  ], { borders: { top: outer, bottom: outer, left: outer, right: outer, insideHorizontal: thin(), insideVertical: thin() } });
}

function koBlock(f) {
  const bw = 4900, mid = W - 2 * bw;
  const zero = { top: 0, bottom: 0, left: 0, right: 0 };
  const bracket = table([bw, mid, bw], [row([
    cell([matchBox(f.hf[0], bw - SAFE, false, F && F.ko['Halbfinale 1']), spacer(10), matchBox(f.hf[1], bw - SAFE, false, F && F.ko['Halbfinale 2'])], bw, { margins: zero }),
    cell(para(run('→', { size: 28, color: GREY }), { align: AlignmentType.CENTER }), mid),
    cell([
      matchBox(['Finale', 'Sieger HF 1', 'Sieger HF 2'], bw - SAFE, true, F && F.ko['Finale']),
      spacer(10),
      para([run('🏆 TURNIERSIEGER  ', { bold: true, size: 16, spacing: 10 }), F ? run(F.winner, { bold: true, size: 26, font: DISPLAY }) : run('______________________', { size: 20 })])
    ], bw, { margins: zero })
  ])]);
  // Reihenfolge wie vom Turnierleiter festgelegt: Platz 7 → Platz 5 → Platz 3
  const pl = f.places.slice().reverse().concat([['Platz 3', 'Verlierer HF 1', 'Verlierer HF 2']]);
  const pw = 3400, pg = Math.floor((W - 3 * pw) / 2);
  const pcells = [];
  for (let i = 0; i < 3; i++) {
    if (i) pcells.push(cell(para(run('')), i === 2 ? W - 3 * pw - pg : pg));
    pcells.push(pl[i] ? cell(matchBox(pl[i], pw - SAFE, false, F && F.ko[pl[i][0]]), pw, { margins: zero, vAlign: VerticalAlign.TOP }) : cell(para(run('')), pw));
  }
  return [
    heading('Endrunde'),
    bracket,
    spacer(8),
    table([pw, pg, pw, W - 3 * pw - pg, pw], [row(pcells)]),
    ...(F && F.koNotes.length ? F.koNotes : f.fixed).map((t) => para(run(t, { size: 15, color: GREY }), { before: 80 }))
  ];
}

const note = (t) => para(run(t, { size: 13, color: GREY }), { before: 100, border: { top: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 4 } } });

function page1(n, f) {
  return [
    ...band(n, 1),
    infoBlock(), spacer(8),
    ...[].concat(groupsBlock(f)), spacer(10),
    ...koBlock(f),
    note('Ø = 3-Dart-Average · Rest-Diff. = Restpunkte des Verlierers (bei Legs-Gleichstand in der Gruppe entscheidend)')
  ];
}

/* ---------------------------------------------------------
   Blatt 2
   --------------------------------------------------------- */
function page2(n) {
  const cw = 5123, gap = W - 2 * cw;
  const zero = { top: 0, bottom: 0, left: 0, right: 0 };
  const medal = ['', YELLOW, 'D5D8DC', 'D9A36F'];
  const rankCell = (i, w) => cell(para(run(String(i), { bold: true, size: 18 }), { align: AlignmentType.CENTER }), w, { fill: medal[i] || SOFT });
  let rankRows;
  if (n >= 7) {
    const w = [520, 2041, 520, 2042 - SAFE];
    rankRows = table(w, Array.from({ length: 4 }, (_, r) => row([
      rankCell(r + 1, w[0]), lineCell(w[1], F && F.placements[r]),
      ...(r + 5 <= n ? [rankCell(r + 5, w[2]), lineCell(w[3], F && F.placements[r + 4])] : [cell(para(run('')), w[2]), cell(para(run('')), w[3])])
    ], 440)));
  } else {
    const w = [520, cw - 520 - SAFE];
    rankRows = table(w, Array.from({ length: n }, (_, r) => row([rankCell(r + 1, w[0]), lineCell(w[1], F && F.placements[r])], 440)));
  }
  const honors = table([2400, cw - 2400 - SAFE], ['🏆 Turniersieger', '🎈 Ballon-Dart-Sieger', '🏠 Nächster Ausrichter', '🤷 Beste Ausrede'].map((t, i) =>
    row([cell(para(run(t.toUpperCase(), { bold: true, size: 14, spacing: 10 })), 2400, { vAlign: VerticalAlign.BOTTOM }), lineCell(cw - 2400 - SAFE, F && F.honors[i])], 500)));

  const sw = [2546 - SAFE, 1300, 1400, 2000, 1500, 1800];
  const statsHead = row([
    th('Spieler', sw[0]), th('3-Darts Avg', sw[1], { align: AlignmentType.CENTER }), th('Highest Score', sw[2], { align: AlignmentType.CENTER }),
    th('Checkout (Treffer/Vers., %)', sw[3], { align: AlignmentType.CENTER }), th('Highest Checkout', sw[4], { align: AlignmentType.CENTER }),
    th('Minimum Darts (Avg)', sw[5], { align: AlignmentType.CENTER })
  ], null, { header: true });
  const stats = table(sw, [statsHead].concat(Array.from({ length: n }, (_, r) => row(sw.map((w, c) => {
    const v = F && F.stats[r] ? F.stats[r][c] : '';
    return cell(para(fv(v), F && c ? { align: AlignmentType.CENTER } : {}), w);
  }), 430))), { borders: GRID });

  const bw = [3500, 2500, W - 6000 - SAFE];
  const bests = table(bw, [row([th('Kategorie', bw[0]), th('Wert', bw[1], { align: AlignmentType.CENTER }), th('Spieler', bw[2])], null, { header: true })].concat(
    ['3-Dart Average', 'Highest Score', 'Checkout (%)', 'Highest Checkout', 'Minimum Darts (Avg)'].map((k, i) =>
      row([cell(para(run(k, { bold: true })), bw[0]),
        cell(para(fv(F && F.bests[i] ? F.bests[i][0] : ''), F ? { align: AlignmentType.CENTER } : {}), bw[1]),
        cell(para(fv(F && F.bests[i] ? F.bests[i][1] : '')), bw[2])], 420))), { borders: GRID });

  const momentLines = Math.max(2, 10 - n, F ? F.moments.length : 0);
  return [
    ...band(n, 2),
    table([cw, gap, cw], [row([
      cell([heading('Endplatzierung'), rankRows], cw, { vAlign: VerticalAlign.TOP, margins: zero }),
      cell(para(run('')), gap),
      cell([heading('Ehrungen'), honors], cw, { vAlign: VerticalAlign.TOP, margins: zero })
    ])]),
    spacer(10),
    heading('Statistiken – Gesamtturnier'), stats, spacer(10),
    heading('Bestwerte des Turniers'), bests, spacer(10),
    heading('Besondere Momente', 'Robin Hood, 180er, Dartitis, legendäre Sprüche …'),
    table([W], Array.from({ length: momentLines }, (_, i) => row([cell(para(F && F.moments[i] ? run(F.moments[i], { size: 16 }) : run('')), W)], 430)), { borders: { top: NONE, left: NONE, right: NONE, bottom: thin(), insideHorizontal: thin(), insideVertical: NONE } }),
    note('Nach dem Turnier fotografieren oder scannen und hochladen – die Website wird daraus aktualisiert.')
  ];
}

/* ---------------------------------------------------------
   Blatt 3 – Autodarts-Protokoll (Darts + Ø je Spieler und Match)
   --------------------------------------------------------- */
function page3(n, f) {
  const w = [600, 3486 - SAFE, 1600, 1600, 1600, 1600];
  const total = w.reduce((s, v) => s + v, 0);
  const head = new TableRow({ tableHeader: true, children: [
    th('Nr.', w[0]), th('Spiel', w[1]),
    th('Darts Sp. 1', w[2], { align: AlignmentType.CENTER }), th('Ø Sp. 1', w[3], { align: AlignmentType.CENTER }),
    th('Darts Sp. 2', w[4], { align: AlignmentType.CENTER }), th('Ø Sp. 2', w[5], { align: AlignmentType.CENTER })
  ] });
  const sep = (t) => row([cell(para(run(t.toUpperCase(), { bold: true, size: 13, color: GREY, spacing: 15 })), total, { span: 6, fill: SOFT })], 260);
  const line = (nr, spiel, vals) => row([
    cell(para(run(String(nr || ''), { bold: true, color: GREY })), w[0]),
    cell(para(typeof spiel === 'string' ? run(spiel, { bold: true }) : spiel), w[1]),
    ...[2, 3, 4, 5].map((i) => cell(para(vals ? fv(vals[i - 2]) : run(''), { align: AlignmentType.CENTER }), w[i]))
  ], 400);
  const rows = [head];
  const twoGroups = f.groups.length === 2;
  // Gruppenspiele – gleiche Nummerierung wie auf Blatt 1
  f.groups.forEach((g) => {
    rows.push(sep(g.name));
    const code = (i) => (g.code ? g.code + i : String.fromCharCode(64 + i));
    if (F) {
      const list = F.games[g.code] || [];
      if (!list.length) rows.push(row([cell(para(run('Keine Daten zur Gruppenphase vorhanden', { size: 15, color: GREY, italics: true })), total, { span: 6 })], 350));
      list.forEach((m) => {
        if (m.sep) { rows.push(sep(m.sep)); return; }
        rows.push(line(m.nr, `${m.a}  –  ${m.b}`, [m.n1 != null ? m.n1 : '', de(m.a1, 2), m.n2 != null ? m.n2 : '', de(m.a2, 2)]));
      });
    } else {
      roundRobin(g.size, g.double).forEach(([a, b], i) => rows.push(line(i + 1, `${code(a)}  –  ${code(b)}`)));
      rows.push(line('', run('Entscheidungsspiel: ____ – ____', { color: GREY, size: 16 })));
    }
  });
  // Endrunde – gleiche Reihenfolge wie auf Blatt 1
  rows.push(sep('Endrunde'));
  const ko = [f.hf[0], f.hf[1]].concat(f.places.slice().reverse(), [['Platz 3', 'Verl. HF 1', 'Verl. HF 2'], ['Finale', 'Sieger HF 1', 'Sieger HF 2']]);
  ko.forEach(([label, a, b]) => {
    const m = F && F.ko[label];
    const names = m && m.names[0] ? `${m.names[0]} – ${m.names[1] || ''}` : `${a} – ${b}`;
    rows.push(line('', [run(label + ':  ', { bold: true }), run(names, { color: m ? '111111' : GREY, size: m ? 18 : 16 })],
      m ? [m.darts ? m.darts[0] : '', de(m.avg[0], 2), m.darts ? m.darts[1] : '', de(m.avg[1], 2)] : null));
  });
  return [
    ...band(n, 3),
    para(run('Nach jedem Match aus Autodarts ablesen und eintragen: geworfene Darts und 3-Dart-Average (Ø) beider Spieler. Spieler 1 ist der links genannte Spieler.', { size: 16, color: GREY }), { after: 120 }),
    table(w, rows, { borders: GRID }),
    note('Turnier-Average = Summe (Ø × Darts) ÷ Summe Darts – wird von der Website automatisch berechnet.')
  ];
}

/* ---------------------------------------------------------
   Ausgabe
   --------------------------------------------------------- */
const pageProps = { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: 420, bottom: 360, left: MARGIN, right: MARGIN, header: 0, footer: 0 } } };

async function build(n, fill, outFile) {
  const f = FORMATS[n];
  F = fill || null;
  const doc = new Document({
    creator: 'Eisern Alessio',
    title: F ? `EA Masters ${F.roman} – Ergebnisse` : `EA Masters – Turnierplan ${n} Spieler`,
    styles: { default: { document: { run: { font: FONT, size: 18 }, paragraph: { spacing: { before: 0, after: 0 } } } } },
    sections: [
      { properties: pageProps, children: page1(n, f) },
      { properties: pageProps, children: page2(n) },
      { properties: pageProps, children: page3(n, f) }
    ]
  });
  const file = outFile || path.join(process.env.OUT_DIR || __dirname, `EA-Masters-Turnierplan-${n}-Spieler.docx`);
  fs.writeFileSync(file, await Packer.toBuffer(doc));
  F = null;
  console.log('geschrieben:', path.basename(file));
}

module.exports = { build, FORMATS, LOGO_PNG, STRIPE_PNG };

if (require.main === module) {
  (async () => {
    const only = process.argv[2] ? [Number(process.argv[2])] : Object.keys(FORMATS).map(Number);
    for (const n of only) await build(n);
  })();
}
