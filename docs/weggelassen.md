# Bewusst weggelassen

## P3.2 Progress-Abschluss
Kein eigener `bun:test` für `setProgress`/`getProgress` — reine DB-Ops ohne
Netzwerk/Key-Abhängigkeit wurden hier (wie schon bei den core-ops aus P1.2/1.3)
nur manuell per CLI durchgespielt (`progress 1 42` → `list` zeigt es → erneutes
Setzen überschreibt), keine Testdatei angelegt. Automatisierte Tests in diesem
Projekt fokussieren auf die Adapter, wo Skip-Bedingungen (Key/Netz) echten Wert
haben.

## P1.4 TMDB-Adapter
Kein TMDB_API_KEY in dieser Umgebung verfügbar → kein Live-Aufruf gegen die
echte API während der Entwicklung, nur Modul-/Wiring-Check. Kein eigener
TMDB-Response-Typ (Rohdaten werden ad hoc als `any` gelesen, nur die
tatsächlich genutzten Felder werden gemappt). Staffel-Requests laufen
sequenziell, keine Parallelisierung über Staffeln hinweg.

## P1.1 Projekt-Setup
Kein zentrales Config-Objekt/Schema für Env-Vars — nur der `requireEnv`-Helper,
der bei tatsächlicher Nutzung (TMDB-/TVDB-Adapter) wirft. Keine Validierung
aller Env-Vars beim Programmstart.
