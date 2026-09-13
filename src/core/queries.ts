import type { Database } from "bun:sqlite";

type Params = Record<string, string | number | null>;

export function one<T>(db: Database, sql: string, params: Params = {}): T | null {
  return db.query(sql).get(params) as T | null;
}

export function many<T>(db: Database, sql: string, params: Params = {}): T[] {
  return db.query(sql).all(params) as T[];
}

export function run(db: Database, sql: string, params: Params = {}): void {
  db.query(sql).run(params);
}
