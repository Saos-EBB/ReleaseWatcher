import { describe, expect, test } from "bun:test";
import { tvdbSource } from "./tvdb";

const hasKey = Boolean(process.env.TVDB_API_KEY);

describe.skipIf(!hasKey)("tvdb source (live)", () => {
  test("search finds a known series and returns a link", async () => {
    const results = await tvdbSource.search("Breaking Bad");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.url).toContain("thetvdb.com/series/");
  });

  test("getReleases returns episodes with aired date and a link", async () => {
    const results = await tvdbSource.search("Breaking Bad");
    const series = results[0];
    if (!series) throw new Error("expected to find Breaking Bad in search results");

    const releases = await tvdbSource.getReleases({ source: "tvdb", external_id: series.external_id });
    expect(releases.length).toBeGreaterThan(0);
    expect(releases[0]?.air_date).toBeTruthy();
    expect(releases[0]?.url).toContain("thetvdb.com/series/");
  });
});

test.skipIf(hasKey)("tvdb live smoke test skipped (no TVDB_API_KEY)", () => {
  expect(hasKey).toBe(false);
});
