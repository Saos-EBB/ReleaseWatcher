# Entscheidungen

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
