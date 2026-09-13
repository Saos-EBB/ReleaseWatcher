import type { Source, SourceName } from "../core/types";
import { anilistSource } from "./anilist";
import { tmdbSource } from "./tmdb";

const registry = new Map<SourceName, Source>();

export function registerSource(source: Source): void {
  registry.set(source.name, source);
}

export function getSource(name: SourceName): Source {
  const source = registry.get(name);
  if (!source) throw new Error(`Unknown source: ${name}`);
  return source;
}

registerSource(tmdbSource);
registerSource(anilistSource);
