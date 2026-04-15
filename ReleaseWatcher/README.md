# ReleaseWatcher

A lightweight Node.js terminal tool that watches manga, anime, or any numbered release page and opens your browser the
moment a new one is available. No more refreshing.

![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![Status](https://img.shields.io/badge/Status-Running-brightgreen) ![Type](https://img.shields.io/badge/Type-CLI%20Tool-purple)

---

## About the Project

ReleaseWatcher is a small CLI tool built in Node.js that polls a chapter or episode URL on a set interval and
automatically opens the browser when a new release is detected.

The idea came from spending days refreshing TCB Scans waiting for new One Piece chapters — and then running into anime
sites that work completely differently. Instead of building something overly complex, the goal was to keep it minimal:
one file, no server, no browser extension, just a script that runs in the background and does exactly one thing well.

Works for manga, anime episodes, or anything that follows a numbered URL or predictable page structure.

---

## Features

- **4 check methods** — title number, content absent, content present, HTTP status
- **Multi-entry support** — save unlimited entries with nicknames, resume anytime
- **Groups** — organize entries into groups and watch an entire group at once
- **Watch all** — start watchers for every saved entry simultaneously
- **Persistent state** — saves everything to `state.json` automatically
- **Self-installing** — creates `package.json` and runs `npm install` on first launch
- **Interactive menu** — nested submenus, guided setup for non-technical users
- **Color theme system** — Purple, Green, Blue, or White (no color)
- **Keyboard shortcuts** — R to check now, M for menu, Q to quit while watching
- **Quick resume** — `node release.js onepiece` skips the menu entirely
- **Configurable interval** — change the check interval from the Settings menu

---

## Check Methods

Different sites work differently. When adding an entry you choose which method fits:

| Method            | How it works                                                     | Good for                                         |
|-------------------|------------------------------------------------------------------|--------------------------------------------------|
| `title-number`    | Fetches next URL, reads `<title>`, extracts number               | TCB Scans, most manga readers                    |
| `content-absent`  | Page exists but release is out when a specific text *disappears* | onepiece.tube anime (`"keine Streams gefunden"`) |
| `content-present` | Release is out when a specific text *appears*                    | Sites that show "Stream available"               |
| `http-status`     | 404 = not yet, 200 = out                                         | Sites that cleanly return 404                    |

---

## How It Works (title-number)

| Step           | What happens                                      |
|----------------|---------------------------------------------------|
| Build next URL | Replace current number in URL with `current + 1`  |
| Fetch the page | Send a plain HTTP request                         |
| Read the title | Extract number from the `<title>` tag             |
| Compare        | If extracted number > last known → release is out |
| Open browser   | Launch the URL automatically                      |
| Save state     | Update `state.json` with the new number           |

---

## Getting Started

**Requirements**

- Node.js 18 or higher — [nodejs.org](https://nodejs.org)
- PowerShell, CMD, or any terminal

**First launch:**

```bash
node release.js
```

The script sets itself up automatically and opens the interactive menu.

**Quick resume (once an entry is saved):**

```bash
node release.js onepiece
```

---

## Menu Structure

```
RELEASE WATCHER 🏴‍☠️
─────────────────────────────
[1] Add new
[2] Watch
      [1] Resume single
      [2] Watch group
      [3] Watch all
[3] Manage
      [1] Entries
            [1] List all
            [2] Edit entry
            [3] Delete entry
      [2] Groups
            [1] List groups
            [2] Create group
            [3] Edit group
            [4] Delete group
[4] Settings
      [1] Change check interval
      [2] Change theme
[b] Exit
```

Press `b` at any `>` prompt to go back to the previous menu.

---

## Keyboard Shortcuts (while watching)

| Key | Action                          |
|-----|---------------------------------|
| R   | Check now (skip the wait)       |
| M   | Stop all watchers, back to menu |
| Q   | Stop all watchers, exit         |

---

## Project Structure

```
ReleaseWatcher/
├── release.js       # Main script — all logic in one file
├── state.json       # Auto-generated — entries, groups, settings
├── package.json     # Auto-generated on first run
└── how-to-use.txt   # Plain English guide
```

---

## State File Structure

```json
{
  "settings": {
    "intervalMinutes": 2,
    "theme": "purple"
  },
  "entries": {
    "onepiece": {
      "url": "https://tcbonepiecechapters.com/chapters/7975/one-piece-chapter-1179",
      "lastNumber": 1179,
      "method": "title-number"
    },
    "onepiece-anime": {
      "url": "https://onepiece.tube/anime/folge/1155",
      "lastNumber": 1155,
      "method": "content-absent",
      "absentText": "keine Streams gefunden"
    }
  },
  "groups": {
    "onepiece-all": [
      "onepiece",
      "onepiece-anime"
    ]
  }
}
```

---
## Contributing



That said, feel free to:

- 🐛 [Open an issue](https://github.com/Saos-EBB/AniScript/issues) if you find a bug
- 💡 [Start a discussion](https://github.com/Saos-EBB/AniScript/discussions) if you have a feature request or suggestion
- 🍴 Fork the repo and adapt it to your own needs (GPL-3.0)

I'll have a look when I find the time.


---


## Author

Kevin Schaberl — SAOS