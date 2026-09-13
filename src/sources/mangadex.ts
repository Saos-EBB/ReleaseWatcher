import type { Release, SearchResult, Source, SourceRef } from "../core/types";

const BASE_URL = "https://api.mangadex.org";
const RATE_LIMIT_DELAY_MS = 250;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function get(path: string, params: URLSearchParams): Promise<any> {
  const url = new URL(`${BASE_URL}${path}`);
  url.search = params.toString();
  const response = await fetch(url);
  await sleep(RATE_LIMIT_DELAY_MS);
  if (!response.ok) {
    throw new Error(`MangaDex request failed: ${response.status} ${path}`);
  }
  return response.json();
}

async function search(query: string): Promise<SearchResult[]> {
  const data = await get("/manga", new URLSearchParams({ title: query, limit: "10" }));
  return data.data.map((manga: any) => {
    const titles: Record<string, string> = manga.attributes.title;
    const name = titles.en ?? Object.values(titles)[0] ?? "Unknown";
    return {
      external_id: manga.id,
      name,
      type: "manga",
      url: `https://mangadex.org/title/${manga.id}`,
    };
  });
}

async function getReleases(ref: SourceRef): Promise<Release[]> {
  const params = new URLSearchParams();
  params.append("translatedLanguage[]", "de");
  params.append("translatedLanguage[]", "en");
  params.append("order[chapter]", "desc");
  params.append("limit", "100");

  const data = await get(`/manga/${ref.external_id}/feed`, params);
  return data.data
    .filter((chapter: any) => chapter.attributes.chapter !== null)
    .map((chapter: any) => ({
      season: null,
      number: Number(chapter.attributes.chapter),
      name: chapter.attributes.title ?? null,
      air_date: chapter.attributes.publishAt ?? null,
      provider: null,
      url: `https://mangadex.org/chapter/${chapter.id}`,
    }));
}

export const mangadexSource: Source = {
  name: "mangadex",
  search,
  getReleases,
};
