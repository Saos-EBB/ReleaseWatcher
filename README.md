# release-watcher

Persönlicher Multi-Plattform Media-Tracker: Release-Radar (was/wann/wo neu, mit Link
pro Release) + manuelles Progress-Tracking. CLI und Web-UI, Quellen ausschließlich über
APIs (TMDB, AniList, MangaDex, TVDB).

> 🚧 **Baustelle / Work in progress.** Das Projekt steckt mitten in einem
> Umbau und ist dort hängen geblieben. Einiges ist halb umgezogen, nicht alles
> läuft, Doku und Code können auseinanderlaufen.

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

### CLI

```bash
bun run start add [--source <tmdb|anilist|mangadex|tvdb>] <query>  # Titel hinzufügen
bun run start list                                                  # Watchlist anzeigen
bun run start check-new                                             # neue Releases prüfen
bun run start status <id> <status>                                  # watching | plan | done | dropped
bun run start progress <id> <number>                                # Fortschritt setzen
bun run start rm <id>                                               # Titel entfernen
bun run start --help
```

### Web UI

```bash
bun run ui
# Öffne http://localhost:3000
```

Web-UI mit Suche (TMDB), Kalender-Ansicht der Releases, und „Check new"-Button.
Minimales Design: dunkles Theme, Gold-Akzent, Serif-Header.

## Tests

```bash
bun test
```

Netzwerk-/Key-abhängige Tests skippen automatisch, wenn der jeweilige API-Key
fehlt (TMDB, TVDB) oder die Quelle gerade nicht erreichbar ist (AniList,
MangaDex).

## Lizenz und Attribution

- **Code:** [MIT](LICENSE), © Kevin Schaberl.
- **TMDB:** This product uses the TMDB API but is not endorsed or certified by TMDB.
  Daten von [The Movie Database](https://www.themoviedb.org/).
- **Weitere Datenquellen:** [AniList](https://anilist.co), [MangaDex](https://mangadex.org),
  [TheTVDB](https://thetvdb.com), jeweils über deren API und nach deren Nutzungsbedingungen.
  Die abgerufenen Daten gehören den jeweiligen Anbietern.
- **`.claude/skills/`:** aus [mattpocock/skills](https://github.com/mattpocock/skills),
  MIT, © 2026 Matt Pocock (siehe [`.claude/skills/LICENSE-mattpocock-skills`](.claude/skills/LICENSE-mattpocock-skills)).
