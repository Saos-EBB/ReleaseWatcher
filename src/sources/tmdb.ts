import { requireEnv } from "../core/env";
import type { Release, SearchResult, Source, SourceRef } from "../core/types";

const BASE_URL = "https://api.themoviedb.org/3";

function apiKey(): string {
  return requireEnv("TMDB_API_KEY");
}

function url(path: string, params: Record<string, string> = {}): URL {
  const target = new URL(`${BASE_URL}${path}`);
  target.searchParams.set("api_key", apiKey());
  for (const [key, value] of Object.entries(params)) {
    target.searchParams.set(key, value);
  }
  return target;
}

async function get(path: string, params: Record<string, string> = {}): Promise<any> {
  const response = await fetch(url(path, params));
  if (!response.ok) {
    throw new Error(`TMDB request failed: ${response.status} ${path}`);
  }
  return response.json();
}

async function search(query: string): Promise<SearchResult[]> {
  const [tv, movies] = await Promise.all([
    get("/search/tv", { query }),
    get("/search/movie", { query }),
  ]);
  const tvResults: SearchResult[] = tv.results.map((show: any) => ({
    external_id: String(show.id),
    name: show.name,
    type: "series",
    url: `https://www.themoviedb.org/tv/${show.id}`,
  }));
  const movieResults: SearchResult[] = movies.results.map((movie: any) => ({
    external_id: String(movie.id),
    name: movie.title,
    type: "movie",
    url: `https://www.themoviedb.org/movie/${movie.id}`,
  }));
  return [...tvResults, ...movieResults];
}

function toProviderId(providerName: string): string {
  return `${providerName.toLowerCase().replace(/\s+/g, "_")}_de`;
}

async function watchProviderDe(
  kind: "tv" | "movie",
  id: string,
): Promise<{ provider: string | null; url: string | null }> {
  const data = await get(`/${kind}/${id}/watch/providers`);
  const de = data.results?.DE;
  const fallbackUrl = `https://www.themoviedb.org/${kind}/${id}`;
  if (!de) {
    return { provider: null, url: fallbackUrl };
  }
  const providerName: string | undefined = de.flatrate?.[0]?.provider_name;
  return {
    provider: providerName ? toProviderId(providerName) : null,
    url: de.link ?? fallbackUrl,
  };
}

async function tvReleases(id: string, series: any): Promise<Release[]> {
  const { provider, url: releaseUrl } = await watchProviderDe("tv", id);
  const releases: Release[] = [];
  for (let seasonNumber = 1; seasonNumber <= series.number_of_seasons; seasonNumber++) {
    const season = await get(`/tv/${id}/season/${seasonNumber}`);
    for (const episode of season.episodes ?? []) {
      releases.push({
        season: episode.season_number,
        number: episode.episode_number,
        name: episode.name ?? null,
        air_date: episode.air_date ?? null,
        provider,
        url: releaseUrl,
      });
    }
  }
  return releases;
}

async function movieRelease(id: string): Promise<Release[]> {
  const movie = await get(`/movie/${id}`);
  const { provider, url: releaseUrl } = await watchProviderDe("movie", id);
  return [
    {
      season: null,
      number: 1,
      name: movie.title ?? null,
      air_date: movie.release_date ?? null,
      provider,
      url: releaseUrl,
    },
  ];
}

async function getReleases(ref: SourceRef): Promise<Release[]> {
  const seriesResponse = await fetch(url(`/tv/${ref.external_id}`));
  if (seriesResponse.ok) {
    return tvReleases(ref.external_id, await seriesResponse.json());
  }
  return movieRelease(ref.external_id);
}

export const tmdbSource: Source = {
  name: "tmdb",
  search,
  getReleases,
};
