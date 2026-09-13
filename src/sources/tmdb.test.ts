import { describe, expect, test } from "bun:test";
import { tmdbSource } from "./tmdb";

const hasKey = Boolean(process.env.TMDB_API_KEY);

describe.skipIf(!hasKey)("tmdb source (live)", () => {
  test("search finds a known series and returns a link", async () => {
    const results = await tmdbSource.search("Breaking Bad");
    const series = results.find((r) => r.type === "series");
    expect(series).toBeDefined();
    expect(series?.url).toContain("themoviedb.org");
  });

  test("getReleases returns episodes with air_date and a link", async () => {
    const results = await tmdbSource.search("Breaking Bad");
    const series = results.find((r) => r.type === "series");
    if (!series) throw new Error("expected to find Breaking Bad in search results");

    const releases = await tmdbSource.getReleases({ source: "tmdb", external_id: series.external_id });
    expect(releases.length).toBeGreaterThan(0);
    expect(releases[0]?.air_date).toBeTruthy();
    expect(releases[0]?.url).toBeTruthy();
  });
});

test.skipIf(hasKey)("tmdb live smoke test skipped (no TMDB_API_KEY)", () => {
  expect(hasKey).toBe(false);
});
