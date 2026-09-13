import type { Release, SearchResult, Source, SourceRef } from "../core/types";

const ENDPOINT = "https://graphql.anilist.co";

async function anilistQuery(query: string, variables: Record<string, unknown>): Promise<any> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const body = await response.json();
  if (!response.ok && !body.data) {
    throw new Error(`AniList request failed: ${response.status}`);
  }
  return body.data;
}

async function searchByType(query: string, mediaType: "ANIME" | "MANGA"): Promise<SearchResult[]> {
  const data = await anilistQuery(
    `query ($q: String, $type: MediaType) {
      Media(search: $q, type: $type) {
        id
        title { romaji english }
        siteUrl
      }
    }`,
    { q: query, type: mediaType },
  );
  const media = data?.Media;
  if (!media) return [];
  return [
    {
      external_id: String(media.id),
      name: media.title.english ?? media.title.romaji,
      type: mediaType === "ANIME" ? "anime" : "manga",
      url: media.siteUrl,
    },
  ];
}

async function search(query: string): Promise<SearchResult[]> {
  const [anime, manga] = await Promise.all([
    searchByType(query, "ANIME"),
    searchByType(query, "MANGA"),
  ]);
  return [...anime, ...manga];
}

async function getReleases(ref: SourceRef): Promise<Release[]> {
  const data = await anilistQuery(
    `query ($id: Int) {
      Media(id: $id) {
        siteUrl
        airingSchedule(notYetAired: false) {
          nodes { episode airingAt }
        }
      }
    }`,
    { id: Number(ref.external_id) },
  );
  const media = data?.Media;
  if (!media) return [];
  const nodes: Array<{ episode: number; airingAt: number }> = media.airingSchedule?.nodes ?? [];
  return nodes.map((node) => ({
    season: null,
    number: node.episode,
    name: null,
    air_date: new Date(node.airingAt * 1000).toISOString(),
    provider: null,
    url: media.siteUrl,
  }));
}

export const anilistSource: Source = {
  name: "anilist",
  search,
  getReleases,
};
