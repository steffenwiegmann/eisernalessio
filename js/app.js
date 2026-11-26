/*
 * EISERN ALESSIO – Seitenlogik
 * Erzeugt Header, Footer und alle datengetriebenen Seiten aus js/data.js.
 * Für neue Turniere muss hier NICHTS geändert werden.
 */
(function () {
  'use strict';

  const D = window.EA_DATA || { players: {}, tournaments: [] };

  /* =========================================================
     Hilfsfunktionen
     ========================================================= */
  const ROMAN_MAP = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  function roman(n) {
    let r = '';
    for (const [v, s] of ROMAN_MAP) { while (n >= v) { r += s; n -= v; } }
    return r;
  }
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const isNum = (v) => typeof v === 'number' && isFinite(v);
  function num(v, digits) {
    if (!isNum(v)) return '–';
    const o = digits == null
      ? { maximumFractionDigits: 2 }
      : { minimumFractionDigits: digits, maximumFractionDigits: digits };
    return v.toLocaleString('de-DE', o);
  }
  const signed = (v) => (isNum(v) ? (v > 0 ? '+' : v < 0 ? '−' : '±') + num(Math.abs(v)) : '–');
  const pct = (v) => (isNum(v) ? num(v * 100, 1) + ' %' : '–');
  function parseDate(iso) { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); }
  const dateShort = (iso) => parseDate(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const dateLong = (iso) => parseDate(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
  const avgFromDarts = (d) => (isNum(d) && d > 0 ? (501 * 3) / d : null);
  const mean = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
  const params = new URLSearchParams(location.search);
  const $ = (sel) => document.querySelector(sel);

  /* =========================================================
     Daten aufbereiten
     ========================================================= */
  const TOURS = D.tournaments.slice().sort((a, b) => a.nr - b.nr).map((t) => Object.assign({}, t, {
    roman: roman(t.nr),
    title: 'EA Masters ' + roman(t.nr),
    url: 'turnier.html?nr=' + t.nr,
    placements: t.placements || [],
    winner: (t.placements || [])[0],
    stats: t.stats || [],
    groups: t.groups || [],
    groupMatches: t.groupMatches || [],
    knockout: t.knockout || [],
    notes: t.notes || [],
    events: t.events || [],
    // Single Out (Masters I–III): Average, Checkout, Finish und Shortest Leg sind nicht mit Double Out vergleichbar
    so: /single\s*out/i.test(t.mode || '')
  }));
  const LATEST = TOURS[TOURS.length - 1];
  const FIRST_DO = TOURS.find((t) => !t.so);
  const DO_NOTE = FIRST_DO && TOURS.some((t) => t.so) ? `ab ${FIRST_DO.title} (Double Out)` : '';
  const soTag = '<span class="badge badge-so" title="Single Out – zählt nicht in Averages, Checkout- und Finish-Rekorde">SO</span>';

  // Turnier-Average exakt aus Autodarts-Daten (Ø × Darts), wenn für alle Matches eines Spielers vorhanden
  TOURS.forEach((t) => {
    const acc = {};
    const all = t.groupMatches.concat(...t.groups.map((g) => g.tiebreak || []), t.knockout.filter((m) => m.p1 && m.p2));
    all.forEach((m) => [[m.p1, m.a1, m.n1, m.sc1], [m.p2, m.a2, m.n2, m.sc2]].forEach(([p, a, n, sc]) => {
      const o = acc[p] || (acc[p] = { pts: 0, darts: 0, complete: true, sc: [0, 0, 0, 0], scComplete: true });
      // Punkte sind ganzzahlig: Runden gleicht die 2-Nachkommastellen-Rundung des Match-Averages aus
      if (isNum(a) && isNum(n) && n > 0) { o.pts += Math.round((a * n) / 3); o.darts += n; } else o.complete = false;
      if (Array.isArray(sc) && sc.length === 4) sc.forEach((v, i) => { o.sc[i] += v; }); else o.scComplete = false;
    }));
    Object.keys(acc).forEach((p) => {
      const o = acc[p];
      const stat = () => {
        let s = t.stats.find((x) => x.p === p);
        if (!s) { s = { p }; t.stats.push(s); }
        return s;
      };
      if (o.complete && o.darts) {
        const s = stat();
        s.avg = Math.round(((o.pts / o.darts) * 3) * 100) / 100;
        s.avgCalc = true;
        s.dartsTotal = o.darts;
      }
      // Aufnahmen 60–99 / 100–139 / 140–179 / 180 aus den Matches summieren
      if (o.scComplete) {
        const s = stat();
        ['s60', 's100', 's140', 's180'].forEach((k, i) => { s[k] = o.sc[i]; });
      }
    });
  });

  // Besondere Ereignisse (180er, 100+ Finishes, 9-Darter) je Turnier und Spieler
  const EVENT_TYPES = { '180': { icon: '💥', label: '180' }, highfinish: { icon: '🎯', label: '100+ Finish' }, '9darter': { icon: '✨', label: '9-Darter' } };
  // 100+ Finishes zählen nur bei Double Out. Quelle: events (type 'highfinish', v = Wert);
  // ist dort nichts eingetragen, zählt ein Highest Checkout ab 100 aus stats als ein Finish.
  function highFinishes(t, p) {
    if (t.so) return [];
    const ev = t.events.filter((e) => e.type === 'highfinish' && e.p === p && !(isNum(e.v) && e.v < 100)).map((e) => e.v);
    if (ev.length) return ev;
    const s = t.stats.find((x) => x.p === p);
    return s && isNum(s.hco) && s.hco >= 100 ? [s.hco] : [];
  }
  function eventCount(t, p, type) {
    const n = t.events.filter((e) => e.type === type && e.p === p).length;
    if (type === '180') {
      const s = t.stats.find((x) => x.p === p);
      return Math.max(n, s && isNum(s.s180) ? s.s180 : 0);
    }
    return n;
  }

  const PLAYER_NAMES = (() => {
    const s = new Set(Object.keys(D.players || {}));
    TOURS.forEach((t) => t.placements.forEach((p) => s.add(p)));
    return Array.from(s);
  })();
  const isFounder = (n) => !!(D.players[n] && D.players[n].founder);
  const pUrl = (n) => 'spieler.html?name=' + encodeURIComponent(n);
  const pLink = (n) => `<a class="plink" href="${pUrl(n)}">${esc(n)}</a>`;
  const tLink = (t) => `<a class="tlink" href="${t.url}">${esc(t.title)}</a>`;

  // Alle Matches mit bekanntem Ergebnis (Gruppe, Entscheidungsspiel, Endrunde)
  const MATCHES = [];
  TOURS.forEach((t) => {
    t.groupMatches.forEach((m) => MATCHES.push(Object.assign({ t, stage: 'Gruppenphase' }, m)));
    t.groups.forEach((g) => (g.tiebreak || []).forEach((m) =>
      MATCHES.push(Object.assign({ t, stage: 'Entscheidungsspiel' }, m))));
    t.knockout.filter((m) => m.p1 && m.p2).forEach((m) => MATCHES.push(Object.assign({ t, stage: m.round }, m)));
  });
  const SCORED = MATCHES.filter((m) => isNum(m.s1) && isNum(m.s2));
  const STAT_ROWS = TOURS.flatMap((t) => t.stats.map((s) => Object.assign({ t }, s)));
  const STAT_DO = STAT_ROWS.filter((s) => !s.t.so); // modusabhängige Werte (Average, Checkout, Finish, Shortest Leg)
  const STAT_SO = STAT_ROWS.filter((s) => s.t.so);

  // Aufnahmen in Bereichen wie bei Autodarts: 60–99, 100–139, 140–179, 180
  const SC_KEYS = ['s60', 's100', 's140', 's180'];
  const SC_LABELS = ['60+', '100+', '140+', '180'];
  const SC_RANGES = ['60–99', '100–139', '140–179', '180'];
  const hasScoring = (s) => SC_KEYS.every((k) => isNum(s[k]));
  const tons = (s) => s.s100 + s.s140 + s.s180; // „Tonnen“ = alle Aufnahmen ab 100
  const STAT_SC = STAT_ROWS.filter(hasScoring);

  // Spieler-Aggregate
  const AGG = {};
  PLAYER_NAMES.forEach((n) => {
    AGG[n] = {
      name: n, founder: isFounder(n), entries: [], places: [], titles: 0, finals: 0, podiums: 0,
      avgs: [], avgChart: [], best: {}, mW: 0, mL: 0, lW: 0, lL: 0, ballon: 0, hosted: 0, h2h: {},
      s180: 0, ninedarter: 0, hiFin: [],
      sc: null, // Aufnahmen [60–99, 100–139, 140–179, 180] über alle Turniere mit Daten
      profile: (D.players || {})[n] || {}
    };
  });
  function keepBest(a, key, v, t, dir) {
    if (!isNum(v)) return;
    const cur = a.best[key];
    if (!cur || (dir === 'min' ? v < cur.v : v > cur.v)) a.best[key] = { v, t };
  }
  TOURS.forEach((t) => {
    t.placements.forEach((p, i) => {
      const a = AGG[p];
      const place = i + 1;
      const stat = t.stats.find((s) => s.p === p) || null;
      a.entries.push({ t, place, stat });
      a.s180 += eventCount(t, p, '180');
      a.hiFin.push(...highFinishes(t, p));
      a.ninedarter += eventCount(t, p, '9darter');
      a.places.push(place);
      if (place === 1) a.titles++;
      if (place <= 2) a.finals++;
      if (place <= 3) a.podiums++;
      if (stat && hasScoring(stat)) {
        // dv/darts: nur Turniere mit bekannter Dartzahl (für Quoten und Scoring-Mix)
        const c = a.sc || (a.sc = { v: [0, 0, 0, 0], dv: [0, 0, 0, 0], darts: 0, tours: [] });
        SC_KEYS.forEach((k, i) => { c.v[i] += stat[k]; });
        c.tours.push(t);
        if (isNum(stat.dartsTotal)) { c.darts += stat.dartsTotal; SC_KEYS.forEach((k, i) => { c.dv[i] += stat[k]; }); }
        keepBest(a, 'ton', tons(stat), t, 'max');
      }
      if (stat) {
        if (isNum(stat.avg)) a.avgChart.push({ v: stat.avg, t });
        keepBest(a, 'hs', stat.hs, t, 'max');
        if (!t.so) {
          if (isNum(stat.avg)) a.avgs.push({ v: stat.avg, t });
          keepBest(a, 'avg', stat.avg, t, 'max');
          keepBest(a, 'hco', stat.hco, t, 'max');
          keepBest(a, 'minDarts', stat.minDarts, t, 'min');
        }
      }
    });
    if (t.ballonDart && AGG[t.ballonDart]) AGG[t.ballonDart].ballon++;
    if (t.host && AGG[t.host]) AGG[t.host].hosted++;
  });
  SCORED.forEach((m) => {
    [[m.p1, m.p2, m.s1, m.s2, m.a1], [m.p2, m.p1, m.s2, m.s1, m.a2]].forEach(([me, op, sm, so, av]) => {
      const a = AGG[me];
      if (!a) return;
      const win = sm > so;
      a.mW += win ? 1 : 0; a.mL += win ? 0 : 1; a.lW += sm; a.lL += so;
      const h = a.h2h[op] || (a.h2h[op] = { w: 0, l: 0, lw: 0, ll: 0 });
      h.w += win ? 1 : 0; h.l += win ? 0 : 1; h.lw += sm; h.ll += so;
      if (!m.t.so) keepBest(a, 'matchAvg', av, m.t, 'max');
    });
  });
  Object.values(AGG).forEach((a) => {
    a.careerAvg = mean(a.avgs.map((x) => x.v));
    a.avgPlace = mean(a.places);
    a.bestPlace = a.places.length ? Math.min.apply(null, a.places) : null;
    a.matches = a.mW + a.mL;
    a.winRate = a.matches ? a.mW / a.matches : null;
    a.since = a.entries.length ? a.entries[0].t : null;
    const h = Object.entries(a.h2h).map(([op, x]) => ({ op, n: x.w + x.l, w: x.w, l: x.l }));
    // Erzrivale: meiste Duelle, bei Gleichstand die knappste Bilanz
    a.rival = h.slice().sort((x, y) => y.n - x.n || Math.abs(x.w - x.l) - Math.abs(y.w - y.l))[0] || null;
    // Angstgegner: meiste Niederlagen (nur wenn die Bilanz negativ ist)
    a.nemesis = h.filter((x) => x.l > x.w).sort((x, y) => y.l - x.l || (x.w - x.l) - (y.w - y.l))[0] || null;
    // Lieblingsgegner: meiste Siege (nur wenn die Bilanz positiv ist)
    a.favOpp = h.filter((x) => x.w > x.l).sort((x, y) => y.w - x.w || (y.w - y.l) - (x.w - x.l))[0] || null;
  });

  // Rekord-Suche: liefert Bestwert + alle Halter
  function best(items, dir) {
    const valid = items.filter((i) => isNum(i.v));
    if (!valid.length) return null;
    const vals = valid.map((i) => i.v);
    const target = dir === 'min' ? Math.min.apply(null, vals) : Math.max.apply(null, vals);
    if (dir !== 'min' && target <= 0) return null;
    return { v: target, items: valid.filter((i) => i.v === target) };
  }
  const coRate = (s) => (isNum(s.coHit) && s.coAtt > 0 ? s.coHit / s.coAtt : null);

  /* =========================================================
     Bausteine
     ========================================================= */
  const ICON = {
    board: '<svg class="board" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="#ffd400"/><circle cx="16" cy="16" r="11.5" fill="#0b0b0b"/><circle cx="16" cy="16" r="8" fill="#ffd400"/><circle cx="16" cy="16" r="4.5" fill="#0b0b0b"/><circle cx="16" cy="16" r="1.8" fill="#ffd400"/></svg>',
    trophy: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M18 6h28v14a14 14 0 0 1-28 0z" fill="currentColor"/><path d="M18 11H9v3a10 10 0 0 0 10 10M46 11h9v3a10 10 0 0 1-10 10" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><rect x="29" y="33" width="6" height="12" fill="currentColor"/><rect x="21" y="45" width="22" height="6" rx="2" fill="currentColor"/><rect x="16" y="53" width="32" height="6" rx="2" fill="currentColor"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  const NAV = [
    ['index.html', 'Start', 'home'],
    ['eamasters.html', 'Turniere', 'turniere'],
    ['statistiken.html', 'Statistiken', 'statistiken'],
    ['ruhmeshalle.html', 'Ruhmeshalle', 'ruhmeshalle'],
    ['spieler.html', 'Spieler', 'spieler'],
    ['eamastersrules.html', 'Regeln', 'regeln'],
    ['club.html', 'Verein', 'verein']
  ];

  function renderChrome() {
    const page = document.body.dataset.page === 'turnier' ? 'turniere' : document.body.dataset.page;
    const h = $('#site-header');
    if (h) {
      h.outerHTML = `
      <header class="site-header">
        <div class="wrap nav-row">
          <a class="brand" href="index.html">${ICON.board}<span>Eisern <b>Alessio</b></span></a>
          <nav id="site-nav" class="site-nav" aria-label="Hauptnavigation">
            ${NAV.map(([href, label, key]) => `<a href="${href}"${key === page ? ' class="active" aria-current="page"' : ''}>${label}</a>`).join('')}
          </nav>
          <div class="nav-actions">
            <button class="theme-toggle" type="button" aria-label="Hell/Dunkel umschalten" title="Hell/Dunkel umschalten">
              <svg class="i-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></g></svg>
              <svg class="i-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill="currentColor"/></svg>
            </button>
            <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Menü öffnen">
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
        <div class="hazard" aria-hidden="true"></div>
      </header>`;
      const themeBtn = $('.theme-toggle');
      const syncThemeLabel = () => {
        const light = document.documentElement.dataset.theme === 'light';
        themeBtn.setAttribute('aria-label', light ? 'Zum dunklen Design wechseln' : 'Zum hellen Design wechseln');
        themeBtn.title = themeBtn.getAttribute('aria-label');
      };
      syncThemeLabel();
      themeBtn.addEventListener('click', () => {
        const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
        document.documentElement.dataset.theme = next;
        try { localStorage.setItem('ea-theme', next); } catch (e) { /* z. B. privater Modus */ }
        syncThemeLabel();
      });
      const btn = $('.nav-toggle');
      const nav = $('#site-nav');
      btn.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(open));
        btn.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
      });
    }
    const f = $('#site-footer');
    if (f) {
      f.outerHTML = `
      <footer class="site-footer">
        <div class="hazard" aria-hidden="true"></div>
        <div class="wrap footer-row">
          <div class="brand brand-sm">${ICON.board}<span>Eisern <b>Alessio</b></span></div>
          <p>Darts unter Freunden · seit ${TOURS.length ? TOURS[0].date.slice(0, 4) : ''} · „Also damals, beim ersten Turnier …“</p>
          <nav class="footer-nav" aria-label="Fußzeile">${NAV.map(([href, label]) => `<a href="${href}">${label}</a>`).join('')}</nav>
        </div>
      </footer>`;
    }
  }

  const pageHead = (kicker, title, lead, extra) => `
    <section class="page-head">
      <div class="wrap">
        ${kicker ? `<p class="kicker">${kicker}</p>` : ''}
        <h1 class="display">${title}</h1>
        ${lead ? `<p class="lead">${lead}</p>` : ''}
        ${extra || ''}
      </div>
    </section>`;

  const sectionHead = (kicker, title, aside) => `
    <div class="section-head">
      <div>${kicker ? `<p class="kicker">${kicker}</p>` : ''}<h2>${title}</h2></div>
      ${aside || ''}
    </div>`;

  const kpi = (label, value, sub) => `
    <div class="kpi"><div class="kpi-value">${value}</div><div class="kpi-label">${label}</div>${sub ? `<div class="kpi-sub">${sub}</div>` : ''}</div>`;

  const placeBadge = (p) => `<span class="place place-${p <= 3 ? p : 'x'}">${p}</span>`;

  function podium(t) {
    return `<div class="podium" role="list" aria-label="Podium ${esc(t.title)}">
      ${[1, 0, 2].map((i) => (t.placements[i] ? `
        <div class="podium-step step-${i + 1}" role="listitem">
          <a class="podium-name" href="${pUrl(t.placements[i])}">${esc(t.placements[i])}</a>
          <div class="podium-block"><span>${i + 1}</span></div>
        </div>` : '')).join('')}
    </div>`;
  }

  function tourCard(t) {
    return `
    <a class="tour-card" href="${t.url}">
      <div class="tour-num" aria-hidden="true">${t.roman}</div>
      <div class="tour-body">
        <div class="tour-title">${esc(t.title)}</div>
        <div class="tour-meta">${dateShort(t.date)} · ${esc(t.venue)}${t.country ? ', ' + esc(t.country) : ''}</div>
        <div class="tour-winner"><span class="trophy-mini">${ICON.trophy}</span>${esc(t.winner || 'offen')}</div>
        <div class="tags">
          <span class="tag">${t.placements.length} Spieler</span>
          <span class="tag">${esc((t.mode || '').split('·').slice(0, 2).join('·').trim())}</span>
          ${t.host ? `<span class="tag">Ausrichter: ${esc(t.host)}</span>` : ''}
        </div>
      </div>
      <span class="tour-arrow">${ICON.arrow}</span>
    </a>`;
  }

  function champCard(t) {
    return `
    <aside class="champ-card">
      <div class="champ-trophy">${ICON.trophy}</div>
      <p class="champ-label">Aktueller Pokalhalter</p>
      <div class="champ-name">${pLink(t.winner)}</div>
      <p class="champ-meta">Sieger ${esc(t.title)} · ${dateLong(t.date)}</p>
      <p class="champ-next">Laut Regelwerk richtet ${esc(t.winner)} die <strong>EA Masters ${roman(t.nr + 1)}</strong> aus.</p>
    </aside>`;
  }

  function table(head, rows, cls) {
    return `<div class="table-wrap"><table class="${cls || ''}">
      <thead><tr>${head.map((h) => `<th${h.cls ? ` class="${h.cls}"` : ''}${h.title ? ` title="${esc(h.title)}"` : ''}>${h.l}</th>`).join('')}</tr></thead>
      <tbody>${rows.join('')}</tbody></table></div>`;
  }

  // Einfaches horizontales Balkendiagramm (eine Serie, Wert direkt beschriftet)
  function barChart(items, opts) {
    opts = opts || {};
    if (!items.length) return '<p class="muted">Noch keine Daten.</p>';
    const max = opts.max || Math.max.apply(null, items.map((i) => i.v));
    const min = opts.min || 0;
    return `<div class="bars" role="list">
      ${items.map((i, idx) => {
        const w = Math.max(2, ((i.v - min) / (max - min || 1)) * 100);
        return `<div class="bar-row${idx === 0 ? ' top' : ''}" role="listitem" tabindex="0" data-tip="${esc(i.tip || '')}">
          <span class="bar-label">${i.href ? `<a href="${i.href}">${esc(i.label)}</a>` : esc(i.label)}</span>
          <span class="bar-track"><span class="bar-fill" style="--w:${w.toFixed(1)}%"></span></span>
          <span class="bar-value">${i.display}</span>
        </div>`;
      }).join('')}
    </div>`;
  }

  // Linien-Diagramm für einen Spieler (Average je Turnier)
  function lineChart(points) {
    const W = 640, H = 240, L = 44, R = 20, T = 20, B = 36;
    const vals = points.map((p) => p.v);
    const lo = Math.floor((Math.min.apply(null, vals) - 4) / 5) * 5;
    const hi = Math.ceil((Math.max.apply(null, vals) + 4) / 5) * 5;
    const xs = (i) => L + (TOURS.length === 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (TOURS.length - 1));
    const ys = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
    const ticks = [];
    for (let v = lo; v <= hi; v += 5) ticks.push(v);
    const pts = points.map((p) => ({ x: xs(TOURS.indexOf(p.t)), y: ys(p.v), p }));
    const path = pts.map((q, i) => (i ? 'L' : 'M') + q.x.toFixed(1) + ' ' + q.y.toFixed(1)).join(' ');
    return `<figure class="chart">
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Average-Verlauf">
        ${ticks.map((v) => `<line class="grid" x1="${L}" x2="${W - R}" y1="${ys(v)}" y2="${ys(v)}"/><text class="axis" x="${L - 8}" y="${ys(v) + 4}" text-anchor="end">${v}</text>`).join('')}
        ${TOURS.map((t, i) => `<text class="axis" x="${xs(i)}" y="${H - 12}" text-anchor="middle">${t.roman}</text>`).join('')}
        <path class="line" d="${path}"/>
        ${pts.map((q) => `<g class="pt${q.p.t.so ? ' pt-so' : ''}" tabindex="0"><circle class="hit" cx="${q.x}" cy="${q.y}" r="16"/><circle class="dot" cx="${q.x}" cy="${q.y}" r="5.5"/><text class="pt-label" x="${q.x}" y="${q.y - 14}" text-anchor="middle">${num(q.p.v, 2)}</text><title>${esc(q.p.t.title)}: Ø ${num(q.p.v, 2)}${q.p.t.so ? ' (Single Out)' : ''}</title></g>`).join('')}
      </svg>
      <figcaption>3-Dart-Average je Turnier (Turniere ohne Statistik fehlen).${points.some((p) => p.t.so) ? ' Hohle Punkte = Single Out, nicht direkt vergleichbar.' : ''}</figcaption>
    </figure>`;
  }

  /* =========================================================
     Startseite
     ========================================================= */
  function renderHome() {
    const legs = SCORED.reduce((s, m) => s + m.s1 + m.s2, 0);
    const hs = best(STAT_ROWS.map((s) => ({ v: s.hs, p: s.p })), 'max');
    const rulesTeaser = [
      ['🏆', 'Der heilige Wanderpokal', 'Der Gewinner verpflichtet sich, das nächste Turnier auszurichten.'],
      ['💥', 'Die 180-Eskalationsregel', 'Bei einer geworfenen 180 stehen alle Anwesenden auf.'],
      ['🤷‍♂️', 'Die Eine-Ausrede-Regel', 'Doppelausreden sind verboten – „Schulter UND Bier“ zählt nicht.']
    ];
    return `
    <section class="hero">
      <div class="wrap hero-grid">
        <div class="hero-copy">
          <p class="kicker">Darts unter Freunden · seit ${TOURS[0].date.slice(0, 4)}</p>
          <h1 class="display hero-title">Eisern<br><span class="hl">Alessio</span></h1>
          <p class="lead">Die offizielle Heimat der <strong>EA Masters</strong>: alle Turniere, Ergebnisse, Statistiken und die heiligen Regeln – gesammelt an einem Ort.</p>
          <div class="cta">
            <a class="btn btn-primary" href="eamasters.html">Zu den Turnieren ${ICON.arrow}</a>
            <a class="btn btn-ghost" href="statistiken.html">Statistiken</a>
          </div>
        </div>
        ${champCard(LATEST)}
      </div>
    </section>

    <section class="wrap section clock-section">
      <div class="clock" id="ea-clock">
        <p class="kicker" id="ea-clock-title"></p>
        <div class="clock-digits" aria-live="off">
          <div><span id="ea-d">–</span><small>Tage</small></div>
          <div><span id="ea-h">–</span><small>Stunden</small></div>
          <div><span id="ea-m">–</span><small>Minuten</small></div>
        </div>
        <p class="clock-note" id="ea-clock-note"></p>
      </div>
    </section>

    <section class="wrap kpis">
      ${kpi('Turniere', TOURS.length)}
      ${kpi('Spieler', PLAYER_NAMES.length)}
      ${kpi('Matches', SCORED.length)}
      ${hs ? kpi('Höchster Score', hs.v, hs.items.map((i) => esc(i.p)).join(', ')) : kpi('Legs', legs)}
    </section>

    <section class="wrap section">
      ${sectionHead('Zuletzt gespielt', esc(LATEST.title), `<a class="more" href="${LATEST.url}">Alle Details ${ICON.arrow}</a>`)}
      <div class="feature">
        <div class="feature-info">
          <dl class="facts">
            <div><dt>Datum</dt><dd>${dateLong(LATEST.date)}</dd></div>
            <div><dt>Spielort</dt><dd>${esc(LATEST.venue)}${LATEST.country ? ', ' + esc(LATEST.country) : ''}</dd></div>
            <div><dt>Modus</dt><dd>${esc(LATEST.mode)}</dd></div>
            <div><dt>Teilnehmer</dt><dd>${LATEST.placements.length}</dd></div>
          </dl>
        </div>
        ${podium(LATEST)}
      </div>
    </section>

    <section class="wrap section">
      ${sectionHead('Turnierserie', 'Alle EA Masters', '<a class="more" href="eamasters.html">Übersicht ' + ICON.arrow + '</a>')}
      <div class="tour-grid">${TOURS.slice().reverse().map(tourCard).join('')}</div>
    </section>

    <section class="wrap section split">
      <div class="panel">
        ${sectionHead('Ehrentafel', 'Die Sieger')}
        <ol class="honor">
          ${TOURS.map((t) => `<li><a href="${t.url}"><span class="honor-t">${t.roman}</span><span class="honor-n">${esc(t.winner)}</span><span class="honor-d">${dateShort(t.date)}</span></a></li>`).join('')}
        </ol>
        <a class="more" href="statistiken.html">Ewige Tabelle &amp; Rekorde ${ICON.arrow}</a>
      </div>
      <div class="panel">
        ${sectionHead('Das Regelwerk', 'Heilige Regeln')}
        <ul class="rule-teaser">
          ${rulesTeaser.map(([i, h, p]) => `<li><span class="rt-icon">${i}</span><div><strong>${h}</strong><p>${p}</p></div></li>`).join('')}
        </ul>
        <a class="more" href="eamastersrules.html">Alle Regeln ${ICON.arrow}</a>
      </div>
    </section>`;
  }

  /* =========================================================
     Turnierübersicht
     ========================================================= */
  function renderTurniere() {
    const next = `
      <div class="next-card">
        <div class="next-num" aria-hidden="true">${roman(LATEST.nr + 1)}</div>
        <div>
          <p class="kicker">Als Nächstes</p>
          <h3>EA Masters ${roman(LATEST.nr + 1)}</h3>
          <p>Ausrichter: <strong>${pLink(LATEST.winner)}</strong> (Titelverteidiger) · Termin und Spielort folgen über die heilige WhatsApp-Gruppe.</p>
        </div>
      </div>`;
    return `
    ${pageHead('Turnierserie', 'EA <span class="hl">Masters</span>', 'Alle Turniere der Eisern Alessio Masters – vom ersten Wurf in Bovenden bis heute. Klick auf ein Turnier für Ergebnisse, Endrunde und Statistiken.')}
    <section class="wrap section">
      ${next}
      <div class="timeline">
        ${TOURS.slice().reverse().map((t) => `
          <article class="tl-item">
            <div class="tl-date"><span>${dateShort(t.date)}</span></div>
            <div class="tl-card">
              ${tourCard(t)}
              <ol class="tl-top">
                ${t.placements.slice(0, 3).map((p, i) => `<li>${placeBadge(i + 1)} ${pLink(p)}</li>`).join('')}
                ${t.ballonDart ? `<li class="tl-ballon">🎈 Ballon Dart: ${pLink(t.ballonDart)}</li>` : ''}
              </ol>
            </div>
          </article>`).join('')}
      </div>
    </section>`;
  }

  /* =========================================================
     Turnierdetail
     ========================================================= */
  const ROUND_ORDER = ['Viertelfinale', 'Halbfinale', 'Spiel um Platz 7', 'Spiel um Platz 5', 'Spiel um Platz 3', 'Finale'];

  function matchCard(m) {
    if (m.text) {
      return `<div class="match"><div class="match-bo">Best of ${m.bo || '?'}</div>
        <div class="match-text">${esc(m.text)}</div><div class="match-result">${esc(m.result || '')}</div></div>`;
    }
    const row = (p, s, a, c, win) => `
      <div class="mrow${win ? ' win' : ''}">
        <span class="mname">${pLink(p)}</span>
        ${isNum(a) ? `<span class="mstat" title="3-Dart-Average">Ø ${num(a, 2)}</span>` : ''}
        ${c ? `<span class="mstat" title="Checkouts (Treffer/Versuche)">${esc(c)}</span>` : ''}
        <span class="mscore">${s}</span>
      </div>`;
    return `<div class="match${m.round === 'Finale' ? ' final' : ''}">
      <div class="match-bo">Best of ${m.bo || '?'}</div>
      ${row(m.p1, m.s1, m.a1, m.c1, m.s1 > m.s2)}
      ${row(m.p2, m.s2, m.a2, m.c2, m.s2 > m.s1)}
    </div>`;
  }

  function matchTable(list) {
    const hasD = list.some((m) => isNum(m.d1));
    const hasA = list.some((m) => isNum(m.a1));
    const hasC = list.some((m) => m.c1);
    const head = [{ l: 'Spieler 1' }, { l: 'Legs', cls: 'c' }, { l: 'Spieler 2' }];
    if (hasD) head.push({ l: 'Differenz', cls: 'r', title: 'Restpunkte-Differenz aus Sicht von Spieler 1' });
    if (hasA) head.push({ l: 'Average', cls: 'r' });
    if (hasC) head.push({ l: 'Checkouts', cls: 'r', title: 'Treffer/Versuche' });
    const rows = list.map((m) => `<tr>
      <td class="${m.s1 > m.s2 ? 'w' : ''}">${pLink(m.p1)}</td>
      <td class="c score">${m.s1}:${m.s2}</td>
      <td class="${m.s2 > m.s1 ? 'w' : ''}">${pLink(m.p2)}</td>
      ${hasD ? `<td class="r num">${signed(m.d1)}</td>` : ''}
      ${hasA ? `<td class="r num">${num(m.a1, 2)} – ${num(m.a2, 2)}</td>` : ''}
      ${hasC ? `<td class="r num">${esc(m.c1 || '–')} – ${esc(m.c2 || '–')}</td>` : ''}
    </tr>`);
    return table(head, rows, 'compact');
  }

  const STAT_COLS = [
    { k: 'gp', l: 'Games', title: 'Games gespielt' },
    { k: 'gw', l: 'Siege', title: 'Games gewonnen', best: 'max' },
    { k: 'lp', l: 'Legs', title: 'Legs gespielt' },
    { k: 'lw', l: 'Legs gew.', title: 'Legs gewonnen', best: 'max' },
    { k: 'avg', l: '3-Dart Ø', d: 2, best: 'max', title: '3-Dart-Average' },
    { k: 'hs', l: 'High Score', best: 'max', title: 'Höchste Aufnahme' },
    { k: 'co', l: 'Checkout', get: coRate, fmt: (v, s) => `${pct(v)} <small>${s.coHit}/${s.coAtt}</small>`, best: 'max', title: 'Checkout-Quote (Treffer/Versuche)' },
    { k: 'hco', l: 'Highest Finish', best: 'max', title: 'Höchstes Checkout' },
    { k: 'minDarts', l: 'Shortest Leg', best: 'min', fmt: (v) => `${v} <small>Ø ${num(avgFromDarts(v), 2)}</small>`, title: 'Kürzestes Leg in Darts' },
    { k: 's60', l: '60+', best: 'max', title: 'Aufnahmen mit 60–99 Punkten' },
    { k: 's100', l: '100+', best: 'max', title: 'Aufnahmen mit 100–139 Punkten' },
    { k: 's140', l: '140+', best: 'max', title: 'Aufnahmen mit 140–179 Punkten' },
    { k: 's180', l: '180', best: 'max', title: '180er' }
  ];

  // Scoring-Mix: gestapelter Balken aller Aufnahmen (unter 60 bis 180)
  function scoreMix(v, darts) {
    const visits = darts ? Math.round(darts / 3) : 0;
    const low = visits ? Math.max(0, visits - v.reduce((s, x) => s + x, 0)) : null;
    const parts = (low != null ? [['< 60', low, 0]] : []).concat(v.map((x, i) => [SC_RANGES[i], x, i + 1]));
    const total = parts.reduce((s, p) => s + p[1], 0) || 1;
    const share = (x) => (x / total) * 100;
    return `<div class="score-mix">
      <div class="mix-bar" role="img" aria-label="Verteilung der Aufnahmen">
        ${parts.filter((p) => p[1] > 0).map(([l, x, k]) => `<span class="mix-seg mix-${k}" style="--w:${share(x).toFixed(2)}%" title="${esc(l)}: ${x} (${num(share(x), 1)} %)"></span>`).join('')}
      </div>
      <ul class="mix-legend">
        ${parts.map(([l, x, k]) => `<li><i class="mix-${k}"></i>${esc(l)} <strong class="num">${x}</strong>${low != null ? ` <span class="muted">${num(share(x), 1)} %</span>` : ''}</li>`).join('')}
      </ul>
    </div>`;
  }

  function statsTable(t) {
    const order = (p) => { const i = t.placements.indexOf(p); return i < 0 ? 99 : i; };
    const rows = t.stats.slice().sort((a, b) => order(a.p) - order(b.p));
    const val = (c, s) => (c.get ? c.get(s) : s[c.k]);
    const cols = STAT_COLS.filter((c) => rows.some((s) => isNum(val(c, s))));
    const bests = {};
    cols.forEach((c) => { if (c.best) { const b = best(rows.map((s) => ({ v: val(c, s) })), c.best); if (b) bests[c.k] = b.v; } });
    const head = [{ l: '#' }, { l: 'Spieler' }].concat(cols.map((c) => ({ l: c.l, cls: 'r', title: c.title })));
    const body = rows.map((s) => `<tr>
      <td>${placeBadge(order(s.p) + 1)}</td><td>${pLink(s.p)}</td>
      ${cols.map((c) => {
        const v = val(c, s);
        const txt = !isNum(v) ? '–' : c.fmt ? c.fmt(v, s) : num(v, c.d);
        return `<td class="r num${isNum(v) && bests[c.k] === v ? ' best' : ''}">${txt}</td>`;
      }).join('')}
    </tr>`);
    return table(head, body, 'stats');
  }

  function tourBests(t) {
    const S = t.stats.map((s) => Object.assign({ co: coRate(s), ton: hasScoring(s) ? tons(s) : null }, s));
    const defs = [
      ['3-Dart-Average', 'avg', 'max', (v) => num(v, 2)],
      ['High Score', 'hs', 'max', (v) => v],
      ['Highest Finish', 'hco', 'max', (v) => v],
      ['Shortest Leg', 'minDarts', 'min', (v) => v + ' Darts'],
      ['Checkout-Quote', 'co', 'max', pct],
      ['Meiste Tonnen (100+)', 'ton', 'max', (v) => v + '×']
    ];
    const tiles = defs.map(([label, k, dir, f]) => {
      const b = best(S.map((s) => ({ v: s[k], p: s.p })), dir);
      return b ? `<div class="record"><div class="record-label">${label}</div><div class="record-value">${f(b.v)}</div><div class="record-who">${b.items.map((i) => pLink(i.p)).join(', ')}</div></div>` : '';
    }).join('');
    const ballon = t.ballonDart ? `<div class="record"><div class="record-label">🎈 Ballon Dart</div><div class="record-value"><a class="plink-y" href="${pUrl(t.ballonDart)}">${esc(t.ballonDart)}</a></div><div class="record-who muted">Sieger des Ballon Darts</div></div>` : '';
    return tiles + ballon;
  }

  function renderTurnier() {
    const nr = parseInt(params.get('nr'), 10);
    const t = TOURS.find((x) => x.nr === nr) || (isNaN(nr) ? LATEST : null);
    if (!t) return pageHead('Turnier', 'Nicht gefunden', 'Dieses Turnier gibt es (noch) nicht. <a href="eamasters.html">Zur Übersicht</a>');
    document.title = t.title + ' · Eisern Alessio';
    const idx = TOURS.indexOf(t);
    const prev = TOURS[idx - 1];
    const next = TOURS[idx + 1];

    const chips = `<div class="chips">
      <span class="chip">📅 ${dateLong(t.date)}</span>
      <span class="chip">📍 ${esc(t.venue)}${t.country ? ', ' + esc(t.country) : ''}</span>
      ${t.host ? `<span class="chip">🏠 Ausrichter: ${pLink(t.host)}</span>` : ''}
      <span class="chip">🎯 ${esc(t.mode)}</span>
      <span class="chip">👥 ${t.placements.length} Spieler</span>
    </div>`;

    // Endrunde
    const roundIdx = (r) => { const i = ROUND_ORDER.indexOf(r); return i < 0 ? 50 : i; };
    const rounds = Array.from(new Set(t.knockout.map((m) => m.round))).sort((a, b) => roundIdx(a) - roundIdx(b));
    const ko = rounds.length ? `
      <section class="wrap section">
        ${sectionHead('Endrunde', 'K.-o.-Phase')}
        <div class="rounds">
          ${rounds.map((r) => `<div class="round${r === 'Finale' ? ' round-final' : ''}"><h3>${esc(r)}</h3>${t.knockout.filter((m) => m.round === r).map(matchCard).join('')}</div>`).join('')}
        </div>
      </section>` : '';

    // Gruppenphase
    const semis = new Set(t.knockout.filter((m) => m.round === 'Halbfinale').flatMap((m) => [m.p1, m.p2]));
    const groups = t.groups.length ? `
      <section class="wrap section">
        ${sectionHead('Vorrunde', 'Gruppenphase', semis.size ? '<span class="legend-q"><i></i> fürs Halbfinale qualifiziert</span>' : '')}
        <div class="groups">
          ${t.groups.map((g) => {
            const names = g.standings.map((s) => s.p);
            const gm = t.groups.length === 1 ? t.groupMatches : t.groupMatches.filter((m) => names.includes(m.p1) && names.includes(m.p2));
            const hasG = g.standings.some((s) => s.games);
            const hasD = g.standings.some((s) => isNum(s.diff));
            const head = [{ l: '#' }, { l: 'Spieler' }].concat(hasG ? [{ l: 'Games', cls: 'r' }] : [], [{ l: 'Legs', cls: 'r' }], hasD ? [{ l: 'Differenz', cls: 'r' }] : []);
            const rows = g.standings.map((s, i) => `<tr class="${semis.has(s.p) ? 'q' : ''}">
              <td>${i + 1}</td><td>${pLink(s.p)}</td>
              ${hasG ? `<td class="r num">${esc(s.games || '–')}</td>` : ''}
              <td class="r num">${esc(s.legs || '–')}</td>
              ${hasD ? `<td class="r num">${signed(s.diff)}</td>` : ''}
            </tr>`);
            return `<div class="group">
              <h3>${esc(g.name)}</h3>
              ${table(head, rows, 'standings')}
              ${g.tiebreak ? `<p class="sub-h">Entscheidungsspiel</p>${matchTable(g.tiebreak)}` : ''}
              ${gm.length ? `<p class="sub-h">Gruppenspiele (${gm.length})</p>${matchTable(gm)}` : ''}
            </div>`;
          }).join('')}
        </div>
      </section>` : '';

    const stats = t.stats.length ? `
      <section class="wrap section">
        ${sectionHead('Zahlen', 'Bestwerte des Turniers')}
        ${t.so ? `<p class="note-so">${soTag} Dieses Turnier wurde mit <strong>Single Out</strong> gespielt. Average, Checkout, Finish und Shortest Leg zählen deshalb nicht in die ewigen Averages und Rekorde – High Score und 180er schon.</p>` : ''}
        <div class="records">${tourBests(t)}</div>
      </section>
      <section class="wrap section">
        ${sectionHead('Zahlen', 'Spielerstatistiken', '<span class="legend-best"><i></i> Bestwert</span>')}
        ${statsTable(t)}
      </section>` : (t.ballonDart ? `<section class="wrap section"><div class="records">${tourBests(t)}</div></section>` : '');

    const momentItems = t.events.map((e) => {
      const ty = EVENT_TYPES[e.type] || { icon: '⭐', label: e.type };
      return `<li><span class="m-icon" aria-hidden="true">${ty.icon}</span><span><strong>${esc(ty.label)}</strong>${isNum(e.v) ? ` ${e.v}` : ''} · ${pLink(e.p)}${e.note ? ` <span class="muted">– ${esc(e.note)}</span>` : ''}</span></li>`;
    });
    const notes = (momentItems.length || t.notes.length) ? `
      <section class="wrap section">
        ${sectionHead('Abseits der Zahlen', 'Besondere Momente')}
        ${momentItems.length ? `<ul class="moments">${momentItems.join('')}</ul>` : ''}
        ${t.notes.length ? `<div class="note">${t.notes.map((n) => `<p>ℹ️ ${esc(n)}</p>`).join('')}</div>` : ''}
      </section>` : '';

    return `
    ${pageHead(`Turnier ${t.nr} von ${TOURS.length}`, `EA Masters <span class="hl">${t.roman}</span>`, '', chips)}
    <section class="wrap section">
      <div class="result-grid">
        <div class="panel champion">
          <div class="champ-trophy">${ICON.trophy}</div>
          <p class="champ-label">Turniersieger</p>
          <div class="champ-name">${pLink(t.winner)}</div>
          ${podium(t)}
        </div>
        <div class="panel">
          <h3 class="panel-title">Abschlussplatzierung</h3>
          <ol class="ranking">
            ${t.placements.map((p, i) => `<li>${placeBadge(i + 1)}${pLink(p)}${isFounder(p) ? '<span class="badge" title="Gründungsmitglied">GM</span>' : ''}</li>`).join('')}
          </ol>
        </div>
      </div>
    </section>
    ${ko}
    ${groups}
    ${stats}
    ${notes}
    <nav class="wrap pager" aria-label="Weitere Turniere">
      ${prev ? `<a class="btn btn-ghost" href="${prev.url}">← ${esc(prev.title)}</a>` : '<span></span>'}
      <a class="btn btn-ghost" href="eamasters.html">Alle Turniere</a>
      ${next ? `<a class="btn btn-ghost" href="${next.url}">${esc(next.title)} →</a>` : '<span></span>'}
    </nav>`;
  }

  /* =========================================================
     Statistiken
     ========================================================= */
  function recordCard(label, b, fmt, who, sub) {
    if (!b) return '';
    return `<div class="record">
      <div class="record-label">${label}</div>
      <div class="record-value">${fmt(b.v)}</div>
      <div class="record-who">${b.items.map(who).join('<br>')}</div>
      ${sub ? `<div class="record-sub">${sub}</div>` : ''}
    </div>`;
  }

  function renderStatistiken() {
    const players = Object.values(AGG).filter((a) => a.entries.length);
    const whoT = (i) => `${pLink(i.p)} <span class="muted">· ${tLink(i.t)}</span>`;
    const legWins = SCORED.filter((m) => isNum(m.d1)).map((m) => ({
      v: Math.abs(m.d1), p: m.d1 > 0 ? m.p1 : m.p2, o: m.d1 > 0 ? m.p2 : m.p1, t: m.t
    }));
    const matchAvgs = SCORED.flatMap((m) => [
      { v: m.a1, p: m.p1, o: m.p2, t: m.t, r: m.stage },
      { v: m.a2, p: m.p2, o: m.p1, t: m.t, r: m.stage }
    ]);
    const whoM = (i) => `${pLink(i.p)} <span class="muted">vs. ${esc(i.o)} · ${esc(i.r)}, ${tLink(i.t)}</span>`;
    // Modusabhängige Rekorde – getrennt nach Double Out und Single Out
    const modeRecords = (rows, so, sub) => [
      recordCard('Bester Turnier-Average', best(rows.map((s) => ({ v: s.avg, p: s.p, t: s.t })), 'max'), (v) => num(v, 2), whoT, sub),
      recordCard('Bester Match-Average', best(matchAvgs.filter((i) => i.t.so === so), 'max'), (v) => num(v, 2), whoM, sub),
      recordCard('Höchstes Finish', best(rows.map((s) => ({ v: s.hco, p: s.p, t: s.t })), 'max'), (v) => v, whoT, sub),
      recordCard('Kürzestes Leg', best(rows.map((s) => ({ v: s.minDarts, p: s.p, t: s.t })), 'min'), (v) => v + ' Darts', whoT, sub),
      recordCard('Beste Checkout-Quote', best(rows.map((s) => ({ v: coRate(s), p: s.p, t: s.t })), 'max'), pct, whoT, sub)
    ];
    const doRec = modeRecords(STAT_DO, false, DO_NOTE ? 'Double Out' : '');

    const records = [
      doRec[0], doRec[1],
      recordCard('Höchster Score', best(STAT_ROWS.map((s) => ({ v: s.hs, p: s.p, t: s.t })), 'max'), (v) => v, whoT),
      doRec[2], doRec[3], doRec[4],
      recordCard('Deutlichster Leg-Sieg', best(legWins, 'max'), (v) => '+' + v, (i) => `${pLink(i.p)} <span class="muted">vs. ${esc(i.o)} · ${tLink(i.t)}</span>`, 'Restpunkte des Gegners'),
      recordCard('Meiste Titel', best(players.map((a) => ({ v: a.titles, p: a.name })), 'max'), (v) => v + '×', (i) => pLink(i.p)),
      recordCard('Meiste Tonnen (100+)', best(STAT_SC.map((s) => ({ v: tons(s), p: s.p, t: s.t })), 'max'), (v) => v + '×', whoT, 'in einem Turnier')
    ].join('');

    // Aufnahmen über alle Turniere mit Autodarts-Daten
    const scPlayers = players.filter((a) => a.sc).map((a) => {
      const ton = a.sc.v[1] + a.sc.v[2] + a.sc.v[3];
      const visits = a.sc.darts ? a.sc.darts / 3 : null;
      return { a, v: a.sc.v, ton, visits, rate: visits ? (a.sc.dv[1] + a.sc.dv[2] + a.sc.dv[3]) / visits : null };
    }).sort((x, y) => y.ton - x.ton || y.v[0] - x.v[0]);
    const scTours = TOURS.filter((t) => t.stats.some(hasScoring));
    const scBest = [0, 1, 2, 3].map((i) => Math.max.apply(null, scPlayers.map((r) => r.v[i])));
    const scRateBest = Math.max.apply(null, scPlayers.map((r) => r.rate || 0));
    const scoringTable = scPlayers.length ? table(
      [{ l: 'Spieler' }, { l: 'Turniere', cls: 'r' }].concat(SC_LABELS.map((l, i) => ({ l, cls: 'r', title: 'Aufnahmen mit ' + SC_RANGES[i] + ' Punkten' })),
        [{ l: 'Tonnen', cls: 'r', title: 'Alle Aufnahmen ab 100 Punkten' }, { l: 'Tonnen-Quote', cls: 'r', title: 'Anteil der Aufnahmen ab 100 (Aufnahmen ≈ Darts ÷ 3, nur Turniere mit Autodarts-Dartzahl)' }]),
      scPlayers.map((r) => `<tr>
        <td>${pLink(r.a.name)}</td>
        <td class="r num">${r.a.sc.tours.length}</td>
        ${r.v.map((x, i) => `<td class="r num${x && x === scBest[i] ? ' best' : ''}">${x}</td>`).join('')}
        <td class="r num strong">${r.ton}</td>
        <td class="r num${r.rate && r.rate === scRateBest ? ' best' : ''}">${r.rate != null ? `${pct(r.rate)}${r.rate > 0 ? ` <small>jede ${num(1 / r.rate, 1)}.</small>` : ''}` : '–'}</td>
      </tr>`), 'stats') : '';
    const tonRank = scPlayers.map((r) => ({ label: r.a.name, href: pUrl(r.a.name), v: r.ton, display: String(r.ton), tip: `${r.a.name}: ${r.v[1]}× 100+, ${r.v[2]}× 140+, ${r.v[3]}× 180` }));
    const soTours = TOURS.filter((t) => t.so);
    const soRecords = STAT_SO.length ? modeRecords(STAT_SO, true).join('') : '';

    const eternal = players.slice().sort((a, b) =>
      b.titles - a.titles || b.finals - a.finals || b.podiums - a.podiums || a.avgPlace - b.avgPlace || b.entries.length - a.entries.length);
    const eternalTable = table(
      [{ l: '#' }, { l: 'Spieler' }, { l: 'Turniere', cls: 'r' }, { l: '🏆 Titel', cls: 'r' }, { l: 'Finals', cls: 'r' },
        { l: 'Podien', cls: 'r' }, { l: 'Ø Platz', cls: 'r' }, { l: 'Matches', cls: 'r', title: 'Siege–Niederlagen (Matches mit bekanntem Ergebnis)' },
        { l: 'Legs', cls: 'r' }, { l: 'Ø Average', cls: 'r', title: DO_NOTE ? 'Nur Turniere ' + DO_NOTE : '' }],
      eternal.map((a, i) => `<tr${i === 0 ? ' class="lead-row"' : ''}>
        <td>${placeBadge(i + 1)}</td>
        <td>${pLink(a.name)}${a.founder ? '<span class="badge" title="Gründungsmitglied">GM</span>' : ''}</td>
        <td class="r num">${a.entries.length}</td>
        <td class="r num strong">${a.titles}</td>
        <td class="r num">${a.finals}</td>
        <td class="r num">${a.podiums}</td>
        <td class="r num">${num(a.avgPlace, 2)}</td>
        <td class="r num">${a.mW}–${a.mL}</td>
        <td class="r num">${a.lW}:${a.lL}</td>
        <td class="r num">${a.careerAvg != null ? num(a.careerAvg, 2) : '–'}</td>
      </tr>`), 'stats');

    const avgRank = players.filter((a) => a.careerAvg != null).sort((a, b) => b.careerAvg - a.careerAvg).map((a) => ({
      label: a.name, href: pUrl(a.name), v: a.careerAvg, display: num(a.careerAvg, 2),
      tip: `${a.name}: Ø ${num(a.careerAvg, 2)} aus ${a.avgs.length} Turnier${a.avgs.length > 1 ? 'en' : ''} · Bestwert ${num(a.best.avg.v, 2)} (${a.best.avg.t.title})`
    }));
    const avgMin = avgRank.length ? Math.floor(Math.min.apply(null, avgRank.map((i) => i.v)) / 5) * 5 - 5 : 0;
    const bestAvgRank = STAT_DO.filter((s) => isNum(s.avg)).sort((a, b) => b.avg - a.avg).slice(0, 8).map((s) => ({
      label: `${s.p} · ${s.t.roman}`, href: s.t.url, v: s.avg, display: num(s.avg, 2), tip: `${s.p} bei ${s.t.title}: Ø ${num(s.avg, 2)}`
    }));
    const winRank = players.filter((a) => a.matches >= 4).sort((a, b) => b.winRate - a.winRate || b.mW - a.mW).map((a) => ({
      label: a.name, href: pUrl(a.name), v: a.winRate, display: pct(a.winRate), tip: `${a.name}: ${a.mW} Siege, ${a.mL} Niederlagen`
    }));

    const honor = table(
      [{ l: 'Turnier' }, { l: 'Datum' }, { l: 'Ort' }, { l: '🏆 Sieger' }, { l: 'Finalist' }, { l: 'Platz 3' }, { l: '🎈 Ballon Dart' }],
      TOURS.map((t) => `<tr>
        <td>${tLink(t)}</td><td class="num">${dateShort(t.date)}</td><td>${esc(t.venue)}</td>
        <td class="strong">${t.placements[0] ? pLink(t.placements[0]) : '–'}</td>
        <td>${t.placements[1] ? pLink(t.placements[1]) : '–'}</td>
        <td>${t.placements[2] ? pLink(t.placements[2]) : '–'}</td>
        <td>${t.ballonDart ? pLink(t.ballonDart) : '<span class="muted">–</span>'}</td>
      </tr>`));

    return `
    ${pageHead('Zahlen, Daten, Legenden', 'Statis<span class="hl">tiken</span>', 'Ewige Tabelle, Rekorde und Ranglisten über alle EA Masters. Wird automatisch mit jedem neuen Turnier aktualisiert.')}
    <section class="wrap kpis kpis-6">
      ${kpi('Turniere', TOURS.length)}
      ${kpi('Spieler', PLAYER_NAMES.length)}
      ${kpi('Matches', SCORED.length, 'mit bekanntem Ergebnis')}
      ${kpi('Legs', SCORED.reduce((s, m) => s + m.s1 + m.s2, 0))}
      ${kpi('💥 180er', players.reduce((s, a) => s + a.s180, 0))}
      ${kpi('🏆 Sieger', new Set(TOURS.map((t) => t.winner).filter(Boolean)).size, 'verschiedene Champions')}
    </section>
    <section class="wrap section">
      ${sectionHead('Hall of Fame', 'Ehrentafel')}
      ${honor}
    </section>
    <section class="wrap section">
      ${sectionHead('Für die Ewigkeit', 'Rekorde')}
      ${DO_NOTE ? `<p class="muted small">Average, Finish, Shortest Leg und Checkout zählen erst ${DO_NOTE} – bei Single Out ist das Auschecken deutlich leichter. High Score, 180er, Titel und Bilanzen zählen über alle Turniere.</p>` : ''}
      <div class="records">${records}</div>
    </section>
    ${soRecords ? `<section class="wrap section">
      ${sectionHead('Archiv', 'Single-Out-Ära')}
      <p class="muted small">Bestwerte aus ${soTours.map((t) => t.title).join(', ')} – gespielt mit Single Out. Bleiben für die Geschichtsbücher, zählen aber nicht in die Rekorde und Averages oben.</p>
      <div class="records records-so">${soRecords}</div>
    </section>` : ''}
    <section class="wrap section">
      ${sectionHead('Alle Turniere', 'Ewige Tabelle')}
      <p class="muted small">Sortiert nach Titeln, Finalteilnahmen, Podien und durchschnittlicher Platzierung.</p>
      ${eternalTable}
    </section>
    ${scoringTable ? `<section class="wrap section">
      ${sectionHead('Scoring', 'Aufnahmen &amp; Tonnen', '<span class="legend-best"><i></i> Bestwert</span>')}
      <p class="muted small">Gezählt wie bei Autodarts in Bereichen: 60+ = 60–99, 100+ = 100–139, 140+ = 140–179. Tonnen = alle Aufnahmen ab 100. Daten aus ${scTours.map((t) => t.title).join(', ')}.</p>
      ${scoringTable}
    </section>` : ''}
    <section class="wrap section chart-grid">
      <div class="panel">
        ${sectionHead('Rangliste', 'Ø 3-Dart-Average')}
        <p class="muted small">Mittelwert der Turnier-Averages${DO_NOTE ? ' ' + DO_NOTE : ''}.</p>
        ${barChart(avgRank, { min: avgMin })}
      </div>
      <div class="panel">
        ${sectionHead('Rangliste', 'Beste Turnier-Averages')}
        <p class="muted small">Die besten Einzelleistungen über ein ganzes Turnier${DO_NOTE ? ' ' + DO_NOTE : ''}.</p>
        ${barChart(bestAvgRank, { min: avgMin })}
      </div>
      <div class="panel">
        ${sectionHead('Rangliste', 'Match-Siegquote')}
        <p class="muted small">Alle Matches mit bekanntem Ergebnis, ab 4 Matches.</p>
        ${barChart(winRank, { max: 1 })}
      </div>
      ${tonRank.length ? `<div class="panel">
        ${sectionHead('Rangliste', 'Tonnen (100+)')}
        <p class="muted small">Alle Aufnahmen ab 100 Punkten über alle Turniere mit Autodarts-Daten.</p>
        ${barChart(tonRank)}
      </div>` : ''}
      <div class="panel">
        ${sectionHead('Nebenschauplätze', 'Ehrungen &amp; Momente')}
        ${table([{ l: 'Spieler' }, { l: '🏠', cls: 'r', title: 'Wie oft ausgerichtet' }, { l: '🎈', cls: 'r', title: 'Ballon-Dart-Siege' }, { l: '💥 180', cls: 'r', title: '180er' }],
          players.filter((a) => a.hosted || a.ballon || a.s180).sort((a, b) => (b.hosted + b.ballon + b.s180) - (a.hosted + a.ballon + a.s180))
            .map((a) => `<tr><td>${pLink(a.name)}</td><td class="r num">${a.hosted}</td><td class="r num">${a.ballon}</td><td class="r num">${a.s180}</td></tr>`), 'compact')}
        <p class="muted small">🏠 Ausrichter · 🎈 Ballon Dart · 💥 180er</p>
      </div>
    </section>`;
  }

  /* =========================================================
     Ruhmeshalle
     ========================================================= */
  // Wanderpokal als SVG: jeder Sieger bekommt ein graviertes Plättchen im Sockel
  function trophySvg() {
    const W = 420, PW = 150, PH = 50, GX = 14, GY = 12, TOP = 264;
    const plates = TOURS.filter((t) => t.winner).map((t) => ({ t }));
    const nextNr = TOURS.length ? TOURS[TOURS.length - 1].nr + 1 : 1;
    plates.push({ next: nextNr });
    const rows = Math.ceil(plates.length / 2);
    const blockH = 22 + rows * PH + (rows - 1) * GY + 22;
    const H = TOP + blockH + 18;
    const x0 = W / 2 - PW - GX / 2;
    const plate = (p, i) => {
      const x = x0 + (i % 2) * (PW + GX);
      const y = TOP + 22 + Math.floor(i / 2) * (PH + GY);
      if (p.next) {
        return `<g class="tr-plate-next"><rect x="${x}" y="${y}" width="${PW}" height="${PH}" rx="4"/>
          <text class="tr-eng-small" x="${x + PW / 2}" y="${y + 19}" text-anchor="middle">MASTERS ${roman(p.next)}</text>
          <text class="tr-eng-name" x="${x + PW / 2}" y="${y + 41}" text-anchor="middle">? ? ?</text></g>`;
      }
      return `<a href="${p.t.url}" class="tr-plate-link"><g class="tr-plate">
          <title>${esc(p.t.title)}: ${esc(p.t.winner)}</title>
          <rect x="${x}" y="${y}" width="${PW}" height="${PH}" rx="4"/>
          <rect class="tr-plate-inner" x="${x + 4}" y="${y + 4}" width="${PW - 8}" height="${PH - 8}" rx="2"/>
          <text class="tr-eng-small" x="${x + PW / 2}" y="${y + 19}" text-anchor="middle">MASTERS ${p.t.roman} · ${p.t.date.slice(0, 4)}</text>
          <text class="tr-eng-name" x="${x + PW / 2}" y="${y + 41}" text-anchor="middle">${esc(p.t.winner.toUpperCase())}</text>
        </g></a>`;
    };
    return `<svg class="trophy-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Wanderpokal der EA Masters mit den eingravierten Siegern">
      <defs>
        <linearGradient id="trGold" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" class="tr-g-dark"/><stop offset="0.35" class="tr-g-light"/><stop offset="0.6" class="tr-g-mid"/><stop offset="1" class="tr-g-dark"/>
        </linearGradient>
        <linearGradient id="trPlate" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" class="tr-p-light"/><stop offset="1" class="tr-p-dark"/>
        </linearGradient>
        <clipPath id="trBowl"><path d="M122 34 H298 V62 C298 132 258 176 210 182 C162 176 122 132 122 62 Z"/></clipPath>
      </defs>
      <!-- Henkel -->
      <path class="tr-handle" d="M126 52 C78 50 76 128 156 140"/>
      <path class="tr-handle" d="M294 52 C342 50 344 128 264 140"/>
      <!-- Schale -->
      <path class="tr-gold" d="M122 34 H298 V62 C298 132 258 176 210 182 C162 176 122 132 122 62 Z"/>
      <rect class="tr-gold" x="112" y="22" width="196" height="16" rx="8"/>
      <g clip-path="url(#trBowl)"><rect class="tr-shine" x="60" y="0" width="34" height="200"/></g>
      <text class="tr-cup-big" x="210" y="104" text-anchor="middle">EA</text>
      <text class="tr-cup-small" x="210" y="126" text-anchor="middle">MASTERS</text>
      <!-- Dartscheibe als Emblem -->
      <g class="tr-emblem"><circle cx="210" cy="150" r="11"/><circle class="tr-emblem-in" cx="210" cy="150" r="6"/><circle cx="210" cy="150" r="2"/></g>
      <!-- Stiel und Fuß -->
      <rect class="tr-gold" x="199" y="178" width="22" height="60"/>
      <ellipse class="tr-gold" cx="210" cy="200" rx="22" ry="8"/>
      <path class="tr-gold" d="M164 236 H256 L268 256 H152 Z"/>
      <rect class="tr-gold" x="146" y="254" width="128" height="10" rx="3"/>
      <!-- Sockel -->
      <rect class="tr-base" x="36" y="${TOP}" width="348" height="${blockH}" rx="6"/>
      <rect class="tr-base-edge" x="36" y="${TOP}" width="348" height="6" rx="3"/>
      <rect class="tr-base" x="24" y="${TOP + blockH}" width="372" height="14" rx="4"/>
      ${plates.map(plate).join('')}
    </svg>`;
  }

  function renderRuhmeshalle() {
    const won = TOURS.filter((t) => t.winner);
    // Jeder Sieger genau einmal, in der Reihenfolge seines ersten Titels
    const champs = [];
    won.forEach((t) => {
      let c = champs.find((x) => x.name === t.winner);
      if (!c) { c = { name: t.winner, first: t, tours: [] }; champs.push(c); }
      c.tours.push(t);
    });
    const champTiles = champs.map((c, i) => `
      <a class="champ-tile" href="${pUrl(c.name)}">
        <span class="champ-no">Champion Nr. ${i + 1}</span>
        <span class="champ-tile-name">${esc(c.name)}${isFounder(c.name) ? '<span class="badge" title="Gründungsmitglied">GM</span>' : ''}</span>
        <span class="champ-tile-meta">Erster Titel: ${esc(c.first.title)} · ${dateShort(c.first.date)} in ${esc(c.first.venue)}</span>
        <span class="champ-tile-cups">${c.tours.map((t) => `<span class="cup-chip" title="${esc(t.title)}">${ICON.trophy}${t.roman}</span>`).join('')}</span>
      </a>`).join('');

    // Amtierender Champion
    const cur = won[won.length - 1];
    const reignDays = cur ? Math.max(0, Math.floor((Date.now() - new Date(cur.date + 'T12:00:00').getTime()) / 86400000)) : 0;
    const spotlight = cur ? `
      <div class="panel reign">
        <p class="kicker">Amtierender Champion</p>
        <div class="reign-name">${pLink(cur.winner)}</div>
        <div class="reign-days"><span>${reignDays}</span> Tage im Besitz des Pokals</div>
        <p class="muted">Seit ${esc(cur.title)} am ${dateLong(cur.date)}. Laut Regelwerk richtet ${esc(cur.winner)} die <strong>EA Masters ${roman(cur.nr + 1)}</strong> aus – und muss den Pokal dort verteidigen.</p>
      </div>` : '';

    // Meilensteine (automatisch aus den Daten)
    const ms = [];
    if (won[0]) ms.push({ t: won[0], icon: '🥇', title: 'Der erste Champion', text: `${pLink(won[0].winner)} gewinnt die allererste Austragung und wird Champion Nr. 1.` });
    const defense = TOURS.find((t, i) => i > 0 && t.winner && t.winner === TOURS[i - 1].winner);
    if (defense) ms.push({ t: defense, icon: '🛡️', title: 'Erste Titelverteidigung', text: `${pLink(defense.winner)} verteidigt den Pokal – Back-to-Back-Champion.` });
    const away = TOURS.find((t) => TOURS[0].country && t.country && t.country !== TOURS[0].country);
    if (away) ms.push({ t: away, icon: '✈️', title: 'Erstes Auswärtsturnier', text: `Die EA Masters gehen ins Ausland: ${esc(away.venue)}, ${esc(away.country)}. Sieger: ${pLink(away.winner)}.` });
    [['180', '💥', 'Die erste 180'], ['highfinish', '🎯', 'Das erste 100+ Finish'], ['9darter', '✨', 'Der erste 9-Darter']].forEach(([type, icon, title]) => {
      const t = TOURS.find((x) => PLAYER_NAMES.some((p) => (type === 'highfinish' ? highFinishes(x, p).length : eventCount(x, p, type)) > 0));
      if (!t) return;
      const who = PLAYER_NAMES.filter((p) => (type === 'highfinish' ? highFinishes(t, p).length : eventCount(t, p, type)) > 0);
      ms.push({ t, icon, title, text: `${who.map(pLink).join(', ')} – für immer in den Geschichtsbüchern.` });
    });
    if (FIRST_DO && DO_NOTE) ms.push({ t: FIRST_DO, icon: '🎯', title: 'Beginn der Double-Out-Ära', text: `Ab jetzt wird auf Doppel ausgecheckt. Erster Double-Out-Champion: ${pLink(FIRST_DO.winner)}.` });
    ms.sort((a, b) => a.t.nr - b.t.nr);
    const milestones = `<ol class="milestones">${ms.map((m) => `
      <li><span class="ms-icon" aria-hidden="true">${m.icon}</span>
        <div><p class="ms-when">${tLink(m.t)} · ${dateShort(m.t.date)}</p><h3>${m.title}</h3><p>${m.text}</p></div></li>`).join('')}</ol>`;

    // Rekordhalter
    const whoT = (i) => `${pLink(i.p)} <span class="muted">· ${tLink(i.t)}</span>`;
    const recs = [
      recordCard('Höchster Score', best(STAT_ROWS.map((s) => ({ v: s.hs, p: s.p, t: s.t })), 'max'), (v) => v, whoT),
      recordCard('Bester Turnier-Average', best(STAT_DO.map((s) => ({ v: s.avg, p: s.p, t: s.t })), 'max'), (v) => num(v, 2), whoT, DO_NOTE ? 'Double Out' : ''),
      recordCard('Höchstes Finish', best(STAT_DO.map((s) => ({ v: s.hco, p: s.p, t: s.t })), 'max'), (v) => v, whoT, DO_NOTE ? 'Double Out' : ''),
      recordCard('Kürzestes Leg', best(STAT_DO.map((s) => ({ v: s.minDarts, p: s.p, t: s.t })), 'min'), (v) => v + ' Darts', whoT, DO_NOTE ? 'Double Out' : '')
    ].join('');

    // Ballon-Dart-Könige (jeder einmal)
    const ballonKings = [];
    TOURS.filter((t) => t.ballonDart).forEach((t) => {
      let k = ballonKings.find((x) => x.name === t.ballonDart);
      if (!k) { k = { name: t.ballonDart, tours: [] }; ballonKings.push(k); }
      k.tours.push(t);
    });

    // Noch ohne Gravur
    const waiting = Object.values(AGG).filter((a) => a.entries.length && !a.titles).sort((a, b) => a.bestPlace - b.bestPlace || a.name.localeCompare(b.name));

    return `
    ${pageHead('Hall of Fame', 'Ruhmes<span class="hl">halle</span>', 'Hier steht, wer den heiligen Wanderpokal schon in den Händen hielt. Jeder Champion ist auf dem Sockel verewigt – das nächste Plättchen ist noch frei.')}
    <section class="wrap section trophy-stage">
      <div class="trophy-wrap">${trophySvg()}</div>
      <div class="trophy-side">
        ${spotlight}
        <div class="panel">
          <p class="kicker">Gravur-Service</p>
          <p class="muted">Klick auf ein Plättchen öffnet das Turnier. Das leere Plättchen wartet auf den Champion der <strong>EA Masters ${roman((TOURS.length ? TOURS[TOURS.length - 1].nr : 0) + 1)}</strong>.</p>
        </div>
      </div>
    </section>
    <section class="wrap section">
      ${sectionHead('Verewigt', 'Die Champions')}
      <p class="muted small">Jeder Sieger einmal – in der Reihenfolge seines ersten Titels.</p>
      <div class="champ-grid">${champTiles}</div>
    </section>
    <section class="wrap section">
      ${sectionHead('Geschichte', 'Meilensteine')}
      ${milestones}
    </section>
    ${recs ? `<section class="wrap section">
      ${sectionHead('Rekordhalter', 'Für die Ewigkeit', `<a class="more" href="statistiken.html">Alle Rekorde ${ICON.arrow}</a>`)}
      <div class="records">${recs}</div>
    </section>` : ''}
    <section class="wrap section split">
      ${ballonKings.length ? `<div class="panel">
        ${sectionHead('Nebentitel', '🎈 Ballon-Dart-Könige')}
        <ul class="honor-list">${ballonKings.map((k) => `<li>${pLink(k.name)} <span class="muted">· ${k.tours.map((t) => t.roman).join(', ')}</span></li>`).join('')}</ul>
      </div>` : ''}
      ${waiting.length ? `<div class="panel">
        ${sectionHead('Warteliste', 'Noch ohne Gravur')}
        <p class="muted small">Der Graveur hat schon die Feile in der Hand. Bestes Ergebnis bisher:</p>
        <ul class="honor-list">${waiting.map((a) => `<li>${pLink(a.name)} <span class="muted">· ${a.bestPlace}. Platz</span></li>`).join('')}</ul>
      </div>` : ''}
    </section>`;
  }

  /* =========================================================
     Spieler
     ========================================================= */
  function playerCard(a) {
    return `<a class="player-card" href="${pUrl(a.name)}">
      ${a.profile && a.profile.photo ? `<img class="avatar" src="${esc(a.profile.photo)}" alt="">` : `<span class="avatar" aria-hidden="true">${esc(a.name.charAt(0))}</span>`}
      <span class="pc-body">
        <span class="pc-name">${esc(a.name)}${a.founder ? '<span class="badge" title="Gründungsmitglied">GM</span>' : ''}</span>
        <span class="pc-meta">${a.entries.length} Turnier${a.entries.length === 1 ? '' : 'e'}${a.titles ? ` · ${a.titles}× 🏆` : ''}${a.careerAvg != null ? ` · Ø ${num(a.careerAvg, 2)}` : ''}</span>
      </span>
    </a>`;
  }

  function renderSpieler() {
    const name = params.get('name');
    const a = name && AGG[name];
    if (!a) {
      const list = Object.values(AGG).sort((x, y) =>
        (y.founder - x.founder) || (y.titles - x.titles) || (y.entries.length - x.entries.length) || x.name.localeCompare(y.name));
      return `
      ${pageHead('Die Teilnehmer', 'Spie<span class="hl">ler</span>', 'Alle Spieler, die bisher bei den EA Masters am Oche standen. Klick auf einen Namen für Profil, Bestwerte und Head-to-Head.')}
      <section class="wrap section"><div class="player-grid">${list.map(playerCard).join('')}</div></section>`;
    }
    document.title = a.name + ' · Eisern Alessio';
    const B = a.best;
    const tiles = [
      kpi('Titel', a.titles),
      kpi('Turniere', a.entries.length),
      kpi('Bestes Ergebnis', a.bestPlace ? a.bestPlace + '.' : '–'),
      kpi('Ø Platz', num(a.avgPlace, 1)),
      kpi('Matches', a.matches ? `${a.mW}–${a.mL}` : '–', a.matches ? pct(a.winRate) + ' Siege' : ''),
      kpi('Ø Average', a.careerAvg != null ? num(a.careerAvg, 2) : '–', DO_NOTE ? 'nur Double Out' : '')
    ].join('');
    const rec = (label, b, f) => (b ? `<div class="record"><div class="record-label">${label}</div><div class="record-value">${f(b.v)}</div><div class="record-who">${tLink(b.t)}</div></div>` : '');
    const records = [
      rec('Bester Turnier-Average', B.avg, (v) => num(v, 2)),
      rec('Bester Match-Average', B.matchAvg, (v) => num(v, 2)),
      rec('High Score', B.hs, (v) => v),
      rec('Highest Finish', B.hco, (v) => v),
      rec('Shortest Leg', B.minDarts, (v) => v + ' Darts'),
      rec('Meiste Tonnen (100+)', B.ton, (v) => v + '×')
    ].join('');

    // Scoring: Aufnahmen 60+/100+/140+/180 (Autodarts)
    let scoring = '';
    if (a.sc) {
      const v = a.sc.v;
      const ton = v[1] + v[2] + v[3];
      const visits = a.sc.darts ? a.sc.darts / 3 : null;
      const dTon = a.sc.dv[1] + a.sc.dv[2] + a.sc.dv[3];
      const perTour = (x) => num(x / a.sc.tours.length, 1);
      const tiles = v.map((x, i) => `<div class="score-tile${i === 3 && x ? ' score-180' : ''}">
          <div class="score-label">${SC_LABELS[i]}</div>
          <div class="score-value">${x}</div>
          <div class="score-sub">${i === 3 ? (x ? 'Höchststrafe! 💥' : 'die Jagd läuft …') : `${SC_RANGES[i]} Punkte · Ø ${perTour(x)} je Turnier`}</div>
        </div>`).join('');
      const dTours = a.sc.tours.filter((t) => { const s = t.stats.find((x) => x.p === a.name); return s && isNum(s.dartsTotal); });
      const fun = (visits && dTon
        ? `Im Schnitt ist <strong>jede ${num(visits / dTon, 1)}. Aufnahme</strong> eine Tonne (100+). `
        : '') + (ton ? `Insgesamt <strong>${ton} Tonnen</strong> bei den EA Masters.` : 'Die erste Tonne lässt noch auf sich warten.');
      scoring = `<section class="wrap section">
        ${sectionHead('Scoring', 'Aufnahmen')}
        <div class="score-tiles">${tiles}</div>
        <div class="panel score-panel">
          <p class="kicker">Scoring-Mix${visits ? ` · Masters ${dTours.map((t) => t.roman).join(' + ')}` : ''}</p>
          ${visits ? scoreMix(a.sc.dv, a.sc.darts) : scoreMix(v, 0)}
          <p class="score-fun">${fun}</p>
          <p class="muted small">Aufnahmen aus ${a.sc.tours.map(tLink).join(', ')}. Gezählt wie bei Autodarts in Bereichen: 60+ = 60–99, 100+ = 100–139, 140+ = 140–179.</p>
        </div>
      </section>`;
    }
    const showSc = a.entries.some((e) => e.stat && hasScoring(e.stat));
    const scCells = (e) => (showSc ? SC_KEYS.map((k) => `<td class="r num">${e.stat && isNum(e.stat[k]) ? e.stat[k] : '–'}</td>`).join('') : '');

    const history = table(
      [{ l: 'Turnier' }, { l: 'Datum' }, { l: 'Platz', cls: 'c' }, { l: '3-Dart Ø', cls: 'r' }, { l: 'High Score', cls: 'r' }, { l: 'Highest Finish', cls: 'r' }, { l: 'Shortest Leg', cls: 'r' }]
        .concat(showSc ? SC_LABELS.map((l, i) => ({ l, cls: 'r', title: 'Aufnahmen mit ' + SC_RANGES[i] + ' Punkten' })) : []),
      a.entries.slice().reverse().map((e) => `<tr>
        <td>${tLink(e.t)}${e.t.so ? ' ' + soTag : ''}${e.t.ballonDart === a.name ? ' <span title="Ballon-Dart-Sieger">🎈</span>' : ''}${e.t.host === a.name ? ' <span title="Ausrichter">🏠</span>' : ''}</td>
        <td class="num">${dateShort(e.t.date)}</td>
        <td class="c">${placeBadge(e.place)}</td>
        <td class="r num">${e.stat ? num(e.stat.avg, 2) : '–'}</td>
        <td class="r num">${e.stat ? num(e.stat.hs) : '–'}</td>
        <td class="r num">${e.stat ? num(e.stat.hco) : '–'}</td>
        <td class="r num">${e.stat && isNum(e.stat.minDarts) ? e.stat.minDarts : '–'}</td>
        ${scCells(e)}
      </tr>`));

    const h2h = Object.entries(a.h2h).sort((x, y) => (y[1].w + y[1].l) - (x[1].w + x[1].l) || y[1].w - x[1].w);
    const h2hTable = h2h.length ? table(
      [{ l: 'Gegner' }, { l: 'Matches', cls: 'r' }, { l: 'Bilanz', cls: 'r' }, { l: 'Legs', cls: 'r' }, { l: '', cls: 'bar-col' }],
      h2h.map(([op, h]) => {
        const share = h.w / (h.w + h.l);
        return `<tr><td>${pLink(op)}</td><td class="r num">${h.w + h.l}</td>
          <td class="r num ${h.w > h.l ? 'pos' : h.w < h.l ? 'neg' : ''}">${h.w}–${h.l}</td>
          <td class="r num">${h.lw}:${h.ll}</td>
          <td class="bar-col"><span class="mini-bar" title="${pct(share)} Siege"><span style="--w:${(share * 100).toFixed(0)}%"></span></span></td></tr>`;
      }), 'compact') : '<p class="muted">Keine Matches mit bekanntem Ergebnis.</p>';

    const others = Object.values(AGG).filter((x) => x.name !== a.name).sort((x, y) => x.name.localeCompare(y.name));

    // Steckbrief (manuell gepflegt in data.js → players)
    const P = a.profile;
    const nv = (v) => (v ? esc(v) : '<span class="muted">noch nicht hinterlegt</span>');
    const factList = (items) => `<dl class="facts profile-facts">${items.map(([k, v, tip]) => `<div><dt${tip ? ` title="${esc(tip)}"` : ''}>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
    const steckbrief = factList([
      ['Spitzname-Herkunft', nv(P.nickname)],
      ['Walk-On-Song', nv(P.walkOn)],
      ['Lieblingsdoppel', nv(P.favDouble)],
      ['Traumfinish', nv(P.dreamFinish)],
      ['Wurfhand', nv(P.hand)],
      ['Darts', nv(P.darts)],
      ['Lieblingsspieler', nv(P.favPlayer)],
      ['Lieblings-Walk-On', nv(P.favWalkOn)],
      ['Lieblingsspitzname', nv(P.favNickname)]
    ]);
    // automatisch berechnet
    const autoFacts = factList([
      ['Dabei seit', a.since ? `${tLink(a.since)} <span class="muted">· ${dateShort(a.since.date)}</span>` : '–'],
      ['Erzrivale', a.rival ? `${pLink(a.rival.op)} <span class="muted">· ${a.rival.n} Duelle, Bilanz ${a.rival.w}–${a.rival.l}</span>` : '–'],
      ['Lieblingsgegner', a.favOpp ? `${pLink(a.favOpp.op)} <span class="muted">· Bilanz ${a.favOpp.w}–${a.favOpp.l}</span>` : '<span class="muted">noch keiner</span>'],
      ['Angstgegner', a.nemesis ? `${pLink(a.nemesis.op)} <span class="muted">· Bilanz ${a.nemesis.w}–${a.nemesis.l}</span>` : '<span class="muted">keiner – bisher</span>'],
      ['180er', String(a.s180)],
      ['100+ Finishes', a.hiFin.length ? `${a.hiFin.length} <span class="muted">· ${a.hiFin.filter(isNum).sort((x, y) => y - x).join(', ')}</span>` : '0', 'Checkouts ab 100 Punkten, nur Double Out'],
      ...(a.ninedarter ? [['9-Darter', '✨ ' + a.ninedarter]] : [])
    ]);
    return `
    ${pageHead(a.founder ? '👑 Gründungsmitglied' : 'Spielerprofil', esc(a.name), '',
      `${P.photo ? `<img class="profile-photo" src="${esc(P.photo)}" alt="${esc(a.name)}">` : ''}<div class="chips">${a.titles ? `<span class="chip chip-y">🏆 ${a.titles}× Turniersieger</span>` : ''}${a.ballon ? `<span class="chip">🎈 ${a.ballon}× Ballon Dart</span>` : ''}${a.hosted ? `<span class="chip">🏠 ${a.hosted}× Ausrichter</span>` : ''}</div>`)}
    <section class="wrap kpis kpis-6">${tiles}</section>
    <section class="wrap section split">
      <div class="panel">${sectionHead('Über den Spieler', 'Steckbrief')}${steckbrief}</div>
      <div class="panel">${sectionHead('Automatisch ermittelt', 'Fakten')}${autoFacts}</div>
    </section>
    ${records ? `<section class="wrap section">${sectionHead('Persönliche', 'Bestwerte')}<div class="records">${records}</div></section>` : ''}
    ${scoring}
    <section class="wrap section">
      ${sectionHead('Karriere', 'Turnierhistorie')}
      ${history}
      ${a.entries.some((e) => e.t.so) ? `<p class="muted small">${soTag} = Single Out: Average, Finish und Shortest Leg zählen nicht in Ø Average und Bestwerte.</p>` : ''}
    </section>
    ${a.avgChart.length >= 2 ? `<section class="wrap section">${sectionHead('Form', 'Average-Verlauf')}<div class="panel">${lineChart(a.avgChart)}</div></section>` : ''}
    <section class="wrap section">
      ${sectionHead('Duelle', 'Head-to-Head')}
      ${h2hTable}
    </section>
    <section class="wrap section">
      ${sectionHead('', 'Weitere Spieler')}
      <div class="chips">${others.map((o) => `<a class="chip chip-link" href="${pUrl(o.name)}">${esc(o.name)}</a>`).join('')}</div>
    </section>`;
  }

  /* =========================================================
     Verein (statischer Text + dynamische Listen)
     ========================================================= */
  function fillVerein() {
    const f = $('#founders');
    if (f) f.innerHTML = Object.values(AGG).filter((a) => a.founder).map(playerCard).join('');
    const m = $('#members');
    if (m) m.innerHTML = Object.values(AGG).filter((a) => !a.founder).sort((x, y) => y.entries.length - x.entries.length || x.name.localeCompare(y.name)).map(playerCard).join('');
    const c = $('#chronik');
    if (c) c.innerHTML = TOURS.slice().reverse().map(tourCard).join('');
  }

  /* =========================================================
     Start
     ========================================================= */
  function startClock() {
    const box = $('#ea-clock');
    if (!box) return;
    const at = (date, time) => { const d = parseDate(date); if (time) { const [h, m] = time.split(':').map(Number); d.setHours(h, m || 0, 0, 0); } return d; };
    const next = D.nextTournament && D.nextTournament.date ? D.nextTournament : null;
    const last = at(LATEST.date, LATEST.time);
    const deadline = new Date(last); deadline.setMonth(deadline.getMonth() + 6);
    const target = next ? at(next.date, next.time) : last;
    $('#ea-clock-title').textContent = next ? `Countdown bis EA Masters ${roman(LATEST.nr + 1)}` : `Seit dem letzten Turnier (${LATEST.title})`;
    const tick = () => {
      const now = new Date();
      let diff = Math.max(0, next ? target - now : now - target);
      const d = Math.floor(diff / 864e5); diff -= d * 864e5;
      const h = Math.floor(diff / 36e5); diff -= h * 36e5;
      const m = Math.floor(diff / 6e4);
      $('#ea-d').textContent = d; $('#ea-h').textContent = h; $('#ea-m').textContent = m;
      const note = $('#ea-clock-note');
      if (next) {
        note.innerHTML = `${dateLong(next.date)}${next.time ? ', ' + esc(next.time) + ' Uhr' : ''}${next.venue ? ' · ' + esc(next.venue) : ''}${next.host ? ' · Ausrichter: ' + esc(next.host) : ''}`;
        box.classList.remove('overdue');
      } else if (now > deadline) {
        const over = Math.floor((now - deadline) / 864e5);
        note.innerHTML = `⚠️ Die 6-Monats-Frist ist seit <strong>${over} ${over === 1 ? 'Tag' : 'Tagen'}</strong> abgelaufen. ${esc(LATEST.winner)}, wir warten.`;
        box.classList.add('overdue');
      } else {
        const left = Math.ceil((deadline - now) / 864e5);
        note.innerHTML = `Laut Regelwerk muss das nächste Turnier spätestens in <strong>${left} Tagen</strong> stattfinden.`;
        box.classList.remove('overdue');
      }
    };
    tick();
    setInterval(tick, 15000);
  }

  function init() {
    renderChrome();
    const page = document.body.dataset.page;
    const app = $('#app');
    const R = { home: renderHome, turniere: renderTurniere, turnier: renderTurnier, statistiken: renderStatistiken, ruhmeshalle: renderRuhmeshalle, spieler: renderSpieler };
    if (app && R[page]) app.innerHTML = R[page]();
    if (page === 'verein') fillVerein();
    if (page === 'home') startClock();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
