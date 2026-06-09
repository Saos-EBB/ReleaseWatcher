# ReleaseWatcher

A minimal Node.js CLI that checks TCB Scans and MangaFire for new manga chapters.

![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![Status](https://img.shields.io/badge/Status-Running-brightgreen) ![Type](https://img.shields.io/badge/Type-CLI%20Tool-purple)

---

## How It Works

Stores the current chapter URL for each manga. When you check, it replaces the chapter number in the URL with `+1` and does a GET request — if the response is `200`, the chapter is out.

Works for any site where the chapter number is part of the URL (TCB Scans, MangaFire, etc.).

---

## Getting Started

**Requirements:** Node.js 18+ — [nodejs.org](https://nodejs.org)

```bash
node release.js
```

Dependencies install automatically on first launch.

---

## Menu

```
[a] Add    – enter name, current chapter URL, current chapter number
[d] Delete – remove a manga from the list
[c] Check  – fetch next chapter URL for all manga, report what's out
[q] Quit
```

When a new chapter is found, the saved URL and chapter number update automatically.

---

## Data

Saved to `mangas.json` in the same folder:

```json
[
  {
    "name": "One Piece",
    "url": "https://tcbscans.me/chapters/xxxx/one-piece-chapter-1138",
    "chapter": 1138
  }
]
```

---

## Author

Kevin Schaberl — SAOS

---

## Changelog

### 2026-06-09 (2)
- `package.json` mit `node-fetch` Dependency hinzugefügt
- `mangas.json` mit initialen Einträgen (OnePiece, AniMan, Freaky) hinzugefügt
- `.gitignore` erstellt (node_modules ausgeschlossen)

### 2026-06-09
- Komplett vereinfacht: alles raus außer Add, Delete und Check all
- Nur noch HTTP-Status-Check (next chapter URL = 200? → raus)
- Flat menu statt verschachteltem Menüsystem
- Von ~970 auf ~65 Zeilen reduziert
