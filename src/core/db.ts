import { Database } from "bun:sqlite";
import { runMigrations } from "./migrations";

export const db = new Database("release-watcher.sqlite");
runMigrations(db);
