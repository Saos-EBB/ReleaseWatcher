## 2026-07-23 — fix(tcb): homepage ground-truth check instead of Next-link chase
**Was:** checkTCB liest jetzt die Homepage statt den "Next"-Link von der gespeicherten Chapter-Seite zu jagen. Checker-Rückgabe ist jetzt `{url, chapter}` statt nur `url`, damit ein Site-Check mehrere übersprungene Kapitel auf einmal melden kann.
**Nicht gebaut:** kein Nachliefern einzelner übersprungener Zwischenkapitel (Homepage kennt nur die neueste); kein Fallback falls die Serie nicht mehr auf der Homepage auftaucht.
