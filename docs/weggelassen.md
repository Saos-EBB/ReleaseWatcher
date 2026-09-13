# Bewusst weggelassen

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
