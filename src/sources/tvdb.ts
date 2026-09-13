import { requireEnv } from "../core/env";
import type { Release, SearchResult, Source, SourceRef } from "../core/types";

const BASE_URL = "https://api4.thetvdb.com/v4";

let cachedToken: string | null = null;

async function getToken(): Promise<string> {
  if (cachedToken) return cachedToken;

  const response = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apikey: requireEnv("TVDB_API_KEY") }),
  });
  if (!response.ok) {
    throw new Error(`TVDB login failed: ${response.status}`);
  }
  const body = await response.json();
  cachedToken = body.data.token;
  return cachedToken as string;
}

async function get(path: string, params: URLSearchParams = new URLSearchParams()): Promise<any> {
  const token = await getToken();
  const url = new URL(`${BASE_URL}${path}`);
  url.search = params.toString();
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) {
    throw new Error(`TVDB request failed: ${response.status} ${path}`);
  }
  return response.json();
}

async function search(query: string): Promise<SearchResult[]> {
  const data = await get("/search", new URLSearchParams({ query, type: "series" }));
  return data.data.map((result: any) => ({
    external_id: result.tvdb_id,
    name: result.name,
    type: "series",
    url: `https://thetvdb.com/series/${result.slug}`,
  }));
}

async function getReleases(ref: SourceRef): Promise<Release[]> {
  const data = await get(
    `/series/${ref.external_id}/episodes/default`,
    new URLSearchParams({ page: "0" }),
  );
  const slug = data.data.series?.slug;
  const url = slug ? `https://thetvdb.com/series/${slug}` : null;

  return (data.data.episodes ?? []).map((episode: any) => ({
    season: episode.seasonNumber,
    number: episode.number,
    name: episode.name ?? null,
    air_date: episode.aired || null,
    provider: null,
    url,
  }));
}

export const tvdbSource: Source = {
  name: "tvdb",
  search,
  getReleases,
};
