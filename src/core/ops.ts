import { db } from "./db";
import { many, one, run } from "./queries";
import { getSource } from "../sources/index";
import type { Progress, Release, SourceName, SourceRef, Title, TitleStatus, TitleType } from "./types";

export interface ReleaseWithTitle extends Release {
  title_id: number;
  title_name: string;
  source: SourceName;
}

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

export function setProgress(titleId: number, lastNumber: number): void {
  run(
    db,
    `INSERT INTO progress (title_id, last_number, updated_at) VALUES ($title_id, $last_number, $updated_at)
     ON CONFLICT (title_id) DO UPDATE SET last_number = excluded.last_number, updated_at = excluded.updated_at`,
    { $title_id: titleId, $last_number: lastNumber, $updated_at: new Date().toISOString() },
  );
}

export function getProgress(titleId: number): Progress | null {
  return one<Progress>(db, `SELECT * FROM progress WHERE title_id = $title_id`, {
    $title_id: titleId,
  });
}

export interface NewRelease {
  titleId: number;
  titleName: string;
  release: Release;
  source: SourceName;
}

export async function checkNew(titleId?: number): Promise<NewRelease[]> {
  const titles = titleId ? [getTitle(titleId)] : listWatchlist();
  const newReleases: NewRelease[] = [];

  for (const title of titles) {
    if (!title) continue;
    const refs = listSourceRefsForTitle(title.id);
    for (const ref of refs) {
      const source = getSource(ref.source);
      const releases = await source.getReleases(ref);
      for (const release of releases) {
        if (!saveReleaseIfNew(title.id, ref.source, release)) continue;
        newReleases.push({
          titleId: title.id,
          titleName: title.name,
          release,
          source: ref.source,
        });
      }
    }
  }

  return newReleases;
}

export interface ReleaseWithTitleInfo {
  id: number;
  title_id: number;
  title_name: string;
  type: TitleType;
  source: SourceName;
  season: number | null;
  number: number;
  name: string | null;
  air_date: string | null;
  provider: string | null;
  url: string | null;
  fetched_at: string;
}

export function listReleasesBetween(from: string, to: string): ReleaseWithTitleInfo[] {
  return many<ReleaseWithTitleInfo>(
    db,
    `SELECT r.id, r.title_id, t.name AS title_name, t.type, r.source,
            r.season, r.number, r.name, r.air_date, r.provider, r.url, r.fetched_at
     FROM "release" r
     JOIN title t ON r.title_id = t.id
     WHERE r.air_date BETWEEN $from AND $to
     ORDER BY r.air_date ASC, t.name ASC`,
    { $from: from, $to: to },
  );
}
