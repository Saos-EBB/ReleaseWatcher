# release-watcher

Persönlicher Multi-Plattform Media-Tracker: Release-Radar (was/wann/wo neu, mit Link
pro Release) + manuelles Progress-Tracking. CLI-only, Quellen ausschließlich über
APIs (TMDB, AniList, MangaDex, TVDB).

## Setup

```bash
bun install
cp .env.example .env   # TMDB_API_KEY / TVDB_API_KEY eintragen
```

## Commands

```bash
bun src/cli/index.ts add <query>          # TMDB durchsuchen, Treffer wählen, zur Watchlist hinzufügen
bun src/cli/index.ts list                 # Watchlist anzeigen (status watching/plan)
bun src/cli/index.ts check-new            # neue Releases der Watchlist prüfen und speichern
bun src/cli/index.ts status <id> <status> # watching | plan | done | dropped
bun src/cli/index.ts rm <id>              # Titel entfernen
bun src/cli/index.ts --help
```

`bun run start` ist ein Alias für `bun src/cli/index.ts`.

## Tests

```bash
bun test
```

Netzwerk-/Key-abhängige Tests (z.B. der TMDB-Live-Test) skippen automatisch,
wenn der jeweilige API-Key in `.env` fehlt.
