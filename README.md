# ReleaseWatcher


A minimal Node.js CLI that checks manga sites (TCB Scans, MangaFire) for new chapters and auto-opens them in your browser.

![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![Status](https://img.shields.io/badge/Status-Running-brightgreen) ![Type](https://img.shields.io/badge/Type-CLI%20Tool-purple)

---

## How It Works

Stores the current chapter URL and site for each manga. On check, it looks up the next chapter number using a site-specific method and reports what it finds.

**TCB:** Homepage-based check — chapter IDs get reassigned to later chapters over time, so the saved URL can go stale. Reads the site's homepage (which always lists each series' true latest chapter) and matches by URL slug instead.

**MangaFire:** Browser-based check — chapter URLs use opaque numeric IDs (`/chapter/6927219`), not the chapter number, so the next URL can't be guessed by incrementing. The site is also a client-rendered SPA behind a Cloudflare JS challenge, so a plain HTTP request to its chapter-list API gets rejected. Instead a headless Puppeteer browser loads the title page and captures the same JSON response the page's own JS receives, then matches by chapter number.

---

## Getting Started

**Requirements:** Node.js 18+ — [nodejs.org](https://nodejs.org)

```bash
npm install
node release.js
```

---

## Menu

```
[a] Add    – enter name, site (TCB / MangaFire), chapter URL, chapter number
[d] Delete – remove a manga by index
[n] Update – set a new chapter number (and updates the URL) by index
[c] Check  – fetch next chapter for all manga, report what's out
[q] Quit
```

When a new chapter is found, the saved URL and chapter number update automatically and the chapter opens in your browser. The list shows `[TCB]` or `[MF]` prefix per entry.

---

## Data

Saved to `mangas.json` in the same folder:

```json
[
  {
    "name": "One Piece",
    "site": "tcb",
    "url": "https://tcbonepiecechapters.com/chapters/7988/one-piece-chapter-1185",
    "chapter": 1185
  },
  {
    "name": "AniMan",
    "site": "mangafire",
    "url": "https://mangafire.to/title/pmykj-animan/chapter/6927219",
    "chapter": 17
  }
]
```

---

## Author

Kevin Schaberl — SAOS

---

## Changelog

### 2026-07-23 (2)
- MangaFire moved its chapter-list API behind a Cloudflare JS challenge, breaking yesterday's fetch-based fix within a day (`403 Missing token`). The check now drives a headless Puppeteer browser to load the title page and capture the same API response the page's own JS gets, since the challenge only passes for a real browser
- Adds `puppeteer` as a dependency; run `npm install` before `node release.js`

### 2026-07-23
- Fixed TCB check: chapter IDs get reassigned to later chapters over time (saved id 7995 silently moved from chapter 1186 to 1188), so chasing a "Next" link off the saved page could get permanently stuck once that page became the latest chapter with no "Next". Now reads the homepage's live listing instead, which can catch up more than one chapter at once
- Check results now carry the actual chapter number found instead of assuming `+1`, so a checker can report catching up multiple chapters at a time

### 2026-07-22
- Fixed MangaFire check: site switched chapter URLs to opaque numeric IDs (`/chapter/6927219`) and moved to a client-rendered SPA (page HTML no longer contains chapter data), breaking both the increment-based next-URL guess and the old body-title check
- MangaFire check now calls the site's own JSON API (`/api/titles/{hid}/chapters`) to read the real chapter list and match by chapter number, preferring the official chapter when both an official and unofficial release share a number

### 2026-06-18
- Per-site check methods: TCB uses URL match, MangaFire reads page title to detect false positives
- Site selection (TCB / MangaFire) on manga creation; `[TCB]` / `[MF]` prefix in list display
- Fixed TCB check: regex now matches `-chapter-N` (dash) not just `/chapter-N` (slash)
- Fixed MangaFire false positives: body title check catches JS-redirect to chapter 1
- Fixed browser open on Linux: switched from `start` (Windows) to `xdg-open`

### 2026-06-17
- Repo cleanup: flattened structure, removed `.idea` and `how-to-use.txt`

### 2026-06-09 (2)
- `package.json` mit `node-fetch` Dependency hinzugefügt
- `mangas.json` mit initialen Einträgen (OnePiece, AniMan, Freaky) hinzugefügt
- `.gitignore` erstellt (node_modules ausgeschlossen)

### 2026-06-09
- Komplett vereinfacht: alles raus außer Add, Delete und Check all
- Nur noch HTTP-Status-Check (next chapter URL = 200? → raus)
- Flat menu statt verschachteltem Menüsystem
- Von ~970 auf ~65 Zeilen reduziert
