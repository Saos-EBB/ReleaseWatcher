# Entscheidungen

## 2026-09-14 — `add --source` als führendes optionales Flag
`--source <name>` muss (falls gesetzt) vor dem Query stehen — kein
Parsing von Flags irgendwo im Argument-Array, da der Query selbst beliebige
Wörter enthalten kann und ein generischer Flag-Parser dafür Overkill wäre.
`check-new` brauchte keine Änderung: es ruft ohnehin generisch
`getSource(ref.source)` pro `source_ref` auf, das war seit P1.5 schon
quellen-agnostisch.

## 2026-09-13 — TVDB: Token-Cache & Pagination
Der Bearer-Token wird nur In-Memory pro Prozesslauf gecacht (Modul-Variable),
nicht auf Disk — ein CLI-Aufruf ist kurzlebig genug, dass ein erneuter Login
beim nächsten Aufruf keine Rolle spielt (TVDB-Tokens sind eh einen Monat
gültig). `getReleases` liest nur `page=0` der Episoden — keine
Pagination-Schleife über weitere Seiten, da die Swagger-Spec kein
`links.next`-Feld für diesen Endpoint dokumentiert und die Default-Page-Size
für die meisten Serien reicht. `external_id` speichert `tvdb_id` aus dem
Suchergebnis (nicht das mit Typ-Präfix versehene `id`-Feld), weil
`/series/{id}/episodes/...` die reine numerische ID erwartet. Ohne
`TVDB_API_KEY` in dieser Umgebung nur Modul-/Fehlerpfad-Check, kein Live-Call
(analog TMDB) — TVDB-Endpunkte gegen die swagger.yml im v4-api-Repo geprüft,
nicht gegen die (JS-gerenderte) Swagger-UI-Seite.

## 2026-09-13 — MangaDex: fixer Delay pro Request
Nach jedem MangaDex-Call wartet der Adapter 250ms (`RATE_LIMIT_DELAY_MS`), wie
im Spec-Punkt "Rate-Limit → kleiner Delay" gefordert. Das verzögert auch einen
einzelnen `search()`-Aufruf spürbar, ist aber für ein persönliches Tool ohne
Zeitdruck vertretbar und verhindert Bursts bei `check-new` über mehrere
Manga-Titel hinweg. Titelname kommt aus `attributes.title.en`, sonst dem
ersten vorhandenen Sprachwert (MangaDex liefert nicht immer ein `en`-Title).

## 2026-09-13 — AniList: Top-Match-Suche & Manga ohne Releases
`Media(search:$q, type:$type)` (aus dem Spec-Snippet) liefert pro Aufruf nur
den einen besten Treffer, keine Trefferliste — anders als TMDB/MangaDex.
`search()` ruft die Query für ANIME und MANGA parallel auf und liefert bis zu
zwei Ergebnisse (nicht zehn wie bei TMDB). Ein Miss liefert HTTP 404 mit
gültigem `{"data":{"Media":null}}`-Body (live gegen die echte API geprüft) —
kein Fehler, sondern "kein Treffer" für den jeweiligen Typ.
`getReleases` nutzt `airingSchedule(notYetAired: false)`, damit nur bereits
ausgestrahlte Folgen als Release zählen. Für Manga-Refs liefert AniList dafür
naturgemäß eine leere `airingSchedule` (keine Sonderfall-Behandlung im Code
nötig) — echte Kapitel-Termine kommen über MangaDex (P2.2).

## 2026-09-13 — CLI-Kommandos & interaktive Auswahl
`add <query>` sucht immer über die TMDB-Quelle (einzige registrierte Quelle in
Phase 1; `--source` kommt erst in P2.4). Auswahl aus den Suchtreffern läuft
über Bun's globales `prompt()` (blockierendes Stdin-Readline), kein eigener
Readline-Wrapper. `list` zeigt nur die Watchlist (status watching/plan), wie
im Datenmodell definiert — Titel mit `done`/`dropped` sind über `list` nicht
mehr sichtbar, aber per bekannter `id` weiterhin über `status`/`rm` erreichbar.
`check-new` dedupliziert über `saveReleaseIfNew` (manueller Existenz-Check mit
`IS` statt der UNIQUE-Constraint direkt, da SQLite mehrere `NULL`-Season-Werte
sonst als "verschieden" behandelt — hätte bei Filmen sonst bei jedem Lauf
Duplikate erzeugt).

## 2026-09-13 — TMDB: tv/movie-Unterscheidung in getReleases
`SourceRef` trägt kein `type`-Feld, die TMDB-ID-Räume für TV und Movie
überschneiden sich aber. `getReleases` probiert deshalb erst `GET /tv/{id}`;
schlägt das fehl (404), wird `{id}` als Movie behandelt. Für Movies liefert
`getReleases` genau eine Pseudo-Release (season: null, number: 1,
air_date: release_date) statt echter Episoden — ein Film hat keine Staffeln.
Provider-Name → `provider`-Feld: `"Netflix"` → `"netflix_de"` (lowercase,
Leerzeichen zu `_`, Suffix `_de`), wie im Spec-Beispiel.

## 2026-09-13 — Default-Status & Progress-Constraint
`addTitle` setzt neue Titel auf Status `plan` (Spec nennt keinen Default).
`progress.title_id` ist `UNIQUE` — ein Titel hat maximal einen Progress-Eintrag,
`setProgress` wird das per Upsert nutzen (Spec sagt das nicht explizit, ergibt
sich aber aus "progress <id> <number> — manuell setzen").

## 2026-09-13 — Projekt ersetzt statt koexistiert
Bestehendes `release.js` (Node.js/Puppeteer, TCB/MangaFire-Scraping) wurde entfernt
statt in einen Unterordner verschoben. Neuer Media-Tracker ist das alleinige
Projekt in diesem Repo, Name bleibt `release-watcher`.

## 2026-09-13 — Bun lokal installiert
Bun war auf der Maschine nicht vorhanden. Offizieller Installer
(`curl -fsSL https://bun.sh/install | bash`) lokal nach `~/.bun` installiert,
kein sudo.

## 2026-09-13 — `.env`-Ladelogik
Bun lädt `.env` automatisch (kein `dotenv` nötig). "Lade-Logik" aus 1.1 ist ein
schmaler `requireEnv(name)`-Helper in `src/core/env.ts`, der bei fehlendem Key
mit klarer Fehlermeldung wirft — kein eigenes Config-Objekt, keine Validierung
beim Start.
