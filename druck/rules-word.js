/*
 * Erzeugt das Regelwerk als Word-Dokument im EA-Masters-Design.
 *   cd druck && node rules-word.js  → druck/EA-Masters-Regeln.docx
 * Die Regeltexte sind wortgleich mit eamastersrules.html und dürfen nicht umformuliert werden.
 */
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun, Footer,
  WidthType, BorderStyle, ShadingType, AlignmentType, VerticalAlign, TableLayoutType
} = require('docx');
const { LOGO_PNG, STRIPE_PNG } = require('./generate-word');

const FONT = 'Arial', DISPLAY = 'Bahnschrift SemiBold Condensed', EMOJI = 'Segoe UI Emoji';
const YELLOW = 'FFD400', BLACK = '141414', GREY = '666666';
const PAGE_W = 11906, PAGE_H = 16838, MARGIN = 900, W = PAGE_W - 2 * MARGIN;
const NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const NO_B = { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE };

const run = (text, o = {}) => new TextRun({ text, font: o.font || FONT, size: o.size || 21, bold: o.bold, italics: o.italics, color: o.color || '111111', characterSpacing: o.spacing });
const para = (children, o = {}) => new Paragraph({
  children: Array.isArray(children) ? children : [children],
  alignment: o.align,
  spacing: { before: o.before || 0, after: o.after == null ? 60 : o.after, line: o.line },
  border: o.border, indent: o.indent,
  keepNext: o.keepNext, keepLines: true
});
const cell = (children, w, o = {}) => new TableCell({
  children, width: { size: w, type: WidthType.DXA },
  shading: o.fill ? { type: ShadingType.CLEAR, color: 'auto', fill: o.fill } : undefined,
  verticalAlign: o.vAlign || VerticalAlign.CENTER, borders: o.borders,
  margins: o.margins || { top: 0, bottom: 0, left: 0, right: 0 }
});
const table = (widths, cells, o = {}) => new Table({
  width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: widths,
  layout: TableLayoutType.FIXED, borders: o.borders || NO_B,
  rows: [new TableRow({ children: cells, cantSplit: true })]
});

