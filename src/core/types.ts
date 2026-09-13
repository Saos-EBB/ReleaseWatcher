export type TitleType = "series" | "movie" | "anime" | "manga";
export type TitleStatus = "watching" | "plan" | "done" | "dropped";

export interface Title {
  id: number;
  name: string;
  type: TitleType;
  status: TitleStatus;
  added_at: string;
}

export type SourceName = "tmdb" | "anilist" | "mangadex" | "tvdb";

export interface SourceRef {
  source: SourceName;
  external_id: string;
}

export interface SearchResult {
  external_id: string;
  name: string;
  type: TitleType;
  url: string | null;
}

export interface Release {
  season: number | null;
  number: number;
  name: string | null;
  air_date: string | null;
  provider: string | null;
  url: string | null;
}

export interface Source {
  name: SourceName;
  search(query: string): Promise<SearchResult[]>;
  getReleases(ref: SourceRef): Promise<Release[]>;
}
