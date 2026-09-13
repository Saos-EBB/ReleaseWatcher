import { describe, expect, test } from "bun:test";
import { anilistSource } from "./anilist";

async function anilistReachable(): Promise<boolean> {
  try {
    await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "{ __typename }" }),
    });
    return true;
  } catch {
    return false;
  }
}

const reachable = await anilistReachable();

describe.skipIf(!reachable)("anilist source (live, no key required)", () => {
  test("search finds a known anime and returns a link", async () => {
    const results = await anilistSource.search("One Piece");
    const anime = results.find((r) => r.type === "anime");
    expect(anime).toBeDefined();
    expect(anime?.url).toContain("anilist.co");
  });

  test("getReleases returns aired episodes with air_date and a link", async () => {
    const results = await anilistSource.search("One Piece");
    const anime = results.find((r) => r.type === "anime");
    if (!anime) throw new Error("expected to find One Piece in search results");

    const releases = await anilistSource.getReleases({
      source: "anilist",
      external_id: anime.external_id,
    });
    expect(releases.length).toBeGreaterThan(0);
    expect(releases[0]?.air_date).toBeTruthy();
    expect(releases[0]?.url).toContain("anilist.co");
  });
});
