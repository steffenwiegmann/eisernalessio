# Eisern Alessio – Website

Statische Website des Dart-Freundeskreises **Eisern Alessio** mit der internen Turnierserie **EA Masters** (Turniere, Ergebnisse, Statistiken, Regeln).

- Repository: https://github.com/steffenwiegmann/eisernalessio (Branch `main`)
- Live (GitHub Pages): https://steffenwiegmann.github.io/eisernalessio/

## Tech-Stack

- Statisches HTML + `style.css` + Vanilla-JavaScript. Kein Build, kein Framework, keine npm-Abhängigkeiten.
- Schriften: Google Fonts (Bebas Neue für Überschriften, Inter für Text).
- Deployment: GitHub Pages direkt aus `main` (Root). Ein Push auf `main` ist automatisch live (nach ca. 1–2 Minuten).
- Lokale Vorschau: `node .claude/serve.js` → http://localhost:8000 (Python ist auf diesem PC nicht installiert).

## Architektur: datengetrieben

**Alle Turnierdaten stehen ausschließlich in `js/data.js`** (`window.EA_DATA`). `js/app.js` erzeugt daraus Header, Footer und alle dynamischen Seiten. Statistiken, Ewige Tabelle, Rekorde, Spielerprofile und Head-to-Head werden automatisch berechnet.

| Datei | Inhalt |
|---|---|
| `index.html` | Startseite (Pokalhalter, Kennzahlen, letztes Turnier, Ehrentafel) – `data-page="home"` |
| `eamasters.html` | Turnierübersicht als Zeitstrahl – `data-page="turniere"` |
| `turnier.html?nr=N` | Turnierdetail (Podium, Endrunde, Gruppen, Statistiken) – `data-page="turnier"` |
| `statistiken.html` | Ehrentafel, Rekorde, Ewige Tabelle, Ranglisten – `data-page="statistiken"` |
| `ruhmeshalle.html` | Ruhmeshalle: Wanderpokal (SVG) mit gravierten Siegern, Champions (jeder einmal), Meilensteine, Rekordhalter – `data-page="ruhmeshalle"` |
| `spieler.html[?name=X]` | Spielerliste bzw. Spielerprofil – `data-page="spieler"` |
| `eamastersrules.html` | Regeln (statisches HTML) – `data-page="regeln"` |
| `club.html` | Verein (statischer Text, Spielerlisten per JS) – `data-page="verein"` |
| `eamastersi.html` … `eamastersiv.html` | Nur Weiterleitungen auf `turnier.html?nr=…` (alte Links bleiben gültig) |
| `js/data.js` | **Einzige Datenquelle** |
| `js/app.js` | Rendering + Berechnungen |
| `style.css` | Design-System |
| `assets/favicon.svg` | Dartscheiben-Icon |

Jede Seite hat `<div id="site-header">`, `<main id="app">` (bzw. statisches `<main>`) und `<div id="site-footer">`. Navigation wird zentral in `NAV` in `js/app.js` gepflegt.

## Neues Turnier hinzufügen

1. In `js/data.js` den letzten Turnierblock kopieren, `nr` hochzählen, Daten eintragen.
2. Unbekannte Felder einfach weglassen – die Seiten blenden sie aus (Feldbeschreibung steht oben in `data.js`).
3. Zahlen mit Punkt (`41.73`), Datum als `'JJJJ-MM-TT'`. Anzeige erfolgt automatisch deutsch.
4. **Keine** neue HTML-Datei nötig – Übersicht, Startseite und Statistiken aktualisieren sich selbst.
5. Kontrollrechnung: Gruppentabellen gegen die Gruppenspiele prüfen, Checkout-Summen gegen Matchwerte.

## Design

