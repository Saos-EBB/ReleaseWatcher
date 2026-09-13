import { db } from "./db";
import { many, one, run } from "./queries";

export type TitleType = "series" | "movie" | "anime" | "manga";
export type TitleStatus = "watching" | "plan" | "done" | "dropped";

export interface Title {
  id: number;
  name: string;
  type: TitleType;
  status: TitleStatus;
  added_at: string;
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