/* ---------------- Regeltexte (wortgleich) ---------------- */
const FOUNDERS = {
  icon: '👑', title: 'Die ehrwürdigen Gründungsmitglieder',
  intro: 'Die folgenden Personen bilden den heiligen Kern dieses Turniers und genießen lebenslangen Legendenstatus:',
  names: ['Katsche', 'Otter', 'Quaasus', 'Sweaty'],
  outro: 'Sie sind Hüter der Regeln, Bewahrer der Tradition und dürfen jederzeit mit dem Satz beginnen:',
  quote: '„Also damals, beim ersten Turnier …“'
};
const RULES = [
  ['🏆', 'Der heilige Wanderpokal', [
    'Der Sieger des Turniers erhält den ehrwürdigen Wanderpokal.',
    'Mit großer Macht kommt große Verantwortung:',
    'Der Gewinner verpflichtet sich, das nächste Turnier auszurichten.',
    'Der Spielort darf frei gewählt werden – Wohnzimmer, Garage, Gartenhütte oder Weltmetropole.']],
  ['👥', 'Mindestteilnehmerzahl', [
    'Ein Turnier ist nur offiziell, wenn mindestens 4 Spieler teilnehmen.',
    'Davon müssen mindestens 2 Gründungsmitglieder anwesend sein, um die Tradition zu wahren und im Zweifelsfall zu behaupten:',
    { quote: '„Das Brett war früher härter und die Pfeile dicker.“' }]],
  ['📲', 'Einladungspflicht', [
    'Alle bisherigen Teilnehmer müssen eingeladen werden.',
    'Die offizielle Kommunikation erfolgt ausschließlich über die heilige WhatsApp-Gruppe.',
    '„Hab ich nicht gesehen“ zählt nicht als Ausrede.']],
  ['🏆', 'Turniermodus', [
    'Bei 4–5 Spielern gibt es eine Gruppe in der Gruppenphase, dann geht’s in die Halbfinals und Platzierungsspiele.',
    'Bei 6–8 Spielern werden zwei Gruppen gebildet, gefolgt von Halbfinals und Platzierungsspielen.',
    'Egal wie viele antreten: Spannung, Spaß und jede Menge Pfeile garantiert.']],
  ['⏳', 'Turnier-Intervall', [
    'Zwischen zwei Turnieren dürfen nicht weniger als 2 Wochen und nicht mehr als 6 Monate vergehen.',
    'Alles andere gilt als unsportliche Turnierverwässerung oder Motivationsverlust.']],
  ['🤝', 'Gentleman’s Agreement', [
    'Alle Spieler verpflichten sich zu einem respektvollen, sportlichen Umgang miteinander.',
    'Sticheleien sind erlaubt. Beleidigungen nur kreativ und mit Stil.',
    'Handschlag vor und nach jedem Spiel ist Pflicht – egal wie schmerzhaft die Niederlage war.']],
  ['🎯', 'Zugelassenes Material', [
    'Es dürfen ausschließlich normale, glatte Spitzen verwendet werden.',
    'Keine Experimente, keine Hightech-Wunderwaffen, keine Baumarkt-Konstruktionen.']],
  ['🚑', 'Die Dartitis-Regel', [
    'Spieler mit diagnostizierter Dartitis dürfen selbstverständlich nicht teilnehmen.',
    'Entwickelt ein Spieler während des Turniers plötzlich Dartitis, wird er umgehend ausgeschlossen.',
    'Das Spiel gilt als verloren.',
    'Das Leiden ist echt – das Mitleid hält sich in Grenzen.']],
  ['🎵', 'Die Walk-On-Pflicht', [
    'Jeder Spieler wählt seinen eigenen Walk-On-Song – Genre völlig egal.',
    'Von episch bis peinlich ist alles erlaubt.',
    'Wer bis Turnierstart keinen Song nennt, verliert sein Wahlrecht.',
    'Dann entscheidet der Ausrichter. Ohne Gnade.']],
  ['🏹', 'Die Robin-Hood-Regel', [
    'Steckt ein Dart im anderen (Robin Hood), wird das Spiel sofort unterbrochen.',
    'Der Werfer darf sich feiern lassen, als hätte er gerade das Finale gewonnen.',
    'Alle stehen auf, stoßen an und zollen gebührenden Respekt.',
    'Für einen kurzen Moment ist er offiziell eine Legende']],
  ['💥', 'Die 180-Eskalationsregel', [
    'Bei einer geworfenen 180 stehen alle Anwesenden auf.',
    'Sofort.',
    'Egal ob am Tisch, auf der Couch oder mitten im Gespräch.',
    'Es wird applaudiert, gejubelt oder zumindest anerkennend genickt.',
    'Wer sitzen bleibt, sollte sich schämen.']],
  ['🤷‍♂️', 'Die Eine-Ausrede-Regel', [
    'Vor jedem Turnier darf sich jeder genau eine offizielle Ausrede sichern – Rücken, Licht, Mondphase, alles erlaubt.',
    'Zu Beginn wird sie feierlich vorgetragen, als wäre es eine Pressekonferenz nach dem WM-Aus.',
    'Doppelausreden sind verboten – „Schulter UND Bier“ zählt nicht.',
    'Wer ohne angemeldete Ausrede verliert, verliert auch seine Würde.',
    'Und wer trotz Ausrede gewinnt, hat offensichtlich einfach nur tiefgestapelt.']],
  ['🏆', 'Die Titelverteidiger-Bürde', [
    'Der amtierende Pokalhalter bringt den Wanderpokal persönlich zum nächsten Turnier mit.',
    'Vor dem ersten Wurf wird er feierlich und ehrfürchtig auf den Tisch gestellt.',
    'Wer den Pokal vergisst, hat ihn offensichtlich nicht verdient.',
    'Kratzer, Fingerabdrücke und Bierflecken sind vor versammelter Mannschaft zu erklären.']],
  ['✨', 'Die 9-Darter-Klausel', [
    'Wer einen 9-Darter wirft, darf die nächsten drei Turniere ausrichten – wenn er will.',
    'Sein Name wird auf ewig in die Ruhmeshalle der Website eingetragen.',
    'Alle Anwesenden müssen den Moment bezeugen, ein Handyvideo wird dringend empfohlen.',
    'Rein theoretisch natürlich. Bisher hat diese Regel noch niemand gebraucht.']],
  ['🎈', 'Die Ballon-Dart-Regel', [
    'Neben dem Wanderpokal wird bei jedem Turnier der Ballon Dart verliehen.',
    'Ihn erhält, wer die meisten Bestwerte des Turniers holt: 3-Dart-Average, Highest Score, Checkout-Quote, Highest Checkout und Minimum Darts.',
    'Bei Gleichstand entscheidet der höhere Average.',
    'Der Ballon Dart ist eine begehrte Trophäe: Die einen nennen ihn Trostpreis, die anderen den wahren Pokal.',
    'Wer ihn holt und trotzdem das Turnier verliert, darf sich über die glanzvolle Einzelauszeichnung freuen.']]
];

