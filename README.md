# Prost! – Trinkspiele-Webseite

Mobile-first Webseite mit App-Feel: 7 Trinkspiele, komplett statisch (HTML/CSS/Vanilla-JS),
ohne Framework, ohne Build-Step, ohne externe Abhängigkeiten oder Requests.

## Lokal starten

Einfach `index.html` im Browser öffnen – oder mit lokalem Server (empfohlen):

```
npx http-server -p 8123 .
```

## Struktur

```
index.html                  Startseite (6 Kacheln)
spiele/*.html               Eine Seite pro Spiel (gut für SEO)
assets/css/style.css        Gesamtes Styling (Design-Tokens in :root)
assets/js/app.js            Geteilte Helfer (Shuffle, Zieh-Stapel, Kategorie-Auswahl, Regeln-Dialog)
assets/js/data/*.js         GENERIERTE Content-Pools – nicht von Hand bearbeiten!
assets/js/games/*.js        Spiel-Logik
manifest.webmanifest        PWA-Manifest ("Zum Homescreen hinzufügen")
robots.txt                  Crawler-Steuerung
```

Konzept-Dokumente liegen eine Ebene höher unter `../docs/`.

## Content pflegen

Die Quelle der Inhalte sind die JSON-Dateien unter `../docs/content/*.json`
(20 Kategorien pro Spiel). Die Dateien unter `assets/js/data/` werden daraus
generiert – Änderungen dort gehen beim nächsten Generieren verloren.

Nach Änderungen an den JSONs neu generieren (aus dem Projektstamm):

```
node docs/generate-data.js
```

Der Generator entfernt dabei Duplikate und filtert kaputte Einträge
(z.B. Wahr-oder-falsch-Vorlagen ohne `___`-Platzhalter oder Bluff-Fragen,
deren richtige Antwort in den Ablenkern vorkommt).

## Kategorien

Jedes Spiel (außer Double or Nothing) hat eine Kategorie-Auswahl mit
An/Aus-Chips ("Alle auswählen"/"Alle abwählen" inklusive). Die Auswahl wird pro
Spiel in `localStorage` gespeichert (`prost-cats-<spiel>`); Standard ist alles an.

## Getroffene Entscheidungen (waren in docs/ als offen markiert)

- **Ich hab noch nie:** Wer die Aussage schon erlebt hat, trinkt (Standard-Variante).
- **Kategorien:** pro Spiel an-/abwählbar (siehe oben), Standard: alle aktiv.
- **Wer würde eher / Wahr oder falsch / Bluff:** Abstimmung läuft analog (zeigen/Handzeichen bzw. eine Person tippt das Gruppenergebnis ein).
- **Double or Nothing – „Ladies first“ (Markenzeichen fürs Marketing):**
  Die DAME ist die höchste Karte. Werte: 2–10 wie aufgedruckt, Bube 11, König 12,
  Ass 13, Dame 14. Gleichstand = verloren. Bei aufgedeckter Dame ist „Riskieren“
  gesperrt (nichts schlägt die Dame). Deck wird bei Verbrauch neu gemischt.
- **Bluff (Name beibehalten):** Die aktive Person sieht die richtige Antwort
  (markiert) plus 2 der 3 Ablenker aus dem Fragen-Pool – so bleibt die
  Gruppenabstimmung bei 4 Antworten. Drittes Ergebnis: Wählt die Gruppe einen
  normalen Ablenker (weder Bluff noch richtig), trinkt die Gruppe den einfachen Einsatz.
- **Geheimmissionen (Antworten auf die offenen Fragen aus docs):** Neu mischen ist
  direkt nach dem Ziehen 1× gratis, jede weitere Mischung kostet einen Schluck
  (Ehrensache, die App erinnert nur daran). Kein automatisches Nachziehen – die
  3 Missionen gelten den ganzen Abend; wer alle geschafft hat, darf 3 neue ziehen.
  Trinkregel: die ausgetrickste Person trinkt; wer beim Auslösen erwischt wird,
  trinkt selbst und die Mission verfällt.
- **Branding:** Arbeitsname „Prost!“, dunkles warmes Design, Akzentfarbe pro Spiel.

## Sicherheit

- Strikte Content-Security-Policy per Meta-Tag (`default-src 'self'`, keine Inline-Skripte/-Styles).
- Nutzereingaben (Namen, Bluff-Antworten) werden ausschließlich über `textContent`
  gerendert – kein `innerHTML`, kein XSS-Risiko.
