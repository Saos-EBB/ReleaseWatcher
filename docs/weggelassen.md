# Bewusst weggelassen

## P1.1 Projekt-Setup
Kein zentrales Config-Objekt/Schema für Env-Vars — nur der `requireEnv`-Helper,
der bei tatsächlicher Nutzung (TMDB-/TVDB-Adapter) wirft. Keine Validierung
aller Env-Vars beim Programmstart.
