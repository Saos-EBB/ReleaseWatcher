## 2026-07-23 — fix(mangafire): headless browser instead of plain fetch
**Was:** checkMangaFire launcht jetzt Puppeteer, lädt die Title-Seite und fängt die `/api/titles/{hid}/chapters`-Response ab, statt die API direkt per fetch anzusprechen. `mangaFireHid` entfällt, da die API-URL nicht mehr selbst gebaut wird.
**Nicht gebaut:** kein Browser-Pooling über mehrere MangaFire-Einträge hinweg (aktuell nur 1 Eintrag); kein Fallback falls Cloudflare den Browser-Weg ebenfalls blockiert.

## 2026-07-23 — fix(tcb): homepage ground-truth check instead of Next-link chase
**Was:** checkTCB liest jetzt die Homepage statt den "Next"-Link von der gespeicherten Chapter-Seite zu jagen. Checker-Rückgabe ist jetzt `{url, chapter}` statt nur `url`, damit ein Site-Check mehrere übersprungene Kapitel auf einmal melden kann.
**Nicht gebaut:** kein Nachliefern einzelner übersprungener Zwischenkapitel (Homepage kennt nur die neueste); kein Fallback falls die Serie nicht mehr auf der Homepage auftaucht.
