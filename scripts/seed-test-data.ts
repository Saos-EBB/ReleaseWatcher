#!/usr/bin/env bun
/**
 * Seed database with test data for UI testing.
 * Run: bun scripts/seed-test-data.ts
 */

import { db } from "../src/core/db.ts";

// Clear existing test data (optional)
console.log("🌱 Seeding test data...");

// Add test titles
const titles = [
  { name: "Breaking Bad", type: "series" },
  { name: "The Matrix", type: "movie" },
  { name: "Attack on Titan", type: "anime" },
  { name: "One Piece", type: "anime" },
  { name: "The Witcher", type: "series" },
];

const titleIds: number[] = [];

for (const title of titles) {
  db.run(
    `INSERT INTO title (name, type, status, added_at) VALUES (?, ?, ?, ?)`,
    [title.name, title.type, "watching", new Date().toISOString()],
  );
  const result = db.query("SELECT last_insert_rowid() as id").get() as { id: number };
  titleIds.push(result.id);
}

// Generate releases across the next month
const today = new Date();
const releases = [
  { titleId: 0, season: 5, number: 12, name: "Phoenix", daysOffset: 3 },
  { titleId: 0, season: 5, number: 13, name: "Felina", daysOffset: 6 },
  { titleId: 2, season: 4, number: 1, name: "The Other Side", daysOffset: 2 },
  { titleId: 2, season: 4, number: 2, name: "The Rumbling", daysOffset: 5 },
  { titleId: 3, season: 1, number: 100, name: "The Joy of Meat", daysOffset: 4 },
  { titleId: 4, season: 3, number: 4, name: "The Bride", daysOffset: 7 },
];

for (const release of releases) {
  const date = new Date(today);
  date.setDate(date.getDate() + release.daysOffset);
  const dateStr = date.toISOString().split("T")[0];

  db.run(
    `INSERT INTO "release" (title_id, source, season, number, name, air_date, provider, url, fetched_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      titleIds[release.titleId],
      "tmdb",
      release.season ?? null,
      release.number,
      release.name,
      dateStr,
      "netflix_de",
      "https://example.com",
      new Date().toISOString(),
    ],
  );
}

console.log(`✓ Added ${titles.length} test titles`);
console.log(`✓ Added ${releases.length} test releases`);
console.log("\n💡 Start the UI with: bun run ui");
console.log("   Then open: http://localhost:3000");
