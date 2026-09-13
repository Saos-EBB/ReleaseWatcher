# Entscheidungen

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
