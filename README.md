# release-watcher

Persönlicher Multi-Plattform Media-Tracker: Release-Radar (was/wann/wo neu, mit Link
pro Release) + manuelles Progress-Tracking. CLI-only, Quellen ausschließlich über
APIs (TMDB, AniList, MangaDex, TVDB).

## Setup

```bash
bun install
cp .env.example .env   # TMDB_API_KEY / TVDB_API_KEY eintragen
```

## Quellen

| Quelle     | Inhalt              | API-Key nötig |
|------------|---------------------|---------------|
| `tmdb`     | Serien & Filme      | ja            |
| `anilist`  | Anime & Manga (Meta)| nein          |
| `mangadex` | Manga-Kapitel       | nein          |
| `tvdb`     | DE/AT-Reality & TV  | ja            |

## Commands

```bash
bun src/cli/index.ts add [--source <tmdb|anilist|mangadex|tvdb>] <query>
                                           # Quelle durchsuchen (default tmdb), Treffer wählen, zur Watchlist hinzufügen
bun src/cli/index.ts list                 # Watchlist anzeigen (status watching/plan)
bun src/cli/index.ts check-new            # neue Releases der Watchlist prüfen und speichern
bun src/cli/index.ts status <id> <status> # watching | plan | done | dropped
bun src/cli/index.ts progress <id> <number> # Fortschritt manuell setzen (z.B. letztes gesehenes Kapitel/Episode)
bun src/cli/index.ts rm <id>              # Titel entfernen
bun src/cli/index.ts --help
```

`bun run start` ist ein Alias für `bun src/cli/index.ts`.

## Tests

```bash
bun test
```

Netzwerk-/Key-abhängige Tests skippen automatisch, wenn der jeweilige API-Key
fehlt (TMDB, TVDB) oder die Quelle gerade nicht erreichbar ist (AniList,
MangaDex).