- `localStorage` (Spielernamen) wird beim Laden validiert und begrenzt.
- Keine externen Ressourcen (Fonts, CDNs, Tracker) – keine Third-Party-Angriffsfläche.
- Security-Header liegen fertig bereit: `_headers` (Netlify/Cloudflare Pages) und
  `.htaccess` (Apache-Webspace wie IONOS/Strato/All-Inkl). Der jeweils unpassende
  wird vom Hoster ignoriert. Bei GitHub Pages sind eigene Header nicht möglich –
  akzeptabel, aber die anderen Hoster sind vorzuziehen.

## SEO

- Eigene Seite pro Spiel mit individuellem `<title>`, Meta-Description und Open-Graph-Tags.
- Regeln stehen als crawlbarer HTML-Text im Regeln-Dialog jeder Spielseite.
- `lang="de"`, semantisches HTML (nav/main/header/footer, h1-Hierarchie).
- Vorschaubild fürs Teilen (WhatsApp/Social): `assets/img/og-image.png` (1200×630),
  inkl. `og:site_name` und vorbereiteter `og:image:width/height/alt`-Tags.
- Strukturierte Daten (JSON-LD): `WebSite` + `ItemList` auf der Startseite,
  `Game`-Schema (Spieleranzahl, 18+, kostenlos) auf jeder Spielseite.
- Sichtbarer Info-Textblock auf der Startseite (Keyword-Relevanz + interne Links),
  „Alle Spiele“-Link im Footer jeder Unterseite (interne Verlinkung).
- `sitemap.xml` mit `lastmod`, eigene `404.html` (Netlify automatisch,
  Apache via `ErrorDocument` in `.htaccess`).
- Rechtsseiten (`impressum.html`, `datenschutz.html`) stehen auf `noindex`.

## Performance

- Keine externen Requests, System-Fonts, Inline-SVG statt Bilddateien.
- Content-Daten werden als `JSON.parse("…")`-String-Literal ausgeliefert –
  parst bei großen Payloads deutlich schneller als ein JS-Objektliteral.
- Alle Skripte mit `defer`, eine einzige CSS-Datei, keine Webfonts.
- Cache-Header für Assets in `_headers` (Netlify/CF) und `.htaccess` (Apache);
  Kompression via `mod_deflate` bzw. automatisch beim Hoster.
- App-Icons: `favicon.svg`, `apple-touch-icon.png` (180), `icon-512.png`
  (Manifest, maskable) – neu erzeugen mit `docs/app-icons.ps1`.

## Launch-Checkliste

Vor dem Onlinestellen einmal durchgehen – alle Platzhalter sind im Code
mit `TODO` bzw. `[ECKIGEN KLAMMERN]` markiert (auf den Rechtsseiten zusätzlich
gelb hervorgehoben):

1. **`impressum.html`:** Name, Anschrift, E-Mail eintragen.
2. **`datenschutz.html`:** Name/Anschrift/E-Mail, Hoster-Angabe, ggf. AVV-Satz,
   Stand-Datum eintragen.
3. **Domain in 3 Dateien eintragen:**
   - `sitemap.xml` (alle `DEINE-DOMAIN.de` ersetzen)
   - `robots.txt` (Sitemap-Zeile einkommentieren)
   - alle HTML-Seiten: auskommentierten `canonical`/`og:url`/`og:image`-Block
     einkommentieren und je Seite den Pfad anpassen (Suche nach `TODO vor Launch`).
4. **HTTPS aktiv?** Bei Netlify/Cloudflare Pages automatisch, bei Webspace
   Let's-Encrypt-Zertifikat aktivieren (und in `.htaccess` die
   HTTPS-Weiterleitung einkommentieren).
5. **Kompression prüfen:** Nach dem Deploy einmal die Seite laden und schauen,
   dass die JS-Dateien gzip/brotli-komprimiert ankommen (Netlify/Cloudflare: automatisch).
6. **Kurztest auf dem Handy:** alle 6 Spiele öffnen, Impressum/Datenschutz-Links
   im Footer prüfen, einen Link per WhatsApp teilen (Vorschaubild erscheint erst
   nach Schritt 3).

## Deployment

Beliebiges statisches Hosting (Netlify, Cloudflare Pages, eigener Webspace,
GitHub Pages). Einfach den Inhalt dieses `webseite/`-Ordners hochladen –
es gibt nichts zu bauen.
