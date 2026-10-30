import type { Database } from "bun:sqlite";

export function runMigrations(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS title (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('series', 'movie', 'anime', 'manga')),
      status TEXT NOT NULL CHECK (status IN ('watching', 'plan', 'done', 'dropped')),
      added_at TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS source_ref (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title_id INTEGER NOT NULL REFERENCES title(id),
      source TEXT NOT NULL CHECK (source IN ('tmdb', 'anilist', 'mangadex', 'tvdb')),
      external_id TEXT NOT NULL,
      UNIQUE (source, external_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS "release" (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title_id INTEGER NOT NULL REFERENCES title(id),
      source TEXT NOT NULL,
      season INTEGER,
      number INTEGER NOT NULL,
      name TEXT,
      air_date TEXT,
      provider TEXT,
      url TEXT,
      fetched_at TEXT NOT NULL,
      UNIQUE (title_id, source, season, number)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title_id INTEGER NOT NULL UNIQUE REFERENCES title(id),
      last_number INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS rating (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title_id INTEGER NOT NULL UNIQUE REFERENCES title(id),
      imdb_id TEXT,
      imdb_rating TEXT,
      rotten_tomatoes TEXT,
      metacritic TEXT,
      poster TEXT,
      fetched_at TEXT NOT NULL
    )
  `);
}