- Gelb-Schwarz: `--yellow #ffd400` auf `--bg #0b0b0b`, Flächen `--surface #161616`. Alle Farben als CSS-Variablen in `:root` von `style.css`.
- Medaillenfarben (Gold/Silber/Bronze) nur für Platzierungen.
- **Dark/Light-Toggle** (Sonne/Mond im Header): Dark ist Standard. Light = `:root[data-theme="light"]` in `style.css`, Wahl in `localStorage` (`ea-theme`). Jede Seite hat im `<head>` ein Mini-Skript, das das Theme vor dem Rendern setzt (gegen Aufblitzen) – bei neuen Seiten mitkopieren.
- Light Mode nur Weiß/Grau/Schwarz + Gelb: Gelb nur als Fläche oder Markierung (Textmarker, Unterstreichung, Balken), Akzenttext ist schwarz (`--accent-ink`). Header und Footer bleiben in beiden Modi schwarz. Keine weiteren Farben (kein Grün/Blau).
- Neue Farben immer als Variable anlegen und für beide Modi definieren.
- Gelb-schwarzer Warnstreifen (`.hazard`) unter Header und über Footer als Markenelement.
- Mobile: Breakpoints 980px, 860px (Burger-Menü), 640px. Keine horizontale Seiten-Scrollbar; breite Tabellen scrollen in `.table-wrap`.
- Styles gehören in `style.css`, keine Inline-Styles (Ausnahme: `--w` für Balkenbreiten).

## Inhalt & Sprache

- Alle Texte auf **Deutsch**, locker-humorvoller Ton (siehe Regeln-Seite).
- Spielernamen sind Spitznamen: Katsche, Otter, Quaasus, Sweaty (Gründungsmitglieder, `founder: true`), Killernini, Hugo, Fynn, Samier, Reto – Schreibweise exakt beibehalten.
- Regel: Der Turniersieger richtet das nächste Turnier aus (wird auf Start- und Turnierseite angezeigt).

## Druckvorlagen (Turnierpläne)

- `druck/` enthält Word-Turnierpläne (`EA-Masters-Turnierplan-<n>-Spieler.docx`, 4–8 Spieler, je genau 3 A4-Seiten: Turnierplan + Ergebnisse/Statistik + Autodarts-Protokoll (Darts, Ø und Aufnahmen 60+/100+/140+/180 je Spieler und Match)) zum Ausdrucken und Ausfüllen per Hand.
- Erzeugt von `cd druck && npm install && node generate-word.js` (npm-Paket `docx`) aus den Formaten in `FORMATS`. Die .docx nicht von Hand ändern, sondern Generator anpassen und neu erzeugen.
- Nach Änderungen prüfen, dass jede Datei genau 3 Seiten hat (Regelwerk: 2) (z. B. per Word-COM `ComputeStatistics(2)` in PowerShell und PDF-Export).
- Statistik-Tabellen auf Blatt 2 entsprechen der bisherigen Word-Vorlage: „Statistiken – Gesamtturnier“ (Spieler, 3-Darts Avg, Highest Score, Checkout, Highest Checkout, Minimum Darts (Avg), 60+, 100+, 140+, 180) und „Bestwerte des Turniers“ (Kategorie, Wert, Spieler; inkl. „Meiste Ton+“ = Aufnahmen ab 100). Aufnahmen werden in Bereichen gezählt wie bei Autodarts (60–99, 100–139, 140–179, 180).
- Modus ist immer fest **501 · Double Out · Legmodus**. „Best of ____“ bleibt leer zum Eintragen und heißt überall gleich (nie „BO“).
- Vor dem Neuerzeugen prüfen, ob die vorhandenen .docx von Hand geändert wurden (Text mit frisch erzeugter Version vergleichen) und Änderungen erst ins Skript übernehmen – sonst gehen sie verloren.
- Formate: 4 = 1 Gruppe Hin+Rück · 5 = 1 Gruppe einfach · 6 = 2×3 Hin+Rück · 7 = 4er einfach + 3er Hin+Rück · 8 = 2×4 einfach. Platzierungsspiele stehen immer in der Reihenfolge Platz 7 → Platz 5 → Platz 3 (vom Turnierleiter so festgelegt, nicht umdrehen). Danach Halbfinale (1.–4./2.–3. bzw. „1. A – 2. B“/„1. B – 2. A“), Platz 3, ggf. Platz 5 („3. A – 3. B“)/7, Finale. In der Endrunde immer „Platz. Gruppe“ schreiben, nie „A1“ (das sind die Spielerplätze in der Gruppe). Bei einer Gruppe heißen die Spieler A–E.
- Regelwerk als Word: `cd druck && node rules-word.js` → `druck/EA-Masters-Regeln.docx`. Texte in `rules-word.js` müssen wortgleich mit `eamastersrules.html` bleiben (bei Regeländerungen beide anpassen).
- Ausgefüllte Ergebnis-Dokumente je Turnier: `cd druck && node fill-word.js [nr]` → `druck/ausgefuellt/EA-Masters-<röm>-Ergebnisse.docx` (füllt die Vorlage mit Daten aus `js/data.js`; Vorlagen selbst bleiben unverändert).
- Ausgefüllte Bögen (Foto/Scan) werden in `js/data.js` übertragen: Gruppenspiele → `groupMatches`, Tabellen → `groups`, Endrunde → `knockout`, Blatt 2 „Statistiken – Gesamtturnier“ → `stats` (Checkout als `coHit`/`coAtt`, Minimum Darts → `minDarts`, Aufnahmen → `s60`/`s100`/`s140`/`s180`), Blatt 3 → `n1`/`n2`, `a1`/`a2`, `sc1`/`sc2` je Match, Ballon Dart → `ballonDart`.

