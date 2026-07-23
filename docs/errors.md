## 2026-07-23 — MangaFire-API gibt `403 Missing token` zurück, obwohl Header identisch zum Vortag
**Symptom:** checkMangaFire (erst gestern per JSON-API gefixt) liefert plötzlich `403` mit Body `{"message":"Missing token."}`.
**Ursache:** MangaFire hat die API hinter eine Cloudflare-JS-Challenge gestellt (Challenge-Script im Seiten-HTML, `window.__config` als Build-Token). Das Token entsteht durch echte JS-Ausführung im Browser (Cloudflare Bot-Management) — kein Header oder Query-Param, das man einfach mitschicken kann. Im JS-Bundle der Seite gibt's keinen client-seitig reproduzierbaren Token-Mechanismus dafür.
**Fix:** checkMangaFire läuft jetzt über einen echten (headless) Browser via Puppeteer, der die Challenge beim Laden der Seite automatisch durchläuft; die API-Response wird dabei einfach mitgeschnitten statt selbst angefragt.

## 2026-07-23 — TCB-Check meldete dauerhaft "not yet", obwohl 2 Kapitel neu draußen waren
**Symptom:** `c` (Check) meldete für OnePiece immer wieder "not yet", trotz mehrfachem Neustart des Tools über Tage hinweg.
**Ursache:** checkTCB fetchte die gespeicherte Chapter-URL und suchte darauf einen "Next"-Link. Die Chapter-ID in der gespeicherten URL (7995) wurde von TCB zwischenzeitlich auf eine spätere Chapter umgebogen (1186 → 1188). Die gefetchte Seite war dadurch bereits die neueste Chapter und hatte nur noch "Prev", kein "Next" mehr — die Regex fand nie etwas, der Check blieb für immer bei "not yet" hängen, unabhängig davon wie oft man es erneut versucht.
**Fix:** checkTCB liest jetzt die Homepage (listet je Serie die echte aktuelle Chapter) statt der potenziell veralteten gespeicherten Seite zu vertrauen.
