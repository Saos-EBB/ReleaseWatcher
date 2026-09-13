import { db } from "./db";
import { many, one, run } from "./queries";
import type { Release, SourceName, SourceRef, Title, TitleStatus, TitleType } from "./types";

export function addTitle(name: string, type: TitleType): Title {
  run(
    db,
    `INSERT INTO title (name, type, status, added_at) VALUES ($name, $type, 'plan', $added_at)`,
    { $name: name, $type: type, $added_at: new Date().toISOString() },
  );
  const title = one<Title>(db, `SELECT * FROM title WHERE id = last_insert_rowid()`);
  if (!title) throw new Error("Failed to insert title");
  return title;
}

export function getTitle(id: number): Title | null {
  return one<Title>(db, `SELECT * FROM title WHERE id = $id`, { $id: id });
}

export function listTitles(): Title[] {
  return many<Title>(db, `SELECT * FROM title ORDER BY added_at DESC`);
}

export function setStatus(id: number, status: TitleStatus): void {
  run(db, `UPDATE title SET status = $status WHERE id = $id`, { $status: status, $id: id });
}

export function removeTitle(id: number): void {
  run(db, `DELETE FROM title WHERE id = $id`, { $id: id });
}

export function listWatchlist(): Title[] {
  return many<Title>(
    db,
    `SELECT * FROM title WHERE status IN ('watching', 'plan') ORDER BY added_at DESC`,
  );
}

export function addSourceRef(titleId: number, source: SourceName, externalId: string): void {
  run(
    db,
    `INSERT OR IGNORE INTO source_ref (title_id, source, external_id) VALUES ($title_id, $source, $external_id)`,
    { $title_id: titleId, $source: source, $external_id: externalId },
  );
}

export function listSourceRefsForTitle(titleId: number): SourceRef[] {
  return many<SourceRef>(
    db,
    `SELECT source, external_id FROM source_ref WHERE title_id = $title_id`,
    { $title_id: titleId },
  );
}

export function saveReleaseIfNew(titleId: number, source: SourceName, release: Release): boolean {
  const existing = one(
    db,
    `SELECT id FROM "release"
     WHERE title_id = $title_id AND source = $source AND season IS $season AND number = $number`,
    { $title_id: titleId, $source: source, $season: release.season, $number: release.number },
  );
  if (existing) return false;

  run(
    db,
    `INSERT INTO "release" (title_id, source, season, number, name, air_date, provider, url, fetched_at)
     VALUES ($title_id, $source, $season, $number, $name, $air_date, $provider, $url, $fetched_at)`,
    {
      $title_id: titleId,
      $source: source,
      $season: release.season,
      $number: release.number,
      $name: release.name,
      $air_date: release.air_date,
      $provider: release.provider,
      $url: release.url,
      $fetched_at: new Date().toISOString(),
    },
  );
  return true;
}