/* ---------------- Bausteine ---------------- */
function header() {
  const lw = Math.round(W * 0.6), rw = W - lw;
  return [
    table([lw, rw], [
      cell([para([
        new ImageRun({ type: 'png', data: LOGO_PNG, transformation: { width: 30, height: 30 } }),
        run('  EISERN ', { font: DISPLAY, size: 34, color: 'F5F5F3' }),
        run('ALESSIO', { font: DISPLAY, size: 34, color: YELLOW })
      ], { after: 0 })], lw, { fill: BLACK, borders: { top: NONE, bottom: NONE, left: NONE, right: NONE }, margins: { top: 110, bottom: 110, left: 180, right: 80 } }),
      cell([para(run('OFFIZIELLES REGELWERK', { bold: true, size: 17, color: YELLOW, spacing: 20 }), { align: AlignmentType.RIGHT, after: 0 })], rw,
        { fill: BLACK, borders: { top: NONE, bottom: NONE, left: NONE, right: NONE }, margins: { top: 110, bottom: 110, left: 80, right: 180 } })
    ]),
    para(new ImageRun({ type: 'png', data: STRIPE_PNG, transformation: { width: Math.round(W / 15), height: 10 } }), { line: 200, after: 0 }),
    para([run('▬▬  ', { color: YELLOW, size: 16 }), run('DAS OFFIZIELLE REGELWERK', { bold: true, size: 15, spacing: 30 })], { before: 200, after: 0 }),
    table([760, 2450, W - 3210], [
      cell([para(run('EA', { font: DISPLAY, size: 80 }), { after: 0 })], 760, { vAlign: VerticalAlign.BOTTOM }),
      cell([para(run('MASTERS', { font: DISPLAY, size: 80 }), { after: 0 })], 2450, { vAlign: VerticalAlign.BOTTOM, borders: { top: NONE, left: NONE, right: NONE, bottom: { style: BorderStyle.SINGLE, size: 48, color: YELLOW } } }),
      cell([para(run('   Die heiligen Regeln', { font: DISPLAY, size: 40, color: GREY }), { after: 0 })], W - 3210, { vAlign: VerticalAlign.BOTTOM })
    ]),
    para(run(''), { after: 200 })
  ];
}

const ruleHeading = (icon, title, nr) => para([
  run(icon + '  ', { font: EMOJI, size: 26 }),
  run(title.toUpperCase(), { font: DISPLAY, size: 32 }),
  ...(nr ? [run(`   § ${nr}`, { font: DISPLAY, size: 24, color: GREY })] : [])
], { before: 260, after: 100, keepNext: true, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: YELLOW, space: 2 } } });

const line = (t, last) => (typeof t === 'object'
  ? para(run(t.quote, { italics: true, bold: true }), { keepNext: !last, indent: { left: 240 }, border: { left: { style: BorderStyle.SINGLE, size: 24, color: YELLOW, space: 8 } } })
  : para(run(t), { keepNext: !last }));

function foundersBlock() {
  const f = FOUNDERS;
  const inner = [
    ruleHeading(f.icon, f.title),
    para(run(f.intro), { keepNext: true }),
    ...f.names.map((n) => para([run('■  ', { color: YELLOW, size: 16 }), run(n, { bold: true })], { keepNext: true, indent: { left: 240 }, after: 20 })),
    para(run(f.outro), { keepNext: true, before: 100 }),
    line({ quote: f.quote }, true)
  ];
  return table([W], [cell(inner, W, { fill: 'FFF6C2', margins: { top: 60, bottom: 200, left: 240, right: 240 } })]);
}

async function main() {
  const children = [
    ...header(),
    foundersBlock(),
    ...RULES.flatMap(([icon, title, lines], i) => [ruleHeading(icon, title, i + 1), ...lines.map((t, j) => line(t, j === lines.length - 1))])
  ];
  const doc = new Document({
    creator: 'Eisern Alessio',
    title: 'EA Masters – Die heiligen Regeln',
    styles: { default: { document: { run: { font: FONT, size: 21 } } } },
    sections: [{
      properties: { page: { size: { width: PAGE_W, height: PAGE_H }, margin: { top: 600, bottom: 800, left: MARGIN, right: MARGIN, header: 300, footer: 360 } } },
      footers: { default: new Footer({ children: [para(run('Eisern Alessio · EA Masters – Die heiligen Regeln', { size: 15, color: GREY }), { align: AlignmentType.CENTER, after: 0 })] }) },
      children
    }]
  });
  const file = path.join(__dirname, 'EA-Masters-Regeln.docx');
  fs.writeFileSync(file, await Packer.toBuffer(doc));
  console.log('geschrieben:', path.basename(file));
}
main();
