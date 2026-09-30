# release-watcher

Persönlicher Multi-Plattform Media-Tracker: Release-Radar (was/wann/wo neu, mit Link
pro Release) + manuelles Progress-Tracking. CLI und Web-UI, Quellen ausschließlich über
APIs (TMDB, AniList, MangaDex, TVDB).

## Quickstart

```bash
bun run start setup        # prüft Bun, installiert deps, erstellt .env
# .env öffnen → TMDB_API_KEY und TVDB_API_KEY eintragen
bun run start setup --seed  # optional: Testdaten für die UI laden
```

## CLI Commands

```bash
bun run start <command>
```

| Command | Beschreibung |
|---------|-------------|
| `setup [--seed]` | Prüft ob alles installiert ist, richtet `.env` ein. `--seed` lädt Testdaten. |
| `add [--source <src>] <query>` | Titel suchen und zur Watchlist hinzufügen. Default-Quelle: `tmdb`. |
| `list` | Watchlist anzeigen (inkl. Progress). |
| `check-new` | Neue Releases für alle Titel der Watchlist prüfen und speichern. |
| `status <id> <status>` | Status setzen: `watching`, `plan`, `done`, `dropped`. |
| `progress <id> <number>` | Fortschritt manuell setzen (z.B. letzte gesehene Episode). |
| `rm <id>` | Titel aus der Watchlist entfernen. |
| `--help` | Hilfe anzeigen. |

### Beispiele

```bash
bun run start add "Breaking Bad"                    # TMDB-Suche
bun run start add --source anilist "Attack on Titan" # AniList-Suche
bun run start list                                   # Watchlist
bun run start check-new                              # neue Releases holen
bun run start status 1 watching                      # Status ändern
bun run start progress 1 42                          # Episode 42 gesehen
bun run start rm 3                                   # Titel löschen
```

## Web UI

```bash
bun run ui
# → http://localhost:3000
```

Minimales Dark-Theme mit Searchbar (TMDB), Monats-Kalender mit Release-Chips
und „Check new"-Button.

## Quellen

| Quelle | Inhalt | API-Key nötig |
|--------|--------|---------------|
| `tmdb` | Serien & Filme | ja |
| `anilist` | Anime & Manga (Meta) | nein |
| `mangadex` | Manga-Kapitel | nein |
| `tvdb` | DE/AT-Reality & TV | ja |

## Tests

```bash
bun test
```

Netzwerk-/Key-abhängige Tests skippen automatisch, wenn der jeweilige API-Key
fehlt (TMDB, TVDB) oder die Quelle gerade nicht erreichbar ist (AniList,
MangaDex).
