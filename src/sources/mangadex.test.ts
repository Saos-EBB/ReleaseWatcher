import { describe, expect, test } from "bun:test";
import { mangadexSource } from "./mangadex";

async function mangadexReachable(): Promise<boolean> {
  try {
    await fetch("https://api.mangadex.org/manga?limit=1");
    return true;
  } catch {
    return false;
  }
}

const reachable = await mangadexReachable();

describe.skipIf(!reachable)("mangadex source (live, no key required)", () => {
  test("search finds a known manga and returns a link", async () => {
    const results = await mangadexSource.search("One Piece");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.url).toContain("mangadex.org/title/");
  });

  test("getReleases returns chapters with publish date and a chapter link", async () => {
    const results = await mangadexSource.search("One Piece");
    const manga = results[0];
    if (!manga) throw new Error("expected to find a One Piece result");

    const releases = await mangadexSource.getReleases({
      source: "mangadex",
      external_id: manga.external_id,
    });
    expect(releases.length).toBeGreaterThan(0);
    expect(releases[0]?.air_date).toBeTruthy();
    expect(releases[0]?.url).toContain("mangadex.org/chapter/");
  });
});