## Spielerprofile, Ereignisse, Uhr

- Steckbrief-Felder pro Spieler in `players` (data.js): photo, nickname, walkOn, favDouble, dreamFinish, hand, darts, favPlayer. Leer = „noch nicht hinterlegt“.
- Pro Turnier: `events` (180 / highfinish mit `v` = Wert, ab 100 und nur Double Out / 9darter; Robin Hoods werden bewusst nicht erfasst), optional `time`. Walk-On nur ein Song pro Spieler im Steckbrief (keine Historie), kein Ausreden-Archiv.
- Matches können `n1`/`n2` (Darts laut Autodarts) haben → exakter Turnier-Average wird berechnet und ersetzt stats.avg.
- Automatisch: Dabei seit, Erzrivale (meiste Duelle), Angstgegner (meiste Niederlagen bei negativer Bilanz), Lieblingsgegner (meiste Siege bei positiver Bilanz), 100+ Finishes (Events, sonst Highest Checkout ≥ 100 aus stats).
- `nextTournament` in data.js → Startseite zeigt Countdown statt „Seit dem letzten Turnier“ (inkl. Hinweis auf überschrittene 6-Monats-Frist).
- Regeln: 15 Stück (inkl. Titelverteidiger-Bürde, 9-Darter-Klausel, Ballon-Dart-Regel), wortgleich in eamastersrules.html und druck/rules-word.js.

## Datenhinweise

- Masters II: nur Endrunde und Platzierungen bekannt, keine Gruppen- oder Spielerstatistik.
- Masters I, Platz 3 wurde als Dreier-Spiel (Otter, Quaasus, Killernini) ausgespielt → als Textmatch erfasst.
- Masters III und IV: Alle Matches mit Autodarts abgeglichen (Ø, Darts `n1`/`n2`, Checkouts, Aufnahmen `sc1`/`sc2`). Korrigiert: Fynn III Ø 53,15 (Original 53,03 bzw. 55,03), Finale III Katsche 47,41, Quaasus–Fynn d1 87, IV Reto–Fynn c2 2/23, Sweaty IV Checkout 4/59. Turnier-Averages und Aufnahmen werden aus den Matches berechnet.
- Autodarts-Konto: play.autodarts.com → Stats → Match-Verlauf. Am Turniertag gibt es auch Einwerf- und Spaßspiele vor/nach dem Turnier – nur die Turnierspiele übernehmen.
- Masters I: Otter in der Gruppentabelle auf 3-1 Legs korrigiert (laut Einzelspielen; Original zeigte 2-2).
- Masters IV: Katsches Checkout auf 9/60 korrigiert (Summe der Matches; Original zeigte 9/160 bei 15 %).

## Arbeitsweise

- Änderungen lokal machen, mit `node .claude/serve.js` im Browser prüfen (auch Handy-Breite), dann committen und auf `main` pushen.
- Commit-Messages kurz auf Deutsch.
- Vor dem Push: Seiten auf JS-Fehler prüfen (Konsole) und sicherstellen, dass interne Links funktionieren.
- **Cache-Busting:** CSS/JS werden mit `?v=N` eingebunden (aktuell `?v=19`). Bei jeder Änderung an `style.css`, `js/app.js` oder `js/data.js` die Versionsnummer in **allen** HTML-Seiten hochzählen – sonst zeigen Browser (v. a. Firefox) bis zu 10 Minuten altes CSS/JS zu neuem HTML.
